// dashboard/backend/tests/eventos.test.js
//
// Testes simples usando node:test + fetch nativo do Node.
// Requer Node 18+.
//
// Para rodar futuramente:
// node --test tests/eventos.test.js

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

const testDbPath = path.join(__dirname, "test-eventos.sqlite");

process.env.PORT = "3997";
process.env.DB_PATH = testDbPath;
process.env.OFFLINE_TIMEOUT_MS = "90000";

const { default: db } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

function execSql(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function closeDb() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

let server;
let baseUrl;

test.before(async () => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const schemaPath = path.join(backendRoot, "src", "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await execSql(schema);

  // equipamento base
  await runSql(
    `
      INSERT INTO equipamentos (
        nome,
        codigo,
        patrimonio,
        setor,
        descricao,
        status_atual,
        codigo_estado_atual,
        conectividade
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "Bomba de Infusão 402",
      "BOMBA-INFUSAO-402",
      "PAT-000402",
      "UTI Adulto",
      "Equipamento de teste",
      "desconhecido",
      null,
      "offline"
    ]
  );

  // dispositivo vinculado
  await runSql(
    `
      INSERT INTO dispositivos (
        device_id,
        equipamento_id,
        descricao,
        ativo
      ) VALUES (?, ?, ?, ?)
    `,
    ["BTN-ESP32-402", 1, "Botão ESP32 da bomba 402", 1]
  );

  server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, () => resolve());
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  await closeDb();

  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

test("POST /api/iot/eventos deve receber evento de status e atualizar equipamento", async () => {
  const payload = {
    device_id: "BTN-ESP32-402",
    evento: "status_equipamento",
    codigo_estado: 2,
    status: "indisponivel_prioridade",
    conectividade: "online",
    ip: "192.168.0.50",
    rssi: -58,
    uptime_ms: 123456
  };

  const response = await fetch(`${baseUrl}/api/iot/eventos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.message, "Evento recebido com sucesso.");
  assert.equal(data.equipamento.nome, "Bomba de Infusão 402");
  assert.equal(data.equipamento.codigo, "BOMBA-INFUSAO-402");

  // confere se o dashboard já reflete o novo status
  const dashboardResponse = await fetch(`${baseUrl}/api/dashboard/resumo`);
  const dashboardData = await dashboardResponse.json();

  assert.equal(dashboardResponse.status, 200);
  assert.equal(dashboardData.total, 1);
  assert.equal(dashboardData.indisponivel_prioridade, 1);
  assert.equal(dashboardData.online, 1);
  assert.equal(dashboardData.equipamentos[0].status_atual, "indisponivel_prioridade");
});

test("POST /api/iot/eventos deve receber heartbeat", async () => {
  const payload = {
    device_id: "BTN-ESP32-402",
    evento: "heartbeat",
    conectividade: "online",
    ip: "192.168.0.50",
    rssi: -55,
    uptime_ms: 130000
  };

  const response = await fetch(`${baseUrl}/api/iot/eventos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.message, "Evento recebido com sucesso.");
});

test("POST /api/iot/eventos deve retornar 404 para device_id não vinculado", async () => {
  const payload = {
    device_id: "BTN-ESP32-999",
    evento: "status_equipamento",
    codigo_estado: 1,
    status: "manutencao_curto_prazo",
    conectividade: "online"
  };

  const response = await fetch(`${baseUrl}/api/iot/eventos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Nenhum equipamento vinculado a este device_id");
  assert.equal(data.device_id, "BTN-ESP32-999");
});

test("POST /api/iot/eventos deve retornar 400 quando device_id não for informado", async () => {
  const payload = {
    evento: "status_equipamento",
    codigo_estado: 0,
    status: "funcional",
    conectividade: "online"
  };

  const response = await fetch(`${baseUrl}/api/iot/eventos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.equal(data.error, "device_id não informado no payload");
});
