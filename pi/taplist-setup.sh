#!/bin/bash
set -e

# Variables
USER_HOME=$(eval echo "~$USER")
INSTALL_DIR="$USER_HOME/taplist-server"
SERVICE_NAME="taplist.service"
PYTHON_EXEC="python3"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🧼 Updating system..."
sudo apt update && sudo apt full-upgrade -y

echo "🔧 Installing dependencies..."
sudo apt install -y \
  $PYTHON_EXEC \
  python3-pip \
  python3-venv \
  chromium-browser \
  x11-xserver-utils \
  unclutter \
  lightdm \
  openbox \
  curl \
  unzip \
  jq

echo "📁 Preparing install directory..."
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "📦 Downloading latest taplist release..."
latest_url=$(curl -s https://api.github.com/repos/ljreaux/meadtools-taplist/releases/latest | jq -r '.assets[] | select(.name == "flask-bundle.zip") | .browser_download_url')
curl -L "$latest_url" -o release.zip

echo "📂 Extracting release..."
unzip -q release.zip
rm release.zip

echo "🐍 Setting up Python virtual environment..."
cd server
$PYTHON_EXEC -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "🧷 Creating $SERVICE_NAME..."
POST_SCRIPT="$USER_HOME/taplist-setup/pi/post-taplist-start.sh"
sudo tee /etc/systemd/system/$SERVICE_NAME > /dev/null <<EOF
[Unit]
Description=MeadTools Taplist Server and Kiosk
After=network.target

[Service]
WorkingDirectory=$INSTALL_DIR/server
ExecStart=$INSTALL_DIR/server/venv/bin/$PYTHON_EXEC server.py
ExecStartPost=$POST_SCRIPT
Restart=always
User=$USER
Environment=FLASK_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "📛 Enabling $SERVICE_NAME on boot..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME
sudo systemctl start $SERVICE_NAME

echo "🖥️ Creating kiosk-launch.sh script..."
KIOSK_SCRIPT="$USER_HOME/kiosk-launch.sh"
cat <<EOF > "$KIOSK_SCRIPT"
#!/bin/bash

LOG_DIR="$USER_HOME"
TIMESTAMP=\$(date)
KIOSK_LOG="\$LOG_DIR/kiosk.log"

PI_HOSTNAME=\$(hostname)
APP_URL="http://\${PI_HOSTNAME}.local:5000"

echo "\$TIMESTAMP: Starting Chromium kiosk pointed at \$APP_URL" >> "\$KIOSK_LOG"

until curl --output /dev/null --silent --head --fail "\$APP_URL"; do
  echo "\$TIMESTAMP: Waiting for server..." >> "\$KIOSK_LOG"
  sleep 2
done

chromium-browser --kiosk --app="\$APP_URL" \
  --noerrdialogs \
  --disable-infobars \
  --incognito \
  --disable-session-crashed-bubble \
  --autoplay-policy=no-user-gesture-required \
  --window-position=0,0 \
  --start-fullscreen >> "\$KIOSK_LOG" 2>&1
EOF

chmod +x "$KIOSK_SCRIPT"

echo "🧷 Creating kiosk-launch.service..."
sudo tee /etc/systemd/system/kiosk-launch.service > /dev/null <<EOF
[Unit]
Description=Start Chromium in Kiosk Mode
After=graphical.target network-online.target
Requires=network-online.target

[Service]
User=$USER
Environment=DISPLAY=:0
Environment=XDG_RUNTIME_DIR=/run/user/$(id -u $USER)
ExecStart=$KIOSK_SCRIPT
Restart=on-failure

[Install]
WantedBy=graphical.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable kiosk-launch.service

echo "📡 Running setup-access-point.sh to configure local Wi-Fi..."
bash "$SCRIPT_DIR/setup-access-point.sh"

echo "📶 Ensuring Wi-Fi stays unblocked on boot..."
sudo tee /etc/systemd/system/unblock-wifi.service > /dev/null <<EOF
[Unit]
Description=Unblock Wi-Fi at boot
After=network-pre.target
Wants=network-pre.target

[Service]
Type=oneshot
ExecStart=/usr/sbin/rfkill unblock wlan

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable unblock-wifi.service

echo "✅ Setup complete. Server and kiosk should launch automatically on boot."
echo "🧪 Reboot the Pi to test everything: sudo reboot"