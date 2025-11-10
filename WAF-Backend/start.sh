#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo -e "${YELLOW}⚠️  Fichier .env manquant, utilisation des valeurs par défaut${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WAF-AP Manager - Démarrage${NC}"
echo -e "${BLUE}========================================${NC}\n"

if ! sudo systemctl is-active --quiet postgresql 2>/dev/null; then
    echo -e "${YELLOW}Démarrage de PostgreSQL...${NC}"
    if ! sudo systemctl start postgresql; then
        echo -e "${YELLOW}⚠️  PostgreSQL non disponible, utilisation de H2${NC}"
    fi
fi

# Créer le dossier de logs
mkdir -p logs

echo -e "${GREEN}Lancement de l'application...${NC}\n"

if [ ! -f ./mvnw ]; then
    echo -e "${YELLOW}⚠️  Maven wrapper manquant${NC}"
    exit 1
fi

./mvnw spring-boot:run
