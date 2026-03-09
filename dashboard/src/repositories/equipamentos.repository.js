// dashboard/backend/src/repositories/equipamentos.repository.js

import db from "../config/db.js";

export function listarEquipamentosRepository() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        e.id,
        e.nome,
        e.codigo,
        e.patrimonio,
        e.setor,
        e.descricao,
        e.status_atual,
        e.codigo_estado_atual,
        e.conectividade,
        e.ultimo_evento_em,
        e.ultimo_heartbeat_em,
        d.device_id,
        d.descricao AS dispositivo_descricao
      FROM equipamentos e
      LEFT JOIN dispositivos d
        ON d.equipamento_id = e.id
      ORDER BY e.nome ASC
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

export function buscarEquipamentoPorId(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        id,
        nome,
        codigo,
        patrimonio,
        setor,
        descricao,
        status_atual,
        codigo_estado_atual,
        conectividade,
        ultimo_evento_em,
        ultimo_heartbeat_em,
        criado_em
      FROM equipamentos
      WHERE id = ?
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

export function buscarEquipamentoPorCodigo(codigo) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        id,
        nome,
        codigo,
        patrimonio,
        setor,
        descricao,
        status_atual,
        codigo_estado_atual,
        conectividade,
        ultimo_evento_em,
        ultimo_heartbeat_em,
        criado_em
      FROM equipamentos
      WHERE codigo = ?
      LIMIT 1
    `;

    db.get(sql, [codigo], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

export function criarEquipamento({ nome, codigo, patrimonio = null, setor = null, descricao = null }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO equipamentos (
        nome,
        codigo,
        patrimonio,
        setor,
        descricao
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [nome, codigo, patrimonio, setor, descricao],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            nome,
            codigo,
            patrimonio,
            setor,
            descricao
          });
        }
      }
    );
  });
}

export function atualizarEquipamento(
  id,
  { nome, codigo, patrimonio, setor, descricao, status_atual, codigo_estado_atual, conectividade }
) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE equipamentos
      SET
        nome = COALESCE(?, nome),
        codigo = COALESCE(?, codigo),
        patrimonio = COALESCE(?, patrimonio),
        setor = COALESCE(?, setor),
        descricao = COALESCE(?, descricao),
        status_atual = COALESCE(?, status_atual),
        codigo_estado_atual = COALESCE(?, codigo_estado_atual),
        conectividade = COALESCE(?, conectividade),
        ultimo_evento_em = CASE
          WHEN ? IS NOT NULL OR ? IS NOT NULL OR ? IS NOT NULL
          THEN CURRENT_TIMESTAMP
          ELSE ultimo_evento_em
        END
      WHERE id = ?
    `;

    db.run(
      sql,
      [
        nome ?? null,
        codigo ?? null,
        patrimonio ?? null,
        setor ?? null,
        descricao ?? null,
        status_atual ?? null,
        codigo_estado_atual ?? null,
        conectividade ?? null,
        status_atual ?? null,
        codigo_estado_atual ?? null,
        conectividade ?? null,
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

export function atualizarHeartbeatEquipamento(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE equipamentos
      SET
        conectividade = 'online',
        ultimo_heartbeat_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(sql, [id], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          updated: this.changes > 0,
          changes: this.changes
        });
      }
    });
  });
}

export function removerEquipamento(id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM equipamentos WHERE id = ?`;

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
