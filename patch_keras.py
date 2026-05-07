import os

filepath = "/Users/starkbbk/Library/Python/3.9/lib/python/site-packages/keras/src/models/functional.py"
with open(filepath, "r") as f:
    content = f.read()

patch = """
    args, kwargs = node_data
    # --- PATCH START ---
    if layer.__class__.__name__ in ["Add", "Multiply", "Subtract", "Divide"]:
        if isinstance(args, (list, tuple)) and len(args) > 1 and any(isinstance(x, (float, int)) for x in args):
            import tensorflow as tf
            new_list = []
            for a in args:
                if isinstance(a, (float, int)):
                    new_list.append(tf.constant(a, dtype=tf.float32))
                else:
                    new_list.append(a)
            args = (new_list,)
    # --- PATCH END ---
"""

if "# --- PATCH START ---" not in content:
    content = content.replace("    args, kwargs = node_data", patch)
    with open(filepath, "w") as f:
        f.write(content)
    print("Patched functional.py successfully.")
else:
    print("Already patched.")
