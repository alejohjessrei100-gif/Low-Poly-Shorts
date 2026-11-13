"""Synthesized sound effects + final audio mix (voice + music bed + SFX). All sounds are generated here (no samples).

  python3 kit/sfx.py episodes/02_gravity --music renders/music/bgm.wav --music-vol 0.25 --out episodes/02_gravity/mix.mp3

Cues live in <episode>/sfx.json: [[word, after, offset_s, kind, gain_db, dur_s], ...] anchored to words.json.
"""
import argparse
import json
import os
import re
import subprocess

import numpy as np

SR = 48000
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.005, r=0.2):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, cut):
    """one-pole low-pass, cut in Hz (scalar or per-sample array)"""
    cut = np.broadcast_to(np.asarray(cut, float), x.shape)
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def hp(x, cut):
    return x - lp(x, cut)


def noise(d):
    return rng.standard_normal(int(d * SR))


def sweep(f0, f1, d, shape='sin'):
    t = t_(d)
    f = f0 * (f1 / f0) ** (t / d)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) if shape == 'sin' else np.sign(np.sin(ph)) * 0.6


# ---------------------------------------------------------------- sounds
def whoosh_up(d=1.2):
    n = noise(d)
    cut = np.linspace(300, 4000, len(n))
    return lp(n, cut) * np.sin(np.linspace(0, np.pi, len(n))) ** 1.5 * 0.9


def whoosh_down(d=0.8):
    n = noise(d)
    return lp(n, np.linspace(5000, 300, len(n))) * np.sin(np.linspace(0, np.pi, len(n))) ** 1.2


def float_shimmer(d=1.6):
    t = t_(d)
    x = sum(np.sin(2 * np.pi * f * (1 + 0.6 * t / d) * t) / (k + 1) for k, f in enumerate([523, 784, 1047, 1568]))
    return x * env(len(t), 0.2, 0.6) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t)) * 0.35


def siren(d=3.0):
    t = t_(d)
    f = 650 + 350 * (0.5 - 0.5 * np.cos(2 * np.pi * t / 1.4))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)
    return x * env(len(t), 0.15, 0.6) * 0.35


def bell(d=2.5, f=220):
    t = t_(d)
    parts = [(0.5, 1.0, 1.2), (1.0, 0.8, 2.0), (1.19, 0.5, 2.6), (1.5, 0.45, 3.0), (2.0, 0.35, 3.6), (2.74, 0.2, 5), (3.0, 0.15, 6)]
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-k * t) for r, a, k in parts)
    return x * env(len(t), 0.002, 0.3) * 0.35


def tick(d=0.05, f=2800):
    t = t_(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-90 * t) * 0.5 + noise(d) * np.exp(-150 * t) * 0.2


def ticks(d=1.0, rate=4):
    out = np.zeros(int(d * SR))
    for i in range(int(d * rate)):
        s = tick(0.05, 2800 if i % 2 else 2200)
        j = int(i / rate * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def thump(d=0.3, f=70):
    t = t_(d)
    return (np.sin(2 * np.pi * f * t * (1 - 0.4 * t / d)) * np.exp(-14 * t) + lp(noise(d), 800) * np.exp(-40 * t) * 0.5) * 0.8


def boom(d=1.6):
    t = t_(d)
    return (np.sin(2 * np.pi * 45 * t * (1 - 0.3 * t / d)) * np.exp(-3 * t) + lp(noise(d), 300) * np.exp(-4 * t) * 0.8) * 0.9


def kick(d=0.25):
    t = t_(d)
    return (np.sin(2 * np.pi * 120 * t * np.exp(-12 * t)) * np.exp(-18 * t) + hp(noise(d), 1500) * np.exp(-60 * t) * 0.3) * 0.6


def jingle(d=2.0):
    notes = [784, 988, 1175, 988, 784, 1175, 1568]
    out = np.zeros(int(d * SR))
    for i, f in enumerate(notes):
        tt = t_(0.35)
        s = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.01 * tt)) * np.exp(-9 * tt) * 0.3
        j = int(i * 0.24 * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def chime(d=2.0):
    out = np.zeros(int(d * SR))
    for i, f in enumerate([1047, 1319, 1568, 2093]):
        tt = t_(1.2)
        s = np.sin(2 * np.pi * f * tt) * np.exp(-3.5 * tt) * 0.22
        j = int(i * 0.12 * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def wind(d=2.0):
    n = noise(d)
    t = t_(d)
    return lp(n, 500 + 400 * np.sin(2 * np.pi * 0.7 * t) ** 2) * env(len(n), 0.4, 0.6) * 1.2


def click(d=0.12):
    t = t_(d)
    return (hp(noise(d), 2500) * np.exp(-120 * t) + np.sin(2 * np.pi * 1800 * t) * np.exp(-80 * t) * 0.6) * 0.7


def belt_clicks(d=0.8):
    out = np.zeros(int(d * SR))
    for i in range(3):
        s = click()
        j = int((0.05 + i * 0.22) * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def squish(d=0.45):
    t = t_(d)
    return lp(noise(d), 900) * np.exp(-6 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * t)) * 0.8


def clank(d=0.7, f=330):
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-k * t) for r, a, k in [(1, 1, 8), (2.76, 0.6, 12), (5.4, 0.4, 18), (8.9, 0.25, 25)])
    return (x + hp(noise(d), 2000) * np.exp(-50 * t)) * 0.4


