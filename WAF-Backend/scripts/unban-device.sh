#!/bin/bash
MAC=$1
IP=$2

# Unblock device by MAC address
iptables -D FORWARD -m mac --mac-source "$MAC" -j DROP 2>/dev/null
iptables -D INPUT -m mac --mac-source "$MAC" -j DROP 2>/dev/null

# Unblock device by IP if provided
if [ -n "$IP" ]; then
    iptables -D FORWARD -s "$IP" -j DROP 2>/dev/null
    iptables -D INPUT -s "$IP" -j DROP 2>/dev/null
fi

echo "Device unbanned: MAC=$MAC IP=$IP"
exit 0
