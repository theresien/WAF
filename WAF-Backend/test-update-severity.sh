#!/bin/bash

# Script de test pour la modification de la sévérité des domaines blacklistés

echo "=== Test de modification de sévérité des domaines blacklistés ==="
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

# Afficher les domaines actuels
echo -e "${BLUE}1. Domaines blacklistés actuels :${NC}"
curl -s http://localhost:8080/blacklist/domains | jq -r '.[] | "  - \(.domain) (sévérité: \(.severity))"'
echo ""

# Demander le domaine à modifier
read -p "Entrez le domaine à modifier (ex: french-stream.one) : " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}✗ Domaine requis${NC}"
    exit 1
fi

# Vérifier si le domaine existe
DOMAIN_EXISTS=$(curl -s http://localhost:8080/blacklist/domains | jq -r --arg domain "$DOMAIN" '.[] | select(.domain == $domain) | .domain')

if [ -z "$DOMAIN_EXISTS" ]; then
    echo -e "${RED}✗ Le domaine '$DOMAIN' n'existe pas dans la blacklist${NC}"
    exit 1
fi

# Afficher la sévérité actuelle
CURRENT_SEVERITY=$(curl -s http://localhost:8080/blacklist/domains | jq -r --arg domain "$DOMAIN" '.[] | select(.domain == $domain) | .severity')
echo -e "${YELLOW}Sévérité actuelle : ${CURRENT_SEVERITY}${NC}"
echo ""

# Demander la nouvelle sévérité
read -p "Entrez la nouvelle sévérité (1-5) : " NEW_SEVERITY

if ! [[ "$NEW_SEVERITY" =~ ^[1-5]$ ]]; then
    echo -e "${RED}✗ La sévérité doit être un nombre entre 1 et 5${NC}"
    exit 1
fi

# Mettre à jour la sévérité
echo ""
echo -e "${BLUE}2. Mise à jour de la sévérité...${NC}"
RESPONSE=$(curl -s -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"severity\": $NEW_SEVERITY}" \
    http://localhost:8080/blacklist/domains/$DOMAIN)

# Vérifier le résultat
if echo "$RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Sévérité mise à jour avec succès${NC}"
    echo ""
    echo -e "${BLUE}3. Détails du domaine mis à jour :${NC}"
    echo "$RESPONSE" | jq '.domain'
else
    echo -e "${RED}✗ Erreur lors de la mise à jour${NC}"
    echo "$RESPONSE" | jq '.'
    exit 1
fi

echo ""
echo -e "${BLUE}4. Vérification - Tous les domaines :${NC}"
curl -s http://localhost:8080/blacklist/domains | jq -r '.[] | "  - \(.domain) (sévérité: \(.severity))"'

echo ""
echo -e "${GREEN}=== Test terminé avec succès ===${NC}"
