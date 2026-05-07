import os

filepath = "/Users/starkbbk/Library/Python/3.9/lib/python/site-packages/keras/src/models/functional.py"
with open(filepath, "r") as f:
    content = f.read()

patch = """    args, kwargs = deserialize_node(node_data, created_layers)
    # --- PATCH START ---
    if layer.__class__.__name__ in ["Multiply", "Add", "Subtract", "Divide"]:
        flat_args = args[0] if (isinstance(args, (list, tuple)) and len(args) == 1 and isinstance(args[0], (list, tuple))) else args
        if isinstance(flat_args, (list, tuple)) and any(isinstance(x, (float, int)) for x in flat_args):
            scalar = next((x for x in flat_args if isinstance(x, (float, int))), None)
            tensor = next((x for x in flat_args if not isinstance(x, (float, int))), None)
            if scalar is not None and tensor is not None:
                import keras
                if layer.__class__.__name__ == "Multiply":
                    class MathConstantLayer(keras.layers.Layer):
                        def call(self, inputs): return inputs * scalar
                elif layer.__class__.__name__ == "Add":
                    class MathConstantLayer(keras.layers.Layer):
                        def call(self, inputs): return inputs + scalar
                elif layer.__class__.__name__ == "Subtract":
                    class MathConstantLayer(keras.layers.Layer):
                        def call(self, inputs): return inputs - scalar
                elif layer.__class__.__name__ == "Divide":
                    class MathConstantLayer(keras.layers.Layer):
                        def call(self, inputs): return inputs / scalar
                        
                new_layer = MathConstantLayer(name=layer.name)
                created_layers[layer.name] = new_layer
                layer = new_layer
                args = [tensor] # Make args a list with a single element
    # --- PATCH END ---"""

if "# --- PATCH START ---" not in content:
    content = content.replace("    args, kwargs = deserialize_node(node_data, created_layers)", patch)
    with open(filepath, "w") as f:
        f.write(content)
    print("Patched functional.py successfully.")
else:
    print("Already patched.")
