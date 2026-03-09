// dashboard/backend/tests/dashboard.test.js
//
// Teste simples usando node:test + fetch nativo do Node.
// Requer Node 18+.
//
// Para rodar futuramente:
// node --test tests/dashboard.test.js

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

// Banco temporário só para teste
const testDbPath = path.join(__dirname, "test-dashboard.sqlite");

// Define env ANTES dos imports do app/db
process.env.PORT = "3999";
process.env.DB_PATH = testDbPath;
process.env.OFFLINE_TIMEOUT_MS = "90000";

// Importações dinâmicas após configurar env
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
  // Limpa banco anterior de teste, se existir
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Inicializa schema
  const schemaPath = path.join(backendRoot, "src", "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await execSql(schema);

  // Seed mínimo para dashboard
  await runSql(
    `
      INSERT INTO equipamentos (
        nome, codigo, patrimonio, setor, descricao,
        status_atual, codigo_estado_atual, conectividade,
        ultimo_evento_em, ultimo_heartbeat_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    [
      "Bomba de Infusão 402",
      "BOMBA-INFUSAO-402",
      "PAT-000402",
      "UTI Adulto",
      "Equipamento de teste",
      "funcional",
      0,
      "online"
    ]
  );

  await runSql(
    `
      INSERT INTO dispositivos (
        device_id, equipamento_id, descricao, ativo
      ) VALUES (?, ?, ?, ?)
    `,
    ["BTN-ESP32-402", 1, "Dispositivo de teste", 1]
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

test("GET /api/health deve responder status ok", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.status, "ok");
  assert.equal(data.service, "dashboard-backend");
});

test("GET /api/dashboard/resumo deve retornar resumo do parque tecnológico", async () => {
  const response = await fetch(`${baseUrl}/api/dashboard/resumo`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.total, 1);
  assert.equal(data.online, 1);
  assert.equal(data.offline, 0);
  assert.equal(data.funcional, 1);

  assert.ok(Array.isArray(data.equipamentos));
  assert.equal(data.equipamentos.length, 1);
  assert.equal(data.equipamentos[0].nome, "Bomba de Infusão 402");
  assert.equal(data.equipamentos[0].codigo, "BOMBA-INFUSAO-402");
});

test("rota inexistente deve retornar 404", async () => {
  const response = await fetch(`${baseUrl}/api/rota-inexistente`);
  const data = await response.json();

  assert.equal(response.status, 404);
  assert.equal(data.error, "Rota não encontrada");
});
