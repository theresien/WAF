#!/bin/bash

# Script de test pour vérifier que les événements sont mis à jour quand la sévérité change

echo "=== Test de mise à jour des événements lors du changement de sévérité ==="
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
    exit 1
fi

echo -e "${GREEN}✓ L'application est en cours d'exécution${NC}"
echo ""

# Choisir un domaine
DOMAIN="french-stream.one"

echo -e "${BLUE}1. Vérification du domaine : $DOMAIN${NC}"
CURRENT_SEVERITY=$(curl -s http://localhost:8080/blacklist/domains | jq -r --arg d "$DOMAIN" '.[] | select(.domain == $d) | .severity')

if [ -z "$CURRENT_SEVERITY" ]; then
    echo -e "${RED}✗ Le domaine '$DOMAIN' n'existe pas dans la blacklist${NC}"
    exit 1
fi

echo "  Sévérité actuelle : $CURRENT_SEVERITY"
echo ""

# Vérifier les événements existants
echo -e "${BLUE}2. Événements existants pour ce domaine :${NC}"
EVENTS=$(curl -s "http://localhost:8080/events/blacklisted-domains" | jq --arg d "$DOMAIN" '[.content[] | select(.requestUri | contains($d))]')
EVENT_COUNT=$(echo "$EVENTS" | jq '. | length')

if [ "$EVENT_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠ Aucun événement trouvé pour ce domaine${NC}"
    echo "  Créez un événement avec : ./test-blacklist.sh"
    exit 0
fi

echo "  Nombre d'événements : $EVENT_COUNT"
echo "$EVENTS" | jq -r '.[] | "  - Event #\(.id): severity=\(.severity), timestamp=\(.timestamp)"'
echo ""

# Changer la sévérité
NEW_SEVERITY=$((CURRENT_SEVERITY == 5 ? 1 : 5))
echo -e "${BLUE}3. Changement de sévérité : $CURRENT_SEVERITY → $NEW_SEVERITY${NC}"

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"severity\": $NEW_SEVERITY}" \
    http://localhost:8080/blacklist/domains/$DOMAIN)

EVENTS_UPDATED=$(echo "$RESPONSE" | jq -r '.eventsUpdated')

if [ "$EVENTS_UPDATED" != "null" ]; then
    echo -e "${GREEN}✓ Sévérité mise à jour${NC}"
    echo "  Événements mis à jour : $EVENTS_UPDATED"
else
    echo -e "${RED}✗ Erreur lors de la mise à jour${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

echo ""

# Vérifier que les événements ont été mis à jour
echo -e "${BLUE}4. Vérification des événements après mise à jour :${NC}"
sleep 1  # Attendre un peu pour que la base de données soit à jour

UPDATED_EVENTS=$(curl -s "http://localhost:8080/events/blacklisted-domains" | jq --arg d "$DOMAIN" '[.content[] | select(.requestUri | contains($d))]')
echo "$UPDATED_EVENTS" | jq -r '.[] | "  - Event #\(.id): severity=\(.severity), timestamp=\(.timestamp)"'

# Vérifier que toutes les sévérités ont changé
ALL_UPDATED=$(echo "$UPDATED_EVENTS" | jq --arg sev "$NEW_SEVERITY" 'all(.severity == ($sev | tonumber))')

echo ""
if [ "$ALL_UPDATED" = "true" ]; then
    echo -e "${GREEN}✓ Tous les événements ont été mis à jour avec la nouvelle sévérité ($NEW_SEVERITY)${NC}"
else
    echo -e "${YELLOW}⚠ Certains événements n'ont pas été mis à jour${NC}"
fi

echo ""
echo -e "${GREEN}=== Test terminé ===${NC}"
