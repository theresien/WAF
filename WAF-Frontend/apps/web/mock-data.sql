-- Mock data for WAF-AP Manager Demo
-- Run this script to populate your database with realistic demo data

-- Insert HTTP Events (sites web visités par les appareils)
INSERT INTO events (type, source_ip, timestamp, severity, rule_name, method, uri, payload) VALUES
-- Activité normale
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '5 minutes', 'LOW', 'Normal browsing', 'GET', 'https://www.google.com/search?q=network+security', NULL),
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '10 minutes', 'LOW', 'Normal browsing', 'GET', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', NULL),
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '15 minutes', 'LOW', 'Normal browsing', 'GET', 'https://github.com/trending', NULL),
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '20 minutes', 'LOW', 'Normal browsing', 'GET', 'https://stackoverflow.com/questions/tagged/javascript', NULL),
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '25 minutes', 'LOW', 'Normal browsing', 'GET', 'https://www.reddit.com/r/programming', NULL),

-- Activité suspecte
('HTTP_ATTACK', '192.168.99.101', NOW() - INTERVAL '2 minutes', 'HIGH', 'SQL Injection Attempt', 'POST', '/login.php', 'username=admin'' OR ''1''=''1&password=test'),
('HTTP_ATTACK', '192.168.99.101', NOW() - INTERVAL '3 minutes', 'HIGH', 'SQL Injection Attempt', 'GET', '/products.php?id=1 UNION SELECT * FROM users--', NULL),
('HTTP_ATTACK', '192.168.99.102', NOW() - INTERVAL '8 minutes', 'CRITICAL', 'XSS Attack Detected', 'POST', '/comment.php', '<script>alert(document.cookie)</script>'),
('HTTP_ATTACK', '192.168.99.102', NOW() - INTERVAL '12 minutes', 'MEDIUM', 'Path Traversal Attempt', 'GET', '/download.php?file=../../etc/passwd', NULL),
('HTTP_ATTACK', '192.168.99.103', NOW() - INTERVAL '1 hour', 'HIGH', 'Command Injection', 'POST', '/ping.php', 'host=8.8.8.8; cat /etc/shadow'),

-- Sites populaires visités
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '30 minutes', 'LOW', 'Normal browsing', 'GET', 'https://www.facebook.com/', NULL),
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '35 minutes', 'LOW', 'Normal browsing', 'GET', 'https://twitter.com/home', NULL),
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '40 minutes', 'LOW', 'Normal browsing', 'GET', 'https://www.instagram.com/', NULL),
('HTTP_ATTACK', '192.168.99.97', NOW() - INTERVAL '45 minutes', 'LOW', 'Normal browsing', 'GET', 'https://www.netflix.com/browse', NULL),
('HTTP_ATTACK', '192.168.99.97', NOW() - INTERVAL '50 minutes', 'LOW', 'Normal browsing', 'GET', 'https://www.amazon.com/', NULL),
('HTTP_ATTACK', '192.168.99.98', NOW() - INTERVAL '55 minutes', 'LOW', 'Normal browsing', 'GET', 'https://www.wikipedia.org/', NULL),
('HTTP_ATTACK', '192.168.99.98', NOW() - INTERVAL '1 hour', 'LOW', 'Normal browsing', 'GET', 'https://www.linkedin.com/feed/', NULL),

-- Attaques diverses
('HTTP_ATTACK', '192.168.99.104', NOW() - INTERVAL '2 hours', 'CRITICAL', 'Remote Code Execution', 'POST', '/upload.php', '<?php system($_GET["cmd"]); ?>'),
('HTTP_ATTACK', '192.168.99.105', NOW() - INTERVAL '3 hours', 'HIGH', 'Directory Listing', 'GET', '/admin/', NULL),
('HTTP_ATTACK', '192.168.99.106', NOW() - INTERVAL '4 hours', 'MEDIUM', 'Suspicious User-Agent', 'GET', '/', 'sqlmap/1.0'),
('HTTP_ATTACK', '192.168.99.107', NOW() - INTERVAL '5 hours', 'HIGH', 'Brute Force Login', 'POST', '/wp-login.php', 'username=admin&password=123456'),
('HTTP_ATTACK', '192.168.99.107', NOW() - INTERVAL '5 hours', 'HIGH', 'Brute Force Login', 'POST', '/wp-login.php', 'username=admin&password=password'),
('HTTP_ATTACK', '192.168.99.107', NOW() - INTERVAL '5 hours', 'HIGH', 'Brute Force Login', 'POST', '/wp-login.php', 'username=admin&password=admin123'),

-- Plus d'activité normale
('HTTP_ATTACK', '192.168.99.99', NOW() - INTERVAL '6 hours', 'LOW', 'Normal browsing', 'GET', 'https://www.bbc.com/news', NULL),
('HTTP_ATTACK', '192.168.99.99', NOW() - INTERVAL '7 hours', 'LOW', 'Normal browsing', 'GET', 'https://www.cnn.com/', NULL),
('HTTP_ATTACK', '192.168.99.100', NOW() - INTERVAL '8 hours', 'LOW', 'Normal browsing', 'GET', 'https://www.twitch.tv/', NULL),
('HTTP_ATTACK', '192.168.99.100', NOW() - INTERVAL '9 hours', 'LOW', 'Normal browsing', 'GET', 'https://discord.com/channels/@me', NULL),
('HTTP_ATTACK', '192.168.99.96', NOW() - INTERVAL '10 hours', 'LOW', 'Normal browsing', 'GET', 'https://mail.google.com/', NULL);

