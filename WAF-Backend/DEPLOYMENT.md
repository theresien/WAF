# Guide de Déploiement WAF-AP Manager

Ce guide explique comment déployer WAF-AP Manager sur votre PC en tant que point d'accès WiFi sécurisé.

## 📋 Prérequis

### Logiciels requis
- **Arch Linux** (ou distribution similaire)
- **Java 21** : `sudo pacman -S jdk21-openjdk`
- **Maven** : `sudo pacman -S maven`
- **PostgreSQL** : `sudo pacman -S postgresql`
- **dnsmasq** : `sudo pacman -S dnsmasq`
- **hostapd** : `sudo pacman -S hostapd`

### Configuration système
- Interface WiFi disponible (ex: wlp3s0)
- Connexion Internet active
- Permissions sudo

## 🚀 Déploiement Automatique

### 1. Configuration initiale

```bash
# Cloner ou naviguer vers le projet
cd /home/mahafeno/Documents/WAF/WAF-Backend

# Configurer les variables d'environnement
cp .env.example .env
nano .env  # Modifier les mots de passe !
```

### 2. Lancer le script de déploiement

```bash
./deploy.sh
```

Ce script va :
- ✅ Vérifier les prérequis (Java, Maven, PostgreSQL)
- ✅ Démarrer PostgreSQL si nécessaire
- ✅ Créer la base de données et l'utilisateur
- ✅ Configurer sudo pour les scripts iptables
- ✅ Copier les scripts vers `/opt/wafap/scripts`
- ✅ Build l'application

### 3. Configurer le hotspot WiFi

```bash
sudo ./scripts/setup-hotspot.sh
```

Cela configure :
- IP forwarding
- NAT avec iptables
- Blocage par défaut des nouveaux appareils

### 4. Démarrer l'application

```bash
# Mode développement
./start.sh

# Mode production (background)
nohup ./mvnw spring-boot:run > logs/wafap.log 2>&1 &
```

## 🐳 Déploiement avec Docker (Alternative)

### Prérequis Docker
```bash
sudo pacman -S docker docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER  # Redémarrer la session après
```

### Configuration

```bash
# Créer .env.docker avec vos credentials
cp .env.example .env.docker
nano .env.docker  # Modifier DB_HOST=postgres
```

### Lancement

```bash
docker-compose up -d
```

**⚠️ Limitations Docker :**
- Le monitoring SSH via `journalctl` peut ne pas fonctionner
- Nécessite `privileged: true` pour iptables
- Accès limité au système hôte

**Recommandation : Déploiement direct sur PC pour un accès complet au système.**

## 🔧 Configuration Post-Déploiement

### 1. Configurer dnsmasq

Créer `/etc/dnsmasq.conf` :

```conf
# Interface du hotspot
interface=wlp3s0

# Plage DHCP
dhcp-range=192.168.50.50,192.168.50.150,12h

# Fichier de leases (lu par le backend)
dhcp-leasefile=/var/lib/misc/dnsmasq.leases

# DNS upstream
server=8.8.8.8
server=1.1.1.1

# Logs des requêtes DNS (pour tracking HTTPS)
log-queries
log-facility=/var/log/dnsmasq-queries.log

# Blacklist de domaines (géré par l'API)
conf-dir=/etc/dnsmasq.d/,*.conf
```

Démarrer dnsmasq :
```bash
sudo systemctl enable --now dnsmasq
```

### 2. Configurer hostapd

Créer `/etc/hostapd/hostapd.conf` :

```conf
interface=wlp3s0
driver=nl80211
ssid=WAF-AP-Secure
hw_mode=g
channel=6
auth_algs=1
wpa=2
wpa_passphrase=VotreMotDePasseWiFi
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
```

Démarrer hostapd :
```bash
sudo systemctl enable --now hostapd
```

### 3. Vérifier les permissions

Le backend doit pouvoir :
- Lire `/var/lib/misc/dnsmasq.leases`
- Exécuter les scripts dans `/opt/wafap/scripts` avec sudo
- Accéder à `journalctl` pour les logs SSH

```bash
# Vérifier les permissions
ls -l /var/lib/misc/dnsmasq.leases
sudo -l  # Vérifier que les scripts sont autorisés

# Test des scripts
sudo /opt/wafap/scripts/ban-device.sh AA:BB:CC:DD:EE:FF 192.168.50.100
```

## 📊 Accès à l'Application

### API Backend
- **URL** : http://localhost:8080/api
- **Swagger UI** : http://localhost:8080/api/swagger-ui.html
- **Health Check** : http://localhost:8080/api/logs/health

### Authentification

```bash
# Se connecter
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mahafeno","password":"Mahafeno2003"}'

# Utiliser le token JWT retourné
export TOKEN="eyJhbGc..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/policy/stats
```

### Endpoints Principaux

**Devices :**
- `GET /api/devices` - Liste des appareils
- `GET /api/devices/connected` - Appareils connectés
- `GET /api/devices/status/BANNED` - Appareils bannis

**Policy (protégés par JWT) :**
- `POST /api/policy/devices/{mac}/ban` - Bannir un appareil
- `POST /api/policy/devices/{mac}/allow` - Débannir un appareil

