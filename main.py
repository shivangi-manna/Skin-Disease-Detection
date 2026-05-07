import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image, ImageStat
import io
import tensorflow as tf
import tf_keras as keras
print(f"TensorFlow version: {tf.__version__}")
print(f"Keras version: {keras.__version__}")

app = FastAPI()

# Allow both local development and Vercel production frontend
origins = [
    "http://localhost:5173",
    "https://skin-disease-detection-sigma.vercel.app",
    "*", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model lazily
MODEL_PATH = "super_fixed_model.h5"
_model = None

def get_model():
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        try:
            # Use tf_keras for better compatibility with .h5 files
            # Adding compile=False to avoid issues with custom layers or metrics
            _model = keras.models.load_model(MODEL_PATH, compile=False)
            print(f"Successfully loaded model from {MODEL_PATH}")
        except Exception as e:
            print(f"Error loading model: {e}")
    return _model

CLASSES = [
    "Actinic keratoses",
    "Basal cell carcinoma",
    "Benign keratosis-like lesions",
    "Dermatofibroma",
    "Melanoma",
    "Melanocytic nevi",
    "Vascular lesions"
]

@app.get("/")
def read_root():
    return {"status": "online", "model_file_exists": os.path.exists(MODEL_PATH)}

def is_skin_image(image: Image.Image) -> bool:
    # Resize for faster analysis
    img = image.copy().resize((128, 128))
    img_array = np.array(img).astype(float)
    
    # 1. Basic Stats
    stat = ImageStat.Stat(img)
    stddev = sum(stat.stddev) / 3
    if stddev < 12: # Too flat
        return False
        
    # 2. Edge Density Check (Screenshots have sharp horizontal/vertical edges)
    # Natural skin is smooth with gradual gradients.
    # Compute gradients
    dy, dx = np.gradient(np.mean(img_array, axis=-1))
    edge_magnitude = np.sqrt(dx**2 + dy**2)
    # UI screenshots usually have many pixels with very high gradient (sharp lines)
    # and many with zero gradient (flat backgrounds).
    high_edge_pct = np.sum(edge_magnitude > 40) / edge_magnitude.size
    if high_edge_pct > 0.12: # Too many sharp edges for a skin photo
        return False

    # 3. Unique Color Distribution
    pixels = img_array.reshape(-1, 3)
    unique_colors = len(np.unique(pixels, axis=0))
    # Natural photos have thousands of unique colors due to sensor noise and gradients.
    # Screenshots often have fewer or extremely specific patterns.
    if unique_colors < 800: 
        return False

    # 4. Color range check (Skin is generally in a specific HSV range)
    hsv_img = img.convert('HSV')
    h, s, v = hsv_img.split()
    h_arr = np.array(h)
    # Skin usually falls in low hue (red/orange/yellow) 0-30 or 240-255
    # We broaden slightly but skin is rarely green/blue.
    skin_hue_mask = (h_arr < 40) | (h_arr > 220)
    skin_hue_pct = np.sum(skin_hue_mask) / h_arr.size
    
    if skin_hue_pct < 0.35: # If less than 35% of image matches skin/lesion tones
        return False

    # 5. Flat region check
    # Screenshots of windows often have large regions of perfectly identical pixels
    diffs = np.diff(img_array, axis=0)
    flat_pixels = np.sum(np.all(diffs == 0, axis=-1)) / img_array.size
    if flat_pixels > 0.15: # Too much perfectly flat area
        return False

    return True

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents)).convert('RGB')
    except Exception:
        return {"error": "Invalid file format", "class": "Error", "confidence": 0.0, "details": "Please upload a valid image file."}
    
    # --- VALIDATION STEP ---
    if not is_skin_image(image):
        return {
            "error": "Invalid Image",
            "class": "Non-Skin Image Detected",
            "confidence": 0.0,
            "details": "The uploaded image does not appear to be a skin lesion. Please upload a clear, focused photo of the affected area."
        }
    
    # --- PREDICTION STEP ---
    model = get_model()
    
    if not model:
        return {
            "error": "Model Error",
            "class": "AI Offline",
            "confidence": 0.0,
            "details": "The AI model failed to load. Please contact the administrator."
        }
        
    try:
        image_resized = image.resize((224, 224))
        img_array = np.array(image_resized) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        predictions = model.predict(img_array)
        class_idx = np.argmax(predictions[0])
        confidence = float(np.max(predictions[0]))
        
        return {
            "class": CLASSES[class_idx],
            "confidence": confidence,
            "details": f"Analysis complete. The pattern matches {CLASSES[class_idx]} with {confidence:.2%} confidence."
        }
    except Exception as e:
        return {
            "error": "Processing Error",
            "class": "Error",
            "confidence": 0.0,
            "details": f"An error occurred during analysis: {str(e)}"
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
