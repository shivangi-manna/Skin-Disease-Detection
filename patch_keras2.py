import os

filepath = "/Users/starkbbk/Library/Python/3.9/lib/python/site-packages/keras/src/models/functional.py"
with open(filepath, "r") as f:
    content = f.read()

patch = """
    args, kwargs = node_data
    # --- PATCH START 2 ---
    has_float = False
    if isinstance(args, (tuple, list)):
        for x in args:
            if isinstance(x, (float, int)): has_float = True
            if isinstance(x, (list, tuple)):
                for y in x:
                    if isinstance(y, (float, int)): has_float = True
    if has_float:
        print("FLOAT DETECTED IN ARGS for layer:", layer.__class__.__name__)
        print("ARGS:", args)
        
        # Aggressive patch
        import tensorflow as tf
        def convert_to_tensor(val):
            if isinstance(val, (float, int)): return tf.constant(val, dtype=tf.float32)
            if isinstance(val, list): return [convert_to_tensor(v) for v in val]
            if isinstance(val, tuple): return tuple(convert_to_tensor(v) for v in val)
            return val
        args = convert_to_tensor(args)
        print("NEW ARGS:", args)
    # --- PATCH END 2 ---
"""

# replace the old patch
if "# --- PATCH START ---" in content:
    start_idx = content.find("# --- PATCH START ---")
    end_idx = content.find("# --- PATCH END ---") + len("# --- PATCH END ---")
    content = content[:start_idx] + patch.strip() + content[end_idx:]
    with open(filepath, "w") as f:
        f.write(content)
    print("Patched functional.py aggressively.")
