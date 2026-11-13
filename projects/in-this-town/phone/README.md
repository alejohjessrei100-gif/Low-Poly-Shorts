# Phone render page

`index.html` renders an episode on the phone's GPU in the browser, burns captions (same spec as
`kit/finish.py`), mixes voice + music (music at 25 % of voice RMS), encodes H.264 + AAC/Opus with
WebCodecs and mp4-muxer, and saves the MP4 through the artifact `downloads` capability.

Published layout (files next to the page): `kit/*.js`, `kit/fonts/Poppins-800.ttf`,
`episodes/01_shadow/{episode.js,words.json}`, `audio/{voice,music}.mp3`, `lib/mp4-muxer.js`
(npm mp4-muxer@5.1.3 build/mp4-muxer.js). three.js loads from jsDelivr (three@0.170.0).
`?frames=N` limits the frame count for local testing.
