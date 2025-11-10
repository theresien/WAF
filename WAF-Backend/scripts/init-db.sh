#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -f ../.env ]; then
    set -a
    source ../.env
    set +a
elif [ -f .env ]; then
    set -a
    source .env
    set +a
else
    echo -e "${RED}❌ Fichier .env introuvable${NC}" >&2
    exit 1
fi

DB_NAME=${DB_NAME:-wafap}
DB_USER=${DB_USER:-mahafeno}
DB_PASSWORD=${DB_PASSWORD:-}

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ DB_PASSWORD non défini dans .env${NC}" >&2
    exit 1
fi

echo -e "${YELLOW}Initialisation de la base de données PostgreSQL${NC}\n"

if ! sudo systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}Démarrage de PostgreSQL...${NC}"
    if ! sudo systemctl start postgresql; then
        echo -e "${RED}❌ Échec du démarrage de PostgreSQL${NC}" >&2
        exit 1
    fi
fi

# Créer la base de données si elle n'existe pas
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}⚠️  Base de données '$DB_NAME' existe déjà${NC}"
    read -p "Voulez-vous la réinitialiser ? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Suppression de la base de données...${NC}"
        sudo -u postgres dropdb "$DB_NAME"
        echo -e "${GREEN}✓${NC} Base supprimée"
    else
        echo -e "${YELLOW}Utilisation de la base existante${NC}"
        exit 0
    fi
fi

echo -e "${YELLOW}Création de la base de données '$DB_NAME'...${NC}"
sudo -u postgres createdb "$DB_NAME"
echo -e "${GREEN}✓${NC} Base de données créée"

if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    echo -e "${GREEN}✓${NC} Utilisateur '$DB_USER' existe déjà"
else
    echo -e "${YELLOW}Création de l'utilisateur '$DB_USER'...${NC}"
    if ! sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"; then
        echo -e "${RED}❌ Échec de la création de l'utilisateur${NC}" >&2
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Utilisateur créé"
fi

echo -e "${YELLOW}Configuration des permissions...${NC}"
if ! sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"; then
    echo -e "${RED}❌ Échec de l'attribution des permissions${NC}" >&2
    exit 1
fi
if ! sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"; then
    echo -e "${RED}❌ Échec de l'attribution des permissions sur le schéma${NC}" >&2
    exit 1
fi
echo -e "${GREEN}✓${NC} Permissions accordées"

echo -e "\n${GREEN}✓ Base de données initialisée avec succès !${NC}"
echo -e "${YELLOW}Les tables seront créées automatiquement au premier démarrage de l'application.${NC}\n"
