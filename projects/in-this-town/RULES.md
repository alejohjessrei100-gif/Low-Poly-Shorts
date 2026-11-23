# In This Town: house rules

Set by the channel owner. Every episode follows these.

1. **Length 30–45 seconds** (from episode 4). Script about 100–150 words (the +4 / 1.25x voice runs about 3.4 words per
   second).
2. **Blur only where it helps (changed 22 Nov 2026).** Upgraded episodes call `C.allowBlur(true)`: gentle depth of field
   focused on the subject (`kit/polish.js` `dof()`), motion blur on fast moves (`C.renderAccum`, 3 sub-frames). Older
   episodes never opt in, so they stay sharp.
3. **Check and auto-fix before rendering.** Before any video render:
   1. `node kit/autofix.mjs episodes/<ep>`: finds camera-in-wall, blocked frames, hidden characters and clipping,
      and fixes them with the smallest camera move or character nudge. Every change is logged in
      `episodes/<ep>/autofix.json` (delete it to undo). It never moves seated characters, never pushes anyone
      out of frame, and never re-aims wide shots (unless run with `--aim`).
   2. `node kit/clipcheck.mjs episodes/<ep>`: must come back clean, including the frame checks (black frames,
      one-colour frames, sudden jumps). Intended contacts go in `episodes/<ep>/clip_allow.json`.
   3. Fix by hand whatever autofix reports as "still needs a human look", then look at a still from every shot for:
   - camera inside a wall, building, car, tree or character
   - characters clipping into walls, floors, furniture or each other
   - props passing through hands, faces or bodies
   - subject out of frame or hidden behind something
   - mirrored or upside-down text, missing textures, black or blank frames
4. **Voice:** ElevenLabs Adam, pitch +4, speed 1.25x. **Captions:** white, Poppins 800 at 56 px, one word at a time.
5. **Music:** background track at 25% of the voice loudness. **Sound effects:** synthesized in `kit/sfx.py`, cued to words.
6. **Backgrounds:** detailed, never bare grass (`kit/world.js` suburbs + backdrop).
7. **New town every episode.** Never reuse a previous episode's town layout, main street, landmark buildings
   or palette. Each episode gets its own location built for its story (for example a snowy mountain village,
   a beach town on stilts, a desert canyon town, a floating sky city, a swamp village, a neon night city), with
   its own terrain, architecture, colours, landmark and lighting. Shared code (avatars, captions, SFX, QA) is
   fine; what the viewer sees of the world must be new. Keep a list of used settings below.
8. **Faces act (changed 22 Nov 2026).** The face rig (`kit/face.js`) gives every character separate eyes, pupils, lids,
   brows and a mouth: named presets (happy, laughing, sad, crying, angry, furious, scared, shocked, smug, suspicious,
   embarrassed, determined, bored, dread, starstruck) that blend over ~5 frames and are keyed a few frames before the
   beat, automatic blinks, moving pupils, and lip-sync from the word timings plus the voice loudness (`amp.json`).
   Personalities set how far faces go: Kuro dramatic, Mom stern, teacher deadpan. Bodies act with `kit/act.js` (R15
   elbows/knees, anticipation, follow-through, idle breathing/glances, grounded walk cycles, squash & stretch) and the
   camera eases with punch-ins and shakes on hits.
9. **Show the world (not zoomed in).** At least half the shots are wide (characters at most 25% of the frame height), the rest
    medium (at most 45%). At most 4 close-ups per episode, only on key beats, listed in
    `window.HOUSE_RULES.close`. Every scene opens on an establishing shot. Lens 50-60 degrees. `clipcheck` reports
    `TOO_TIGHT` and counts the wide shots; `autofix` pulls tight cameras back.
10. **Detail.** Streets and sets are dressed with clutter (benches, bins, signs, bikes, crates, pots, stalls),
    real 3D window frames, doors, balconies and roof detail, and ambient life (background crowd, birds,
    vehicles or boats, smoke, flags, setting particles). `clipcheck` warns `DETAIL_LOW` when a non-close shot
    has too little in view. Static detail is baked, moving detail is instanced, so phones stay fast.
11. **Hook = absurd + debate bait.** The first line must be a rule that is both absurd and something people will
    argue about in the comments (take a side, say it's unfair, say they'd break it): kids vote and adults don't,
    pineapple pizza is a crime, kids grade their parents. Keep it harmless: no real politics, religion, real people,
    slurs, or anything dangerous to copy.
12. **Look.** New episodes use `createCore(canvas, { look: 'blender' })`: AgX colour, sky image lighting, ambient
    occlusion and bloom on lamps and glowing things.
13. **Meme sound effects** may come from myinstants.com when they fit the beat (one or two per video, on the joke).
    Most clips there are user uploads of other people's audio, so they can trigger copyright claims or demonetize a
    video. Prefer our own synthesized sound-alikes in `kit/sfx.py`; list any downloaded clip in the episode's
    `sfx_sources.txt` so it can be swapped out if a platform flags it.
