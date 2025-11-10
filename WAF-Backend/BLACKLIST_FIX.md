# Correction : Affichage des URL blacklistées avec les IP des appareils

## Problème identifié

Les URL blacklistées ne s'affichaient pas avec les IP des appareils qui y ont navigué pour les raisons suivantes :

1. **Événements non créés** : Le `DnsMonitorService` ne créait un événement que si l'appareil était trouvé dans la base de données par son IP. Si l'appareil n'était pas trouvé, aucun événement n'était enregistré.

2. **Type d'événement incorrect** : Les événements utilisaient `HTTP_ATTACK` au lieu de `HTTPS_DANGEROUS_SITE`, ce qui rendait difficile le filtrage des accès aux domaines blacklistés.

3. **Manque de logs** : Peu de logs étaient générés pour le débogage, rendant difficile l'identification du problème.

## Solution implémentée

### 1. Modification du `DnsMonitorService.java`

**Changements apportés** :
- Les événements sont maintenant créés **même si l'appareil n'est pas trouvé** dans la base de données
- L'IP source est toujours enregistrée dans l'événement (champ `sourceIp`)
- Le type d'événement est changé de `HTTP_ATTACK` à `HTTPS_DANGEROUS_SITE`
- Ajout de logs détaillés pour faciliter le débogage

**Code modifié** :
```java
// Avant : événement créé seulement si l'appareil est trouvé
deviceRepository.findByIpAddress(sourceIp).ifPresent(device -> {
    Event event = new Event(device, EventType.HTTP_ATTACK);
    // ...
});

// Après : événement toujours créé, avec ou sans appareil
var deviceOpt = deviceRepository.findByIpAddress(sourceIp);
Device device = deviceOpt.orElse(null);

Event event = new Event(device, EventType.HTTPS_DANGEROUS_SITE);
event.setSourceIp(sourceIp); // IP toujours enregistrée
// ...
eventRepository.save(event);
```

### 2. Ajout d'un endpoint API dédié

Un nouvel endpoint a été ajouté dans `EventController.java` :

```
GET /events/blacklisted-domains
```

Cet endpoint retourne tous les événements de type `HTTPS_DANGEROUS_SITE` avec :
- L'IP source de l'appareil
- Le domaine blacklisté accédé
- L'appareil associé (si trouvé)
- La sévérité de la violation
- L'horodatage

### 3. Structure de l'événement

Chaque événement contient maintenant :
- `sourceIp` : L'IP de l'appareil qui a tenté d'accéder au domaine
- `requestUri` : Le domaine blacklisté
- `device` : L'appareil associé (peut être null si non trouvé)
- `deviceIp` : L'IP de l'appareil (via le DTO)
- `severity` : Niveau de sévérité du domaine blacklisté
- `messageJson` : Détails supplémentaires en JSON

## Test de la solution

### 1. Compiler le projet
```bash
mvn clean compile
```

### 2. Démarrer l'application
```bash
mvn spring-boot:run
```

### 3. Tester avec le script fourni
```bash
./test-blacklist.sh
```

Ce script ajoute une entrée de test dans le log DNS pour simuler un accès à un domaine blacklisté.

### 4. Vérifier les événements

**Via l'API** :
```bash
# Tous les événements de domaines blacklistés
curl http://localhost:8080/events/blacklisted-domains

# Événements par type
curl http://localhost:8080/events/type/HTTPS_DANGEROUS_SITE
```

**Via les logs** :
```bash
tail -f logs/wafap.log | grep -i "blacklist"
```

## Résultat attendu

Les événements affichent maintenant :
```json
{
  "id": 123,
  "deviceId": 45,
  "deviceMac": "aa:bb:cc:dd:ee:ff",
  "deviceIp": "192.168.50.32",
  "timestamp": "2025-11-09T17:30:00",
  "eventType": "HTTPS_DANGEROUS_SITE",
  "sourceIp": "192.168.50.32",
  "requestUri": "french-stream.one",
  "ruleId": "BLACKLIST_DOMAIN",
  "severity": 3,
  "messageJson": "{\"domain\":\"french-stream.one\",\"blocked\":true,\"attack_type\":\"Blacklisted Domain Access\"}"
}
```

**Note** : Si l'appareil n'est pas trouvé dans la base de données, `deviceId`, `deviceMac` et `deviceIp` seront `null`, mais `sourceIp` contiendra toujours l'IP de l'appareil.

## Améliorations futures possibles

1. **Résolution automatique des appareils** : Créer automatiquement un appareil "inconnu" si l'IP n'est pas trouvée
2. **Agrégation des événements** : Grouper les accès répétés au même domaine par le même appareil
3. **Notifications** : Envoyer des alertes en temps réel lors d'accès à des domaines de haute sévérité
4. **Dashboard** : Créer une vue dédiée dans le frontend pour visualiser les accès aux domaines blacklistés
