import tensorflow as tf

try:
    print("Loading model...")
    model = tf.keras.models.load_model("best_model.h5", compile=False, safe_mode=False)
    print("Model loaded successfully.")
except Exception as e:
    import traceback
    print("Failed to load model:")
    traceback.print_exc()
