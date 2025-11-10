# Fonctionnalité : Modification de la sévérité des URL blacklistées

## Vue d'ensemble

Cette fonctionnalité permet de modifier la sévérité d'un domaine déjà présent dans la blacklist sans avoir à le supprimer et le rajouter.

## Endpoint API

### Modifier la sévérité d'un domaine

**Endpoint** : `PUT /blacklist/domains/{domain}`

**Paramètres** :
- `{domain}` : Le nom de domaine à modifier (dans l'URL)

**Body (JSON)** :
```json
{
  "severity": 5
}
```

**Validation** :
- `severity` : Obligatoire, doit être un entier entre 1 et 5

**Réponse en cas de succès (200 OK)** :
```json
{
  "message": "Domain severity updated",
  "domain": {
    "id": 1,
    "domain": "french-stream.one",
    "severity": 5,
    "addedAt": "2025-11-09T15:30:00"
  }
}
```

**Réponse en cas d'erreur (404 Not Found)** :
```json
{
  "error": "Domain not found"
}
```

**Réponse en cas de validation échouée (400 Bad Request)** :
```json
{
  "severity": "Severity must be between 1 and 5"
}
```

## Niveaux de sévérité

| Niveau | Description | Action automatique |
|--------|-------------|-------------------|
| 1 | Faible | Blocage DNS uniquement |
| 2 | Modéré | Blocage DNS + log |
| 3 | Moyen | Blocage DNS + log + alerte |
| 4 | Élevé | Blocage DNS + log + alerte + bannissement temporaire |
| 5 | Critique | Blocage DNS + log + alerte + bannissement permanent |

## Exemples d'utilisation

### Avec curl

```bash
# Modifier la sévérité de french-stream.one à 5 (critique)
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/french-stream.one

# Modifier la sévérité de moviebox.ph à 2 (modéré)
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 2}' \
  http://localhost:8080/blacklist/domains/moviebox.ph
```

### Avec JavaScript (fetch)

```javascript
// Modifier la sévérité
async function updateDomainSeverity(domain, severity) {
  const response = await fetch(`http://localhost:8080/blacklist/domains/${domain}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ severity })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update severity');
  }
  
  return await response.json();
}

// Utilisation
updateDomainSeverity('french-stream.one', 5)
  .then(data => console.log('Updated:', data))
  .catch(error => console.error('Error:', error));
```

### Avec Python (requests)

```python
import requests

def update_domain_severity(domain, severity):
    url = f"http://localhost:8080/blacklist/domains/{domain}"
    payload = {"severity": severity}
    
    response = requests.put(url, json=payload)
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to update: {response.text}")

# Utilisation
result = update_domain_severity('french-stream.one', 5)
print(f"Updated: {result}")
```

## Scripts de test fournis

### 1. Test interactif
```bash
./test-update-severity.sh
```
Ce script vous guide à travers le processus de modification de sévérité de manière interactive.

### 2. Test automatique
```bash
./test-update-severity-auto.sh
```
Ce script teste automatiquement la modification de sévérité sur plusieurs domaines.

## Workflow complet

### 1. Lister les domaines blacklistés
```bash
curl http://localhost:8080/blacklist/domains
```

### 2. Modifier la sévérité d'un domaine
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 4}' \
  http://localhost:8080/blacklist/domains/example.com
```

### 3. Vérifier la modification
```bash
curl http://localhost:8080/blacklist/domains | jq '.[] | select(.domain == "example.com")'
```

## Impact de la modification

Lorsque vous modifiez la sévérité d'un domaine :

1. ✅ La modification est **immédiate** dans la base de données
2. ✅ Les **nouveaux accès** au domaine utiliseront la nouvelle sévérité
3. ✅ Un **log** est créé pour tracer la modification
4. ℹ️ Le fichier dnsmasq **n'est pas mis à jour** (le blocage reste actif)
5. ℹ️ Les **événements passés** conservent leur ancienne sévérité

## Cas d'usage

### Scénario 1 : Réduction de sévérité
Un domaine était marqué comme critique (5) mais s'avère être un faux positif :
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 2}' \
  http://localhost:8080/blacklist/domains/false-positive.com
```

### Scénario 2 : Augmentation de sévérité
Un domaine modéré (2) devient une menace critique :
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/new-threat.com
```

### Scénario 3 : Ajustement progressif
Tester différents niveaux de sévérité pour trouver le bon équilibre :
```bash
# Commencer modéré
curl -X PUT -H "Content-Type: application/json" \
  -d '{"severity": 2}' \
  http://localhost:8080/blacklist/domains/test.com

# Observer le comportement, puis augmenter si nécessaire
curl -X PUT -H "Content-Type: application/json" \
  -d '{"severity": 4}' \
  http://localhost:8080/blacklist/domains/test.com
```

## Sécurité

- ✅ Validation stricte de la sévérité (1-5)
- ✅ Validation du format du domaine
- ✅ Logs de toutes les modifications
- ✅ Pas d'injection possible (utilisation de JPA)

## Fichiers modifiés

1. `src/main/java/com/wafap/controller/BlacklistController.java` - Ajout de l'endpoint PUT
2. `src/main/java/com/wafap/dto/UpdateSeverityRequest.java` - Nouveau DTO pour la validation

## Tests

Pour tester la fonctionnalité :

```bash
# 1. Compiler
mvn clean compile

# 2. Démarrer l'application
mvn spring-boot:run

# 3. Dans un autre terminal, tester
./test-update-severity-auto.sh
```
