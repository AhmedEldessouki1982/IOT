"""RenderCommon - force Cycles rendering onto the NVIDIA CUDA GPU.

Usage (must run BEFORE starting a render, headless or GUI):

    exec(open('/path/to/render_common.py').read())  # or add to sys.path

Or import as a module via blender's script path:

    import render_common
    render_common.force_gpu(scene)

For headless `blender -b ... -P job.py`, simply place at the very top of job.py:
    exec(open('/abs/path/render_common.py').read())
    force_gpu()

Sets active GPU device (CUDA) as the Cycles compute device, disables CPU as
the Cycles backend, and re-points scene.cycles.device to GPU. Falls back to CPU
only if no CUDA device is available or a flag is passed.
"""

import bpy


def _set_backend() -> bool:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'CUDA'
    prefs.get_devices(compute_device_type='CUDA')
    cuda = [d for d in prefs.devices if d.type == 'CUDA']
    if not cuda:
        return False
    for d in prefs.devices:
        if d.type == 'CUDA':
            d.use = True
        else:
            d.use = False
    return True


def force_gpu(scene: bpy.types.Scene = None, fallback_cpu: bool = True) -> None:
    scene = scene or bpy.context.scene
    ok = _set_backend()
    if ok:
        scene.cycles.device = 'GPU'
        print('[render_common] Cycles backend -> CUDA GPU')
    elif fallback_cpu:
        scene.cycles.device = 'CPU'
        print('[render_common] WARNING: no CUDA device, fell back to CPU')
    else:
        raise RuntimeError('render_common: no CUDA device and fallback_cpu=False')


if __name__ == '__main__':
    force_gpu()
    print('[render_common] ready')