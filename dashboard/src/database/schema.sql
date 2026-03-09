-- dashboard/backend/src/database/schema.sql

CREATE TABLE IF NOT EXISTS equipamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    patrimonio TEXT,
    setor TEXT,
    descricao TEXT,
    status_atual TEXT DEFAULT 'desconhecido',
    codigo_estado_atual INTEGER DEFAULT NULL,
    conectividade TEXT DEFAULT 'offline',
    ultimo_evento_em TEXT DEFAULT NULL,
    ultimo_heartbeat_em TEXT DEFAULT NULL,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dispositivos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL UNIQUE,
    equipamento_id INTEGER NOT NULL,
    descricao TEXT,
    ativo INTEGER DEFAULT 1,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id)
);

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
