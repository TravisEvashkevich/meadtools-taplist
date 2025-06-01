#!/bin/bash

# Navigate to the project public folder
cd /home/meadtools/meadtools-taplist/public

# Start a simple HTTP server on port 80
# You may need to use sudo if port 80 is restricted
sudo python3 -m http.server 80