# Style bible: "In this town…" blocky-avatar story Shorts

References: 19 TikTok videos (the channel's latest), 44 min, about 157,000 frames at 60 fps, every frame measured
with `clone-shorts-style/scripts/measure.py`. Transcripts: 18 caption files via `transcript_stats.py`.
The channel has only 28 videos. Their topics are all off-limits for us (list at the bottom).

## Script
| item | measured | source | how we build it |
|---|---|---|---|
| length | **139 s** median (108–155), **381 words** | info.json, script.md | target 130–145 s, about 370–400 words |
| pace | **2.76 words/s**, **5% dead air** | script.md | ElevenLabs at normal speed; trim every pause over 0.4 s |
| hook | "In this town, <one impossible rule>." in 18/18 (17 say "town", 1 says "world") | hooks table | first sentence = the rule, nothing before it |
| explain | "You see," or "See," right after the hook in about 12/18 | transcripts | second sentence: how the rule works plus the stakes |
| narrator | first person, "My name is <X>" in 12/18 | recurring phrases | named kid or teen narrator, with "I" from line 3 |
| beats | rule → how it works → my problem → funny montage of how the town copes → my scheme → villain or disaster ("then I noticed something strange", 8/18) → secret lair, machine or big button → countdown climax → win → **twist that flips the rule back** | 3 full transcripts | one beat about every 12–15 s |
| phrases | "the entire" 14/18, "a giant" 14/18, "for the first time" 9/18, "that's when" 8/18 | recurring phrases | use them naturally; they're the voice of the format |
| ending | last line = an ironic reversal (new tax on breathing; the billionaire becomes invisible; "if the lights go out again, he's dead") | transcripts | punchline in the final 5 s, no outro |

## Camera and editing
| item | measured | source | how we build it |
|---|---|---|---|
| hard cuts | **56 per video**, **2.4 s** average shot (1.6–2.9) | hard_cuts, mean_shot_s | a new shot about every 2.4 s; on long beats every 1.5 s |
| camera moving | **87% of frames** (79–98) | pct_frames_camera_moving | the camera never sits still |
| push-ins | **82%** of frames have zoom motion, 63% of it pushing in | pct_frames_zooming | default move = slow dolly-in on the subject |
| move length | **58 frames** (about 1 s at 60 fps) | median_move_frames | each shot = one continuous move |
| easing | only **25%** of moves eased | pct_moves_eased | mostly **linear** constant-speed drifts, not ease-in-out glides |
| speed | 0.25 px/frame at 240 px width (about 1.1 px/frame at 1080p) | median_move_speed_px | slow: about 3–5% of frame width per second |
| held frames | 10% | pct_held_frames | renders at 60 fps; character animation is smooth (not on twos) |
| opener | slow aerial push down the main street towards the town landmark | sheet 7703800777336212768/00000 | establishing drone shot, 2–3 s |

## Look
| item | measured | source | how we build it |
|---|---|---|---|
| black point | **0.16** luma (no pure black) | black_point | lift blacks with a curve; night scenes are navy, not black |
| white point | 0.99 | white_point | bright skies and signs can clip |
| brightness, contrast | luma 0.56, contrast 0.19 | luma, contrast | bright and soft, low contrast |
| saturation | **0.40** (0.30 at night, 0.49 in day scenes) | saturation | candy pastel: sky blue, mint, pink, yellow |
| shadow tint | **purple (285°)** | shadow_hue | blue-violet ambient and fill light, warm sun |
| highlight tint | yellow-green (88°) | highlight_hue | warm sun key |
| outlines | **none** (ink density 0.009, about 0) | ink_density | no outline pass |
| depth of field | border/centre sharpness **0.21** (strong blur) | border_vs_centre_sharpness | heavy background blur on close-ups. The caption sits in the centre and inflates the centre sharpness, so check against sheets |
| night | navy-blue scenes with floodlights, police red/blue, rain | stills 7707085218670185760 | lighting follows the story: day setup, night climax |

## Characters (from sheets and stills)
| item | measured | source | how we build it |
|---|---|---|---|
| type | blocky 3D avatars (box head, box torso, box limbs), smooth-shaded, lit by the scene | stills | original avatar kit, our own faces, no platform logos |
| height | about 4.5–5 heads | stills | head about 0.2 of body height |
| faces | flat 2D cartoon faces on the head box, many expressions (shocked, happy, scared) | stills | face texture swap per beat |
| props | huge readable signs and UI ("NEW RULE! FLYING LICENSE $1,000", a phone with "BALANCE: $110") | stills | full-screen sign and phone close-ups for every number in the script |

## Captions
| item | measured | source | how we build it |
|---|---|---|---|
| layout | **one word at a time**, centre of the frame (about 60% down) | every sheet | word-synced from Whisper timings |
| style | bold rounded sans, yellow-white fill, thick black outline | sheets | e.g. a heavy rounded font, yellow #FFF23A, 8 px black stroke |
| animation | pops in small → big → settle over about 4 frames (60 fps) | sheet 7703800777336212768/00600 | scale 0.6 → 1.15 → 1.0 |

## Their topics (do not reuse)
bunker, richer = higher house, monster moves in the dark, touching the ground costs $10, can't look
at the moon, everyone watches these videos, paid for being unlucky, night ice-cream truck, two
pills, train that never stops, hunted for 10 days, Backrooms, it rains something different daily,
era changes daily, everyone has a mammoth, Christmas, poor people are invisible, enter any book,
paid for being embarrassed, everyone's a ninja, opposite size, golden-ticket cereal, floor is lava.
