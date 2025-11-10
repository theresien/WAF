#!/bin/bash
set -euo pipefail

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WAF-AP Manager - Déploiement PC${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 1. Vérifier les prérequis
echo -e "${YELLOW}[1/7]${NC} Vérification des prérequis..."

# Java 21
if ! java -version 2>&1 | grep -q "21"; then
    echo -e "${RED}❌ Java 21 requis. Installez avec : sudo pacman -S jdk21-openjdk${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Java 21 installé"

# Maven
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}❌ Maven requis. Installez avec : sudo pacman -S maven${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Maven installé"

# PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL requis. Installez avec : sudo pacman -S postgresql${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} PostgreSQL installé"

# 2. Vérifier que PostgreSQL est démarré
echo -e "\n${YELLOW}[2/7]${NC} Vérification du service PostgreSQL..."
if ! sudo systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}PostgreSQL n'est pas démarré. Démarrage...${NC}"
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi
echo -e "${GREEN}✓${NC} PostgreSQL actif"

echo -e "\n${YELLOW}[3/7]${NC} Chargement des variables d'environnement..."
if [ ! -f .env ]; then
    echo -e "${RED}❌ Fichier .env manquant. Copiez .env.example vers .env et configurez-le.${NC}" >&2
    exit 1
fi
set -a
source .env
set +a

if [ -z "${DB_PASSWORD:-}" ]; then
    echo -e "${RED}❌ DB_PASSWORD non défini dans .env${NC}" >&2
    exit 1
fi
echo -e "${GREEN}✓${NC} Variables chargées depuis .env"

# 4. Créer la base de données
echo -e "\n${YELLOW}[4/7]${NC} Configuration de la base de données..."

# Vérifier si la DB existe
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}✓${NC} Base de données '$DB_NAME' existe déjà"
else
    echo -e "${YELLOW}Création de la base de données '$DB_NAME'...${NC}"
    sudo -u postgres createdb "$DB_NAME"
    echo -e "${GREEN}✓${NC} Base de données créée"
fi

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

# Donner les permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" > /dev/null
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" > /dev/null
echo -e "${GREEN}✓${NC} Permissions configurées"

# 5. Configurer sudo pour les scripts iptables
echo -e "\n${YELLOW}[5/7]${NC} Configuration sudo pour scripts iptables..."

SUDOERS_FILE="/etc/sudoers.d/wafap"
SCRIPTS_DIR="/opt/wafap/scripts"

# Créer le répertoire des scripts
if [ ! -d "$SCRIPTS_DIR" ]; then
    echo -e "${YELLOW}Création du répertoire $SCRIPTS_DIR...${NC}"
    sudo mkdir -p "$SCRIPTS_DIR"
fi

# Copier les scripts
sudo cp scripts/*.sh "$SCRIPTS_DIR/"
sudo chmod +x "$SCRIPTS_DIR"/*.sh
echo -e "${GREEN}✓${NC} Scripts copiés vers $SCRIPTS_DIR"

# Créer la règle sudoers
if [ ! -f "$SUDOERS_FILE" ]; then
    echo -e "${YELLOW}Création de la règle sudoers...${NC}"
    echo "$USER ALL=(ALL) NOPASSWD: $SCRIPTS_DIR/*.sh" | sudo tee "$SUDOERS_FILE" > /dev/null
    sudo chmod 0440 "$SUDOERS_FILE"
    echo -e "${GREEN}✓${NC} Règle sudoers créée"
else
    echo -e "${GREEN}✓${NC} Règle sudoers existe déjà"
fi

echo -e "\n${YELLOW}[6/7]${NC} Build de l'application..."
if ! ./mvnw clean package -DskipTests; then
    echo -e "${RED}❌ Échec du build${NC}" >&2
    exit 1
fi
echo -e "${GREEN}✓${NC} Build terminé"

# 7. Instructions finales
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ Déploiement terminé avec succès !${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Pour lancer l'application :${NC}"
echo -e "  ./mvnw spring-boot:run\n"

echo -e "${YELLOW}Ou en production (avec nohup) :${NC}"
echo -e "  nohup ./mvnw spring-boot:run > logs/wafap.log 2>&1 &\n"

echo -e "${YELLOW}API disponible sur :${NC}"
echo -e "  http://localhost:8080/api\n"

echo -e "${YELLOW}Documentation Swagger :${NC}"
echo -e "  http://localhost:8080/api/swagger-ui.html\n"

echo -e "${YELLOW}Login admin :${NC}"
echo -e "  Username: $ADMIN_USERNAME"
echo -e "  Password: $ADMIN_PASSWORD\n"

echo -e "${YELLOW}Pour configurer le hotspot WiFi :${NC}"
echo -e "  sudo ./scripts/setup-hotspot.sh\n"

echo -e "${RED}IMPORTANT :${NC}"
echo -e "  - Changez le mot de passe admin dans .env"
echo -e "  - Configurez dnsmasq pour le DHCP"
echo -e "  - Le monitoring SSH nécessite journalctl accessible\n"
