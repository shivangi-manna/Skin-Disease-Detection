import h5py
import json
import re
import shutil

# Copy to avoid corrupting original
shutil.copy('best_model.h5', 'fixed_model.h5')

with h5py.File('fixed_model.h5', 'r+') as f:
    model_config = f.attrs.get('model_config')
    if model_config is not None:
        if isinstance(model_config, bytes):
            config_str = model_config.decode('utf-8')
        else:
            config_str = model_config
            
        # 1. Fix batch_shape -> batch_input_shape
        config_str = config_str.replace('"batch_shape":', '"batch_input_shape":')
        
        # 2. Fix DTypePolicy -> string
        # Match "dtype": {"module": "keras", "class_name": "DTypePolicy", "config": {"name": "ANYTHING"}, "registered_name": null}
        # and replace with "dtype": "ANYTHING"
        pattern = r'"dtype":\s*\{\s*"module":\s*"keras",\s*"class_name":\s*"DTypePolicy",\s*"config":\s*\{\s*"name":\s*"([^"]+)"\s*\},\s*"registered_name":\s*null\s*\}'
        config_str = re.sub(pattern, r'"dtype": "\1"', config_str)
        
        f.attrs['model_config'] = config_str.encode('utf-8')
        print("Model config patched successfully.")
    else:
        print("No model config found.")
