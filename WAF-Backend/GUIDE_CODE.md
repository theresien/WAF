# Guide du Code - WAF-AP Manager

## 📁 Architecture de l'Application

```
src/main/java/com/wafap/
├── model/          → Entités de base de données
├── repository/     → Accès aux données (JPA)
├── service/        → Logique métier
├── controller/     → API REST
├── dto/            → Objets de transfert de données
├── config/         → Configuration Spring
└── exception/      → Gestion des erreurs
```

---

## 🎯 CODES LES PLUS IMPORTANTS

### 1. 🔴 **PolicyService.java** - CŒUR DE LA SÉCURITÉ
**Fichier**: `service/PolicyService.java`

**Fonctionnalités**:
- ✅ **Bannir un appareil** (bloque l'accès WiFi)
- ✅ **Débannir un appareil** (restaure l'accès)
- ✅ **Exécute les commandes iptables** via sudo

**Code clé**:
```java
public void banDevice(Device device, String reason, Integer durationMinutes) {
    // 1. Marque l'appareil comme BANNED dans la DB
    // 2. Exécute: sudo /path/ban-device.sh <MAC>
    // 3. Crée un événement DEVICE_BANNED
}

public void unbanDevice(Device device) {
    // 1. Marque l'appareil comme MONITORED
    // 2. Exécute: sudo /path/unban-device.sh <MAC>
    // 3. Crée un événement DEVICE_UNBANNED
}
```

**Scripts appelés**:
- `scripts/ban-device.sh` → Ajoute règle iptables DROP
- `scripts/unban-device.sh` → Supprime règle iptables DROP

---

### 2. 🌐 **DnsMonitorService.java** - SURVEILLANCE DNS
**Fichier**: `service/DnsMonitorService.java`

**Fonctionnalités**:
- ✅ **Lit les logs DNS** de dnsmasq (`/var/log/dnsmasq-queries.log`)
- ✅ **Détecte les domaines blacklistés**
- ✅ **Bannit automatiquement** les appareils qui accèdent à des sites dangereux

**Code clé**:
```java
@Scheduled(fixedDelay = 5000) // Toutes les 5 secondes
public void monitorDnsQueries() {
    // 1. Lit le fichier de logs DNS
    // 2. Parse chaque ligne: "query[A] example.com from 192.168.99.100"
    // 3. Vérifie si le domaine est blacklisté
    // 4. Si OUI → bannit l'appareil automatiquement
}
```

**Format log DNS**:
```
Nov 10 23:19:28 dnsmasq[1234]: query[A] malware.com from 192.168.99.100
```

---

### 3. 🔒 **LogIngesterService.java** - DÉTECTION D'ATTAQUES HTTP
**Fichier**: `service/LogIngesterService.java`

**Fonctionnalités**:
- ✅ **Reçoit les logs ModSecurity** (attaques HTTP)
- ✅ **Analyse la sévérité** de l'attaque
- ✅ **Bannit automatiquement** si sévérité ≥ 3

**Code clé**:
```java
public void ingestModSecurityLog(String jsonLog) {
    // 1. Parse le JSON ModSecurity
    // 2. Extrait: IP, sévérité, ruleId, URI
    // 3. Trouve l'appareil par IP
    // 4. Crée un événement HTTP_ATTACK
    // 5. Si sévérité ≥ 3 → bannit l'appareil
}
```

**Seuil configurable**: `application.yml`
```yaml
wafap:
  modsecurity:
    severity-threshold: 3  # Bannir si sévérité ≥ 3
```

---

### 4. 📡 **DhcpLeaseReader.java** - DÉCOUVERTE D'APPAREILS
**Fichier**: `service/DhcpLeaseReader.java`

**Fonctionnalités**:
- ✅ **Lit les baux DHCP** de dnsmasq
- ✅ **Découvre les nouveaux appareils**
- ✅ **Met à jour IP, hostname, vendor**

**Code clé**:
```java
@Scheduled(fixedDelay = 60000) // Toutes les 60 secondes
public void scanDhcpLeases() {
    // 1. Lit /var/lib/dnsmasq/dhcp.leases
    // 2. Parse: <timestamp> <MAC> <IP> <hostname> <client-id>
    // 3. Crée ou met à jour l'appareil dans la DB
    // 4. Résout le hostname via DNS si absent
    // 5. Récupère le vendor via MAC address
}
```

**Format lease**:
```
1234567890 aa:bb:cc:dd:ee:ff 192.168.99.100 laptop-001 *
```

---

### 5. 🔌 **ConnectionMonitor.java** - STATUT DE CONNEXION
**Fichier**: `service/ConnectionMonitor.java`

**Fonctionnalités**:
- ✅ **Vérifie quels appareils sont connectés**
- ✅ **Met à jour le statut ONLINE/OFFLINE**

**Code clé**:
```java
@Scheduled(fixedRate = 15000) // Toutes les 15 secondes
public void updateConnectedDevices() {
    // 1. Exécute: ip neigh show dev wlp3s0
    // 2. Parse les MAC addresses avec statut REACHABLE
    // 3. Met à jour isConnected = true/false pour chaque appareil
}
```

**Commande utilisée**:
```bash
ip neigh show dev wlp3s0
# Résultat: 192.168.99.100 lladdr aa:bb:cc:dd:ee:ff REACHABLE
```

---

### 6. 🔐 **SshCollectorService.java** - DÉTECTION SSH
**Fichier**: `service/SshCollectorService.java`

**Fonctionnalités**:
- ✅ **Surveille les tentatives SSH échouées**
- ✅ **Bannit après 5 échecs**

**Code clé**:
```java
@Scheduled(fixedDelay = 10000) // Toutes les 10 secondes
public void collectSshLogs() {
    // 1. Lit /var/log/auth.log
    // 2. Cherche: "Failed password for"
    // 3. Incrémente failedAttempts
    // 4. Si failedAttempts ≥ 5 → bannit l'appareil
}
```

---

## 🎮 CONTROLLERS (API REST)

### **DeviceController.java** - Gestion des Appareils
```java
GET    /devices              → Liste tous les appareils
GET    /devices/{id}         → Détails d'un appareil
POST   /devices/{id}/ban     → Bannir un appareil
POST   /devices/{id}/unban   → Débannir un appareil
DELETE /devices/{id}         → Supprimer un appareil
```

### **EventController.java** - Événements de Sécurité
```java
GET /events                      → Tous les événements
GET /events/type/{eventType}     → Filtrer par type
GET /events/device/{deviceId}    → Événements d'un appareil
GET /events/blacklisted-domains  → Accès sites dangereux
```

### **BlacklistController.java** - Gestion Blacklist
```java
GET    /blacklist        → Liste des domaines blacklistés
POST   /blacklist        → Ajouter un domaine
DELETE /blacklist/{id}   → Supprimer un domaine
```

### **PolicyController.java** - Actions de Sécurité
```java
POST /policy/ban/{deviceId}    → Bannir un appareil
POST /policy/unban/{deviceId}  → Débannir un appareil
```

---

## 📊 MODÈLES DE DONNÉES

### **Device.java** - Appareil
```java
- id: Long
- macAddress: String (unique)
- ipAddress: String
- hostname: String          ← NOUVEAU
- vendor: String
- status: DeviceStatus (MONITORED, BANNED, TRUSTED)
- failedAttempts: Integer
- isConnected: Boolean
- firstSeen: LocalDateTime
- lastSeen: LocalDateTime
```

### **Event.java** - Événement de Sécurité
```java
- id: Long
- device: Device
- timestamp: LocalDateTime
- eventType: EventType
- severity: Integer
- sourceIp: String
- requestUri: String
- userAgent: String
- messageJson: String (détails complets)
```

### **EventType** (Enum)
```java
- DEVICE_CONNECTED
- DEVICE_BANNED
- DEVICE_UNBANNED
- HTTP_ATTACK
- SSH_FAILED_AUTH
- HTTPS_DANGEROUS_SITE
```

---

## ⚙️ CONFIGURATION IMPORTANTE

### **application.yml**
```yaml
wafap:
  # Scripts de sécurité
  scripts:
    ban-device: /home/mahafeno/Documents/WAF/WAF-Backend/scripts/ban-device.sh
    unban-device: /home/mahafeno/Documents/WAF/WAF-Backend/scripts/unban-device.sh
  
  # Seuils de sécurité
  modsecurity:
    severity-threshold: 3  # Bannir si sévérité ≥ 3
  
  ssh:
    max-failed-attempts: 5  # Bannir après 5 échecs SSH
  
  # Fichiers surveillés
  dhcp:
    leases-file: /var/lib/dnsmasq/dhcp.leases
    scan-interval: 60000  # 60 secondes
  
  dns:
    log-file: /var/log/dnsmasq-queries.log
    monitor-interval: 5000  # 5 secondes
```

---

## 🔄 FLUX DE DONNÉES PRINCIPAUX

### 1. **Nouvel Appareil se Connecte**
```
WiFi Connection
    ↓
dnsmasq attribue IP (DHCP)
    ↓
DhcpLeaseReader détecte le lease
    ↓
Crée Device dans DB (status: MONITORED)
    ↓
Crée Event (DEVICE_CONNECTED)
    ↓
ConnectionMonitor met isConnected = true
```

### 2. **Appareil Accède à un Site Blacklisté**
```
Appareil fait requête DNS → malware.com
    ↓
dnsmasq log la requête
    ↓
DnsMonitorService lit le log
    ↓
Vérifie si malware.com est blacklisté
    ↓
OUI → PolicyService.banDevice()
    ↓
Exécute ban-device.sh (iptables DROP)
    ↓
Crée Event (HTTPS_DANGEROUS_SITE)
    ↓
Device.status = BANNED
```

### 3. **Attaque HTTP Détectée**
```
Appareil envoie requête HTTP malveillante
    ↓
ModSecurity détecte l'attaque
    ↓
ModSecurity envoie JSON à /logs/modsecurity
    ↓
LogIngesterService.ingestModSecurityLog()
    ↓
Parse sévérité (ex: 4)
    ↓
Si sévérité ≥ 3 → PolicyService.banDevice()
    ↓
Crée Event (HTTP_ATTACK)
```

---

## 🚨 POINTS CRITIQUES À RETENIR

1. **PolicyService** = Cerveau de la sécurité (ban/unban)
2. **DnsMonitorService** = Surveille les accès web
3. **LogIngesterService** = Détecte les attaques HTTP
4. **DhcpLeaseReader** = Découvre les nouveaux appareils
5. **ConnectionMonitor** = Statut online/offline

**Tous les services utilisent @Scheduled pour tourner en boucle !**

---

## 📝 COMMANDES UTILES POUR RÉVISER

```bash
# Voir les appareils
curl http://localhost:8080/devices

# Voir les événements
curl http://localhost:8080/events

# Voir la blacklist
curl http://localhost:8080/blacklist

# Bannir un appareil
curl -X POST http://localhost:8080/policy/ban/1

# Débannir un appareil
curl -X POST http://localhost:8080/policy/unban/1
```

---

## 🎓 RÉSUMÉ ULTRA-RAPIDE

| Service | Quoi | Quand | Action |
|---------|------|-------|--------|
| **PolicyService** | Ban/Unban | Sur demande | Exécute iptables |
| **DnsMonitorService** | Surveille DNS | Toutes les 5s | Ban si blacklist |
| **LogIngesterService** | Détecte attaques HTTP | Sur réception log | Ban si sévérité ≥ 3 |
| **DhcpLeaseReader** | Découvre appareils | Toutes les 60s | Crée Device |
| **ConnectionMonitor** | Statut connexion | Toutes les 15s | Update isConnected |
| **SshCollectorService** | Surveille SSH | Toutes les 10s | Ban après 5 échecs |

**C'est tout ! L'application surveille en continu et bannit automatiquement les menaces.** 🛡️
