-- dashboard/backend/src/database/seed.sql
-- Dados iniciais para testes locais do dashboard

INSERT INTO equipamentos (
    nome,
    codigo,
    tipo,
    marca,
    modelo,
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
    'Bomba de Infusão',
    'Mindray',
    'BeneFusion VP5',
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
    'Monitor Multiparamétrico',
    'Philips',
    'IntelliVue MX550',
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
    'Ventilador Pulmonar',
    'Dräger',
    'Evita V300',
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
    'telemetria_minima',
    'funcional',
    0,
    'online',
    NULL,
    NULL,
    NULL,
    '{"c":"BOMBA-INFUSAO-402","s":0}'
),
(
    2,
    'BTN-ESP32-101',
    'telemetria_minima',
    'manutencao_curto_prazo',
    1,
    'online',
    NULL,
    NULL,
    NULL,
    '{"c":"MONITOR-101","s":1}'
),
(
    3,
    'BTN-ESP32-205',
    'telemetria_minima',
    'indisponivel_prioridade',
    2,
    'offline',
    NULL,
    NULL,
    NULL,
    '{"c":"VENTILADOR-205","s":2}'
);
