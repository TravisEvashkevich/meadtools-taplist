#!/bin/bash
set -e

systemctl daemon-reload
systemctl restart wlan0-static.service
systemctl restart hostapd
systemctl restart dnsmasq