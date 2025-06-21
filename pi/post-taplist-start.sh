#!/bin/bash
set -e
LOGFILE="/tmp/post-taplist.log"
{
  echo "--- Post Start $(date) ---"
  systemctl daemon-reexec
  systemctl daemon-reload

  for svc in wlan0-static.service hostapd dnsmasq; do
    if systemctl list-units --full -all | grep -Fq "$svc"; then
      echo "Restarting $svc..."
      systemctl restart "$svc"
    else
      echo "⚠️  $svc not found"
    fi
  done
} >> "$LOGFILE" 2>&1