#!/bin/bash

# Créer le fichier de log DNS
sudo touch /var/log/dnsmasq-queries.log
sudo chmod 644 /var/log/dnsmasq-queries.log

# Créer le répertoire pour la blacklist
sudo mkdir -p /etc/dnsmasq.d
sudo touch /etc/dnsmasq.d/blacklist.conf

# Copier la config dnsmasq
sudo cp scripts/dnsmasq.conf /etc/dnsmasq.conf

# Redémarrer dnsmasq
sudo systemctl restart dnsmasq

echo "DNS monitoring configured!"
echo "Log file: /var/log/dnsmasq-queries.log"
echo "Blacklist: /etc/dnsmasq.d/blacklist.conf"
