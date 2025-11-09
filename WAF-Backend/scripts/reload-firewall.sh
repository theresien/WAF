#!/bin/bash
systemctl reload dnsmasq 2>/dev/null || true
echo "Firewall reloaded"
exit 0
