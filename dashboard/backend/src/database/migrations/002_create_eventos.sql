-- dashboard/backend/src/database/migrations/002_create_eventos.sql

CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipamento_id INTEGER,
    device_id TEXT,
    evento TEXT NOT NULL,
    status TEXT,
    codigo_estado INTEGER,
    conectividade TEXT,
    ip TEXT,
    rssi INTEGER,
    uptime_ms INTEGER,
    payload_json TEXT NOT NULL,
    recebido_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id)
);
