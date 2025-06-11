#!/bin/bash
set -e

echo "🧼 Updating system..."
sudo apt update && sudo apt full-upgrade -y

echo "🔧 Installing dependencies..."
sudo apt install -y \
  python3 \
  python3-pip \
  python3-venv \
  chromium-browser \
  x11-xserver-utils \
  unclutter \
  lightdm \
  openbox \
  curl \
  unzip

echo "📦 Downloading latest taplist release..."
cd ~
mkdir -p taplist-server
cd taplist-server

latest_url=$(curl -s https://api.github.com/repos/ljreaux/meadtools-taplist/releases/latest \
  | grep browser_download_url \
  | grep flask-bundle.zip \
  | cut -d '"' -f 4)

echo "🌐 Downloading from $latest_url..."
curl -L "$latest_url" -o release.zip

echo "📂 Extracting release..."
unzip release.zip
rm release.zip

echo "🐍 Setting up Python virtual environment..."
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "🧪 Testing server manually..."
python3 server.py &

echo "🧷 Creating taplist.service..."
sudo tee /etc/systemd/system/taplist.service > /dev/null <<EOF
[Unit]
Description=MeadTools Taplist Server
After=network.target

[Service]
WorkingDirectory=/home/pi/taplist-server/server
ExecStart=/home/pi/taplist-server/server/venv/bin/python server.py
Restart=always
User=pi
Environment=FLASK_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo "📛 Enabling taplist service on boot..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl enable taplist.service
sudo systemctl start taplist.service

echo "✅ Setup complete. Server should now be running on http://localhost:5000"