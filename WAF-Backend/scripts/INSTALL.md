# Installation des scripts de contrôle réseau (Arch Linux)

## 1. Installer iptables
```bash
sudo pacman -S iptables
```

## 2. Copier les scripts
```bash
sudo mkdir -p /opt/wafap/scripts
sudo cp scripts/*.sh /opt/wafap/scripts/
sudo chmod +x /opt/wafap/scripts/*.sh
```

## 3. Configurer sudo sans mot de passe
```bash
sudo EDITOR=nano visudo
```

Ajouter cette ligne à la fin :
```
mahafeno ALL=(ALL) NOPASSWD: /opt/wafap/scripts/ban-device.sh, /opt/wafap/scripts/unban-device.sh, /opt/wafap/scripts/reload-firewall.sh
```

## 4. Configurer le hotspot (ton interface: wlp3s0)
```bash
# Lancer le script de configuration
chmod +x scripts/setup-hotspot.sh
sudo ./scripts/setup-hotspot.sh
```

Ou manuellement :
```bash
# Activer le forwarding IP
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee /etc/sysctl.d/30-ipforward.conf

# Configurer NAT (wlp3s0 = ton WiFi qui reçoit Internet et sert de hotspot)
sudo iptables -t nat -A POSTROUTING -o wlp3s0 -j MASQUERADE
sudo iptables -A FORWARD -i wlp3s0 -o wlp3s0 -j ACCEPT
sudo iptables -A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT

# Sauvegarder
sudo mkdir -p /etc/iptables
sudo iptables-save | sudo tee /etc/iptables/iptables.rules
```

## 5. Tester
```bash
# Tester le ban
sudo /opt/wafap/scripts/ban-device.sh aa:bb:cc:dd:ee:ff 192.168.1.100

# Vérifier les règles
sudo iptables -L -n -v

# Tester l'unban
sudo /opt/wafap/scripts/unban-device.sh aa:bb:cc:dd:ee:ff 192.168.1.100
```
