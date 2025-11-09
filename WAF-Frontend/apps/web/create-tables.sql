-- Create tables for WAF-AP Manager

-- Table: devices
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    mac_address VARCHAR(17) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    hostname VARCHAR(255),
    status VARCHAR(20) DEFAULT 'MONITORED',
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    failed_attempts INTEGER DEFAULT 0,
    ban_reason TEXT,
    banned_at TIMESTAMP,
    banned_until TIMESTAMP
);

-- Table: events
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    source_ip VARCHAR(45) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    severity VARCHAR(20),
    rule_name TEXT,
    username VARCHAR(255),
    port INTEGER,
    method VARCHAR(10),
    uri TEXT,
    payload TEXT,
    device_id INTEGER REFERENCES devices(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_source_ip ON events(source_ip);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_devices_mac_address ON devices(mac_address);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- Display tables
SELECT 'Tables created successfully' as status;
\dt
