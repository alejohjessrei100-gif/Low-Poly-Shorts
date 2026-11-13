#!/usr/bin/env bash
# Download the latest N Shorts from a channel as reference material.
#   bash fetch_refs.sh "https://www.youtube.com/@somechannel" 20 refs/
# Gets: video (<=720p, ORIGINAL audio track, not an auto-dub), English subtitles, description, info.json.
# Needs yt-dlp (pip install yt-dlp) and ffmpeg.
# Cloud machines often get "Sign in to confirm you're not a bot": export a cookies.txt from a logged-in
# browser and run with COOKIES=cookies.txt, or run this script on your own computer and upload refs/.
set -euo pipefail
CHANNEL="${1:?channel url}"; N="${2:-20}"; OUT="${3:-refs}"
mkdir -p "$OUT"
CK=(); [ -n "${COOKIES:-}" ] && CK=(--cookies "$COOKIES")
URL="${CHANNEL%/}/shorts"
# 1) list the newest N shorts (flat, fast)
yt-dlp "${CK[@]}" --flat-playlist --playlist-end "$N" --print "%(id)s	%(title)s	%(view_count)s" "$URL" | tee "$OUT/list.tsv"
# 2) fetch each one. Prefer the original-language audio: YouTube can serve an auto-dubbed track first.
#    'format_note*=original' matches the original track when dubs exist; the fallbacks cover normal videos.
cut -f1 "$OUT/list.tsv" | while read -r id; do
  [ -z "$id" ] && continue
  yt-dlp "${CK[@]}" -q --no-warnings \
    -f "bv*[height<=720]+ba[format_note*=original]/bv*[height<=720]+ba[language^=en]/b[height<=720]/b" \
    --merge-output-format mp4 \
    --write-auto-subs --write-subs --sub-langs "en.*,en" --sub-format vtt \
    --write-description --write-info-json \
    -o "$OUT/%(id)s.%(ext)s" "https://www.youtube.com/shorts/$id" || echo "FAILED $id" >&2
done
ls "$OUT"/*.mp4 2>/dev/null | wc -l | xargs echo "videos downloaded:"