def chain_rattle(d=1.0):
    out = np.zeros(int(d * SR))
    for i in range(9):
        s = clank(0.25, 600 + 130 * (i % 4)) * 0.6
        j = int(i / 9 * d * 0.9 * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def creak(d=1.2):
    t = t_(d)
    f = 160 + 60 * np.sin(2 * np.pi * 0.9 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t))
    return lp(x, 1600) * env(len(t), 0.05, 0.3) * 0.35


def sting(d=1.6):
    t = t_(d)
    x = sum(np.sin(2 * np.pi * f * t) for f in [110, 155.6, 220.6, 311]) / 4
    return (x * np.exp(-1.6 * t) + boom(d) * 0.5) * 0.9


def ding(d=0.8, f=1319):
    t = t_(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 3 * t)) * np.exp(-5 * t) * 0.4


def cash(d=1.0):
    t = t_(d)
    bell_ = (np.sin(2 * np.pi * 2637 * t) + 0.6 * np.sin(2 * np.pi * 3520 * t)) * np.exp(-4 * t) * 0.3
    drawer = np.zeros_like(t)
    s = clank(0.3, 220) * 0.6
    drawer[: len(s)] += s
    return bell_ + drawer


def engine(d=2.5):
    t = t_(d)
    f = 48 + 6 * np.sin(2 * np.pi * 0.5 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sign(np.sin(ph)) * 0.5 + lp(noise(d), 200) * 0.6
    return lp(x, 400) * env(len(t), 0.4, 0.8) * 0.9


def hum(d=4.0):
    t = t_(d)
    x = np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 120 * t) + 0.25 * np.sin(2 * np.pi * 180 * t) + 0.15 * np.sin(2 * np.pi * 997 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 3 * t))
    return x * env(len(t), 0.5, 0.8) * 0.18


