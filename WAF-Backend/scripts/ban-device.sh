#!/bin/bash
set -euo pipefail

MAC=$1
IP=${2:-}

if [ -z "$MAC" ]; then
    echo "Error: MAC address required" >&2
    exit 1
fi

if ! iptables -I FORWARD -m mac --mac-source "$MAC" -j DROP 2>/dev/null; then
    echo "Error: Failed to ban MAC in FORWARD chain" >&2
    exit 1
fi

if ! iptables -I INPUT -m mac --mac-source "$MAC" -j DROP 2>/dev/null; then
    iptables -D FORWARD -m mac --mac-source "$MAC" -j DROP 2>/dev/null || true
    echo "Error: Failed to ban MAC in INPUT chain" >&2
    exit 1
fi

if [ -n "$IP" ]; then
    iptables -I FORWARD -s "$IP" -j DROP 2>/dev/null || true
    iptables -I INPUT -s "$IP" -j DROP 2>/dev/null || true
fi

echo "Device banned: MAC=$MAC IP=$IP"
exit 0
