#!/bin/bash

# Start TypeScript watcher
tsc --watch &
TSC_PID=$!

# Activate virtualenv and start Flask server with autoreload
source server/venv/bin/activate
watchmedo auto-restart --directory=public --pattern="*.js" --recursive -- python3 server/server.py &
SERVER_PID=$!

# Wait until admin.html responds with HTTP 200
echo "Waiting for Flask server to serve full files..."
until curl --output /dev/null --silent --head --fail http://127.0.0.1:5000/admin.html; do
  sleep 0.5
done

# Extra delay to allow static files (JS/CSS) to load
sleep 1

# Open browser tabs after the delay
open http://127.0.0.1:5000/
open http://127.0.0.1:5000/admin.html

# Wait for background processes to finish
wait $TSC_PID $SERVER_PID