def beeps(d=3.0):
    out = np.zeros(int(d * SR))
    for i in range(int(d)):
        tt = t_(0.12)
        s = np.sin(2 * np.pi * 1760 * tt) * env(len(tt), 0.003, 0.03) * 0.3
        j = int(i * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def steps(d=1.2, rate=6):
    out = np.zeros(int(d * SR))
    for i in range(int(d * rate)):
        s = thump(0.12, 110) * 0.5 + hp(noise(0.12), 1200) * np.exp(-40 * t_(0.12)) * 0.15
        j = int(i / rate * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def alarm(d=3.0):
    t = t_(d)
    on = (np.floor(t * 4) % 2 == 0)
    return np.sign(np.sin(2 * np.pi * np.where(on, 880, 660) * t)) * 0.18 * env(len(t), 0.02, 0.3)


def heartbeat(d=2.4):
    out = np.zeros(int(d * SR))
    for i in range(int(d / 0.8)):
        for o, g in [(0, 1), (0.18, 0.7)]:
            s = thump(0.2, 55) * g
            j = int((i * 0.8 + o) * SR)
            out[j:j + len(s)] += s[: len(out) - j]
    return out


def riser(d=2.5):
    t = t_(d)
    x = sweep(110, 880, d) * 0.4 + lp(noise(d), np.linspace(400, 6000, int(d * SR))) * 0.5
    return x * (t / d) ** 2 * 0.8


def grabs(d=2.0, rate=3):
    out = np.zeros(int(d * SR))
    for i in range(int(d * rate)):
        s = clank(0.2, 520) * 0.5
        j = int(i / rate * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def splash(d=1.5):
    t = t_(d)
    n = noise(d)
    return (lp(n, 2500) * np.exp(-3.5 * t) + hp(n, 3000) * np.exp(-6 * t) * 0.4 + thump(d, 60)[: len(t)] * 0.6) * 0.9


def splashes(d=2.5):
    out = np.zeros(int(d * SR))
    for i in range(8):
        s = splash(1.2) * (0.5 + 0.5 * (i % 3) / 2)
        j = int((i * 0.22 + (i % 2) * 0.07) * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def thuds(d=1.2):
    out = np.zeros(int(d * SR))
    for i, o in enumerate([0.05, 0.18, 0.33, 0.45, 0.6]):
        s = thump(0.35, 60 + i * 8)
        j = int(o * SR)
        out[j:j + len(s)] += s[: len(out) - j]
    return out


def crowd(d=2.5):
    t = t_(d)
    x = np.zeros_like(t)
    for k in range(14):
        f0 = 180 + 220 * rng.random()
        vib = np.sin(2 * np.pi * (4 + 3 * rng.random()) * t + rng.random() * 6)
        ph = 2 * np.pi * np.cumsum(f0 * (1 + 0.08 * vib + 0.15 * np.sin(2 * np.pi * 0.7 * t + k))) / SR
        x += (np.sin(ph) + 0.4 * np.sin(2 * ph)) * (0.5 + 0.5 * np.sin(2 * np.pi * (1 + rng.random()) * t + k)) ** 2
    x = lp(x / 14 + lp(noise(d), 1800) * 0.25, 2500)
    return x * env(len(t), 0.2, 0.8) * 1.4


def pops(d=1.5):
    out = np.zeros(int(d * SR))
    for i in range(10):
        tt = t_(0.08)
        s = hp(noise(0.08), 1500) * np.exp(-60 * tt) * 0.5
        j = int(rng.random() * (d - 0.1) * SR)
        out[j:j + len(s)] += s
    return out


def sparkle(d=1.5):
    out = np.zeros(int(d * SR))
    for i in range(12):
        f = 2000 + 2500 * rng.random()
        tt = t_(0.4)
        s = np.sin(2 * np.pi * f * tt) * np.exp(-10 * tt) * 0.15
        j = int(i / 12 * (d - 0.4) * SR)
        out[j:j + len(s)] += s
    return out


KINDS = {k: v for k, v in globals().items() if callable(v) and k not in ('t_', 'env', 'lp', 'hp', 'noise', 'sweep', 'main', 'load')}


def load(path, n):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    return x


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('episode')
    ap.add_argument('--music', default='')
    ap.add_argument('--music-vol', type=float, default=0.25)
    ap.add_argument('--sfx-vol', type=float, default=0.55, help='SFX peak level relative to the voice peak')
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    words = json.load(open(os.path.join(a.episode, 'words.json')))['words']
    norm = lambda w: re.sub(r"[^a-z0-9']", '', w.lower())  # noqa: E731
    cues = json.load(open(os.path.join(a.episode, 'sfx.json')))
    v = load(os.path.join(a.episode, 'voice.mp3'), 0)
    n = len(v)
    sfx = np.zeros(n + SR * 3)
    for word, after, off, kind, gdb, dur in cues:
        t0 = next(s for s, e, w in words if s >= after - 0.01 and norm(w) == word) + off
        x = KINDS[kind](dur)
        x = x / (np.abs(x).max() + 1e-9) * 10 ** (gdb / 20)
        j = int(max(0, t0) * SR)
        sfx[j:j + len(x)] += x[: len(sfx) - j]
    sfx = sfx[:n]
    vp = np.abs(v).max()
    sfx *= vp * a.sfx_vol
    if a.music:
        m = load(a.music, n)
        m = np.tile(m, int(np.ceil(n / len(m))))[:n]
        m *= np.sqrt(np.mean(v ** 2)) * a.music_vol / (np.sqrt(np.mean(m ** 2)) + 1e-9)
    else:
        m = np.zeros(n)
    mix = v + m + sfx
    fade = int(0.08 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix /= np.abs(mix).max() / 0.89
    raw = a.out + '.f32'
    mix.astype(np.float32).tofile(raw)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', raw, '-b:a', '256k', a.out], check=True)
    os.remove(raw)
    print('wrote', a.out, f'{n / SR:.2f}s', len(cues), 'cues')


if __name__ == '__main__':
    main()