14. **Real-world scale.** New sets are built in metres: people 1.75 m, floors 3.2 m, doors 2.3 m, street lamps 6 m,
    cars at their real length (4.5-5 m), a two-lane road 10 m. Characters must look small next to buildings, never
    taller than a door. Episodes in metres set `window.QA.scale = 1/3` so the QA thresholds match.
15. **Characters = our classic avatars, at real size.** From episode 6 the cast is the original avatars
    (`kit/avatar.js`: rounded boxes, drawn faces, hair, hats) through `kit/rig.js`: grown-ups 1.7-1.85 m, kids
    1.3-1.45 m, animated with named clips (walk, sprint, idle, cheer, emote-yes/no, interact, holding, pick-up, sit,
    wave, clap, shrug, facepalm...) that keep the feet on the ground; vary them from shot to shot, `poseArms()` mixes
    two clips. One steady face per line via `c.setFace()` (rule 8). Cars, trees, food and props still come from the
    CC0 library in `assets/cc0/` via `kit/assets.js` (Kenney, Quaternius; credits in `assets/cc0/NOTICE.txt`); the
    phone page ships each model as `<name>.glb.txt` (base64) because artifact hosting does not serve `.glb`.
16. **YouTube title = "In this town, X".** Every upload title starts with "In this town," followed by the rule
    from the hook (e.g. "In this town, nobody gets a phone until 18 📵"). Keep it under about 60 characters,
    at most one emoji. Description: what happens, then the debate question, then the series line. Hashtags: 3-5
    starting with #shorts #viral. Tags: specific to the episode's rule, characters and setting.
17. **Plain scripts, no audio tags.** Scripts are plain text for ElevenLabs (no [excited]-style tags). Word count
    110-130, which lands at 30-45 s after the 1.25x speed-up.
18. **True-story Shorts (a second format next to In This Town).** Real, fact-checked stories (sources in the
    episode's SOURCES.md; disputed details softened to "about" / "the story goes"). Rule 16's "In this town" title
    does not apply; these use hook titles with one or two CAPS words and 1-2 emojis ("10-Year-Old Saw The Ocean
    DISAPPEAR... 🌊😨"). Script built for retention: the first sentence is the most shocking moment (cold open, and
    the first shot shows it), then who / where / when in one breath, a re-hook around the middle ("But here's the
    strange part"), the climax, and a last line that lands hard or loops back to the start. Short sentences, no
    filler. Description ends with "Based on a true story. Some scenes are dramatized."
19. **Every script starts with "In this town,"** (the reference scripts open "In this world/town/jungle,"; ours always say town). The first sentence is the rule and its penalty.
20. **Story structure for scripts (from the reference scripts the user shared, 23 Nov 2026).** Rule + automatic penalty
    -> "You see," how it works with 3 examples -> "Because of this," how the world behaves -> "But one day," the
    inciting incident -> a visible countdown or stages of the penalty -> a mentor/object/warning that gets planted
    -> escalating journey with specific creepy details -> a personal-stakes reveal at the middle -> a win -> a
    fake-out ("you think that was the list?") -> the planted object pays off -> resolution -> a final sting that
    loops back. Shorts version (110-130 words): 0-3 s rule+penalty, 3-9 you see+3 examples, 9-13 because of this,
    13-18 trigger+countdown, 18-30 plant+escalation, 30-38 reveal+fake-out, 38-45 payoff+sting. A new fact or turn
    every 5-8 s, each paragraph ends on a mini-hook.

## Settings used so far
- Ep 1 "Your Shadow Is Free": pastel main street, town hall with gold dome, glass skyline, suburbs.
- Ep 2 "Lie Balloons": seaside harbor town (`kit/harbor.js`): gabled row houses, cobblestones, quay, boats,
  lighthouse, terraced hillside with a church, stone-and-verdigris town hall.
- Ep 3 "The Mountain Whisper": snowy alpine village (`kit/alpine.js`): timber chalets with lit windows, balconies and
  icicles, Echo Point lookout on a cliff, frozen pond, cable car, pine forests, a giant talking mountain, snowfall.
- Ep 4 "Pineapple Crime": neon night city (`kit/neon.js`): wet reflective street, lit towers, neon shop and blade signs,
  fire escapes, lanterns, giant street screen, Slice Palace pizzeria with a secret pineapple room.
  Rebuilt in metres with the CC0 characters and cars (v2).
- Ep 5 "No Phones Till 18": farm town Pigeon Creek (`kit/farm.js`): brick and clapboard main street with real shop windows,
  awnings and signs, a columned town hall with a clock tower, swaying instanced cornfields, red barn with silos, windmill
  pump, water tower, farmhouses, power lines, two cell towers, a storm system (rain, clouds, lightning). Kids are the
  blocky characters at 1.3-1.4 m; Theo is blocky_c repainted (`skin` option in `kit/assets.js`).
