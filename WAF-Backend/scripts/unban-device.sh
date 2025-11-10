#!/bin/bash
set -euo pipefail

MAC=$1
IP=${2:-}

if [ -z "$MAC" ]; then
    echo "Error: MAC address required" >&2
    exit 1
fi

iptables -D FORWARD -m mac --mac-source "$MAC" -j DROP 2>/dev/null || true
iptables -D INPUT -m mac --mac-source "$MAC" -j DROP 2>/dev/null || true

if [ -n "$IP" ]; then
    iptables -D FORWARD -s "$IP" -j DROP 2>/dev/null || true
    iptables -D INPUT -s "$IP" -j DROP 2>/dev/null || true
fi

echo "Device unbanned: MAC=$MAC IP=$IP"
exit 0
