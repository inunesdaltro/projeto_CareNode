-- dashboard/backend/src/database/seed.sql
-- Dados iniciais para testes locais do dashboard

INSERT INTO equipamentos (
    nome,
    codigo,
    patrimonio,
    setor,
    descricao,
    status_atual,
    codigo_estado_atual,
    conectividade
) VALUES
(
    'Bomba de Infusão 402',
    'BOMBA-INFUSAO-402',
    'PAT-000402',
    'UTI Adulto',
    'Bomba de infusão vinculada ao botão ESP32 da UTI Adulto',
    'funcional',
    0,
    'online'
),
(
    'Monitor Multiparamétrico 101',
    'MONITOR-101',
    'PAT-000101',
    'Sala Vermelha',
    'Monitor multiparamétrico para testes do dashboard',
    'manutencao_curto_prazo',
    1,
    'online'
),
(
    'Ventilador Pulmonar 205',
    'VENTILADOR-205',
    'PAT-000205',
    'UTI Neonatal',
    'Ventilador pulmonar cadastrado para simulação de indisponibilidade',
    'indisponivel_prioridade',
    2,
    'offline'
);

INSERT INTO dispositivos (
    device_id,
    equipamento_id,
    descricao,
    ativo
) VALUES
(
    'BTN-ESP32-402',
    1,
    'Botão IoT da bomba de infusão 402',
    1
),
(
    'BTN-ESP32-101',
    2,
    'Botão IoT do monitor multiparamétrico 101',
    1
),
(
    'BTN-ESP32-205',
    3,
    'Botão IoT do ventilador pulmonar 205',
    1
);

INSERT INTO eventos (
    equipamento_id,
    device_id,
    evento,
    status,
    codigo_estado,
    conectividade,
    ip,
    rssi,
    uptime_ms,
    payload_json
) VALUES
(
    1,
    'BTN-ESP32-402',
    'status_equipamento',
    'funcional',
    0,
    'online',
    '192.168.0.40',
    -52,
    120340,
    '{"device_id":"BTN-ESP32-402","evento":"status_equipamento","status":"funcional","codigo_estado":0,"conectividade":"online","ip":"192.168.0.40","rssi":-52,"uptime_ms":120340}'
),
(
    2,
    'BTN-ESP32-101',
    'status_equipamento',
    'manutencao_curto_prazo',
    1,
    'online',
    '192.168.0.41',
    -60,
    98420,
    '{"device_id":"BTN-ESP32-101","evento":"status_equipamento","status":"manutencao_curto_prazo","codigo_estado":1,"conectividade":"online","ip":"192.168.0.41","rssi":-60,"uptime_ms":98420}'
),
(
    3,
    'BTN-ESP32-205',
    'status_equipamento',
    'indisponivel_prioridade',
    2,
    'offline',
    '192.168.0.42',
    -70,
    45000,
    '{"device_id":"BTN-ESP32-205","evento":"status_equipamento","status":"indisponivel_prioridade","codigo_estado":2,"conectividade":"offline","ip":"192.168.0.42","rssi":-70,"uptime_ms":45000}'
);
