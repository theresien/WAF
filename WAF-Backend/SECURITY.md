# Guide de Sécurité - WAF-AP Manager

## Configuration Initiale

### 1. Variables d'Environnement

**IMPORTANT** : Ne jamais commiter les fichiers `.env` ou `.env.docker` !

```bash
# Copier les fichiers d'exemple
cp .env.example .env
cp .env.docker.example .env.docker

# Éditer et configurer avec des valeurs sécurisées
nano .env
```

### 2. Mots de Passe Sécurisés

Générer des mots de passe forts :

```bash
# Pour DB_PASSWORD
openssl rand -base64 32

# Pour ADMIN_PASSWORD
openssl rand -base64 24
```

### 3. Console H2

**Production** : Toujours désactiver la console H2 en production
```yaml
H2_CONSOLE_ENABLED=false
```

**Développement** : Activer uniquement en local
```yaml
H2_CONSOLE_ENABLED=true
```

## Permissions Scripts

Les scripts iptables nécessitent des permissions sudo :

```bash
# Vérifier la configuration sudoers
sudo cat /etc/sudoers.d/wafap

# Devrait contenir :
# username ALL=(ALL) NOPASSWD: /opt/wafap/scripts/*.sh
```

## Bonnes Pratiques

1. **Rotation des mots de passe** : Changer régulièrement les credentials
2. **Principe du moindre privilège** : Limiter les permissions aux scripts nécessaires
3. **Logs** : Surveiller les logs pour détecter les activités suspectes
4. **Firewall** : Configurer iptables pour limiter l'accès réseau
5. **HTTPS** : Utiliser un reverse proxy (nginx) avec SSL en production

## Audit de Sécurité

Vérifier régulièrement :
- Permissions des fichiers de configuration
- Logs d'authentification SSH
- Événements de bannissement
- Tentatives d'accès non autorisées
