#!/bin/bash
set -euo pipefail

WIFI_INTERFACE=${1:-wlp3s0}

if ! ip link show "$WIFI_INTERFACE" &>/dev/null; then
    echo "Error: Interface $WIFI_INTERFACE not found" >&2
    echo "Available interfaces:" >&2
    ip link show | grep -E '^[0-9]+:' | cut -d: -f2 | tr -d ' ' >&2
    exit 1
fi

if ! sudo sysctl -w net.ipv4.ip_forward=1; then
    echo "Error: Failed to enable IP forwarding" >&2
    exit 1
fi

# Rendre permanent
echo "net.ipv4.ip_forward=1" | sudo tee /etc/sysctl.d/30-ipforward.conf

# wlp3s0 = Interface WiFi (reçoit Internet ET sert de hotspot)
# Les clients se connectent via le hotspot sur wlp3s0

sudo iptables -t nat -A POSTROUTING -o "$WIFI_INTERFACE" -j MASQUERADE || {
    echo "Error: Failed to configure NAT" >&2
    exit 1
}

sudo iptables -A FORWARD -i "$WIFI_INTERFACE" -o "$WIFI_INTERFACE" -j ACCEPT
sudo iptables -A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -m state --state NEW -j DROP

sudo mkdir -p /etc/iptables
if ! sudo iptables-save | sudo tee /etc/iptables/iptables.rules >/dev/null; then
    echo "Warning: Failed to save iptables rules" >&2
fi

echo "Hotspot firewall configured!"
echo "Interface: $WIFI_INTERFACE"
echo "New devices will be MONITORED by default"
