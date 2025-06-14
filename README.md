# MeadTools Taplist Setup (Raspberry Pi)

This folder contains everything needed to set up the MeadTools Taplist Display System on a Raspberry Pi running Raspberry Pi OS (Bookworm recommended).

## What This Setup Does

- Runs a local Flask server to host the taplist
- Launches a full-screen kiosk display on boot
- Creates a local Wi-Fi access point for editing the taplist
- Redirects connected devices to the admin panel via captive portal

## Requirements

- Raspberry Pi 3 or newer
- Raspberry Pi OS (Bookworm recommended)
- HDMI display
- Optional: USB keyboard or SSH access for setup

## One-Line Install

Run this on your Raspberry Pi (connected to Ethernet or preconfigured Wi-Fi):

```bash
bash <(curl -s https://raw.githubusercontent.com/ljreaux/meadtools-taplist/main/pi/remote-setup.sh)
```

## This Will:

- Downloads only the setup files
- Installs necessary dependencies
- Installs the server and sets up autostart kiosk mode
- Sets up the access point and captive portal for admin access

## What’s Installed

- Flask server on localhost:5000
- Chromium kiosk on boot, showing the taplist
- Access point on wlan0 (SSID: MeadTools Taplist)
- Captive portal that shows the admin panel when connecting to the Pi’s Wi-Fi

## Files Included

| File                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `taplist-setup.sh`      | Main setup script for server and kiosk                 |
| `setup-access-point.sh` | Sets up Wi-Fi access point and captive portal          |
| `hostapd.conf`          | Configures the Wi-Fi access point (SSID, channel, etc) |
| `dnsmasq.conf`          | Handles DHCP and DNS routing for captive portal        |
| `dhcpcd.conf`           | Sets a static IP address for the Pi's Wi-Fi            |
| `remote-setup.sh`       | Minimal bootstrap script for downloading setup files   |

## Server Bundle (Downloaded During Setup)

The taplist server (Flask app + public files) is automatically downloaded from the latest GitHub release. It contains:

- `server.py` – The main Python Flask server
- `public/index.html` – Displayed on the HDMI screen (kiosk mode)
- `public/admin.html` – Shown to users connected to the access point
- `public/taplist.json` – Tap list data (editable via admin UI)
- `public/images/` – Uploaded artwork for each tap
