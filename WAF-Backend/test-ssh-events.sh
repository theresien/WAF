#!/bin/bash

# Script de test pour vérifier la détection des tentatives SSH échouées

echo "=== Test de détection des tentatives SSH échouées ==="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier si l'application est en cours d'exécution
if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${RED}✗ L'application n'est pas en cours d'exécution${NC}"
    echo "  Démarrez-la avec : mvn spring-boot:run"
    exit 1
fi

echo -e "${GREEN}✓ L'application est en cours d'exécution${NC}"
echo ""

echo -e "${BLUE}1. Vérification du service SSH${NC}"
if systemctl is-active --quiet ssh || systemctl is-active --quiet sshd; then
    echo -e "${GREEN}✓ Service SSH actif${NC}"
else
    echo -e "${YELLOW}⚠ Service SSH non actif${NC}"
    echo "  Le service SSH doit être actif pour capturer les événements"
fi
echo ""

echo -e "${BLUE}2. Événements SSH existants${NC}"
SSH_EVENTS=$(curl -s "http://localhost:8080/events/type/SSH_FAILED_AUTH?size=10")
EVENT_COUNT=$(echo "$SSH_EVENTS" | jq '.content | length')

if [ "$EVENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ $EVENT_COUNT événement(s) SSH trouvé(s)${NC}"
    echo ""
    echo "$SSH_EVENTS" | jq -r '.content[] | "  - Event #\(.id):"
    + "\n    Timestamp: \(.timestamp)"
    + "\n    IP source: \(.sourceIp)"
    + "\n    Appareil: \(if .deviceMac then .deviceMac else "inconnu" end)"
    + "\n    IP appareil: \(if .deviceIp then .deviceIp else "N/A" end)"
    + "\n"'
else
    echo -e "${YELLOW}⚠ Aucun événement SSH trouvé${NC}"
    echo "  Pour tester, essayez de vous connecter en SSH avec un mauvais mot de passe"
fi
echo ""

echo -e "${BLUE}3. Instructions pour tester${NC}"
echo "  Depuis un autre PC sur le réseau, essayez de vous connecter en SSH :"
echo ""
echo "  ssh utilisateur@$(hostname -I | awk '{print $1}')"
echo ""
echo "  Entrez un mauvais mot de passe plusieurs fois."
echo "  Les événements apparaîtront automatiquement dans l'application."
echo ""

echo -e "${BLUE}4. Vérification des logs SSH système${NC}"
if command -v journalctl &> /dev/null; then
    RECENT_SSH=$(journalctl -u ssh -u sshd --since "5 minutes ago" 2>/dev/null | grep -i "failed" | tail -5)
    if [ -n "$RECENT_SSH" ]; then
        echo -e "${GREEN}✓ Logs SSH récents trouvés${NC}"
        echo "$RECENT_SSH" | sed 's/^/  /'
    else
        echo -e "${YELLOW}⚠ Aucune tentative SSH échouée récente${NC}"
    fi
else
    echo -e "${YELLOW}⚠ journalctl non disponible${NC}"
fi
echo ""

echo -e "${BLUE}5. Surveillance en temps réel${NC}"
echo "  Pour surveiller les événements SSH en temps réel :"
echo ""
echo "  watch -n 2 'curl -s http://localhost:8080/events/type/SSH_FAILED_AUTH | jq \".content[0]\"'"
echo ""

echo -e "${GREEN}=== Test terminé ===${NC}"
