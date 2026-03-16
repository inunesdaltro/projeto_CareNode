// dashboard/backend/src/database/init.js

import fs from "fs";
import path from "path";
import db from "../config/db.js";

const schemaPath = path.resolve("./src/database/schema.sql");
const EQUIPAMENTO_EXTRA_COLUMNS = [
  ["tipo", "TEXT"],
  ["marca", "TEXT"],
  ["modelo", "TEXT"]
];

function garantirColunasEquipamentos() {
  db.all("PRAGMA table_info(equipamentos)", [], (pragmaErr, rows = []) => {
    if (pragmaErr) {
      console.error("Erro ao inspecionar colunas da tabela equipamentos:", pragmaErr.message);
      return;
    }

    const existentes = new Set((rows || []).map((row) => row.name));

    for (const [columnName, columnType] of EQUIPAMENTO_EXTRA_COLUMNS) {
      if (existentes.has(columnName)) continue;

      try {
        db.exec(`ALTER TABLE equipamentos ADD COLUMN ${columnName} ${columnType}`);
        console.log(`Coluna '${columnName}' adicionada à tabela equipamentos.`);
      } catch (migrationError) {
        console.error(
          `Erro ao adicionar a coluna '${columnName}' na tabela equipamentos:`,
          migrationError.message
        );
      }
    }
  });
}

try {
  const schema = fs.readFileSync(schemaPath, "utf-8");

  db.exec(schema, (err) => {
    if (err) {
      console.error("Erro ao inicializar o schema do banco:", err.message);
    } else {
      console.log("Schema do banco inicializado com sucesso.");
      garantirColunasEquipamentos();
    }
  });
} catch (error) {
  console.error("Erro ao ler o arquivo schema.sql:", error.message);
}
