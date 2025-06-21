#!/bin/bash
set -e

sudo systemctl daemon-reload
sudo systemctl restart wlan0-static.service
sudo systemctl restart hostapd
sudo systemctl restart dnsmasq