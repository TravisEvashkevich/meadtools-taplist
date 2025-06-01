#!/bin/bash

# Start HTTP server in the background
cd /home/meadtools/meadtools-taplist/public
sudo python3 -m http.server 80 &

# Wait a few seconds to ensure the server is up
sleep 5

# Launch Chromium in kiosk mode
chromium-browser --kiosk --app=http://localhost/ \
  --noerrdialogs \
  --disable-infobars \
  --incognito \
  --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required \
  --window-position=0,0 \
  --start-fullscreen