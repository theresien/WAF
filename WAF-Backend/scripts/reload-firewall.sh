#!/bin/bash
set -euo pipefail

if systemctl reload dnsmasq 2>/dev/null; then
    echo "Firewall reloaded successfully"
    exit 0
else
    echo "Warning: dnsmasq reload failed or not running" >&2
    exit 0
fi
