# Exemples d'utilisation de l'API

## Gestion des domaines blacklistés

### 1. Lister tous les domaines blacklistés
```bash
curl http://localhost:8080/blacklist/domains
```

**Réponse** :
```json
[
  {
    "id": 1,
    "domain": "french-stream.one",
    "severity": 3,
    "addedAt": "2025-11-09T15:30:00"
  },
  {
    "id": 2,
    "domain": "moviebox.ph",
    "severity": 3,
    "addedAt": "2025-11-09T15:31:00"
  }
]
```

### 2. Ajouter un domaine à la blacklist
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"domain": "malicious-site.com", "severity": 5}' \
  http://localhost:8080/blacklist/domains
```

**Réponse** :
```json
{
  "message": "Domain blacklisted",
  "domain": {
    "id": 3,
    "domain": "malicious-site.com",
    "severity": 5,
    "addedAt": "2025-11-09T17:45:00"
  }
}
```

### 3. Modifier la sévérité d'un domaine ⭐ NOUVEAU
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 4}' \
  http://localhost:8080/blacklist/domains/french-stream.one
```

**Réponse** :
```json
{
  "message": "Domain severity updated",
  "domain": {
    "id": 1,
    "domain": "french-stream.one",
    "severity": 4,
    "addedAt": "2025-11-09T15:30:00"
  }
}
```

### 4. Supprimer un domaine de la blacklist
```bash
curl -X DELETE http://localhost:8080/blacklist/domains/malicious-site.com
```

**Réponse** :
```json
{
  "message": "Domain removed from blacklist"
}
```

---

## Consultation des événements

### 1. Tous les événements
```bash
curl "http://localhost:8080/events?size=20&page=0"
```

### 2. Événements de domaines blacklistés ⭐ NOUVEAU
```bash
curl http://localhost:8080/events/blacklisted-domains
```

**Réponse** :
```json
{
  "content": [
    {
      "id": 456,
      "deviceId": 12,
      "deviceMac": "aa:bb:cc:dd:ee:ff",
      "deviceIp": "192.168.50.32",
      "timestamp": "2025-11-09T17:30:00",
      "eventType": "HTTPS_DANGEROUS_SITE",
      "sourceIp": "192.168.50.32",
      "requestUri": "french-stream.one",
      "ruleId": "BLACKLIST_DOMAIN",
      "severity": 4,
      "messageJson": "{\"domain\":\"french-stream.one\",\"blocked\":true,\"attack_type\":\"Blacklisted Domain Access\"}"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 50,
  "number": 0
}
```

### 3. Événements par type
```bash
curl http://localhost:8080/events/type/HTTPS_DANGEROUS_SITE
```

### 4. Événements d'un appareil spécifique
```bash
curl http://localhost:8080/events/device/12
```

---

## Gestion des appareils

### 1. Lister tous les appareils
```bash
curl http://localhost:8080/devices
```

### 2. Détails d'un appareil
```bash
curl http://localhost:8080/devices/12
```

### 3. Bannir un appareil
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"reason": "Accessed dangerous site", "duration": 3600}' \
  http://localhost:8080/devices/12/ban
```

### 4. Débannir un appareil
```bash
curl -X POST http://localhost:8080/devices/12/unban
```

---

## Exemples avec différents langages

### JavaScript (fetch)
```javascript
// Modifier la sévérité d'un domaine
async function updateSeverity(domain, severity) {
  const response = await fetch(`http://localhost:8080/blacklist/domains/${domain}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ severity })
  });
  return await response.json();
}

// Récupérer les événements de domaines blacklistés
async function getBlacklistedEvents() {
  const response = await fetch('http://localhost:8080/events/blacklisted-domains');
  return await response.json();
}

// Utilisation
updateSeverity('french-stream.one', 5)
  .then(data => console.log('Updated:', data));

getBlacklistedEvents()
  .then(data => console.log('Events:', data.content));
```

### Python (requests)
```python
import requests

# Modifier la sévérité
def update_severity(domain, severity):
    url = f"http://localhost:8080/blacklist/domains/{domain}"
    response = requests.put(url, json={"severity": severity})
    return response.json()

# Récupérer les événements
def get_blacklisted_events():
    url = "http://localhost:8080/events/blacklisted-domains"
    response = requests.get(url)
    return response.json()

# Utilisation
result = update_severity('french-stream.one', 5)
print(f"Updated: {result}")

events = get_blacklisted_events()
for event in events['content']:
    print(f"IP: {event['sourceIp']} accessed {event['requestUri']}")
```

### Java (Spring RestTemplate)
```java
RestTemplate restTemplate = new RestTemplate();

// Modifier la sévérité
UpdateSeverityRequest request = new UpdateSeverityRequest(5);
String url = "http://localhost:8080/blacklist/domains/french-stream.one";
ResponseEntity<Map> response = restTemplate.exchange(
    url, 
    HttpMethod.PUT, 
    new HttpEntity<>(request), 
    Map.class
);

// Récupérer les événements
String eventsUrl = "http://localhost:8080/events/blacklisted-domains";
ResponseEntity<Page<EventDTO>> events = restTemplate.exchange(
    eventsUrl,
    HttpMethod.GET,
    null,
    new ParameterizedTypeReference<Page<EventDTO>>() {}
);
```

---

## Filtrage et pagination

### Pagination des événements
```bash
# Page 0, 10 éléments
curl "http://localhost:8080/events/blacklisted-domains?size=10&page=0"

# Page 1, 20 éléments
curl "http://localhost:8080/events/blacklisted-domains?size=20&page=1"

# Tri par timestamp décroissant (par défaut)
curl "http://localhost:8080/events/blacklisted-domains?sort=timestamp,desc"
```

### Filtrage par date (à implémenter si nécessaire)
```bash
# Événements depuis une date
curl "http://localhost:8080/events?since=2025-11-09T00:00:00"
```

---

## Gestion des erreurs

### Domaine non trouvé (404)
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 5}' \
  http://localhost:8080/blacklist/domains/non-existent.com
```

**Réponse** :
```json
{
  "timestamp": "2025-11-09T17:45:00",
  "status": 404,
  "error": "Not Found"
}
```

### Validation échouée (400)
```bash
curl -X PUT \
  -H "Content-Type: application/json" \
  -d '{"severity": 10}' \
  http://localhost:8080/blacklist/domains/french-stream.one
```

**Réponse** :
```json
{
  "timestamp": "2025-11-09T17:45:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Severity must be between 1 and 5"
}
```

---

## Scripts shell pratiques

### Surveiller les nouveaux événements
```bash
#!/bin/bash
while true; do
  curl -s http://localhost:8080/events/blacklisted-domains?size=5 | \
    jq -r '.content[] | "\(.timestamp) - \(.sourceIp) accessed \(.requestUri)"'
  sleep 10
done
```

### Mettre à jour plusieurs domaines
```bash
#!/bin/bash
DOMAINS=("french-stream.one" "moviebox.ph")
SEVERITY=5

for domain in "${DOMAINS[@]}"; do
  curl -X PUT \
    -H "Content-Type: application/json" \
    -d "{\"severity\": $SEVERITY}" \
    http://localhost:8080/blacklist/domains/$domain
  echo ""
done
```

### Exporter les événements en CSV
```bash
curl -s http://localhost:8080/events/blacklisted-domains | \
  jq -r '.content[] | [.timestamp, .sourceIp, .requestUri, .severity] | @csv' > events.csv
```
