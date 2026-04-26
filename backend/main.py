from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image
import io
import tensorflow as tf

app = FastAPI()

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock model loading - In a real scenario, you'd load your .h5 or SavedModel
# model = tf.keras.models.load_model('skin_cancer_model.h5')

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
    return {"message": "Skin Disease Detection API is running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Read image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert('RGB')
    image = image.resize((224, 224))
    
    # Preprocessing
    img_array = np.array(image) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    # In a real scenario:
    # predictions = model.predict(img_array)
    # score = tf.nn.softmax(predictions[0])
    # class_idx = np.argmax(score)
    
    # Mocking a "tagda" response for demonstration if model file isn't present
    # We'll simulate a prediction
    import random
    class_idx = random.randint(0, len(CLASSES) - 1)
    confidence = random.uniform(0.85, 0.99)
    
    return {
        "class": CLASSES[class_idx],
        "confidence": float(confidence),
        "details": f"The model detected {CLASSES[class_idx]} with {confidence:.2%} confidence."
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
