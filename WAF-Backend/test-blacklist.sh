#!/bin/bash

# Script de test pour vérifier la détection des domaines blacklistés

echo "=== Test de détection de domaine blacklisté ==="

# Ajouter une entrée de test dans le log DNS
TEST_IP="192.168.50.32"
TEST_DOMAIN="french-stream.one"
TIMESTAMP=$(date "+%b %e %H:%M:%S")

echo "${TIMESTAMP} dnsmasq[$$]: query[A] ${TEST_DOMAIN} from ${TEST_IP}" | sudo tee -a /var/log/dnsmasq-queries.log

echo "✓ Entrée de test ajoutée au log DNS"
echo "  Domaine: ${TEST_DOMAIN}"
echo "  IP source: ${TEST_IP}"
echo ""
echo "Attendez 5-10 secondes que le DnsMonitorService traite l'entrée..."
echo "Vérifiez ensuite les logs de l'application et les événements dans la base de données."
