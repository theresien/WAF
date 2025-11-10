#!/bin/bash
set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  WAF-AP Security Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

ERRORS=0
WARNINGS=0

check_file() {
    local file=$1
    local should_exist=$2
    
    if [ "$should_exist" = "yes" ]; then
        if [ -f "$file" ]; then
            echo -e "${GREEN}✓${NC} $file existe"
        else
            echo -e "${RED}✗${NC} $file manquant"
            ((ERRORS++))
        fi
    else
        if [ -f "$file" ]; then
            echo -e "${RED}✗${NC} $file ne devrait pas exister (fichier sensible)"
            ((ERRORS++))
        else
            echo -e "${GREEN}✓${NC} $file n'existe pas (OK)"
        fi
    fi
}

check_env_var() {
    local var_name=$1
    local file=$2
    
    if grep -q "^${var_name}=.*CHANGE_ME" "$file" 2>/dev/null; then
        echo -e "${RED}✗${NC} $var_name contient encore 'CHANGE_ME' dans $file"
        ((ERRORS++))
    elif grep -q "^${var_name}=" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $var_name configuré dans $file"
    else
        echo -e "${YELLOW}⚠${NC} $var_name manquant dans $file"
        ((WARNINGS++))
    fi
}

echo -e "${YELLOW}[1/5]${NC} Vérification des fichiers de configuration...\n"

check_file ".env.example" "yes"
check_file ".env.docker.example" "yes"
check_file ".gitignore" "yes"

echo -e "\n${YELLOW}[2/5]${NC} Vérification des fichiers sensibles...\n"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env existe"
    check_env_var "DB_PASSWORD" ".env"
    check_env_var "ADMIN_PASSWORD" ".env"
else
    echo -e "${YELLOW}⚠${NC} .env manquant (créez-le depuis .env.example)"
    ((WARNINGS++))
fi

echo -e "\n${YELLOW}[3/5]${NC} Vérification Git...\n"

if git rev-parse --git-dir > /dev/null 2>&1; then
    if git check-ignore .env >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} .env est ignoré par Git"
    else
        echo -e "${RED}✗${NC} .env n'est PAS ignoré par Git!"
        ((ERRORS++))
    fi
    
    if git check-ignore .env.docker >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} .env.docker est ignoré par Git"
    else
        echo -e "${YELLOW}⚠${NC} .env.docker devrait être ignoré par Git"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Pas un dépôt Git"
fi

echo -e "\n${YELLOW}[4/5]${NC} Vérification des scripts...\n"

SCRIPTS=(
    "scripts/ban-device.sh"
    "scripts/unban-device.sh"
    "scripts/reload-firewall.sh"
    "scripts/init-db.sh"
    "scripts/setup-hotspot.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo -e "${GREEN}✓${NC} $script est exécutable"
        else
            echo -e "${YELLOW}⚠${NC} $script n'est pas exécutable"
            ((WARNINGS++))
        fi
        
        if head -n 2 "$script" | grep -q "set -euo pipefail"; then
            echo -e "${GREEN}✓${NC} $script utilise set -euo pipefail"
        else
            echo -e "${YELLOW}⚠${NC} $script devrait utiliser set -euo pipefail"
            ((WARNINGS++))
        fi
    else
        echo -e "${RED}✗${NC} $script manquant"
        ((ERRORS++))
    fi
done

echo -e "\n${YELLOW}[5/5]${NC} Vérification des permissions...\n"

if [ -d "/opt/wafap/scripts" ]; then
    echo -e "${GREEN}✓${NC} /opt/wafap/scripts existe"
else
    echo -e "${YELLOW}⚠${NC} /opt/wafap/scripts n'existe pas (exécutez deploy.sh)"
    ((WARNINGS++))
fi

if [ -f "/etc/sudoers.d/wafap" ]; then
    echo -e "${GREEN}✓${NC} Configuration sudoers existe"
else
    echo -e "${YELLOW}⚠${NC} Configuration sudoers manquante (exécutez deploy.sh)"
    ((WARNINGS++))
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Résumé${NC}"
echo -e "${BLUE}========================================${NC}\n"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Aucun problème détecté !${NC}\n"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS avertissement(s)${NC}\n"
    exit 0
else
    echo -e "${RED}✗ $ERRORS erreur(s), $WARNINGS avertissement(s)${NC}\n"
    echo -e "${YELLOW}Actions recommandées :${NC}"
    echo -e "  1. Créez .env depuis .env.example"
    echo -e "  2. Configurez des mots de passe sécurisés"
    echo -e "  3. Exécutez ./deploy.sh pour finaliser l'installation\n"
    exit 1
fi
