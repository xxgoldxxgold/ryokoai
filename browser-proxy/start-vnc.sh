#!/bin/bash
set -e

DISPLAY_NUM=99
export DISPLAY=:${DISPLAY_NUM}
VNC_PORT=5900
NOVNC_PORT=6080
VIEWPORT="1280x800x24"
TARGET_URL="https://www.booking.com/searchresults.ja.html?ss=AYANA+Resort+Bali%2C+Jimbaran%2C+Bali%2C+Indonesia&ssne=%E3%82%BD%E3%82%A6%E3%83%AB&ssne_untouched=%E3%82%BD%E3%82%A6%E3%83%AB&checkin=2026-03-10&checkout=2026-03-11&group_adults=2&no_rooms=1&group_children=0"

# Cleanup
cleanup() {
  kill $(jobs -p) 2>/dev/null
  exit 0
}
trap cleanup SIGTERM SIGINT

# Start Xvfb
Xvfb :${DISPLAY_NUM} -screen 0 ${VIEWPORT} -ac +extension GLX +render -noreset &
sleep 1

# Start Chromium (Playwright's bundled one)
CHROME_PATH=$(find /root/.cache/ms-playwright -name "chrome" -type f 2>/dev/null | head -1)
if [ -z "$CHROME_PATH" ]; then
  echo "Chrome not found, using system chromium"
  CHROME_PATH="chromium"
fi

"$CHROME_PATH" \
  --no-sandbox \
  --disable-gpu \
  --disable-setuid-sandbox \
  --disable-dev-shm-usage \
  --disable-blink-features=AutomationControlled \
  --window-size=1280,800 \
  --window-position=0,0 \
  --kiosk \
  --lang=ja \
  --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36" \
  "$TARGET_URL" &
sleep 3

# Start x11vnc (no password, listen on localhost only)
x11vnc -display :${DISPLAY_NUM} -nopw -listen 127.0.0.1 -rfbport ${VNC_PORT} -shared -forever -defer 5 -wait 10 -noxdamage &
sleep 1

echo "VNC started on port ${VNC_PORT}"

# Start websockify with noVNC
websockify --web /usr/share/novnc ${NOVNC_PORT} localhost:${VNC_PORT} &

echo "noVNC started on port ${NOVNC_PORT}"
echo "Access: http://0.0.0.0:${NOVNC_PORT}/vnc.html"

# Wait for all background processes
wait
