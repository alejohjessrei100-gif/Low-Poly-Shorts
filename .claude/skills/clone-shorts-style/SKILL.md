---
name: clone-shorts-style
description: Learn the visual and script style of a YouTube Shorts channel from its latest ~20 videos by MEASURING them frame by frame (30 fps contact sheets, camera motion, cuts, colour, ink lines, blur, words/second, hook and pivot phrases), write a numeric style bible, then build an original animated Short in code (three.js, Blender or similar) and close the look gap with a topic-split agent team. Use when the user wants to make Shorts "in the style of" a channel, analyse a channel's videos, reverse-engineer why a style looks premium, or fix "ours looks cheap" against a reference.
---

# Clone a Shorts style (measure, don't guess)

Workflow: collect references -> measure every frame -> write a numeric style bible -> pick an
original story -> fact-check -> script with the measured formula -> 5 s look test -> build ->
check stills -> gap analysis with a topic-split team -> fix -> render -> final compare.

Core rule: **don't ask what a video "feels" like; make it measure.** You can't recreate an opinion,
you can recreate a number. Every claim in the style bible needs a number or a frame reference.

Copy the style, never the IP: own characters, own story, own name and logo. Never re-use the
channel's characters, mascots, faces, branding or a story they already told.

Scripts live in `scripts/` next to this file (numpy + Pillow + ffmpeg; yt-dlp for downloads).
Below, `$SK` means this skill's directory.

## 1. Collect references (about 20 videos)

```bash
pip install -q yt-dlp
bash $SK/scripts/fetch_refs.sh "https://www.youtube.com/@CHANNEL" 20 refs/
```
- Pick the latest 20 **in the target style**, and drop off-style videos.
- Check the audio language. YouTube may serve an auto-**dub** (for example German). The script prefers the
  `original` track; confirm with `ffprobe` or by listening to a few seconds, and re-download if it's wrong.
- Keep `list.tsv` (titles and views). It's your topic-overlap list in step 4.
- Cloud machines usually hit YouTube's "confirm you're not a bot" check on downloads (listing still
  works). Then either run with `COOKIES=cookies.txt` (exported from the user's logged-in browser,
  which is the user's call because it's their account) or have the user run `fetch_refs.sh` on their own computer
  and upload the `refs/` folder. Don't pretend you watched videos you couldn't download.

## 2. Measure every frame

```bash
python3 $SK/scripts/measure.py refs/*.mp4 --out measure/ref --sheets
python3 $SK/scripts/transcript_stats.py refs/*.vtt --out measure/ref/script.md
```
`measure.py` reads **every** frame (a normal "analyse this video" samples a few frames and misses the
micro-animation, slow camera drift and light changes that make a style feel real). Output:
- `measure/ref/summary.md`: medians across videos for hard cuts, shot length, % of frames the camera
  moves, % pushing in, move length in frames, % of moves eased, held frames (animating on twos), luma,
  contrast, black and white point, saturation, shadow and highlight hue, ink-line density, and
  background blur.
- `<video>_sheets/*.jpg`: one contact sheet per 2 s, 60 frames tiled 10×6 with frame numbers. View
  them (the Read tool shows images). Use them for what numbers can't tell you: character proportions
  (count head-heights, compare limb thickness to head width), outline style, texture painting, how
  lighting follows the story, and where the camera travels instead of cutting.
- **Measurement traps:** frame-to-frame motion misses slow push-ins. That's why the tool also
  measures over an 8-frame gap and searches zoom separately. Spot-check any "camera is still X% of the time"
  claim on a contact sheet. Re-measure any note you wrote by eye. Eyeballed notes are often
  backwards (for example "their heads are egg-shaped" when ours were the egg-shaped ones).

`transcript_stats.py` gives words/second, dead air, every hook (first ~18 words), and the phrases that recur
across videos. Read the transcripts too. Fill the beats table in the style bible: hook type,
escalation, pivot ("you see…"), real reason, payoff, last-line twist.

## 3. Write the style bible

