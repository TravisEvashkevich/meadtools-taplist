## 🧪 MeadTools Taplist OS v1.1

This is a Raspberry Pi OS image preconfigured with the **MeadTools Taplist Display** app. It supports **two modes**:

- **HDMI Display Mode**: Fullscreen taplist on boot with local editing over Wi-Fi
- **Headless Mode**: No display, just a local Flask server accessible from other devices

Both versions include a built-in Wi-Fi access point and admin interface — no internet connection required.

---

### 📦 Download

- **HDMI Version**: [`MeadTools-Taplist-v1.1.img.gz`](https://github.com/ljreaux/meadtools-taplist-os/releases/download/pi-v1.1/MeadTools-Taplist-v1.1.img.gz)
- **Headless Version**: [`MeadTools-Taplist-Headless-v1.1.img.gz`](https://github.com/ljreaux/meadtools-taplist-os/releases/download/pi-v1.1/MeadTools-Taplist-Headless-v1.1.img.gz)

---

## 🚀 HDMI Version (Default)

### 🛠️ Installation Instructions

1. Flash `MeadTools-Taplist-v1.1.img.gz` to a microSD card (16 GB or larger)
2. Insert into your Raspberry Pi and boot it up
3. The display will launch on HDMI
4. A Wi-Fi network named **Taplist Admin** will appear for configuration

> 💡 If your Pi connects to Wi-Fi or Ethernet, access the admin panel at [`http://meadtools-taplist.local:5000/admin`](http://meadtools-taplist.local:5000/admin)

---

## 🧱 Headless Version

### 🛠️ Installation Instructions

1. Flash `MeadTools-Taplist-Headless-v1.1.img.gz` to a microSD card
2. Use Raspberry Pi Imager’s advanced settings to:
   - Enable Wi-Fi
   - Enable SSH
3. Boot the Pi (no display required)
4. Access the server from any device on the same network at:
   `http://meadtools-taplist.local:5000`

---

### ✅ What’s New in v1.1

- ⚙️ More reliable startup process and Chromium kiosk launch (HDMI version)
- 🖼️ Default desktop background and shortcut link to admin panel
- 🌐 Improved detection of hostname and empty-state behavior
- 🧹 OS cleanup for reduced image size and improved performance

---

### ✅ Features

- Flask server runs locally at `localhost:5000`
- Taplist data stored and editable from the local network
- Wi-Fi Access Point with captive portal on boot (if no Wi-Fi is preconfigured)
- No internet required
- Lightweight — runs on Raspberry Pi 3B+ and up

---

### 🧰 Recommended Hardware

- Raspberry Pi 3B+ or later
- microSD card (≥16 GB)
- (HDMI version) HDMI-compatible display
- (Optional) USB keyboard/mouse for manual setup

---

Need help or want to contribute? [Open an issue](https://github.com/ljreaux/meadtools-taplist-os/issues).
