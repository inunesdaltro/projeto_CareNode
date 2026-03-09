# Dashboard — Monitoramento de Equipamentos de Engenharia Clínica

## Descrição do projeto
Este projeto tem como objetivo criar um dashboard web para monitoramento contínuo de equipamentos médico-hospitalares a partir de dispositivos IoT baseados em ESP32.

Cada dispositivo físico, composto por um botão e LEDs de sinalização, será vinculado a um equipamento específico do parque tecnológico hospitalar. Ao interagir com o botão, o dispositivo enviará eventos em formato JSON para o backend do sistema, permitindo o acompanhamento remoto do estado operacional dos equipamentos.

O sistema foi pensado para apoiar a Engenharia Clínica no controle do parque tecnológico, facilitando a visualização de equipamentos funcionais, em necessidade de manutenção ou indisponíveis, além do monitoramento da conectividade dos dispositivos instalados.

---

## Objetivos
O dashboard deverá permitir:

- cadastrar equipamentos
- armazenar nome, código, patrimônio, setor e descrição
- vincular cada dispositivo IoT a um equipamento específico
- receber eventos JSON enviados pelos dispositivos
- atualizar continuamente o status dos equipamentos
- monitorar conectividade online/offline por heartbeat
- manter histórico de eventos para rastreabilidade

---

## Estrutura inicial do projeto
A estrutura principal do projeto será organizada da seguinte forma:

```text
dashboard/
├── 01-README.md
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── .env.example
└── frontend/


---

## Ajustes aplicados nesta versão

- backend configurado para subir a aplicação completa (`src/app.js`) e inicializar o banco SQLite automaticamente
- backend adaptado para usar o módulo nativo `node:sqlite` (Node 22+)
- rota `GET /api/eventos` implementada
- `GET /api/dashboard/resumo` agora inclui `eventos_recentes`
- backend aceita eventos enviados por `device_id` **ou** pelo código do equipamento
- `index.html` do frontend ajustado para funcionar mesmo quando a pasta do projeto contém caracteres especiais
- firmware `.ino` apontado para a rota real do backend e configurado com `id_equipamento` compatível com o vínculo via `device_id`

## Como executar

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Testes do backend

```bash
cd backend
npm install
npm test
```
