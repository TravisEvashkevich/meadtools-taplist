#!/bin/bash
set -e

USER_HOME=$(eval echo "~$USER")
INSTALL_DIR="$USER_HOME/taplist-server"
SERVICE_NAME="taplist.service"
PYTHON_EXEC="python3"

echo "🧼 Updating system..."
sudo apt update && sudo apt full-upgrade -y

echo "🔧 Installing dependencies..."
sudo apt install -y \
  $PYTHON_EXEC \
  python3-pip \
  python3-venv \
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

echo "🧷 Creating systemd service..."
sudo tee /etc/systemd/system/$SERVICE_NAME > /dev/null <<EOF
[Unit]
Description=MeadTools Taplist Server (Headless)
After=network.target

[Service]
WorkingDirectory=$INSTALL_DIR/server
ExecStart=$INSTALL_DIR/server/venv/bin/$PYTHON_EXEC server.py
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

echo "✅ Headless setup complete."
echo "🌐 Visit http://<pi-ip>:5000 or http://meadtools-taplist.local:5000 from any device on the network."