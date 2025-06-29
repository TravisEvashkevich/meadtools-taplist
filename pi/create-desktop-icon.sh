#!/bin/bash
set -e

# Define variables
SHORTCUT_PATH="$HOME/Desktop/Taplist-Admin.desktop"
ICON_PATH="/home/meadtools/taplist-server/public/images/defaultImage.png"

# Create the .desktop file
cat <<EOF > "$SHORTCUT_PATH"
[Desktop Entry]
Name=Taplist
Comment=Open the Taplist
Exec=chromium-browser http://localhost:5000
Icon=$ICON_PATH
Terminal=false
Type=Application
Categories=Utility;
EOF

# Make it executable
chmod +x "$SHORTCUT_PATH"

echo "✅ Shortcut created at: $SHORTCUT_PATH"