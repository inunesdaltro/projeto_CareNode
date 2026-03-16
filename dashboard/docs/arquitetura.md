# Arquitetura do Sistema — Dashboard de Engenharia Clínica com IoT

## 1. Visão geral
Este sistema foi projetado para apoiar o monitoramento do parque tecnológico hospitalar por meio de dispositivos IoT baseados em ESP32, associados individualmente a equipamentos médico-hospitalares.

A proposta consiste em permitir que cada equipamento tenha um dispositivo físico simples, com botão único e LEDs de sinalização, capaz de registrar rapidamente seu estado operacional e enviar essas informações para um backend central. Esse backend processa os eventos recebidos, atualiza o status do equipamento correspondente e disponibiliza os dados para um dashboard web, permitindo acompanhamento contínuo pela equipe de Engenharia Clínica.

---

## 2. Objetivo da arquitetura
A arquitetura foi definida para atender aos seguintes objetivos:

- permitir cadastro estruturado dos equipamentos do parque tecnológico
- associar cada dispositivo IoT a um equipamento específico
- receber eventos enviados pelo ESP32 em formato JSON
- armazenar histórico completo de eventos
- manter o status atual de cada equipamento
- monitorar a conectividade de cada dispositivo
- disponibilizar visualização centralizada em dashboard web
- permitir futura expansão para autenticação, relatórios, notificações e integração institucional

---

## 3. Componentes principais
A arquitetura do sistema é composta por três blocos principais:

### 3.1 Dispositivo IoT (ESP32)
O dispositivo físico atua na ponta do sistema, junto ao equipamento hospitalar.

#### Responsabilidades
- permitir a seleção de estados operacionais por meio de botão único
- sinalizar visualmente o estado selecionado por LEDs
- confirmar o envio por clique longo
- enviar eventos em formato JSON via rede Wi-Fi
- enviar heartbeats periódicos para monitoramento de conectividade
- armazenar localmente o último estado confirmado em caso de reinicialização
- registrar eventos pendentes quando houver perda temporária de conexão

#### Exemplos de eventos enviados
- `status_equipamento`
- `heartbeat`
- `conectividade`

---

### 3.2 Backend
O backend é o núcleo lógico do sistema.

Ele recebe os eventos dos dispositivos, realiza o vínculo com os equipamentos cadastrados, registra os dados no banco e disponibiliza informações consolidadas para o frontend.

#### Responsabilidades
- expor API REST para cadastro e consulta
- receber eventos IoT
- validar payloads JSON
- localizar equipamento vinculado ao `device_id`
- armazenar histórico de eventos
- atualizar status atual do equipamento
- atualizar heartbeat e conectividade
- calcular equipamentos online/offline com base em timeout
- fornecer dados agregados para o dashboard

#### Tecnologias utilizadas
- Node.js
- Express
- SQLite
- dotenv
- cors

---

### 3.3 Frontend
O frontend será a interface visual do sistema.

Ele permitirá que a equipe visualize o estado atual do parque tecnológico e execute ações cadastrais básicas.

#### Responsabilidades
- exibir visão geral do parque tecnológico
- mostrar indicadores resumidos
- listar equipamentos cadastrados
- exibir status operacional e conectividade
- permitir cadastro de equipamentos
- permitir vínculo entre equipamento e dispositivo
- atualizar periodicamente os dados do backend

#### Tecnologias previstas
- React
- Vite

---

## 4. Fluxo de funcionamento
O fluxo principal do sistema ocorre da seguinte forma:

1. Um equipamento é cadastrado no sistema.
2. Um dispositivo IoT é vinculado a esse equipamento por meio de um `device_id`.
3. O usuário interage com o botão físico do dispositivo.
4. O ESP32 envia um evento JSON ao backend.
5. O backend identifica o equipamento correspondente.
6. O evento é salvo no banco de dados.
7. O status atual do equipamento é atualizado.
8. O frontend consulta periodicamente o backend.
9. O dashboard apresenta o estado atualizado do parque tecnológico.

---

## 5. Modelo lógico da informação
O sistema foi estruturado com base em três entidades principais:

### 5.1 Equipamentos
Representa cada equipamento médico-hospitalar monitorado.

#### Campos principais
- `id`
- `nome`
- `codigo`
- `patrimonio`
- `setor`
- `descricao`
- `status_atual`
- `codigo_estado_atual`
- `conectividade`
- `ultimo_evento_em`
- `ultimo_heartbeat_em`

---

### 5.2 Dispositivos
Representa o botão/dispositivo IoT vinculado ao equipamento.

