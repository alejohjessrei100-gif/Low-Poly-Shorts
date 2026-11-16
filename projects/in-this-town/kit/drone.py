"""Dark ambient music bed (our own synth, no samples) for scary / true-story episodes.

  python3 kit/drone.py out.wav --seconds 45 --root 55
Low minor drone with slow swells, a wind layer and a soft heartbeat-like pulse every 2 s.
"""
import argparse
import subprocess

import numpy as np

SR = 48000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('--seconds', type=float, default=45)
    ap.add_argument('--root', type=float, default=55.0)
    a = ap.parse_args()
    rng = np.random.default_rng(3)
    t = np.arange(int(a.seconds * SR)) / SR
    f0 = a.root
    x = np.zeros_like(t)
    for ratio, amp in [(1, 0.5), (1.5, 0.22), (2, 0.25), (2.378, 0.16), (3, 0.08)]:  # root, fifth, octave, minor third
        f = f0 * ratio * (1 + 0.002 * np.sin(2 * np.pi * 0.07 * t * ratio))
        x += amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.7 + 0.3 * np.sin(2 * np.pi * (0.05 + ratio * 0.01) * t + ratio))
    hi = 0.05 * np.sin(2 * np.pi * f0 * 8.01 * t) * np.clip(np.sin(2 * np.pi * t / 16), 0, 1) ** 3  # eerie high swell
    n = rng.standard_normal(len(t))
    k = np.exp(-2 * np.pi * 400 / SR)
    w = np.zeros_like(n)
    acc = 0.0
    for i in range(len(n)):
        acc = (1 - k) * n[i] + k * acc
        w[i] = acc
    wind = w * (0.5 + 0.5 * np.sin(2 * np.pi * 0.09 * t)) * 0.6
    pulse = np.zeros_like(t)
    for beat in np.arange(1.0, a.seconds, 2.0):
        for off, g in [(0, 1.0), (0.28, 0.7)]:
            j = int((beat + off) * SR)
            tt = np.arange(int(0.25 * SR)) / SR
            s = np.sin(2 * np.pi * 52 * tt) * np.exp(-14 * tt) * g
            pulse[j:j + len(s)] += s[: len(pulse) - j]
    y = x + hi + wind + 0.35 * pulse
    fade = int(1.5 * SR)
    y[:fade] *= np.linspace(0, 1, fade)
    y[-fade:] *= np.linspace(1, 0, fade)
    y /= np.abs(y).max() / 0.8
    raw = a.out + '.f32'
    y.astype(np.float32).tofile(raw)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', raw, a.out], check=True)
    import os
    os.remove(raw)
    print('wrote', a.out)


if __name__ == '__main__':
    main()
