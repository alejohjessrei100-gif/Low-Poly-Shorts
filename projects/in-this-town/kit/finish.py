"""Burn word-by-word captions onto rendered frames, add a music bed under the voice, encode MP4.

  python kit/finish.py --frames renders/ep01_test/frames --words episodes/01_shadow/words.json \
      --voice episodes/01_shadow/voice.mp3 --out renders/ep01_test/ep01_test.mp4 --fps 60 [--to 5.5]

Caption spec (measured on the reference sheets, colour changed to white on request):
one word at a time, lowercase, centred at about 62% of the height, Poppins ExtraBold 112 px, white fill,
13 px black outline, soft drop shadow; each word pops 0.6 -> 1.15 -> 1.0 over 4 frames.
"""
import argparse
import glob
import json
import os
import re
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "Poppins-800.ttf")
W, H = 1080, 1920
CY = int(H * 0.62)
_SPR = {}


def sprite(word, scale):
    key = (word, round(scale, 3))
    if key in _SPR:
        return _SPR[key]
    size = max(10, int(112 * scale))
    f = ImageFont.truetype(FONT, size)
    stroke = max(2, int(13 * scale))
    l, t, r, b = f.getbbox(word, stroke_width=stroke)
    pad = 40
    w, h = r - l + pad * 2, b - t + pad * 2
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).text((pad - l + 4, pad - t + 8), word, font=f, fill=(0, 0, 0, 140), stroke_width=stroke,
                                stroke_fill=(0, 0, 0, 140))
    img = shadow.filter(ImageFilter.GaussianBlur(14 * scale))
    ImageDraw.Draw(img).text((pad - l, pad - t), word, font=f, fill=(255, 255, 255, 255), stroke_width=stroke,
                             stroke_fill=(0, 0, 0, 255))
    _SPR[key] = img
    return img


def pop(k):
    """frames since the word appeared -> scale: 0.6, 1.15 peak at frame 2, settle to 1.0 by frame 4"""
    return [0.6, 0.95, 1.15, 1.06, 1.0][min(k, 4)]


def music(dur, sr=44100, bpm=118):
    """Original light bed: marimba-ish plucks (I-V-vi-IV in C) + soft bass. Kept simple and quiet."""
    beat = 60 / bpm
    out = np.zeros(int((dur + 1) * sr))
    prog = [(60, [72, 76, 79, 76]), (55, [71, 74, 79, 74]), (57, [72, 76, 81, 76]), (53, [72, 77, 81, 77])]
    mf = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731
    step = beat / 2
    for s in range(int(dur / step) + 1):
        bass, arp = prog[(s // 8) % 4]
        i0 = int(s * step * sr)
        tt = np.arange(int(0.5 * sr)) / sr
        note = arp[s % 4]
        x = (np.sin(2 * np.pi * mf(note) * tt) + 0.3 * np.sin(2 * np.pi * mf(note) * 4 * tt) * np.exp(-30 * tt)) * np.exp(-9 * tt)
        if s % 4 == 0:
            x += 0.8 * np.sin(2 * np.pi * mf(bass - 12) * tt) * np.exp(-5 * tt)
        seg = out[i0:i0 + len(x)]
        seg += x[: len(seg)] * 0.3
    return out[: int(dur * sr)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames")
    ap.add_argument("--words")
    ap.add_argument("--voice")
    ap.add_argument("--out")
    ap.add_argument("--fps", type=int, default=60)
    ap.add_argument("--to", type=float, default=0)
    a = ap.parse_args()

    words = json.load(open(a.words))["words"]
    spans = []
    for i, (s, e, w) in enumerate(words):
        nxt = words[i + 1][0] if i + 1 < len(words) else e + 0.4
        end = nxt if nxt - e < 0.45 else e + 0.25
        spans.append((s, end, re.sub(r"[^\w'$%-]", "", w.lower())))

    frames = sorted(glob.glob(os.path.join(a.frames, "*.jpg")))
    tmp = a.frames.rstrip("/") + "_cap"
    os.makedirs(tmp, exist_ok=True)
    for i, fp in enumerate(frames):
        t = i / a.fps
        img = Image.open(fp).convert("RGB")
        cur = next(((s, w) for s, e, w in spans if s <= t < e), None)
        if cur:
            k = int(round((t - cur[0]) * a.fps))
            sp = sprite(cur[1], pop(k))
            img.paste(sp, (W // 2 - sp.width // 2, CY - sp.height // 2), sp)
        img.save(os.path.join(tmp, f"{i:05d}.jpg"), quality=93)

    dur = len(frames) / a.fps
    # audio: voice + music bed 12 dB under it
    sr = 44100
    v = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", a.voice, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                                     capture_output=True, check=True).stdout, np.float32)[: int(dur * sr)]
    v = np.pad(v, (0, max(0, int(dur * sr) - len(v))))
    m = music(dur, sr)
    m *= (np.sqrt(np.mean(v ** 2)) * 10 ** (-12 / 20)) / (np.sqrt(np.mean(m ** 2)) + 1e-9)
    mix = v + m
    fade = int(0.08 * sr)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix /= max(1e-9, np.abs(mix).max()) / 0.89
    wav = tmp + "/mix.f32"
    mix.astype(np.float32).tofile(wav)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(a.fps), "-i", os.path.join(tmp, "%05d.jpg"),
                    "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", wav, "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-crf", "17", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.out], check=True)
    print("wrote", a.out, f"{dur:.2f}s")


if __name__ == "__main__":
    main()
