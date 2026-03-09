// dashboard/backend/src/config/db.js
// Conexão SQLite usando o módulo nativo do Node.js (Node 22+)

import fs from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import dotenv from "dotenv";

dotenv.config();

const DB_PATH = process.env.DB_PATH || "./src/database/database.sqlite";
const resolvedPath = path.resolve(DB_PATH);
const resolvedDir = path.dirname(resolvedPath);

let sqlite = null;

function ensureConnection() {
  if (sqlite) {
    return sqlite;
  }

  fs.mkdirSync(resolvedDir, { recursive: true });
  sqlite = new DatabaseSync(resolvedPath);
  sqlite.exec("PRAGMA foreign_keys = ON;");
  console.log("SQLite conectado em:", resolvedPath);
  return sqlite;
}

const db = {
  exec(sql, callback) {
    try {
      ensureConnection().exec(sql);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  },

  all(sql, params = [], callback) {
    try {
      const statement = ensureConnection().prepare(sql);
      const rows = statement.all(...params);
      callback?.(null, rows);
      return rows;
    } catch (error) {
      callback?.(error);
      return [];
    }
  },

  get(sql, params = [], callback) {
    try {
      const statement = ensureConnection().prepare(sql);
      const row = statement.get(...params);
      callback?.(null, row);
      return row;
    } catch (error) {
      callback?.(error);
      return undefined;
    }
  },

  run(sql, params = [], callback) {
    try {
      const statement = ensureConnection().prepare(sql);
      const result = statement.run(...params);
      const context = {
        lastID: Number(result.lastInsertRowid ?? 0),
        changes: Number(result.changes ?? 0)
      };

      if (typeof callback === "function") {
        callback.call(context, null);
      }

      return context;
    } catch (error) {
      if (typeof callback === "function") {
        callback.call({}, error);
        return null;
      }

      throw error;
    }
  },

  close(callback) {
    try {
      if (sqlite) {
        sqlite.close();
        sqlite = null;
      }
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }
};

export default db;
