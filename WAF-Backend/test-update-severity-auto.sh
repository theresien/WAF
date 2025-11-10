#!/bin/bash

# Script de test automatique pour la modification de sévérité

echo "=== Test automatique de modification de sévérité ==="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier si l'application est en cours d'exécution
if ! curl -s http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo -e "${RED}✗ L'application n'est pas en cours d'exécution${NC}"
    exit 1
fi

# Test avec french-stream.one
DOMAIN="french-stream.one"
NEW_SEVERITY=5

echo -e "${BLUE}Test 1: Mise à jour de $DOMAIN à sévérité $NEW_SEVERITY${NC}"

# Afficher la sévérité actuelle
CURRENT=$(curl -s http://localhost:8080/blacklist/domains | jq -r --arg d "$DOMAIN" '.[] | select(.domain == $d) | .severity')
echo "  Sévérité actuelle: $CURRENT"

# Mettre à jour
RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"severity\": $NEW_SEVERITY}" \
    http://localhost:8080/blacklist/domains/$DOMAIN)

if echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    NEW=$(echo "$RESPONSE" | jq -r '.domain.severity')
    echo -e "  ${GREEN}✓ Mise à jour réussie: $CURRENT → $NEW${NC}"
else
    echo -e "  ${RED}✗ Échec de la mise à jour${NC}"
    exit 1
fi

echo ""

# Test avec moviebox.ph
DOMAIN="moviebox.ph"
NEW_SEVERITY=2

echo -e "${BLUE}Test 2: Mise à jour de $DOMAIN à sévérité $NEW_SEVERITY${NC}"

CURRENT=$(curl -s http://localhost:8080/blacklist/domains | jq -r --arg d "$DOMAIN" '.[] | select(.domain == $d) | .severity')
echo "  Sévérité actuelle: $CURRENT"

RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"severity\": $NEW_SEVERITY}" \
    http://localhost:8080/blacklist/domains/$DOMAIN)

if echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    NEW=$(echo "$RESPONSE" | jq -r '.domain.severity')
    echo -e "  ${GREEN}✓ Mise à jour réussie: $CURRENT → $NEW${NC}"
else
    echo -e "  ${RED}✗ Échec de la mise à jour${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Tous les tests ont réussi ===${NC}"
echo ""
echo "Domaines mis à jour:"
curl -s http://localhost:8080/blacklist/domains | jq -r '.[] | "  - \(.domain) (sévérité: \(.severity))"'
