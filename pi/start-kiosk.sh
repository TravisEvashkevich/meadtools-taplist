#!/bin/bash

echo "$(date): Starting server and kiosk" >> /home/meadtools/kiosk.log
cd /home/meadtools/meadtools-taplist/public
sudo python3 -m http.server 80 >> /home/meadtools/server.log 2>&1 &

sleep 5

chromium-browser --kiosk --app=http://localhost/ \
  --noerrdialogs \
  --disable-infobars \
  --incognito \
  --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required \
  --window-position=0,0 \
  --start-fullscreen >> /home/meadtools/kiosk.log 2>&1