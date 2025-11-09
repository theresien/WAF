#!/bin/bash
# Script de lancement de l'application WAF-AP Manager

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}⚠️  Fichier .env manquant, utilisation des valeurs par défaut${NC}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WAF-AP Manager - Démarrage${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Vérifier que PostgreSQL est actif
if ! sudo systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}Démarrage de PostgreSQL...${NC}"
    sudo systemctl start postgresql
fi

# Créer le dossier de logs
mkdir -p logs

echo -e "${GREEN}Lancement de l'application...${NC}\n"

# Lancer avec Maven
./mvnw spring-boot:run
