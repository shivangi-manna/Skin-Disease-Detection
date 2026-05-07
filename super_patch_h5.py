import h5py
import json
import os

def patch_h5_deeply(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"File {input_path} not found.")
        return

    with h5py.File(input_path, 'r') as f:
        config_data = f.attrs.get('model_config')
        if config_data is None:
            print("No model_config found.")
            return
        
        if isinstance(config_data, bytes):
            config_str = config_data.decode('utf-8')
        else:
            config_str = config_data
            
        config = json.loads(config_str)

    def fix_layer(layer):
        if 'config' in layer:
            l_config = layer['config']
            
            # Fix batch_input_shape and batch_shape
            if 'batch_shape' in l_config:
                l_config['batch_input_shape'] = l_config.pop('batch_shape')
            
            if 'batch_input_shape' in l_config:
                val = l_config['batch_input_shape']
                if isinstance(val, str):
                    try:
                        # Convert string "[None, 224, 224, 3]" to list [None, 224, 224, 3]
                        val = val.replace('None', 'null')
                        l_config['batch_input_shape'] = json.loads(val)
                    except: pass
                elif isinstance(val, list):
                    # Ensure None is properly handled
                    l_config['batch_input_shape'] = [None if x == "None" else x for x in val]

            # Fix dtype policy objects
            if 'dtype' in l_config and isinstance(l_config['dtype'], dict):
                if 'config' in l_config['dtype'] and 'name' in l_config['dtype']['config']:
                    l_config['dtype'] = l_config['dtype']['config']['name']
            
            # Fix nested layers (like in TimeDistributed or Bidirectional)
            if 'layer' in l_config:
                fix_layer(l_config['layer'])
            
            # Fix sub-layers in Sequential or Functional (Keras puts layers inside config)
            if 'layers' in l_config:
                for sub_layer in l_config['layers']:
                    fix_layer(sub_layer)
        
        # Just in case layers are at the root of the layer dict
        if 'layers' in layer:
            for sub_layer in layer['layers']:
                fix_layer(sub_layer)

    # Apply fixes to the whole config
    if 'config' in config:
        if isinstance(config['config'], list):
            for layer in config['config']:
                fix_layer(layer)
        elif isinstance(config['config'], dict) and 'layers' in config['config']:
            for layer in config['config']['layers']:
                fix_layer(layer)

    new_config_bytes = json.dumps(config).encode('utf-8')

    # Write new file
    import shutil
    shutil.copy(input_path, output_path)
    with h5py.File(output_path, 'r+') as f:
        f.attrs['model_config'] = new_config_bytes
    
    print(f"Deeply patched model saved to {output_path}")

if __name__ == "__main__":
    patch_h5_deeply('best_model.h5', 'super_fixed_model.h5')
