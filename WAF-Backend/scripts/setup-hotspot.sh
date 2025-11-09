#!/bin/bash
# Configuration pour Arch Linux - PC comme point d'accès WiFi

# Activer le forwarding IP
sudo sysctl -w net.ipv4.ip_forward=1

# Rendre permanent
echo "net.ipv4.ip_forward=1" | sudo tee /etc/sysctl.d/30-ipforward.conf

# wlp3s0 = Interface WiFi (reçoit Internet ET sert de hotspot)
# Les clients se connectent via le hotspot sur wlp3s0

# Configurer NAT pour partager la connexion
sudo iptables -t nat -A POSTROUTING -o wlp3s0 -j MASQUERADE
sudo iptables -A FORWARD -i wlp3s0 -o wlp3s0 -j ACCEPT
sudo iptables -A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT

# Par défaut, bloquer les nouveaux appareils (MONITORED)
# Ils devront être explicitement autorisés via l'interface web
sudo iptables -A FORWARD -m state --state NEW -j DROP

# Sauvegarder les règles
sudo mkdir -p /etc/iptables
sudo iptables-save | sudo tee /etc/iptables/iptables.rules

echo "Hotspot firewall configured!"
echo "Interface: wlp3s0"
echo "New devices will be MONITORED by default"
