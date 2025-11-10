# Guide de démarrage rapide

## 🚀 Démarrage en 3 étapes

### 1. Compiler le projet
```bash
mvn clean package -DskipTests
```

### 2. Démarrer l'application
```bash
mvn spring-boot:run
```

### 3. Tester les nouvelles fonctionnalités
```bash
# Dans un autre terminal
./test-update-severity-auto.sh
```

---

## 📋 Nouvelles fonctionnalités

### ✅ Affichage des URL blacklistées avec IP des appareils

**Problème résolu** : Les événements de domaines blacklistés affichent maintenant toujours l'IP source, même si l'appareil n'est pas trouvé dans la base de données.

**Endpoint** :
```bash
curl http://localhost:8080/events/blacklisted-domains
```

**Test** :
```bash
./test-blacklist.sh
./verify-blacklist-events.sh
```

### ✅ Modification de la sévérité des domaines blacklistés

**Nouvelle fonctionnalité** : Modifier la sévérité d'un domaine sans le supprimer.

**Endpoint** :
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/french-stream.one
```

**Test** :
```bash
./test-update-severity.sh          # Interactif
./test-update-severity-auto.sh     # Automatique
```

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| `BLACKLIST_FIX.md` | Détails de la correction du problème d'affichage des IP |
| `UPDATE_SEVERITY_FEATURE.md` | Documentation complète de la modification de sévérité |
| `API_EXAMPLES.md` | Exemples d'utilisation de l'API dans différents langages |
| `RESUME_MODIFICATIONS.md` | Résumé de toutes les modifications |

---

## 🧪 Scripts de test

| Script | Description |
|--------|-------------|
| `test-blacklist.sh` | Simule un accès à un domaine blacklisté |
| `verify-blacklist-events.sh` | Vérifie que les événements sont bien enregistrés |
| `test-update-severity.sh` | Test interactif de modification de sévérité |
| `test-update-severity-auto.sh` | Test automatique de modification de sévérité |

---

## 🔧 API Endpoints principaux

### Gestion des domaines blacklistés
```bash
GET    /blacklist/domains           # Lister tous les domaines
POST   /blacklist/domains           # Ajouter un domaine
PUT    /blacklist/domains/{domain}  # Modifier la sévérité ⭐ NOUVEAU
DELETE /blacklist/domains/{domain}  # Supprimer un domaine
```

### Consultation des événements
```bash
GET /events                         # Tous les événements
GET /events/blacklisted-domains     # Événements de domaines blacklistés ⭐ NOUVEAU
GET /events/type/{eventType}        # Événements par type
GET /events/device/{deviceId}       # Événements d'un appareil
```

---

## 💡 Exemples rapides

### Lister les domaines blacklistés
```bash
curl http://localhost:8080/blacklist/domains | jq '.'
```

### Modifier la sévérité d'un domaine
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/french-stream.one | jq '.'
```

### Voir les événements de domaines blacklistés
```bash
curl http://localhost:8080/events/blacklisted-domains | jq '.content[] | {ip: .sourceIp, domain: .requestUri, severity: .severity}'
```

### Ajouter un nouveau domaine
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"domain": "malicious-site.com", "severity": 5}' \
  http://localhost:8080/blacklist/domains | jq '.'
```

---

## 🎯 Niveaux de sévérité

| Niveau | Description | Action |
|--------|-------------|--------|
| **1** | Faible | Blocage DNS uniquement |
| **2** | Modéré | Blocage DNS + log |
| **3** | Moyen | Blocage DNS + log + alerte |
| **4** | Élevé | Blocage DNS + bannissement temporaire |
| **5** | Critique | Blocage DNS + bannissement permanent |

---

## 🔍 Vérification rapide

### Vérifier que l'application fonctionne
```bash
curl http://localhost:8080/actuator/health
```

### Vérifier les logs
```bash
tail -f logs/wafap.log | grep -i "blacklist\|severity"
```

### Vérifier la base de données
```bash
# Si vous utilisez H2 console
# Accédez à : http://localhost:8080/h2-console
```

---

## ⚠️ Prérequis

- Java 21+
- Maven 3.8+
- dnsmasq configuré (pour le blocage DNS)
- jq (pour les tests avec les scripts)

---

## 🆘 Dépannage

### L'application ne démarre pas
```bash
# Vérifier les logs
cat logs/wafap.log

# Vérifier le port 8080
lsof -i :8080
```

### Les événements ne s'affichent pas
```bash
# Vérifier que dnsmasq fonctionne
sudo systemctl status dnsmasq

# Vérifier le fichier de log DNS
tail -f /var/log/dnsmasq-queries.log

# Vérifier les logs de l'application
tail -f logs/wafap.log | grep -i dns
```

### La modification de sévérité ne fonctionne pas
```bash
# Vérifier que le domaine existe
curl http://localhost:8080/blacklist/domains | jq '.[] | .domain'

# Vérifier les logs
tail -f logs/wafap.log | grep -i severity
```

---

## 📞 Support

Pour plus d'informations, consultez :
- `BLACKLIST_FIX.md` - Détails techniques de la correction
- `UPDATE_SEVERITY_FEATURE.md` - Guide complet de la nouvelle fonctionnalité
- `API_EXAMPLES.md` - Exemples d'utilisation dans différents langages
- `RESUME_MODIFICATIONS.md` - Vue d'ensemble de toutes les modifications

---

## ✅ Checklist de démarrage

- [ ] Compiler le projet : `mvn clean package -DskipTests`
- [ ] Démarrer l'application : `mvn spring-boot:run`
- [ ] Vérifier la santé : `curl http://localhost:8080/actuator/health`
- [ ] Lister les domaines : `curl http://localhost:8080/blacklist/domains`
- [ ] Tester la modification : `./test-update-severity-auto.sh`
- [ ] Vérifier les événements : `curl http://localhost:8080/events/blacklisted-domains`
- [ ] Consulter les logs : `tail -f logs/wafap.log`

---

**Prêt à démarrer ? Lancez simplement :**
```bash
mvn spring-boot:run
```

Puis dans un autre terminal :
```bash
./test-update-severity-auto.sh
```

🎉 **C'est tout ! Vous êtes prêt à utiliser les nouvelles fonctionnalités.**
