#!/bin/bash
set -e

echo "🧼 Updating system..."
sudo apt update && sudo apt full-upgrade -y

echo "🔧 Installing dependencies..."
sudo apt install -y \
  git \
  python3 \
  python3-pip \
  python3-venv \
  chromium-browser \
  x11-xserver-utils \
  unclutter \
  lightdm \
  openbox

echo "📁 Cloning taplist repo..."
cd ~
git clone https://github.com/ljreaux/meadtools-taplist.git
cd meadtools-taplist

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
WorkingDirectory=/home/pi/meadtools-taplist/server
ExecStart=/home/pi/meadtools-taplist/server/venv/bin/python server.py
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