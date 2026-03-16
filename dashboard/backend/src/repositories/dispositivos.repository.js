// dashboard/backend/src/repositories/dispositivos.repository.js

import db from "../config/db.js";

export function buscarDispositivoPorDeviceId(deviceId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        d.id,
        d.device_id,
        d.equipamento_id,
        d.descricao,
        d.ativo,
        d.criado_em,
        e.nome AS equipamento_nome,
        e.codigo AS equipamento_codigo
      FROM dispositivos d
      LEFT JOIN equipamentos e
        ON e.id = d.equipamento_id
      WHERE d.device_id = ?
      LIMIT 1
    `;

    db.get(sql, [deviceId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

export function listarDispositivos() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        d.id,
        d.device_id,
        d.equipamento_id,
        d.descricao,
        d.ativo,
        d.criado_em,
        e.nome AS equipamento_nome,
        e.codigo AS equipamento_codigo
      FROM dispositivos d
      LEFT JOIN equipamentos e
        ON e.id = d.equipamento_id
      ORDER BY d.device_id ASC
    `;

    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

export function criarDispositivo({ device_id, equipamento_id, descricao = null, ativo = 1 }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO dispositivos (
        device_id,
        equipamento_id,
        descricao,
        ativo
      )
      VALUES (?, ?, ?, ?)
    `;

    db.run(
      sql,
      [device_id, equipamento_id, descricao, ativo],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            device_id,
            equipamento_id,
            descricao,
            ativo
          });
        }
      }
    );
  });
}

export function atualizarDispositivo(id, { device_id, equipamento_id, descricao, ativo }) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE dispositivos
      SET
        device_id = COALESCE(?, device_id),
        equipamento_id = COALESCE(?, equipamento_id),
        descricao = COALESCE(?, descricao),
        ativo = COALESCE(?, ativo)
      WHERE id = ?
    `;

    db.run(
      sql,
      [
        device_id ?? null,
        equipamento_id ?? null,
        descricao ?? null,
        ativo ?? null,
        id
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            updated: this.changes > 0,
            changes: this.changes
          });
        }
      }
    );
  });
}

export function removerDispositivo(id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM dispositivos WHERE id = ?`;

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
