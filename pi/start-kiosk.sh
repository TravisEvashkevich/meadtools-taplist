#!/bin/bash

# Wait for the server to be ready
sleep 10

# Launch Chromium in kiosk mode
chromium-browser --kiosk --app=http://localhost/ --noerrdialogs --disable-infobars --incognito --disable-session-crashed-bubble --autoplay-policy=no-user-gesture-required --window-position=0,0 --start-fullscreen