**Events :**
- `GET /api/events` - Tous les événements
- `GET /api/events/type/SSH_FAILED_AUTH` - Échecs SSH
- `GET /api/events/type/HTTP_ATTACK` - Attaques HTTP

**Logs (public pour ModSecurity) :**
- `POST /api/logs/modsecurity` - Ingestion des logs ModSecurity

## 🔒 Sécurité

### Changement des mots de passe

**⚠️ IMPORTANT : Changez les mots de passe par défaut !**

```bash
nano .env
```

Modifiez :
- `DB_PASSWORD` - Mot de passe PostgreSQL
- `ADMIN_PASSWORD` - Mot de passe admin backend
- `JWT_SECRET` - Générer avec `openssl rand -base64 64`

Puis redémarrez :
```bash
./start.sh
```

### Endpoints protégés

- ✅ `/policy/**` - Requiert authentification JWT
- ✅ `/logs/modsecurity` - Public (pour ModSecurity)
- ✅ `/devices/**` - Public (lecture seule)
- ✅ `/events/**` - Public (lecture seule)

Pour protéger davantage, modifiez `SecurityConfig.java:49-67`.

## 🛠️ Scripts Utiles

### Initialiser/Réinitialiser la DB
```bash
./scripts/init-db.sh
```

### Configurer le hotspot
```bash
sudo ./scripts/setup-hotspot.sh
```

### Bannir un appareil manuellement
```bash
sudo /opt/wafap/scripts/ban-device.sh AA:BB:CC:DD:EE:FF 192.168.50.100
```

### Débannir un appareil
```bash
sudo /opt/wafap/scripts/unban-device.sh AA:BB:CC:DD:EE:FF 192.168.50.100
```

## 📝 Logs

### Logs de l'application
```bash
tail -f logs/wafap.log
```

### Logs PostgreSQL
```bash
sudo journalctl -u postgresql -f
```

### Logs dnsmasq
```bash
tail -f /var/log/dnsmasq-queries.log
```

### Logs SSH (monitoring)
```bash
sudo journalctl -u sshd -f
```

## 🐛 Dépannage

### L'application ne démarre pas

```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Vérifier les logs
tail -f logs/wafap.log

# Tester la connexion DB
psql -h localhost -U mahafeno -d wafap
```

### Iptables ne fonctionne pas

```bash
# Vérifier les règles actuelles
sudo iptables -L -n -v

# Vérifier les scripts sudo
sudo -l

# Tester manuellement
sudo /opt/wafap/scripts/ban-device.sh TEST:MAC:ADDR 192.168.50.99
sudo iptables -L | grep 192.168.50.99
```

### DHCP leases non détectés

```bash
# Vérifier le fichier de leases
cat /var/lib/misc/dnsmasq.leases

# Vérifier les permissions
ls -l /var/lib/misc/dnsmasq.leases

# Vérifier la config dnsmasq
dnsmasq --test
```

### SSH monitoring ne fonctionne pas

```bash
# Vérifier que journalctl est accessible
journalctl -u sshd --since "1 hour ago"

# Vérifier les logs du backend
grep "SSH" logs/wafap.log

# Tester une fausse tentative SSH
ssh root@localhost  # Entrer un mauvais mot de passe
```

## 📋 Checklist de Production

Avant de mettre en production :

- [ ] Mots de passe changés dans `.env`
- [ ] JWT secret régénéré
- [ ] PostgreSQL démarré et configuré
- [ ] dnsmasq configuré et actif
- [ ] hostapd configuré et actif
- [ ] Hotspot WiFi fonctionnel
- [ ] Scripts sudo configurés
- [ ] Logs accessibles et rotatifs
- [ ] Firewall rules testées
- [ ] API accessible
- [ ] Authentification JWT testée
- [ ] Ban/unban d'appareils testé
- [ ] Monitoring SSH actif
- [ ] ModSecurity configuré (si utilisé)

## 🚧 Fonctionnalités Manquantes

**À implémenter pour une solution complète :**

1. **Tracking HTTPS/DNS :**
   - Monitoring des requêtes DNS de dnsmasq
   - Détection de sites dangereux par domaine
   - Association domaine ↔ IP dans les events

2. **Blacklist de domaines :**
   - API pour gérer les domaines interdits
   - Écriture dans `/etc/dnsmasq.d/blacklist.conf`
   - Reload automatique de dnsmasq

3. **Notifications :**
   - Alertes email/webhook pour bans automatiques
   - Notification de nouveaux appareils

4. **Dashboard web :**
   - Frontend React/Vue pour gérer les appareils
   - Graphiques de statistiques
   - Logs en temps réel

## 📚 Ressources

- **API Docs** : http://localhost:8080/api/swagger-ui.html
- **Logs** : `logs/wafap.log`
- **Scripts** : `/opt/wafap/scripts/`
- **Config** : `.env` et `src/main/resources/application-prod.yml`

---

**Maintenu par** : Mahafeno  
**Version** : 1.0.0  
**Date** : 2025-11-04
