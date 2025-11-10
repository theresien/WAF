# Guide des événements SSH

## Vue d'ensemble

Le système surveille automatiquement les tentatives de connexion SSH échouées et crée des événements pour chaque échec. Les appareils qui dépassent le nombre maximum de tentatives échouées sont automatiquement bannis.

## Fonctionnement

### 1. Surveillance en temps réel

Le `SshCollectorService` utilise `journalctl` pour surveiller les logs SSH en temps réel :

```java
journalctl -u ssh -u sshd -f -o cat
```

### 2. Détection des échecs

Le service détecte les lignes de log contenant :
- `Failed password for ... from IP`
- `Failed publickey for ... from IP`

### 3. Création d'événements

Pour chaque tentative échouée :
- ✅ Un événement `SSH_FAILED_AUTH` est créé
- ✅ L'IP source est toujours enregistrée
- ✅ Si l'appareil est trouvé, le compteur d'échecs est incrémenté
- ✅ Si l'appareil dépasse le seuil, il est automatiquement banni

## Correction apportée

### ❌ Problème précédent

Les événements SSH n'étaient créés **QUE si l'appareil était trouvé** dans la base de données :

```java
if (deviceOpt.isEmpty()) {
    logger.info("SSH failed auth from unknown IP: {}", sourceIp);
    return;  // ❌ Aucun événement créé !
}
```

### ✅ Solution actuelle

Maintenant, les événements sont **toujours créés**, même si l'appareil est inconnu :

```java
Device device = deviceOpt.orElse(null);

// Create event (even if device is unknown)
Event event = new Event(device, EventType.SSH_FAILED_AUTH);
event.setSourceIp(sourceIp);  // IP toujours enregistrée
eventRepository.save(event);
```

## Configuration

### Paramètres dans application.properties

```properties
# Nombre maximum de tentatives SSH échouées avant bannissement
wafap.ssh.max-failed-attempts=5

# Durée du bannissement en secondes (3600 = 1 heure)
wafap.ssh.ban-duration=3600
```

## API Endpoints

### Récupérer tous les événements SSH
```bash
GET /events/type/SSH_FAILED_AUTH
```

**Exemple** :
```bash
curl http://localhost:8080/events/type/SSH_FAILED_AUTH
```

**Réponse** :
```json
{
  "content": [
    {
      "id": 789,
      "deviceId": 12,
      "deviceMac": "aa:bb:cc:dd:ee:ff",
      "deviceIp": "192.168.50.100",
      "timestamp": "2025-11-09T18:00:00",
      "eventType": "SSH_FAILED_AUTH",
      "sourceIp": "192.168.50.100",
      "messageJson": "Failed password for user from 192.168.50.100 port 54321"
    }
  ]
}
```

### Récupérer les événements d'un appareil
```bash
GET /events/device/{deviceId}
```

## Test de la fonctionnalité

### 1. Démarrer l'application
```bash
mvn spring-boot:run
```

### 2. Vérifier le service SSH
```bash
systemctl status ssh
# ou
systemctl status sshd
```

### 3. Tester depuis un autre PC

Depuis un autre ordinateur sur le réseau :

```bash
# Remplacez par l'IP de votre serveur
ssh utilisateur@192.168.50.1
```

Entrez un **mauvais mot de passe** plusieurs fois.

### 4. Vérifier les événements

```bash
# Via le script de test
./test-ssh-events.sh

# Ou directement via l'API
curl http://localhost:8080/events/type/SSH_FAILED_AUTH | jq '.content[0]'
```

### 5. Surveiller en temps réel

```bash
# Surveiller les événements
watch -n 2 'curl -s http://localhost:8080/events/type/SSH_FAILED_AUTH | jq ".content[0]"'

# Surveiller les logs de l'application
tail -f logs/wafap.log | grep -i ssh
```

## Comportement du bannissement

### Seuil de bannissement

Par défaut, après **5 tentatives échouées**, l'appareil est automatiquement banni.

### Exemple de scénario

1. **Tentative 1-4** : Événements créés, compteur incrémenté
2. **Tentative 5** : 
   - Événement créé
   - Appareil banni automatiquement
   - Règles iptables appliquées
   - Événement `DEVICE_BANNED` créé

### Vérifier les appareils bannis

```bash
curl http://localhost:8080/devices | jq '.[] | select(.status == "BANNED")'
```

### Débannir un appareil

```bash
curl -X POST http://localhost:8080/devices/{deviceId}/unban
```

## Structure des événements SSH

Chaque événement SSH contient :

```json
{
  "id": 789,
  "deviceId": 12,                    // null si appareil inconnu
  "deviceMac": "aa:bb:cc:dd:ee:ff",  // null si appareil inconnu
  "deviceIp": "192.168.50.100",      // null si appareil inconnu
  "timestamp": "2025-11-09T18:00:00",
  "eventType": "SSH_FAILED_AUTH",
  "sourceIp": "192.168.50.100",      // ✅ Toujours présent
  "requestUri": null,
  "userAgent": null,
  "ruleId": null,
  "severity": null,
  "messageJson": "Failed password for user from 192.168.50.100 port 54321"
}
```

