// dashboard/backend/tests/equipamentos.test.js
//
// Testes simples usando node:test + fetch (Node 18+).
// Para rodar futuramente:
// node --test tests/equipamentos.test.js

import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

const testDbPath = path.join(__dirname, "test-equipamentos.sqlite");

process.env.PORT = "3998";
process.env.DB_PATH = testDbPath;
process.env.OFFLINE_TIMEOUT_MS = "90000";

const { default: db } = await import("../src/config/db.js");
const { default: app } = await import("../src/app.js");

function execSql(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => (err ? reject(err) : resolve()));
  });
}

function closeDb() {
  return new Promise((resolve, reject) => {
    db.close((err) => (err ? reject(err) : resolve()));
  });
}

let server;
let baseUrl;

test.before(async () => {
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const schemaPath = path.join(backendRoot, "src", "database", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await execSql(schema);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  await closeDb();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
});

test("POST /api/equipamentos deve cadastrar equipamento", async () => {
  const payload = {
    nome: "Bomba de Infusão 402",
    codigo: "BOMBA-INFUSAO-402",
    patrimonio: "PAT-000402",
    setor: "UTI Adulto",
    descricao: "Equipamento de teste"
  };

  const resp = await fetch(`${baseUrl}/api/equipamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await resp.json();

  assert.equal(resp.status, 201);
  assert.equal(data.message, "Equipamento cadastrado com sucesso.");
  assert.ok(Number.isInteger(data.id));
});

test("GET /api/equipamentos deve listar equipamentos", async () => {
  const resp = await fetch(`${baseUrl}/api/equipamentos`);
  const data = await resp.json();

  assert.equal(resp.status, 200);
  assert.ok(Array.isArray(data));
  assert.equal(data.length, 1);
  assert.equal(data[0].codigo, "BOMBA-INFUSAO-402");
});

test("POST /api/equipamentos deve validar campos obrigatórios", async () => {
  const resp = await fetch(`${baseUrl}/api/equipamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo: "SEM-NOME" })
  });

  const data = await resp.json();

  assert.equal(resp.status, 400);
  assert.ok(data.error);
});

test("POST /api/equipamentos/:id/vincular-dispositivo deve vincular device_id", async () => {
  // primeiro pega o equipamento cadastrado
  const listResp = await fetch(`${baseUrl}/api/equipamentos`);
  const list = await listResp.json();
  const equipamentoId = list[0].id;

  const resp = await fetch(`${baseUrl}/api/equipamentos/${equipamentoId}/vincular-dispositivo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id: "BTN-ESP32-402", descricao: "Botão da bomba 402" })
  });

  const data = await resp.json();

  assert.equal(resp.status, 201);
  assert.equal(data.message, "Dispositivo vinculado com sucesso.");
  assert.equal(data.device_id, "BTN-ESP32-402");
  assert.equal(data.equipamento.id, equipamentoId);
});
