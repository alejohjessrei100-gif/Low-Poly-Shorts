"""Measure a video's look and camera every single frame (numpy + Pillow + ffmpeg only).

  python measure.py refs/*.mp4 --out measure/ref [--sheets]
  python measure.py renders/ours.mp4 --out measure/ours --sheets

Per video it writes <out>/<name>.json (per-shot + per-frame numbers) and, with --sheets,
contact sheets: every frame, 60 per image (2 s at 30 fps) tiled 10x6 with frame numbers.
Over all inputs it writes <out>/summary.json and <out>/summary.md (medians across videos).

What it measures and why (each was a gap that made a clone look cheap):
  cuts          hard cuts via colour-histogram jumps -> cuts per video, shot lengths
  motion        sub-pixel phase-correlation pan at 1-frame AND 8-frame gaps (slow drifts are
                invisible frame-to-frame), plus zoom (push-in) search -> % of frames moving,
                typical glide length in frames, ease in/out
  tone          mean luma, contrast (luma std), black point p1, white point p99 -> pure black or not?
  colour        mean saturation, hue of the darkest 20% (shadow tint) and brightest 20% (highlight tint)
  ink           density of thin dark lines (comic outlines) per frame
  depth blur    sharpness of frame border vs centre -> background blur strength
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw

W = 240  # analysis width (px); heights keep the aspect ratio


# ------------------------------------------------------------------ io
def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate", "-of", "json", path],
                         capture_output=True, text=True, check=True).stdout
    s = json.loads(out)["streams"][0]
    num, den = map(int, s["r_frame_rate"].split("/"))
    h = int(round(s["height"] * W / s["width"] / 2) * 2)
    return num / den, h


def frames(path, h):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{h}:flags=area",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = W * h * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, W, 3).astype(np.float32) / 255
    p.wait()


# ------------------------------------------------------------------ per-frame metrics
def luma(f):
    return f @ np.array([0.2126, 0.7152, 0.0722], np.float32)


def hsv(f):
    mx, mn = f.max(2), f.min(2)
    d = mx - mn + 1e-6
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return hue, (mx - mn) / (mx + 1e-6), mx


def circ_mean(deg, w):
    if w.sum() < 1e-3:
        return None
    a = np.deg2rad(deg)
    return float(np.rad2deg(np.arctan2((np.sin(a) * w).sum(), (np.cos(a) * w).sum())) % 360)


def box(x, r):
    """box blur of radius r via cumulative sums"""
    k = 2 * r + 1
    p = np.pad(x, r, mode="edge")
    c = p.cumsum(0)
    c = np.vstack([c[k - 1:k], c[k:] - c[:-k]])
    c = c.cumsum(1)
    return np.hstack([c[:, k - 1:k], c[:, k:] - c[:, :-k]]) / (k * k)


def lap_var(y):
    l = -4 * y[1:-1, 1:-1] + y[:-2, 1:-1] + y[2:, 1:-1] + y[1:-1, :-2] + y[1:-1, 2:]
    return float(l.var())


def frame_stats(f):
    y = luma(f)
    hue, sat, _ = hsv(f)
    lo, hi = np.percentile(y, [20, 80])
    sw = ((y <= lo) & (sat > 0.08)).astype(np.float32)
    hw = ((y >= hi) & (sat > 0.08)).astype(np.float32)
    ink = (y < 0.28) & (y < box(y, 2) - 0.12)  # thin dark lines darker than their surroundings
    h, w = y.shape
    cy0, cy1, cx0, cx1 = h // 4, 3 * h // 4, w // 4, 3 * w // 4
    centre = lap_var(y[cy0:cy1, cx0:cx1])
    border = np.concatenate([y[:h // 6].ravel(), y[-h // 6:].ravel()])
    border_var = lap_var(np.vstack([y[:h // 6], y[-h // 6:]])) if border.size else 0
    return dict(luma=float(y.mean()), contrast=float(y.std()), black=float(np.percentile(y, 1)),
                white=float(np.percentile(y, 99)), sat=float(sat.mean()),
                shadow_hue=circ_mean(hue, sw), highlight_hue=circ_mean(hue, hw),
                ink=float(ink.mean()), sharp_centre=centre, sharp_border=border_var)


# ------------------------------------------------------------------ cuts + camera motion
def hist(f):
    q = (f * 7.999).astype(np.int32)
    idx = q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]
    return np.bincount(idx.ravel(), minlength=512) / idx.size


HANN = {}


def phase_shift(a, b):
    """sub-pixel (dx, dy) that moves a onto b, via phase correlation"""
    if a.shape not in HANN:
        HANN[a.shape] = np.outer(np.hanning(a.shape[0]), np.hanning(a.shape[1]))
    A, B = np.fft.fft2((a - a.mean()) * HANN[a.shape]), np.fft.fft2((b - b.mean()) * HANN[a.shape])
    R = A.conj() * B
    r = np.fft.ifft2(R / (np.abs(R) + 1e-9)).real
    py, px = np.unravel_index(r.argmax(), r.shape)

    def sub(c, m, n):
        y0, y1, y2 = c(m - 1), c(m), c((m + 1) % n)
        d = y0 - 2 * y1 + y2
        return 0.5 * (y0 - y2) / d if abs(d) > 1e-9 else 0.0

    dy = py + sub(lambda k: r[k % r.shape[0], px], py, r.shape[0])
    dx = px + sub(lambda k: r[py, k % r.shape[1]], px, r.shape[1])
    dy = dy - r.shape[0] if dy > r.shape[0] / 2 else dy
    dx = dx - r.shape[1] if dx > r.shape[1] / 2 else dx
    return float(dx), float(dy)


SCALES = np.linspace(0.97, 1.03, 13)


def fshift(a, dx, dy):
    """shift an image by a sub-pixel (dx, dy) with the Fourier shift theorem"""
    fy, fx = np.fft.fftfreq(a.shape[0])[:, None], np.fft.fftfreq(a.shape[1])[None, :]
    return np.fft.ifft2(np.fft.fft2(a) * np.exp(-2j * np.pi * (fx * dx + fy * dy))).real.astype(np.float32)


def zoom_rate(a, b, dx=0.0, dy=0.0):
    """best uniform scale s so that b ~= a magnified by s around the centre (s>1 = push-in).
    The pan (dx, dy) is removed first, otherwise a sideways move reads as a fake zoom."""
    a = fshift(a, dx, dy)
    h, w = a.shape
    ia = Image.fromarray(a)
    m = (slice(h // 8, h - h // 8), slice(w // 8, w - w // 8))
    errs = []
    for s in SCALES:
        nw, nh = int(round(w * s)), int(round(h * s))
        z = np.asarray(ia.resize((nw, nh), Image.BILINEAR))
        x0, y0 = (nw - w) // 2, (nh - h) // 2
        if s >= 1:
            z = z[y0:y0 + h, x0:x0 + w]
        else:
            pad = np.full((h, w), np.nan, np.float32)
            pad[-y0:-y0 + nh, -x0:-x0 + nw] = z
            z = pad
        errs.append(np.nanmean((z[m] - b[m]) ** 2))
    errs = np.array(errs)
    i = int(np.nanargmin(errs))
    s = SCALES[i]
    if 0 < i < len(SCALES) - 1:  # parabolic refinement
        d = errs[i - 1] - 2 * errs[i] + errs[i + 1]
        if d > 0:
            s += 0.5 * (errs[i - 1] - errs[i + 1]) / d * (SCALES[1] - SCALES[0])
    return float(s)


# ------------------------------------------------------------------ contact sheets
def sheet(frames_, start, fps, out):
    cols, rows = 10, 6
    th, tw = frames_[0].shape[0] // 2, W // 2
    im = Image.new("RGB", (cols * tw, rows * (th + 12)), "black")
    d = ImageDraw.Draw(im)
    for k, f in enumerate(frames_):
        x, y = (k % cols) * tw, (k // cols) * (th + 12)
        im.paste(Image.fromarray((f * 255).astype(np.uint8)).resize((tw, th)), (x, y + 12))
        d.text((x + 2, y), f"{start + k} {(start + k) / fps:.2f}s", fill="white")
    im.save(out)


# ------------------------------------------------------------------ main loop
GAP = 8  # frames between slow-motion samples


def analyse(path, out_dir, sheets):
    print("measuring", path, file=sys.stderr, flush=True)
    fps, h = probe(path)
    name = os.path.splitext(os.path.basename(path))[0]
    sdir = os.path.join(out_dir, name + "_sheets")
    if sheets:
        os.makedirs(sdir, exist_ok=True)
    per, ring, hprev, buf, cut_idx = [], [], None, [], [0]
    per_sheet = 60  # one sheet = 60 frames (2 s at 30 fps, 1 s at 60 fps)
    for i, f in enumerate(frames(path, h)):
        y = luma(f)
        hcur = hist(f)
        cut = hprev is not None and 0.5 * np.abs(hcur - hprev).sum() > 0.45
        if cut:
            cut_idx.append(i)
            ring = []
        st = frame_stats(f) if i % 2 == 0 else {}
        if ring:
            st["dx1"], st["dy1"] = phase_shift(ring[-1], y)
        if len(ring) >= GAP:
            dx, dy = phase_shift(ring[-GAP], y)
            st["pan8"] = float(np.hypot(dx, dy)) / GAP
            if i % 4 == 0:
                st["zoom8"] = (zoom_rate(ring[-GAP], y, dx, dy) - 1) / GAP
        st["cut"] = bool(cut)
        st["held"] = bool(ring) and float(np.abs(ring[-1] - y).mean()) < 0.002  # exact repeat of the last frame
        per.append(st)
        ring = (ring + [y])[-GAP:]
        hprev = hcur
        if sheets:
            buf.append(f)
            if len(buf) == per_sheet:
                sheet(buf, i + 1 - per_sheet, fps, os.path.join(sdir, f"{(i + 1 - per_sheet):05d}.jpg"))
                buf = []
    if sheets and buf:
        sheet(buf, len(per) - len(buf), fps, os.path.join(sdir, f"{len(per) - len(buf):05d}.jpg"))

    n = len(per)
    cut_idx.append(n)
    # moving = pan faster than 0.03 px/frame at 240 px wide, or zoom faster than 0.03 %/frame
    pan = np.array([p.get("pan8", np.nan) for p in per])
    zoom = np.array([p.get("zoom8", np.nan) for p in per])
    # zoom is sampled every 4th frame: carry each sample over its 4 frames
    zfill = np.array([zoom[i - i % 4] if i - i % 4 < n else np.nan for i in range(n)])
    has = ~np.isnan(pan)
    moving_pan = pan[has] > 0.03
    zoom_on = np.abs(np.nan_to_num(zfill[has])) > 0.0003
    moving = moving_pan | zoom_on
    zs = zoom[~np.isnan(zoom)]
    # camera moves: runs of moving frames (gaps of <=4 still frames bridged, e.g. held frames)
    speed = np.zeros(n)  # px/frame at 240 px width; zoom converted to the speed of the frame edge
    speed[has] = pan[has] + np.abs(np.nan_to_num(zfill[has])) * W / 2
    mv = np.zeros(n, bool)
    mv[has] = moving
    runs, i0, gap = [], None, 0
    for i in range(n + 1):
        if i < n and mv[i]:
            i0, gap = (i if i0 is None else i0), 0
        elif i0 is not None:
            gap += 1
            if gap > 4 or i == n:
                runs.append((i0, i - gap + 1))
                i0, gap = None, 0
    runs = [(a_, b_) for a_, b_ in runs if b_ - a_ >= 6]
    eased = 0
    for a_, b_ in runs:  # slow-in/slow-out if the first and last quarter move slower than the middle
        v = speed[a_:b_]
        q = max(1, len(v) // 4)
        mid = np.median(v[q:-q]) if len(v) > 2 * q else np.median(v)
        eased += bool(np.median(v[:q]) < 0.7 * mid and np.median(v[-q:]) < 0.7 * mid)
    shots = []
    for a, b in zip(cut_idx[:-1], cut_idx[1:]):
        seg = [p for p in per[a:b] if "luma" in p]
        if not seg:
            continue
        g = lambda key: float(np.median([s[key] for s in seg if s.get(key) is not None])) if any(  # noqa: E731
            s.get(key) is not None for s in seg) else None
        shots.append(dict(start=a, end=b, seconds=round((b - a) / fps, 2),
                          **{k_: g(k_) for k_ in ("luma", "contrast", "black", "white", "sat", "shadow_hue",
                                                   "highlight_hue", "ink", "sharp_centre", "sharp_border")}))
    stats = [p for p in per if "luma" in p]
    med = lambda key: float(np.median([s[key] for s in stats if s.get(key) is not None]))  # noqa: E731
    summary = dict(
        file=path, fps=fps, frames=n, seconds=round(n / fps, 2), hard_cuts=len(cut_idx) - 2,
        mean_shot_s=round(n / fps / max(1, len(shots)), 2),
        pct_frames_camera_moving=round(100 * float(moving.mean()), 1) if moving.size else 0,
        pct_frames_panning=round(100 * float(moving_pan.mean()), 1) if moving_pan.size else 0,
        pct_frames_zooming=round(100 * float(zoom_on.mean()), 1) if zoom_on.size else 0,
        pct_zoom_samples_push_in=round(100 * float(np.mean(zs > 0.0003)), 1) if zs.size else 0,
        camera_moves=len(runs), median_move_frames=int(np.median([b_ - a_ for a_, b_ in runs])) if runs else 0,
        pct_moves_eased=round(100 * eased / len(runs), 1) if runs else 0,
        median_move_speed_px=round(float(np.median(speed[mv])), 3) if mv.any() else 0,
        pct_held_frames=round(100 * float(np.mean([p["held"] for p in per])), 1),
        luma=med("luma"), contrast=med("contrast"), black_point=med("black"), white_point=med("white"),
        saturation=med("sat"), shadow_hue=circ_mean(np.array([s["shadow_hue"] for s in stats if s["shadow_hue"] is not None]),
                                                    np.ones(sum(s["shadow_hue"] is not None for s in stats))),
        highlight_hue=circ_mean(np.array([s["highlight_hue"] for s in stats if s["highlight_hue"] is not None]),
                                np.ones(sum(s["highlight_hue"] is not None for s in stats))),
        ink_density=med("ink"), border_vs_centre_sharpness=round(med("sharp_border") / max(1e-9, med("sharp_centre")), 3),
    )
    json.dump(dict(summary=summary, shots=shots, frames=per), open(os.path.join(out_dir, name + ".json"), "w"))
    return summary


HUE_NAMES = [(15, "red"), (45, "orange"), (70, "yellow"), (160, "green"), (200, "cyan"), (255, "blue"),
             (290, "purple"), (335, "magenta"), (361, "red")]


def hue_name(h):
    return "-" if h is None else next(n for lim, n in HUE_NAMES if h < lim) + f" ({h:.0f})"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("videos", nargs="+")
    ap.add_argument("--out", default="measure")
    ap.add_argument("--sheets", action="store_true", help="also write 60-frame contact sheets")
    ap.add_argument("--jobs", type=int, default=1, help="videos measured in parallel (one CPU each)")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    if a.jobs > 1:
        from multiprocessing import Pool
        with Pool(a.jobs) as pool:
            rows = pool.starmap(analyse, [(v, a.out, a.sheets) for v in a.videos])
    else:
        rows = [analyse(v, a.out, a.sheets) for v in a.videos]
    keys = [k for k, val in rows[0].items() if isinstance(val, (int, float)) and not isinstance(val, bool)]
    agg = {k: float(np.median([r[k] for r in rows])) for k in keys}
    for k in ("shadow_hue", "highlight_hue"):
        hs = [r[k] for r in rows if r[k] is not None]
        agg[k] = circ_mean(np.array(hs), np.ones(len(hs))) if hs else None
    agg["videos"] = len(rows)
    json.dump(dict(median=agg, videos=rows), open(os.path.join(a.out, "summary.json"), "w"), indent=1)
    with open(os.path.join(a.out, "summary.md"), "w") as f:
        f.write(f"# Measured style numbers ({len(rows)} videos, medians)\n\n| metric | median |\n|---|---|\n")
        for k, val in agg.items():
            f.write(f"| {k} | {hue_name(val) if k.endswith('_hue') else val if isinstance(val, int) else f'{val:.4g}'} |\n")
    print(open(os.path.join(a.out, "summary.md")).read())


if __name__ == "__main__":
    main()
