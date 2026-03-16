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
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const schemaPath = path.join(backendRoot, "src", "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await execSql(schema);

  await runSql(
    `
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      "Bomba de Infusão 402",
      "BOMBA-INFUSAO-402",
      "Bomba de Infusão",
      "Mindray",
      "BeneFusion VP5",
      "PAT-000402",
      "UTI Adulto",
      "Equipamento de teste",
      "desconhecido",
      null,
      "offline"
    ]
  );

  await runSql(
    `
      INSERT INTO dispositivos (
        device_id,
        equipamento_id,
        descricao,
        ativo
      ) VALUES (?, ?, ?, ?)
    `,
    ["ESP32-UTI-402", 1, "Placa da bomba 402", 1]
  );

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

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

  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

test("POST /api/iot/eventos deve aceitar payload mínimo por código", async () => {
  const payload = {
    c: "BOMBA-INFUSAO-402",
    s: 2
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
  assert.equal(data.equipamento.codigo, "BOMBA-INFUSAO-402");
  assert.equal(data.equipamento.matched_by, "codigo");

  const dashboardResponse = await fetch(`${baseUrl}/api/dashboard/resumo`);
  const dashboardData = await dashboardResponse.json();

  assert.equal(dashboardResponse.status, 200);
  assert.equal(dashboardData.total, 1);
  assert.equal(dashboardData.indisponivel_prioridade, 1);
  assert.equal(dashboardData.online, 1);
  assert.equal(dashboardData.equipamentos[0].status_atual, "indisponivel_prioridade");
});

test("POST /api/iot/eventos deve aceitar evento por device_id", async () => {
  const payload = {
    device_id: "ESP32-UTI-402",
    codigo_estado: 1,
    status: "manutencao_curto_prazo"
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
  assert.equal(data.equipamento.device_id, "ESP32-UTI-402");
  assert.equal(data.equipamento.matched_by, "device_id");
});

test("POST /api/iot/eventos deve retornar 404 para identificador desconhecido", async () => {
  const payload = {
    c: "NAO-CADASTRADO",
    s: 1
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
  assert.equal(data.error, "Nenhum equipamento encontrado para o identificador informado.");
  assert.equal(data.codigo, "NAO-CADASTRADO");
});

test("POST /api/iot/eventos deve retornar 400 sem identificador", async () => {
  const payload = {
    s: 0
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
  assert.equal(data.error, "Informe o código do equipamento em 'c'/'codigo' ou um 'device_id'.");
});
