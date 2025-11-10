# Guide d'Installation Sécurisé - WAF-AP Manager

## 🚀 Installation Rapide

### 1. Prérequis

```bash
# Arch Linux
sudo pacman -S jdk21-openjdk maven postgresql

# Démarrer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Configuration

```bash
# Copier les fichiers d'exemple
cp .env.example .env
cp .env.docker.example .env.docker

# Générer des mots de passe sécurisés
echo "DB_PASSWORD=$(openssl rand -base64 32)"
echo "ADMIN_PASSWORD=$(openssl rand -base64 24)"

# Éditer .env avec vos valeurs
nano .env
```

### 3. Vérification de Sécurité

```bash
# Vérifier la configuration
./check-security.sh
```

### 4. Déploiement

```bash
# Déploiement local
./deploy.sh

# OU avec Docker
docker-compose up -d
```

### 5. Démarrage

```bash
# Démarrage simple
./start.sh

# OU avec Maven directement
./mvnw spring-boot:run
```

## 📋 Checklist de Sécurité

Avant de déployer en production :

- [ ] Mots de passe forts configurés dans `.env`
- [ ] Console H2 désactivée (`H2_CONSOLE_ENABLED=false`)
- [ ] Fichiers `.env*` dans `.gitignore`
- [ ] Scripts dans `/opt/wafap/scripts` avec permissions correctes
- [ ] Configuration sudoers en place
- [ ] CORS configuré pour votre domaine
- [ ] Logs activés et surveillés
- [ ] Backup de la base de données configuré

## 🔒 Sécurité

### Variables d'Environnement Critiques

```bash
# Base de données
DB_PASSWORD=<mot-de-passe-fort-32-caractères>

# Admin
ADMIN_PASSWORD=<mot-de-passe-fort-24-caractères>

# Production
H2_CONSOLE_ENABLED=false
SPRING_PROFILES_ACTIVE=prod
```

### Génération de Mots de Passe

```bash
# Mot de passe DB (32 caractères)
openssl rand -base64 32

# Mot de passe Admin (24 caractères)
openssl rand -base64 24

# Alternative avec pwgen
pwgen -s 32 1
```

## 🛠️ Scripts Disponibles

| Script | Description |
|--------|-------------|
| `deploy.sh` | Déploiement complet (DB + build) |
| `start.sh` | Démarrage de l'application |
| `check-security.sh` | Vérification de sécurité |
| `scripts/init-db.sh` | Initialisation DB uniquement |
| `scripts/setup-hotspot.sh` | Configuration hotspot WiFi |
| `scripts/ban-device.sh` | Bannir un appareil (usage interne) |
| `scripts/unban-device.sh` | Débannir un appareil (usage interne) |

## 📊 Endpoints API

Une fois démarré :

- **API** : http://localhost:8080/api
- **Swagger** : http://localhost:8080/api/swagger-ui.html
- **H2 Console** : http://localhost:8080/api/h2-console (dev uniquement)

## 🐛 Dépannage

### PostgreSQL ne démarre pas

```bash
# Vérifier le statut
sudo systemctl status postgresql

# Voir les logs
sudo journalctl -u postgresql -n 50

# Réinitialiser si nécessaire
sudo -u postgres initdb -D /var/lib/postgres/data
```

### Erreur de permissions scripts

```bash
# Vérifier sudoers
sudo cat /etc/sudoers.d/wafap

# Recréer si nécessaire
echo "$USER ALL=(ALL) NOPASSWD: /opt/wafap/scripts/*.sh" | sudo tee /etc/sudoers.d/wafap
sudo chmod 0440 /etc/sudoers.d/wafap
```

### Build Maven échoue

```bash
# Nettoyer et rebuilder
./mvnw clean
./mvnw package -DskipTests

# Vérifier Java version
java -version  # Doit être 21
```

## 📚 Documentation

- [SECURITY.md](SECURITY.md) - Guide de sécurité complet
- [CORRECTIONS.md](CORRECTIONS.md) - Corrections appliquées
- Architecture et API - Voir Swagger UI

## 🔄 Mise à Jour

```bash
# Sauvegarder la DB
pg_dump wafap > backup.sql

# Pull des changements
git pull

# Rebuild
./mvnw clean package -DskipTests

# Redémarrer
./start.sh
```

## 📞 Support

En cas de problème :

1. Vérifier les logs : `tail -f logs/wafap.log`
2. Exécuter : `./check-security.sh`
3. Consulter : [SECURITY.md](SECURITY.md)
4. Vérifier la configuration : `cat .env`

## ⚠️ Important

- **NE JAMAIS** commiter les fichiers `.env` ou `.env.docker`
- **TOUJOURS** utiliser des mots de passe forts
- **DÉSACTIVER** la console H2 en production
- **SURVEILLER** les logs régulièrement
- **SAUVEGARDER** la base de données
