# In This Town: house rules

Set by the channel owner. Every episode follows these.

1. **Length 30–45 seconds** (from episode 4). Script about 100–150 words (the +4 / 1.25x voice runs about 3.4 words per
   second).
2. **No blur.** Depth of field is switched off in `kit/core.js`; everything in frame stays sharp.
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
8. **No talking animation.** Mouths don't flap and heads don't bob while someone speaks. Each line gets one
   steady facial expression that fits it (happy, scared, determined, smug...). `talkFace()` in `kit/avatar.js`
   already does this.
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
15. **CC0 asset library.** Characters, cars and food come from `assets/cc0/` through `kit/assets.js` (Kenney Blocky
    Characters, Car Kit and Food Kit, Quaternius; all CC0, credits in `assets/cc0/NOTICE.txt`). Use their real body
    animations (walk, sprint, idle, sit, emote-yes/no, interact, holding, pick-up, kick...) and vary them from shot to
    shot; `poseArms()` mixes two clips (walk while carrying). Their faces are printed on, which fits rule 8. The phone
    page ships each model as `<name>.glb.txt` (base64) because artifact hosting does not serve `.glb`.

## Settings used so far
- Ep 1 "Your Shadow Is Free": pastel main street, town hall with gold dome, glass skyline, suburbs.
- Ep 2 "Lie Balloons": seaside harbor town (`kit/harbor.js`): gabled row houses, cobblestones, quay, boats,
  lighthouse, terraced hillside with a church, stone-and-verdigris town hall.
- Ep 3 "The Mountain Whisper": snowy alpine village (`kit/alpine.js`): timber chalets with lit windows, balconies and
  icicles, Echo Point lookout on a cliff, frozen pond, cable car, pine forests, a giant talking mountain, snowfall.
- Ep 4 "Pineapple Crime": neon night city (`kit/neon.js`): wet reflective street, lit towers, neon shop and blade signs,
  fire escapes, lanterns, giant street screen, Slice Palace pizzeria with a secret pineapple room.
  Rebuilt in metres with the CC0 characters and cars (v2).
