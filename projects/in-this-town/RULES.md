# In This Town: house rules

Set by the channel owner. Every episode follows these.

1. **Length 45–60 seconds.** Script about 160–200 words (the +4 / 1.25x voice runs about 3.5 words per second).
2. **No blur.** Depth of field is switched off in `kit/core.js`; everything in frame stays sharp.
3. **Check before rendering.** Before any video render, run the automatic clipping check
   (`node kit/clipcheck.mjs episodes/<ep>`) and fix every hit, then check a still from the start, middle
   and end of every shot for:
   - camera inside a wall, building, car, tree or character
   - characters clipping into walls, floors, furniture or each other
   - props passing through hands, faces or bodies
   - subject out of frame or hidden behind something
   - mirrored or upside-down text, missing textures, black or blank frames
4. **Voice:** ElevenLabs Adam, pitch +4, speed 1.25x. **Captions:** white, Poppins 800 at 56 px, one word at a time.
5. **Music:** background track at 25% of the voice loudness. **Sound effects:** synthesized in `kit/sfx.py`, cued to words.
6. **Backgrounds:** detailed, never bare grass (`kit/world.js` suburbs + backdrop).
