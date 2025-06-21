#!/bin/bash
set -e

# Path variables
USER_HOME=$(eval echo "~$USER")
TAPLIST_DIR="$USER_HOME/taplist-server"
IMAGE_PATH="$TAPLIST_DIR/server/public/images/defaultImage.png"
DESKTOP_FILE="$USER_HOME/Desktop/Taplist.desktop"
PCMANFM_CONF="$USER_HOME/.config/pcmanfm/LXDE-pi/pcmanfm.conf"

echo "🖼️ Setting desktop background..."

# Ensure config dir and file exist
mkdir -p "$(dirname "$PCMANFM_CONF")"
touch "$PCMANFM_CONF"

# Modify or add wallpaper config
if grep -q '^wallpaper=' "$PCMANFM_CONF"; then
  sed -i "s|^wallpaper=.*|wallpaper=$IMAGE_PATH|" "$PCMANFM_CONF"
else
  echo "wallpaper=$IMAGE_PATH" >> "$PCMANFM_CONF"
fi

# Remove wastebasket icon
echo "🗑️ Removing wastebasket from desktop..."
if grep -q '^show_trash=' "$PCMANFM_CONF"; then
  sed -i 's/^show_trash=.*/show_trash=0/' "$PCMANFM_CONF"
else
  echo "show_trash=0" >> "$PCMANFM_CONF"
fi

echo "🔗 Adding desktop shortcut to Taplist..."
cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=Taplist
Comment=Open local taplist
Exec=chromium-browser --app=http://localhost:5000
Icon=$IMAGE_PATH
Terminal=false
Type=Application
Categories=Utility;
EOF

chmod +x "$DESKTOP_FILE"

echo "🔄 Restarting desktop to apply changes..."
pcmanfm --reconfigure || echo "⚠️ pcmanfm reconfigure failed—try rebooting manually if needed."

echo "✅ Desktop customized successfully."