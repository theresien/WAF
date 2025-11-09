-- Insert mock devices
INSERT INTO devices (mac_address, ip_address, hostname, status, first_seen, last_seen, failed_attempts) VALUES
-- Connected devices (recently seen)
('fa:79:f2:fe:4d:fa', '192.168.99.96', 'MacBook-Pro', 'ALLOWED', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 seconds', 0),
('a1:b2:c3:d4:e5:f6', '192.168.99.97', 'iPhone-13', 'ALLOWED', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '1 minute', 0),
('11:22:33:44:55:66', '192.168.99.98', 'Samsung-Galaxy', 'MONITORED', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 minutes', 0),
('aa:bb:cc:dd:ee:ff', '192.168.99.99', 'Dell-Laptop', 'ALLOWED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 minutes', 0),
('12:34:56:78:90:ab', '192.168.99.100', 'iPad-Air', 'MONITORED', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '4 minutes', 0),

-- Banned devices
('de:ad:be:ef:ca:fe', '192.168.99.101', 'Suspicious-Device', 'BANNED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 hour', 15),
('ba:dd:ca:fe:ba:be', '192.168.99.102', 'Attacker-PC', 'BANNED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '30 minutes', 25),

-- Offline devices
('ff:ee:dd:cc:bb:aa', '192.168.99.103', 'HP-Printer', 'ALLOWED', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 hours', 0),
('98:76:54:32:10:ab', '192.168.99.104', 'Smart-TV', 'MONITORED', NOW() - INTERVAL '1 day', NOW() - INTERVAL '8 hours', 0),
('ab:cd:ef:12:34:56', '192.168.99.105', 'Raspberry-Pi', 'MONITORED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day', 3),

-- More connected devices
('11:11:11:11:11:11', '192.168.99.106', 'Desktop-PC', 'ALLOWED', NOW() - INTERVAL '10 hours', NOW() - INTERVAL '45 seconds', 0),
('22:22:22:22:22:22', '192.168.99.107', 'Xiaomi-Phone', 'MONITORED', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 minute', 0),
('33:33:33:33:33:33', '192.168.99.108', 'Linux-Server', 'ALLOWED', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 minutes', 0),
('44:44:44:44:44:44', '192.168.99.109', 'Nintendo-Switch', 'MONITORED', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 minutes', 0),
('55:55:55:55:55:55', '192.168.99.110', 'Echo-Dot', 'ALLOWED', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 minute', 0);

SELECT 'Devices inserted:' as summary, COUNT(*) as count FROM devices;