#### Campos principais
- `id`
- `device_id`
- `equipamento_id`
- `descricao`
- `ativo`
- `criado_em`

---

### 5.3 Eventos
Representa cada mensagem recebida do dispositivo IoT.

#### Campos principais
- `id`
- `equipamento_id`
- `device_id`
- `evento`
- `status`
- `codigo_estado`
- `conectividade`
- `ip`
- `rssi`
- `uptime_ms`
- `payload_json`
- `recebido_em`

---

## 6. Regras de negócio principais

### 6.1 Vínculo entre dispositivo e equipamento
Cada `device_id` deve estar vinculado a um equipamento específico.  
Esse vínculo permite que o backend saiba exatamente qual equipamento atualizar quando um evento for recebido.

---

### 6.2 Atualização do status do equipamento
Quando o backend recebe um evento do tipo `status_equipamento`, ele deve:

- registrar o evento no histórico
- atualizar o campo `status_atual`
- atualizar o campo `codigo_estado_atual`
- registrar o momento do último evento
- marcar conectividade como online, se aplicável

---

### 6.3 Monitoramento de conectividade
Quando o dispositivo envia um `heartbeat`, o backend deve:

- registrar o evento
- atualizar `ultimo_heartbeat_em`
- considerar o equipamento online

Quando o tempo desde o último heartbeat ultrapassa o limite configurado (`OFFLINE_TIMEOUT_MS`), o sistema deve considerar o equipamento offline.

---

### 6.4 Histórico e rastreabilidade
Todos os eventos recebidos devem ser armazenados integralmente no banco, incluindo o payload JSON original, para garantir rastreabilidade e futura auditoria técnica.

---

## 7. API do sistema
A API REST é a interface de comunicação entre frontend, backend e dispositivos IoT.

### Rotas principais
- `GET /api/health`
- `GET /api/equipamentos`
- `POST /api/equipamentos`
- `POST /api/equipamentos/:id/vincular-dispositivo`
- `POST /api/iot/eventos`
- `GET /api/dashboard/resumo`

---

## 8. Exemplo de comunicação IoT

### Exemplo de payload de status
```json
{
  "device_id": "BTN-ESP32-402",
  "evento": "status_equipamento",
  "codigo_estado": 2,
  "status": "indisponivel_prioridade",
  "conectividade": "online",
  "ip": "192.168.0.50",
  "rssi": -58,
  "uptime_ms": 123456
}
Exemplo de payload de heartbeat
{
  "device_id": "BTN-ESP32-402",
  "evento": "heartbeat",
  "conectividade": "online",
  "ip": "192.168.0.50",
  "rssi": -55,
  "uptime_ms": 130000
}
9. Cálculo de online/offline

A conectividade do dispositivo não depende apenas do último valor salvo no banco, mas também de uma regra temporal baseada em heartbeat.

Regra

Se:

agora - ultimo_heartbeat_em > OFFLINE_TIMEOUT_MS

então o equipamento deve ser considerado:

offline

Caso contrário:

online

Essa abordagem torna o monitoramento mais robusto, pois permite detectar perda de comunicação mesmo sem um evento explícito de desconexão.

10. Estrutura de pastas do backend

A organização do backend foi separada em camadas para facilitar manutenção e evolução do sistema.

Camadas principais

config/
configurações de ambiente e banco

controllers/
entrada das requisições HTTP

services/
regras de negócio

repositories/
acesso ao banco de dados

routes/
definição de endpoints

middlewares/
validações e tratamento de erros

database/
schema, seed e migrações

utils/
funções auxiliares

tests/
testes automatizados

11. Escalabilidade futura

Embora o sistema esteja sendo iniciado com uma arquitetura simples, ele foi pensado para permitir expansão posterior.

Possíveis evoluções

autenticação de usuários

perfis de acesso

filtros avançados por setor, tipo e status

gráficos e indicadores históricos

exportação de relatórios

notificações automáticas

integração com sistemas hospitalares

substituição do SQLite por PostgreSQL

uso de WebSocket para atualização em tempo real

adoção de MQTT para conectividade IoT mais robusta

12. Considerações finais

A arquitetura proposta busca equilibrar simplicidade inicial e capacidade de expansão futura.

Ela é adequada para um primeiro protótipo funcional de monitoramento do parque tecnológico hospitalar, permitindo integrar dispositivos IoT de baixo custo à rotina da Engenharia Clínica, com foco em rastreabilidade, visibilidade operacional e agilidade na identificação de necessidades de manutenção.