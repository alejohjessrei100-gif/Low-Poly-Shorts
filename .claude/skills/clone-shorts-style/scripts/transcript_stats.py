"""Script-formula numbers from YouTube auto-subtitles (.vtt with word timings) or Whisper JSON.

  python transcript_stats.py refs/*.en.vtt [--out measure/script.md]

Per video: words, seconds of speech, words/second, dead-air share (gaps > 0.4 s), the opening
line (the hook: read it, is it a paradox / question / claim?). Across videos: the 2-4 word phrases
that recur in many videos (pivot phrases such as "you see", "here's the thing", "but then").
Whisper JSON input: [{"start": s, "end": e, "word": "..."}...] or {"words": [[s, e, word], ...]}.
"""
import argparse
import collections
import json
import os
import re

TS = r"(\d+):(\d+):(\d+)\.(\d+)"


def secs(m):
    h, mi, s, ms = map(int, m)
    return h * 3600 + mi * 60 + s + ms / 1000


def vtt_words(path):
    """[(t, word)] using the inline <00:00:01.230> word tags auto-subs carry; falls back to cue starts."""
    out, seen = [], set()
    txt = open(path, encoding="utf-8").read()
    for block in txt.split("\n\n"):
        lines = block.strip().splitlines()
        cue = next((l for l in lines if "-->" in l), None)
        if not cue:
            continue
        t0 = secs(re.match(TS, cue).groups())
        for l in lines[lines.index(cue) + 1:]:
            if "<" not in l:  # plain repeat line of the rolling caption: skip, tagged lines carry new words
                continue
            first = re.sub(r"<[^>]+>", "", l.split("<", 1)[0]).strip()
            items = [(t0, w) for w in first.split()]
            for m in re.finditer(r"<" + TS + r"><c>([^<]*)</c>", l):
                items += [(secs(m.groups()[:4]), w) for w in m.group(5).split()]
            for t, w in items:
                key = (round(t, 2), w)
                if key not in seen:
                    seen.add(key)
                    out.append((t, w))
    if not out:  # manual subs: no word tags -> spread cue text across the cue
        for m in re.finditer(TS + r" --> " + TS + r"[^\n]*\n(.+?)(?:\n\n|\Z)", txt, re.S):
            a, b = secs(m.groups()[:4]), secs(m.groups()[4:8])
            ws = re.sub(r"<[^>]+>", "", m.group(9)).split()
            out += [(a + (b - a) * k / max(1, len(ws)), w) for k, w in enumerate(ws)]
    return sorted(out)


def load(path):
    if path.endswith(".json"):
        d = json.load(open(path))
        if isinstance(d, dict):
            return [(w[0], w[2]) for w in d["words"]]
        return [(w["start"], w["word"]) for w in d]
    return vtt_words(path)


def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    rows, grams = [], collections.Counter()
    for f in a.files:
        ws = [(t, w) for t, w in load(f) if norm(w) and not w.startswith("[")]
        if len(ws) < 5:
            continue
        times = [t for t, _ in ws]
        dur = times[-1] - times[0] + 0.4
        gaps = [b - x for x, b in zip(times, times[1:])]
        dead = sum(g - 0.4 for g in gaps if g > 0.4)
        toks = [norm(w) for _, w in ws]
        seen = set()
        for n in (2, 3, 4):
            for i in range(len(toks) - n + 1):
                seen.add(" ".join(toks[i:i + n]))
        grams.update(seen)  # counted once per video
        rows.append(dict(file=os.path.basename(f), words=len(ws), seconds=round(dur, 1),
                         wps=round(len(ws) / dur, 2), dead_air_pct=round(100 * dead / dur, 1),
                         hook=" ".join(w for _, w in ws[:18])))
    n = len(rows)
    stop = {"of the", "in the", "it was", "and the", "to the", "on the", "is the", "at the", "that the", "it's a",
            "for the", "was a", "is a", "in a", "and he", "to be", "this is", "of a"}
    common = [(g, c) for g, c in grams.most_common(400) if c >= max(2, n // 4) and g not in stop][:25]
    md = [f"# Script numbers ({n} transcripts)\n",
          f"- median words/second: **{sorted(r['wps'] for r in rows)[n // 2]}**",
          f"- median dead air: **{sorted(r['dead_air_pct'] for r in rows)[n // 2]}%** of runtime (gaps > 0.4 s)",
          f"- median length: **{sorted(r['seconds'] for r in rows)[n // 2]} s**, "
          f"{sorted(r['words'] for r in rows)[n // 2]} words\n",
          "## Recurring phrases (videos containing it)\n", "| phrase | videos |", "|---|---|"]
    md += [f"| {g} | {c}/{n} |" for g, c in common]
    md += ["\n## Hooks (first ~18 words) - classify each: paradox, question, claim, number, command\n",
           "| video | wps | dead air | hook |", "|---|---|---|---|"]
    md += [f"| {r['file']} | {r['wps']} | {r['dead_air_pct']}% | {r['hook']} |" for r in rows]
    text = "\n".join(md)
    print(text)
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        open(a.out, "w").write(text + "\n")


if __name__ == "__main__":
    main()
