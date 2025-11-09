#!/bin/bash
MAC=$1
IP=$2

# Block device by MAC address
iptables -I FORWARD -m mac --mac-source "$MAC" -j DROP
iptables -I INPUT -m mac --mac-source "$MAC" -j DROP

# Block device by IP if provided
if [ -n "$IP" ]; then
    iptables -I FORWARD -s "$IP" -j DROP
    iptables -I INPUT -s "$IP" -j DROP
fi

echo "Device banned: MAC=$MAC IP=$IP"
exit 0
