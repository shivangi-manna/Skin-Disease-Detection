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
MODEL_PATH = "best_model.h5"
_model = None

def get_model():
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        try:
            # Use tf_keras for better compatibility with .h5 files
            _model = keras.models.load_model(MODEL_PATH)
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
    img = image.copy().resize((100, 100))
    img_array = np.array(img)
    
    # 1. Basic Stats
    stat = ImageStat.Stat(img)
    stddev = sum(stat.stddev) / 3
    
    # 2. Reject extremely low-detail images (pure color blocks)
    if stddev < 10:
        return False
        
    # 3. Reject UI screenshots / Non-Natural images
    # UI elements often have high contrast and many sharp horizontal/vertical edges.
    # We check for the ratio of unique colors.
    pixels = img_array.reshape(-1, 3)
    unique_colors = len(np.unique(pixels, axis=0))
    # Natural skin photos usually have a lot of subtle gradients (high unique colors relative to simplicity)
    # but screenshots have extreme numbers of colors or very few.
    if unique_colors < 100: # Too simple
        return False

    # 4. Color range check (Skin is generally in a specific HSV range)
    hsv_img = img.convert('HSV')
    h, s, v = hsv_img.split()
    h_arr = np.array(h)
    # Skin usually falls in low hue (red/orange/yellow) 0-30 or 240-255
    skin_hue_mask = (h_arr < 35) | (h_arr > 230)
    skin_hue_pct = np.sum(skin_hue_mask) / h_arr.size
    
    if skin_hue_pct < 0.25: # If less than 25% of image matches skin tones
        return False

    # 5. Check for "flat" areas typical of UI backgrounds
    # Screenshots of windows often have large regions of identical pixels
    diffs = np.diff(img_array, axis=0)
    flat_rows = np.sum(np.all(diffs == 0, axis=-1)) / (100 * 100)
    if flat_rows > 0.4: # Too much flat area
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
