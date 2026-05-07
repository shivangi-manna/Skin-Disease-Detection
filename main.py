import os

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image, ImageStat
import io
import tensorflow as tf
import keras
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
MODEL_PATH = "best_model.h5"
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
    """
    Strict dermoscopy-focused validation.
    Rejects: selfies, portraits, full-body shots, random photos.
    Accepts: close-up macro skin lesion photos.
    """
    img128 = image.copy().resize((128, 128))
    img_arr = np.array(img128).astype(float)
    r, g, b = img_arr[:,:,0], img_arr[:,:,1], img_arr[:,:,2]

    # ── 1. Reject if image is too dark or too bright (not a proper skin photo) ──
    mean_brightness = img_arr.mean()
    if mean_brightness < 40 or mean_brightness > 230:
        return False

    # ── 2. Skin tone dominance check ──
    # True skin lesion close-ups are dominated by red/orange/pink/brown pixels.
    # r > g > b is the canonical skin channel ordering.
    skin_pixel_mask = (r > 60) & (r > g) & (g > b * 0.7) & (r - b > 15)
    skin_pct = np.sum(skin_pixel_mask) / (128 * 128)
    if skin_pct < 0.40:   # At least 40% of pixels must look like skin
        return False

    # ── 3. Reject portraits / selfies via background uniformity ──
    # Close-up skin photos have VERY uniform background color variation.
    # Portraits have hair, clothing, surroundings — high inter-channel variance.
    hsv = img128.convert('HSV')
    h_arr, s_arr, v_arr = [np.array(c).astype(float) for c in hsv.split()]
    
    # Saturation std: dermoscopy images have LOW saturation variance (uniform lesion)
    # Portraits have high saturation variation (hair, lips, clothing, background)
    sat_std = s_arr.std()
    if sat_std > 68:      # High saturation spread → not a close-up skin photo
        return False

    # ── 4. Hue concentration check ──
    # Dermoscopy close-ups have hue concentrated in red/brown range.
    # Portraits introduce greens (background), blues (clothing), etc.
    skin_hue_mask = (h_arr < 45) | (h_arr > 210)
    skin_hue_pct = np.sum(skin_hue_mask) / h_arr.size
    if skin_hue_pct < 0.50:   # >50% pixels must be red/brown/pink hue
        return False

    # ── 5. Structural edge check ──
    # Dermoscopy: smooth gradients, no harsh structured lines (like face features).
    # Portraits have sharp eyes, nose, mouth, hair edges → many high-gradient pixels.
    gray = np.mean(img_arr, axis=-1)
    dy, dx = np.gradient(gray)
    edge_mag = np.sqrt(dx**2 + dy**2)
    # Portraits have BOTH many sharp edges (features) AND flat regions (background).
    high_edge_pct = np.sum(edge_mag > 35) / edge_mag.size
    if high_edge_pct > 0.08:  # Too many sharp structural edges
        return False

    # ── 6. Green channel rejection ──
    # If green channel average is close to red, likely not a skin-dominant image.
    mean_r, mean_g, mean_b = r.mean(), g.mean(), b.mean()
    if (mean_r - mean_g) < 8:   # Red must dominate over green for skin
        return False

    # ── 7. Local texture variance (dermoscopy has subtle micro-texture) ──
    # Flat solid-color images and low-detail photos are rejected.
    stat = ImageStat.Stat(img128)
    avg_std = sum(stat.stddev[:3]) / 3
    if avg_std < 15 or avg_std > 90:  # Too flat OR too chaotic (not skin close-up)
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
