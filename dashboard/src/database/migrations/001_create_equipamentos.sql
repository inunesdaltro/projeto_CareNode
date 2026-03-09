-- dashboard/backend/src/database/migrations/001_create_equipamentos.sql

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
