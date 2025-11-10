# Correction : Mise à jour de la sévérité dans les événements HTTP

## Problème identifié

Lorsque vous modifiez la sévérité d'un domaine blacklisté, les événements HTTP existants conservaient l'ancienne sévérité. Seuls les nouveaux événements utilisaient la nouvelle sévérité.

### Exemple du problème
1. Domaine `french-stream.one` avec sévérité **3**
2. Un appareil accède au domaine → événement créé avec sévérité **3**
3. Vous changez la sévérité à **5**
4. ❌ L'événement existant garde la sévérité **3** (problème)
5. ✅ Les nouveaux événements auront la sévérité **5**

## Solution implémentée

Maintenant, quand vous modifiez la sévérité d'un domaine, **tous les événements liés à ce domaine sont automatiquement mis à jour** avec la nouvelle sévérité.

### Modifications apportées

#### 1. EventRepository.java
Ajout d'une méthode pour trouver tous les événements liés à un domaine :
```java
List<Event> findByRequestUriContaining(String domain);
```

#### 2. BlacklistController.java
Mise à jour de l'endpoint PUT pour modifier tous les événements :
```java
@PutMapping("/domains/{domain}")
public ResponseEntity<?> updateDomainSeverity(...) {
    // 1. Mettre à jour le domaine dans la blacklist
    blacklisted.setSeverity(request.severity());
    blacklistRepo.save(blacklisted);
    
    // 2. Mettre à jour tous les événements liés
    var events = eventRepository.findByRequestUriContaining(domain);
    for (var event : events) {
        event.setSeverity(request.severity());
        eventRepository.save(event);
    }
    
    // 3. Retourner le nombre d'événements mis à jour
    return ResponseEntity.ok(Map.of(
        "message", "Domain severity updated",
        "domain", blacklisted,
        "eventsUpdated", updatedCount
    ));
}
```

## Résultat

### Avant la correction
```bash
# Modifier la sévérité
curl -X PUT -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/french-stream.one

# Réponse
{
  "message": "Domain severity updated",
  "domain": {...}
}

# Les événements existants gardent l'ancienne sévérité ❌
```

### Après la correction
```bash
# Modifier la sévérité
curl -X PUT -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/french-stream.one

# Réponse
{
  "message": "Domain severity updated",
  "domain": {...},
  "eventsUpdated": 12  ← Nombre d'événements mis à jour
}

# Tous les événements ont la nouvelle sévérité ✅
```

## Test de la correction

### Script de test automatique
```bash
./test-severity-update-events.sh
```

Ce script :
1. ✅ Vérifie les événements existants et leur sévérité
2. ✅ Change la sévérité du domaine
3. ✅ Vérifie que tous les événements ont été mis à jour
4. ✅ Affiche le nombre d'événements modifiés

### Test manuel

#### 1. Créer un événement de test
```bash
./test-blacklist.sh
```

#### 2. Vérifier les événements avant modification
```bash
curl http://localhost:8080/events/blacklisted-domains | \
  jq '.content[] | {id, domain: .requestUri, severity}'
```

Exemple de sortie :
```json
{
  "id": 123,
  "domain": "french-stream.one",
  "severity": 3
}
```

#### 3. Modifier la sévérité
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/french-stream.one
```

Réponse :
```json
{
  "message": "Domain severity updated",
  "domain": {
    "id": 1,
    "domain": "french-stream.one",
    "severity": 5,
    "addedAt": "2025-11-09T15:30:00"
  },
  "eventsUpdated": 1
}
```

#### 4. Vérifier que l'événement a été mis à jour
```bash
curl http://localhost:8080/events/blacklisted-domains | \
  jq '.content[] | {id, domain: .requestUri, severity}'
```

Résultat :
```json
{
  "id": 123,
  "domain": "french-stream.one",
  "severity": 5  ← Mis à jour !
}
```

## Comportement détaillé

### Mise à jour en cascade
Quand vous modifiez la sévérité d'un domaine :

1. **Le domaine est mis à jour** dans la table `blacklisted_domains`
2. **Tous les événements sont recherchés** où `request_uri` contient le domaine
3. **Chaque événement est mis à jour** avec la nouvelle sévérité
4. **Le nombre d'événements modifiés** est retourné dans la réponse

### Recherche des événements
La recherche utilise `findByRequestUriContaining(domain)` qui trouve tous les événements où :
- `request_uri` contient le domaine (ex: "french-stream.one")
- Cela inclut les sous-domaines (ex: "www.french-stream.one")

### Performance
- ✅ Efficace pour un nombre modéré d'événements (< 1000)
- ✅ Transaction atomique (tout ou rien)
- ⚠️ Pour de très grands volumes, envisager une mise à jour en batch

## Logs

Les logs affichent maintenant :
```
INFO  - Updated severity for domain french-stream.one from 3 to 5 (12 events updated)
```

## Cas d'usage

### Scénario 1 : Correction d'une erreur
Vous avez marqué un domaine comme critique (5) par erreur :
```bash
# Réduire la sévérité
curl -X PUT -H "Content-Type: application/json" \
  -d '{"severity": 2}' \
  http://localhost:8080/blacklist/domains/false-positive.com

# Tous les événements passent de sévérité 5 à 2
```

### Scénario 2 : Escalade de menace
Un domaine devient plus dangereux :
```bash
# Augmenter la sévérité
curl -X PUT -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/new-threat.com

# Tous les événements passent à sévérité 5
```

### Scénario 3 : Analyse historique
Vous voulez voir l'impact d'un domaine avec une sévérité cohérente :
```bash
# Uniformiser la sévérité
curl -X PUT -H "Content-Type: application/json" \
  -d '{"severity": 4}' \
  http://localhost:8080/blacklist/domains/suspicious-site.com

# Tous les événements historiques ont maintenant la même sévérité
```

## Fichiers modifiés

1. `src/main/java/com/wafap/repository/EventRepository.java`
   - Ajout de `findByRequestUriContaining(String domain)`

2. `src/main/java/com/wafap/controller/BlacklistController.java`
   - Mise à jour de `updateDomainSeverity()` pour modifier les événements
   - Ajout du compteur `eventsUpdated` dans la réponse

3. `test-severity-update-events.sh` (nouveau)
   - Script de test pour vérifier la mise à jour des événements

## Compilation et test

```bash
# 1. Compiler
mvn clean compile

# 2. Démarrer l'application
mvn spring-boot:run

# 3. Tester
./test-severity-update-events.sh
```

## Vérification

Pour vérifier que la correction fonctionne :

```bash
# 1. Créer un événement
./test-blacklist.sh

# 2. Vérifier la sévérité actuelle
curl http://localhost:8080/events/blacklisted-domains | \
  jq '.content[0] | {id, severity}'

# 3. Modifier la sévérité
curl -X PUT -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/french-stream.one

# 4. Vérifier que l'événement a changé
curl http://localhost:8080/events/blacklisted-domains | \
  jq '.content[0] | {id, severity}'
```

## Conclusion

✅ **Problème résolu** : Les événements HTTP affichent maintenant toujours la sévérité actuelle du domaine blacklisté, même si elle a été modifiée après la création de l'événement.

✅ **Cohérence des données** : Tous les événements liés à un domaine ont la même sévérité.

✅ **Traçabilité** : Le nombre d'événements mis à jour est retourné dans la réponse API.
