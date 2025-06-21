# MeadTools Taplist Setup (Raspberry Pi)

This project powers the **MeadTools Taplist Display System**, a full-screen taplist for HDMI displays with local editing over Wi-Fi. You can install it two ways:

---

## 🚀 Option 1: Use the Prebuilt OS Image (Fastest)

Download the full Raspberry Pi OS image with everything preinstalled and ready to go.

**➡️ [Get the Latest Image Release](https://github.com/ljreaux/meadtools-taplist/releases)** (look for `MeadTools-Taplist.img.gz`)

### How to Flash the Image

1. Download the `.img.gz` file from the release
2. Flash it to a microSD card (16 GB or larger) using:
   - [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
   - OR [Balena Etcher](https://etcher.io/)
3. Insert the card and boot your Raspberry Pi
4. The taplist display will launch automatically, and a Wi-Fi network named **Taplist Admin** will appear for editing

---

## 🛠 Option 2: Install on Existing Raspberry Pi OS

Use this if you want to add the taplist to a Pi that’s already running Raspberry Pi OS (Bookworm recommended).

### One-Line Install

Run this on your Raspberry Pi (connected to Ethernet or Wi-Fi):

```bash
bash <(curl -s https://raw.githubusercontent.com/ljreaux/meadtools-taplist/main/pi/remote-setup.sh)
```

This will:

- Download setup files
- Install dependencies
- Set up the Flask server
- Configure autostart in kiosk mode
- Enable a Wi-Fi access point with captive portal

---

## ✅ What This Setup Provides

- Fullscreen taplist on HDMI at boot
- Flask server at `localhost:5000`
- Admin panel via local Wi-Fi access point
- No internet connection required for editing

---

## 📦 Files Included

| File                    | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `taplist-setup.sh`      | Main setup script for server and kiosk                 |
| `setup-access-point.sh` | Sets up Wi-Fi access point and captive portal          |
| `hostapd.conf`          | Configures the Wi-Fi access point (SSID, channel, etc) |
| `dnsmasq.conf`          | Handles DHCP and DNS routing for captive portal        |
| `dhcpcd.conf`           | Sets a static IP address for the Pi's Wi-Fi            |
| `remote-setup.sh`       | Minimal bootstrap script for downloading setup files   |

---

## 📁 Server Bundle (Downloaded During Setup)

Includes:

- `server.py` – Flask backend
- `public/index.html` – HDMI-facing display
- `public/admin.html` – Admin panel via Wi-Fi
- `public/taplist.json` – Tap list data (auto-edited)
- `public/images/` – Custom tap artwork

---

Need help? [Open an issue](https://github.com/ljreaux/meadtools-taplist/issues).
