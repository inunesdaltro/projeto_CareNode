// dashboard/backend/src/config/env.js
// Centraliza leitura das variáveis de ambiente

import dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: Number(process.env.PORT || 3001),
  DB_PATH: process.env.DB_PATH || "./src/database/database.sqlite",
  OFFLINE_TIMEOUT_MS: Number(process.env.OFFLINE_TIMEOUT_MS || 90000)
};

export default env;
