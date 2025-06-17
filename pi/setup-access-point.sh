#!/bin/sh

# Code below adapted from https://github.com/Splines/raspi-captive-portal

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

for file in dhcpcd.conf dnsmasq.conf hostapd.conf; do
  if [ ! -f "$SCRIPT_DIR/$file" ]; then
    echo "❌ Missing required config file: $file"
    exit 1
  fi
done

# --- Install necessary packages
sudo apt-get update
sudo apt-get install -y dhcpcd dnsmasq hostapd netfilter-persistent iptables-persistent

# --- Stop services to apply config
sudo systemctl stop dnsmasq
sudo systemctl stop hostapd

# --- Set static IP for wlan0
sudo cp "$SCRIPT_DIR/dhcpcd.conf" /etc/dhcpcd.conf
sudo systemctl restart dhcpcd

# --- Configure dnsmasq
if test -f /etc/dnsmasq.conf; then
  sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
fi
sudo cp "$SCRIPT_DIR/dnsmasq.conf" /etc/dnsmasq.conf
echo "DNSMASQ_EXCEPT=lo" | sudo tee -a /etc/default/dnsmasq > /dev/null

# --- Configure hostapd
sudo rfkill unblock wlan
sudo cp "$SCRIPT_DIR/hostapd.conf" /etc/hostapd/hostapd.conf

# --- Enable and configure services
sudo systemctl unmask dnsmasq
sudo systemctl enable dnsmasq

sudo systemctl unmask hostapd
sudo systemctl enable hostapd

# --- Create fallback IP assignment service
echo "🧷 Creating fallback static IP service for wlan0..."

sudo tee /etc/systemd/system/wlan0-static.service > /dev/null <<'EOF'
[Unit]
Description=Assign static IP to wlan0
Before=network-pre.target
Wants=network-pre.target

[Service]
Type=oneshot
ExecStartPre=/usr/sbin/rfkill unblock wlan
ExecStart=/sbin/ip addr add 192.168.4.1/24 dev wlan0
ExecStartPost=/sbin/ip link set wlan0 up
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable wlan0-static.service
sudo systemctl start wlan0-static.service

# --- Ensure dnsmasq waits for wlan0 IP
sudo mkdir -p /etc/systemd/system/dnsmasq.service.d
sudo tee /etc/systemd/system/dnsmasq.service.d/wait-for-wlan0.conf > /dev/null <<EOF
[Unit]
After=wlan0-static.service
Requires=wlan0-static.service
EOF

# --- Apply iptables rules and persist them
sudo iptables -t nat -D PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.4.1:5000 2>/dev/null || true
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.4.1:5000
sudo netfilter-persistent save

# --- Bring up wlan0 manually in case it didn’t get IP yet
sudo ip link set wlan0 down
sudo ip link set wlan0 up
sudo systemctl restart dhcpcd

# --- Start services
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl restart dnsmasq
sudo systemctl restart hostapd

# --- Done
echo "✅ Wi-Fi access point setup complete!"
echo "🔌 SSID: MeadTools Taplist"
echo "🌐 Admin panel should be available at http://192.168.4.1"