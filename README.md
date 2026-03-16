# CareNode

Sistema de monitoramento IoT para Engenharia Clínica, com cadastro de equipamentos no dashboard e recebimento de pacotes mínimos enviados por ESP32.

## Como o fluxo funciona

1. No dashboard, você cadastra o equipamento com nome, código, tipo, marca, modelo, patrimônio e setor.
2. No firmware da ESP32, você configura apenas o mesmo `codigo` cadastrado no sistema.
3. Cada ESP32 envia para o backend um JSON mínimo como:

```json
{"c":"BOMBA-INFUSAO-402","s":0}
```

4. O backend localiza o equipamento pelo código, salva o evento e atualiza o status.
5. O frontend exibe nome, marca, modelo, setor e demais dados a partir do cadastro do equipamento.

## Status usados no firmware

- `0` = funcional
- `1` = manutencao_curto_prazo
- `2` = indisponivel_prioridade

## Cadastro no dashboard

Sim. A página **Cadastro** já permite:

- cadastrar equipamentos
- vincular opcionalmente uma placa ESP32 por `device_id`

O vínculo por `device_id` não é obrigatório para o fluxo mínimo. Ele serve apenas se você quiser identificar também a placa física instalada.

## Estrutura

```text
projeto_CareNode/
├── botao.ino
└── dashboard/
    ├── backend/
    ├── frontend/
    └── docs/
```

## Executando o backend

```bash
cd dashboard/backend
npm install
cp .env.example .env
npm start
```

Servidor padrão: `http://localhost:3001`

## Executando o frontend

```bash
cd dashboard/frontend
npm install
npm run dev
```

Frontend padrão: `http://localhost:5173`

Se quiser apontar o frontend para outro backend, ajuste o arquivo `.env` do frontend:

```env
VITE_API_URL=http://localhost:3001/api
VITE_POLL_INTERVAL_MS=5000
```

## Testes do backend

```bash
cd dashboard/backend
npm test
```