-- Insert SSH Events (tentatives de connexion SSH)
INSERT INTO events (type, source_ip, timestamp, severity, rule_name, username, port, payload) VALUES
-- Attaques brute force SSH
('SSH_FAILED_AUTH', '192.168.99.105', NOW() - INTERVAL '1 minute', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.105', NOW() - INTERVAL '2 minutes', 'HIGH', 'SSH Brute Force', 'admin', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.105', NOW() - INTERVAL '3 minutes', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.105', NOW() - INTERVAL '4 minutes', 'HIGH', 'SSH Brute Force', 'ubuntu', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.105', NOW() - INTERVAL '5 minutes', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.105', NOW() - INTERVAL '6 minutes', 'HIGH', 'SSH Brute Force', 'test', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.105', NOW() - INTERVAL '7 minutes', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.105', NOW() - INTERVAL '8 minutes', 'HIGH', 'SSH Brute Force', 'administrator', 22, 'Failed password'),

-- Autre IP attaquante
('SSH_FAILED_AUTH', '192.168.99.108', NOW() - INTERVAL '10 minutes', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.108', NOW() - INTERVAL '11 minutes', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.108', NOW() - INTERVAL '12 minutes', 'HIGH', 'SSH Brute Force', 'pi', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.108', NOW() - INTERVAL '13 minutes', 'HIGH', 'SSH Brute Force', 'user', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.108', NOW() - INTERVAL '14 minutes', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),

-- Tentatives avec différents usernames
('SSH_FAILED_AUTH', '192.168.99.109', NOW() - INTERVAL '20 minutes', 'HIGH', 'SSH Brute Force', 'postgres', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.109', NOW() - INTERVAL '21 minutes', 'HIGH', 'SSH Brute Force', 'mysql', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.109', NOW() - INTERVAL '22 minutes', 'HIGH', 'SSH Brute Force', 'oracle', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.109', NOW() - INTERVAL '23 minutes', 'HIGH', 'SSH Brute Force', 'git', 22, 'Failed password'),

-- Attaques plus anciennes
('SSH_FAILED_AUTH', '192.168.99.110', NOW() - INTERVAL '1 hour', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.110', NOW() - INTERVAL '1 hour', 'HIGH', 'SSH Brute Force', 'admin', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.110', NOW() - INTERVAL '1 hour', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.111', NOW() - INTERVAL '2 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.111', NOW() - INTERVAL '2 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.111', NOW() - INTERVAL '2 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),

-- Tentatives avec usernames communs
('SSH_FAILED_AUTH', '192.168.99.112', NOW() - INTERVAL '3 hours', 'HIGH', 'SSH Brute Force', 'guest', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.112', NOW() - INTERVAL '3 hours', 'HIGH', 'SSH Brute Force', 'support', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.112', NOW() - INTERVAL '3 hours', 'HIGH', 'SSH Brute Force', 'webmaster', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.113', NOW() - INTERVAL '4 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.113', NOW() - INTERVAL '4 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.113', NOW() - INTERVAL '4 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),

-- Attaques massives
('SSH_FAILED_AUTH', '192.168.99.114', NOW() - INTERVAL '5 hours', 'CRITICAL', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.114', NOW() - INTERVAL '5 hours', 'CRITICAL', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.114', NOW() - INTERVAL '5 hours', 'CRITICAL', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.114', NOW() - INTERVAL '5 hours', 'CRITICAL', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.114', NOW() - INTERVAL '5 hours', 'CRITICAL', 'SSH Brute Force', 'root', 22, 'Failed password'),

-- Plus de tentatives variées
('SSH_FAILED_AUTH', '192.168.99.115', NOW() - INTERVAL '6 hours', 'HIGH', 'SSH Brute Force', 'deploy', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.115', NOW() - INTERVAL '6 hours', 'HIGH', 'SSH Brute Force', 'jenkins', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.116', NOW() - INTERVAL '7 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.116', NOW() - INTERVAL '7 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.117', NOW() - INTERVAL '8 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.117', NOW() - INTERVAL '8 hours', 'HIGH', 'SSH Brute Force', 'admin', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.118', NOW() - INTERVAL '9 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.118', NOW() - INTERVAL '9 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.119', NOW() - INTERVAL '10 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password'),
('SSH_FAILED_AUTH', '192.168.99.119', NOW() - INTERVAL '10 hours', 'HIGH', 'SSH Brute Force', 'root', 22, 'Failed password');

-- Afficher un résumé
SELECT 'HTTP Events inserted:' as summary, COUNT(*) as count FROM events WHERE type = 'HTTP_ATTACK'
UNION ALL
SELECT 'SSH Events inserted:' as summary, COUNT(*) as count FROM events WHERE type = 'SSH_FAILED_AUTH';
