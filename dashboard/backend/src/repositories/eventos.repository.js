// dashboard/backend/src/repositories/eventos.repository.js

import db from "../config/db.js";

export function listarEventosRepository(limit = 100) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        ev.id,
        ev.equipamento_id,
        ev.device_id,
        ev.evento,
        ev.status,
        ev.codigo_estado,
        ev.conectividade,
        ev.ip,
        ev.rssi,
        ev.uptime_ms,
        ev.payload_json,
        ev.recebido_em,
        e.nome AS equipamento_nome,
        e.codigo AS equipamento_codigo
      FROM eventos ev
      LEFT JOIN equipamentos e
        ON e.id = ev.equipamento_id
      ORDER BY ev.recebido_em DESC, ev.id DESC
      LIMIT ?
    `;

    db.all(sql, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function buscarEventoPorId(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        ev.id,
        ev.equipamento_id,
        ev.device_id,
        ev.evento,
        ev.status,
        ev.codigo_estado,
        ev.conectividade,
        ev.ip,
        ev.rssi,
        ev.uptime_ms,
        ev.payload_json,
        ev.recebido_em,
        e.nome AS equipamento_nome,
        e.codigo AS equipamento_codigo
      FROM eventos ev
      LEFT JOIN equipamentos e
        ON e.id = ev.equipamento_id
      WHERE ev.id = ?
      LIMIT 1
    `;

    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

export function criarEventoRepository({
  equipamento_id = null,
  device_id = null,
  evento,
  status = null,
  codigo_estado = null,
  conectividade = null,
  ip = null,
  rssi = null,
  uptime_ms = null,
  payload_json
}) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO eventos (
        equipamento_id,
        device_id,
        evento,
        status,
        codigo_estado,
        conectividade,
        ip,
        rssi,
        uptime_ms,
        payload_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        equipamento_id,
        device_id,
        evento,
        status,
        codigo_estado,
        conectividade,
        ip,
        rssi,
        uptime_ms,
        typeof payload_json === "string"
          ? payload_json
          : JSON.stringify(payload_json)
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            equipamento_id,
            device_id,
            evento,
            status,
            codigo_estado,
            conectividade,
            ip,
            rssi,
            uptime_ms
          });
        }
      }
    );
  });
}

export function removerEventoRepository(id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM eventos WHERE id = ?`;

    db.run(sql, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          deleted: this.changes > 0,
          changes: this.changes
        });
      }
    });
  });
}

export function limparEventosRepository() {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM eventos`;

    db.run(sql, [], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          deleted: this.changes > 0,
          changes: this.changes
        });
      }
    });
  });
}