**Important** : `sourceIp` est toujours présent, même si l'appareil n'est pas dans la base de données.

## Logs

### Logs de l'application

```bash
# Voir les logs SSH
tail -f logs/wafap.log | grep -i ssh

# Exemples de logs
INFO  - SSH Collector Service started with Virtual Threads
WARN  - SSH failed authentication from IP: 192.168.50.100
INFO  - SSH failed auth from 192.168.50.100 (MAC: aa:bb:cc:dd:ee:ff) - Total failures: 3
INFO  - Device aa:bb:cc:dd:ee:ff banned: Exceeded maximum SSH failed attempts (5)
```

### Logs système SSH

```bash
# Voir les logs SSH système
journalctl -u ssh -u sshd -f

# Voir les échecs récents
journalctl -u ssh -u sshd --since "10 minutes ago" | grep -i failed
```

## Dépannage

### Le service SSH ne démarre pas

**Vérifier les logs** :
```bash
tail -f logs/wafap.log | grep -i "ssh collector"
```

**Vérifier journalctl** :
```bash
which journalctl
journalctl --version
```

### Aucun événement n'est créé

**1. Vérifier que le service SSH est actif** :
```bash
systemctl status ssh
```

**2. Vérifier les permissions** :
```bash
# L'utilisateur doit pouvoir lire les logs
journalctl -u ssh -n 1
```

**3. Tester manuellement** :
```bash
# Depuis un autre PC
ssh utilisateur@IP_DU_SERVEUR
# Entrez un mauvais mot de passe
```

**4. Vérifier les logs système** :
```bash
journalctl -u ssh -u sshd --since "1 minute ago" | grep -i failed
```

### Les appareils ne sont pas bannis

**Vérifier le seuil** :
```bash
# Dans application.properties
wafap.ssh.max-failed-attempts=5
```

**Vérifier le compteur** :
```bash
curl http://localhost:8080/devices | jq '.[] | {mac, ip, failedAttempts}'
```

## Sécurité

### Prévention des attaques par force brute

Le système protège contre les attaques SSH par :

1. **Surveillance en temps réel** des tentatives échouées
2. **Bannissement automatique** après N tentatives
3. **Blocage au niveau firewall** (iptables)
4. **Traçabilité complète** de tous les événements

### Recommandations

- ✅ Utilisez des clés SSH au lieu de mots de passe
- ✅ Désactivez l'authentification par mot de passe root
- ✅ Changez le port SSH par défaut (22)
- ✅ Utilisez fail2ban en complément
- ✅ Surveillez régulièrement les événements SSH

## Exemples d'utilisation

### Voir les 10 dernières tentatives SSH échouées
```bash
curl -s "http://localhost:8080/events/type/SSH_FAILED_AUTH?size=10" | \
  jq -r '.content[] | "\(.timestamp) - \(.sourceIp)"'
```

### Compter les tentatives par IP
```bash
curl -s "http://localhost:8080/events/type/SSH_FAILED_AUTH?size=100" | \
  jq -r '.content[].sourceIp' | sort | uniq -c | sort -rn
```

### Voir les appareils avec des tentatives échouées
```bash
curl -s http://localhost:8080/devices | \
  jq '.[] | select(.failedAttempts > 0) | {mac, ip, failedAttempts, status}'
```

### Exporter les événements SSH en CSV
```bash
curl -s "http://localhost:8080/events/type/SSH_FAILED_AUTH" | \
  jq -r '.content[] | [.timestamp, .sourceIp, .deviceMac // "unknown"] | @csv' > ssh_events.csv
```

## Intégration avec le frontend

Le frontend peut afficher :

1. **Dashboard** : Nombre de tentatives SSH échouées aujourd'hui
2. **Alertes** : Notification en temps réel des tentatives
3. **Graphiques** : Évolution des tentatives dans le temps
4. **Liste** : Tableau des événements SSH avec filtres
5. **Détails** : Informations complètes sur chaque tentative

## Fichiers modifiés

1. `src/main/java/com/wafap/service/SshCollectorService.java`
   - Création d'événements même si l'appareil est inconnu
   - IP source toujours enregistrée

## Test complet

```bash
# 1. Compiler
mvn clean package -DskipTests

# 2. Démarrer
mvn spring-boot:run

# 3. Vérifier
./test-ssh-events.sh

# 4. Tester depuis un autre PC
ssh utilisateur@IP_DU_SERVEUR
# Entrez un mauvais mot de passe

# 5. Vérifier les événements
curl http://localhost:8080/events/type/SSH_FAILED_AUTH | jq '.'
```

## Conclusion

✅ **Le système SSH fonctionne correctement** et crée des événements pour toutes les tentatives échouées, même si l'appareil n'est pas dans la base de données.

✅ **L'IP source est toujours enregistrée**, permettant de tracer toutes les tentatives d'accès.

✅ **Le bannissement automatique** protège contre les attaques par force brute.
