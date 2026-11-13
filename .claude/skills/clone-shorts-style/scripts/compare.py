"""Gap report: our measured numbers vs the reference medians, grouped by analyst topic.

  python compare.py measure/ref/summary.json measure/ours/summary.json [--out measure/gaps.md]
  python compare.py --pair ref_frame.png our_frame.png --out pair.jpg   # side-by-side still

Every row says which topic owns the gap (colour, ink, light, depth, motion, editing), so the
gap-analysis team can be split by topic and each analyst starts from numbers, not opinions.
"""
import argparse
import json

from PIL import Image, ImageDraw

# metric -> (topic, how to read it, relative tolerance)
METRICS = {
    "saturation": ("colour", "mean HSV saturation", 0.15),
    "shadow_hue": ("colour", "hue of the darkest 20% (shadow tint)", None),
    "highlight_hue": ("colour", "hue of the brightest 20%", None),
    "black_point": ("light", "1st-percentile luma (0 = pure black)", 0.35),
    "white_point": ("light", "99th-percentile luma", 0.08),
    "luma": ("light", "mean brightness", 0.15),
    "contrast": ("light", "luma std-dev", 0.15),
    "ink_density": ("ink", "share of pixels on thin dark outlines", 0.3),
    "border_vs_centre_sharpness": ("depth", "edge sharpness of frame border / centre (<1 = blurred bg)", 0.3),
    "pct_frames_camera_moving": ("motion", "% frames where the camera drifts/pans/pushes", 0.2),
    "pct_frames_zooming": ("motion", "% frames pushing in/out", 0.3),
    "median_move_frames": ("motion", "length of a camera move in frames", 0.3),
    "pct_moves_eased": ("motion", "% moves with slow-in/slow-out", 0.25),
    "median_move_speed_px": ("motion", "camera speed, px/frame at 240 px width", 0.35),
    "pct_held_frames": ("motion", "% frames that repeat the previous one (animating on twos?)", 0.5),
    "hard_cuts": ("editing", "hard cuts per video", 0.5),
    "mean_shot_s": ("editing", "average shot length (s)", 0.35),
}


def hue_gap(a, b):
    return None if a is None or b is None else abs((a - b + 180) % 360 - 180)


def report(ref, ours):
    r, o = ref.get("median", ref), ours.get("median", ours)
    rows, by_topic = [], {}
    for k, (topic, desc, tol) in METRICS.items():
        if k not in r or k not in o:
            continue
        rv, ov = r[k], o[k]
        if k.endswith("_hue"):
            g = hue_gap(rv, ov)
            bad = g is not None and g > 25
            delta = "-" if g is None else f"{g:.0f} deg off"
        elif k.startswith("pct_"):  # percentages: compare in points
            bad = abs(ov - rv) > 15
            delta = f"{ov - rv:+.0f} pts"
        elif abs(rv) < 1e-6:
            bad = abs(ov) > 1e-3
            delta = f"{ov - rv:+.3g}"
        else:
            rel = (ov - rv) / abs(rv)
            bad = abs(rel) > tol
            delta = f"{rel * 100:+.0f}%"
        fmt = lambda v: "-" if v is None else f"{v:.4g}"  # noqa: E731
        rows.append(f"| {'**GAP**' if bad else 'ok'} | {topic} | {k} | {fmt(rv)} | {fmt(ov)} | {delta} | {desc} |")
        if bad:
            by_topic.setdefault(topic, []).append(k)
    md = ["# Gap report: reference vs ours\n", "| | topic | metric | reference | ours | diff | meaning |",
          "|---|---|---|---|---|---|---|"] + rows
    md += ["\n## Gaps by topic (one analyst per topic)\n"]
    md += [f"- **{t}**: {', '.join(ks)}" for t, ks in by_topic.items()] or ["- none above tolerance"]
    return "\n".join(md)


def pair(a, b, out):
    A, B = Image.open(a).convert("RGB"), Image.open(b).convert("RGB")
    h = min(A.height, B.height, 960)
    A, B = A.resize((int(A.width * h / A.height), h)), B.resize((int(B.width * h / B.height), h))
    im = Image.new("RGB", (A.width + B.width + 8, h + 24), "black")
    im.paste(A, (0, 24))
    im.paste(B, (A.width + 8, 24))
    d = ImageDraw.Draw(im)
    d.text((6, 6), "REFERENCE", fill="white")
    d.text((A.width + 14, 6), "OURS", fill="white")
    im.save(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ref", nargs="?")
    ap.add_argument("ours", nargs="?")
    ap.add_argument("--pair", nargs=2, metavar=("REF_IMG", "OUR_IMG"))
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    if a.pair:
        pair(*a.pair, a.out or "pair.jpg")
        return
    text = report(json.load(open(a.ref)), json.load(open(a.ours)))
    print(text)
    if a.out:
        open(a.out, "w").write(text + "\n")


if __name__ == "__main__":
    main()
