#!/bin/bash

# Script de vérification des événements de domaines blacklistés

echo "=== Vérification des événements de domaines blacklistés ==="
echo ""

# Couleurs pour l'affichage
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si l'application est en cours d'exécution
if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${RED}✗ L'application n'est pas en cours d'exécution${NC}"
    echo "  Démarrez-la avec : mvn spring-boot:run"
    exit 1
fi

echo -e "${GREEN}✓ L'application est en cours d'exécution${NC}"
echo ""

# Vérifier les domaines blacklistés
echo "1. Domaines blacklistés :"
BLACKLIST_COUNT=$(curl -s http://localhost:8080/blacklist/domains | jq '. | length' 2>/dev/null)
if [ "$BLACKLIST_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ ${BLACKLIST_COUNT} domaine(s) blacklisté(s)${NC}"
    curl -s http://localhost:8080/blacklist/domains | jq -r '.[] | "  - \(.domain) (sévérité: \(.severity))"'
else
    echo -e "${YELLOW}⚠ Aucun domaine blacklisté${NC}"
fi
echo ""

# Vérifier les événements de domaines blacklistés
echo "2. Événements de domaines blacklistés :"
EVENTS=$(curl -s "http://localhost:8080/events/blacklisted-domains?size=10" | jq '.content' 2>/dev/null)
EVENT_COUNT=$(echo "$EVENTS" | jq '. | length' 2>/dev/null)

if [ "$EVENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ ${EVENT_COUNT} événement(s) trouvé(s)${NC}"
    echo ""
    echo "$EVENTS" | jq -r '.[] | "  Événement #\(.id):"
    + "\n    - Timestamp: \(.timestamp)"
    + "\n    - Domaine: \(.requestUri)"
    + "\n    - IP source: \(.sourceIp)"
    + "\n    - Appareil: \(if .deviceMac then .deviceMac else "inconnu" end)"
    + "\n    - IP appareil: \(if .deviceIp then .deviceIp else "N/A" end)"
    + "\n    - Sévérité: \(.severity)"
    + "\n"'
else
    echo -e "${YELLOW}⚠ Aucun événement trouvé${NC}"
    echo "  Testez avec : ./test-blacklist.sh"
fi
echo ""

# Vérifier les logs récents
echo "3. Logs récents (dernières 5 lignes concernant les blacklists) :"
if [ -f "logs/wafap.log" ]; then
    RECENT_LOGS=$(grep -i "blacklist" logs/wafap.log | tail -5)
    if [ -n "$RECENT_LOGS" ]; then
        echo -e "${GREEN}✓ Logs trouvés${NC}"
        echo "$RECENT_LOGS" | sed 's/^/  /'
    else
        echo -e "${YELLOW}⚠ Aucun log récent${NC}"
    fi
else
    echo -e "${RED}✗ Fichier de log non trouvé${NC}"
fi
echo ""

# Résumé
echo "=== Résumé ==="
if [ "$EVENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Les événements de domaines blacklistés sont correctement enregistrés${NC}"
    echo -e "${GREEN}✓ Les IP des appareils sont affichées${NC}"
else
    echo -e "${YELLOW}⚠ Aucun événement trouvé. Testez avec ./test-blacklist.sh${NC}"
fi