Fill `references/style-bible-template.md` and save it as `style-bible.md` in the project. Every
row gets a measured value, a source (sheet and frame, or metric), and a "how we build it" note. This is the spec
that every later step and agent works from.

## 4. Pick an original story

- Brainstorm 5–10 topics in the formula. **Drop any topic that overlaps a reference title or
  transcript.** A topic the channel already covered loses on both originality and novelty.
- **Fact-check before writing a word:** dates, counts, measurements, with sources. Look for a true
  detail that can double as the joke (for example "the river was only 2 ft deep", used twice with
  opposite meanings).
- Ask the user to choose if several topics are equally good.

## 5. Write the script

Follow the measured formula: hook in sentence one (often a paradox), escalation, the measured pivot
phrase, the real reason, payoff, and a last-line twist. Time it at the measured words/second, with no intro and no dead
air. Give the user the narration as **one paragraph with no line breaks** for their TTS (ElevenLabs etc.).
Get word timings back from the voice (Whisper) and drive cuts, camera moves and captions from them.

## 6. Build

- Pick the engine to fit the style. For flat 2D characters in a real 3D world, three.js (plus Remotion or a
  frame-capture loop for rendering) is fast to iterate. Blender suits heavier 3D. Test a **5-second look
  test** first and show it to the user before the full build.
- Use free or CC0 models and procedural textures. Draw characters in code with several expressions.
- Post-process **order matters**: outline (ink) pass AFTER depth-of-field and blur, or the blur wipes the ink
  lines. Check each pass really shows in the output (measure ink_density and border sharpness).
- Camera: glide between beats over the measured move length with ease in and out, instead of snapping in a
  few frames. Hard-cut only as often as the reference does.
- Colour: match the black point (many premium styles have **no pure black**), saturation, and
  shadow tint (for example purple shadows at sunset, not brown). Let lighting follow the story (for example warm
  setup, then cool night-blue at the pivot), as the reference does.

## 7. Check stills before rendering video

Render one still per shot (start, middle, end) and look at all of them before any video render.
Checklist:
- camera inside geometry
- camera overshooting past the subject on a push
- props or chains in front of faces
- wrong-coloured assets (teal trees)
- characters floating or clipping
- captions covering faces

## 8. Gap analysis with an agent team (when the result looks cheap)

1. Render ours, run `measure.py renders/ours.mp4 --out measure/ours --sheets`, then
   `compare.py measure/ref/summary.json measure/ours/summary.json --out measure/gaps.md`.
   Make side-by-sides with `compare.py --pair ref.png ours.png --out pair.jpg`.
2. **Analysts, one topic each** (briefs in `references/agent-briefs.md`):
   - colour
   - ink lines
   - light and shadow
   - textures
   - characters
   - depth and framing
   - motion (camera and character)
   - sound (optional)

   Each puts reference and our frames side by side and returns **numbers plus the exact fix**. They also
   re-check earlier notes, which can be wrong. Run them in parallel.
3. **Builders split by FILE, not just by job.** Agents editing the same project overwrite each other.
   - Give each builder its own copy (`isolation: "worktree"`) and an explicit list of the files it owns. It
     touches nothing else.
   - Typical owners: camera, world, characters, and final look (post-process and grade).
   - Merge back file by file, then re-measure and repeat until the gap report is clean or the
     user is happy.

## 9. Render and deliver

Render the final video, run the compare one last time, and make a contact sheet of the final frames. Look at
it, then send the video. Report the remaining gaps honestly.

## Known failure modes (seen in practice)
- Ink effect present but invisible because blur ran in the same pass (ink density 0).
- Depth-of-field so weak it's unmeasurable (border/centre sharpness about 1.0 when the reference is 0.5).
- Camera snaps in about 3 frames where the reference glides over about 20–25 frames with ease in and out.
- Near-pure blacks against a reference with lifted blacks, and brown shadows instead of purple or blue.
- Characters under 3 heads tall with limbs about 5× too thick, so they look like pasted clip art.
- "Camera is still 80% of the time" from a frame-to-frame tool. It was actually slow push-ins about 65% of the time.
- Auto-dubbed reference audio (wrong language) breaking the transcript analysis.
