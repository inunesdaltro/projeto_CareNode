// dashboard/backend/src/database/init.js

import fs from "fs";
import path from "path";
import db from "../config/db.js";

const schemaPath = path.resolve("./src/database/schema.sql");

try {
  const schema = fs.readFileSync(schemaPath, "utf-8");

  db.exec(schema, (err) => {
    if (err) {
      console.error("Erro ao inicializar o schema do banco:", err.message);
    } else {
      console.log("Schema do banco inicializado com sucesso.");
    }
  });
} catch (error) {
  console.error("Erro ao ler o arquivo schema.sql:", error.message);
}
