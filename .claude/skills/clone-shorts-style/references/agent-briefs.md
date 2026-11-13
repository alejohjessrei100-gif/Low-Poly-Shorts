# Agent briefs for the gap-analysis team

Spawn the analysts in parallel. Each gets: the style bible, `measure/gaps.md`, the reference
contact sheets dir, our contact sheets dir, and ONE topic. Shared rules for every analyst:

> Put reference frames next to ours (`compare.py --pair`). Measure, don't opine: every finding
> needs a number from both sides (pixels, ratios, hue degrees, frame counts) and the frames it came
> from. Re-check any earlier note on your topic and say if it was wrong. End with a ranked list of
> fixes: exact parameter or code change, the file it lives in, and the expected new number.
> Do not edit files.

| analyst | measures |
|---|---|
| colour | saturation, shadow and highlight hue per lighting state, palette of the 8 most common colours, black point |
| ink lines | % of geometric edges with outlines (sample 20 edges), line width in px at 1080p, colour (pure black?), whether characters get lines too |
| light & shadow | key-light direction and colour, shadow length and softness, rim light, how light changes at the story pivot |
| textures | painted vs flat, grain scale, gaps between planks and stones, texture resolution, colour variation |
| characters | height in heads, head width/height ratio, limb thickness relative to head, line weight, number of expressions, how they're lit |
| depth & framing | background blur amount, subject size in frame, horizon position, foreground framing objects, fog/haze |
| motion | move length in frames, easing, speed, push-in vs pan share, idle micro-motion of characters (breathing, blinks), animation on twos |
| sound (optional) | music bed level vs voice, SFX per 10 s, whooshes on camera moves |

## Builders (after the analysts report)

Split by **file ownership**, one worktree each (`isolation: "worktree"`):

| builder | owns (example) |
|---|---|
| camera | `src/camera.*`, shot timing table |
| world | `src/world/*`, textures, lights |
| characters | `src/characters/*` |
| final look | `src/post/*` (ink pass, DoF, grade) |

Rules for builders: touch only your files. If you need a change in someone else's file, write
it in your report instead. The lead merges file by file, re-renders, re-runs `measure.py` and
`compare.py`, and loops until the gaps are closed.
