// dashboard/backend/src/controllers/eventos.controller.js

import db from "../config/db.js";

function listarEventos(limit = 100) {
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
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function buscarEquipamentoPorIdentificador(identificador) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        e.id AS equipamento_id,
        e.nome,
        e.codigo,
        d.device_id,
        CASE
          WHEN d.device_id = ? THEN 'device_id'
          WHEN e.codigo = ? THEN 'codigo_equipamento'
          ELSE 'desconhecido'
        END AS matched_by
      FROM equipamentos e
      LEFT JOIN dispositivos d
        ON e.id = d.equipamento_id
      WHERE d.device_id = ? OR e.codigo = ?
      ORDER BY CASE WHEN d.device_id = ? THEN 0 ELSE 1 END, e.id ASC
      LIMIT 1
    `;

    db.get(
      sql,
      [identificador, identificador, identificador, identificador, identificador],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

function inserirEvento({
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
        JSON.stringify(payload_json)
      ],
      function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
}

function atualizarStatusEquipamento(equipamentoId, body) {
  return new Promise((resolve, reject) => {
    const status = body.status ?? body.status_atual ?? null;
    const codigoEstado = body.codigo_estado ?? body.codigo_estado_atual ?? null;
    const conectividade = body.conectividade || null;
    const evento = body.evento || null;

    const sql = `
      UPDATE equipamentos
      SET
        status_atual = COALESCE(?, status_atual),
        codigo_estado_atual = COALESCE(?, codigo_estado_atual),
        conectividade = COALESCE(?, conectividade),
        ultimo_evento_em = CURRENT_TIMESTAMP,
        ultimo_heartbeat_em = CASE
          WHEN ? = 'heartbeat' THEN CURRENT_TIMESTAMP
          WHEN ? = 'online' THEN CURRENT_TIMESTAMP
          WHEN ? = 'online_restabelecida' THEN CURRENT_TIMESTAMP
          ELSE ultimo_heartbeat_em
        END
      WHERE id = ?
    `;

    db.run(
      sql,
      [status, codigoEstado, conectividade, evento, conectividade, conectividade, equipamentoId],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

export async function listarEventosIoT(req, res) {
  try {
    const parsedLimit = Number(req.query.limit || 100);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(parsedLimit, 500))
      : 100;

    const eventos = await listarEventos(limit);
    return res.json(eventos);
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao listar eventos",
      details: error.message
    });
  }
}

export async function receberEventoIoT(req, res) {
  try {
    const body = req.body;

    const identificador =
      body.device_id || body.id_equipamento || body.codigo_dispositivo;

    if (!identificador) {
      return res.status(400).json({
        error: "device_id não informado no payload"
      });
    }

    const equipamento = await buscarEquipamentoPorIdentificador(identificador);

    if (!equipamento) {
      return res.status(404).json({
        error: "Nenhum equipamento vinculado a este device_id",
        device_id: identificador
      });
    }

    const eventoNormalizado = {
      equipamento_id: equipamento.equipamento_id,
      device_id: equipamento.device_id || identificador,
      evento: body.evento || "status_equipamento",
      status: body.status ?? body.status_atual ?? null,
      codigo_estado: body.codigo_estado ?? body.codigo_estado_atual ?? null,
      conectividade: body.conectividade || null,
      ip: body.ip || null,
      rssi: body.rssi ?? null,
      uptime_ms: body.uptime_ms ?? null,
      payload_json: body
    };

    const eventoId = await inserirEvento(eventoNormalizado);
    await atualizarStatusEquipamento(equipamento.equipamento_id, body);

    return res.status(201).json({
      message: "Evento recebido com sucesso.",
      evento_id: eventoId,
      equipamento: {
        id: equipamento.equipamento_id,
        nome: equipamento.nome,
        codigo: equipamento.codigo,
        device_id: equipamento.device_id || identificador,
        matched_by: equipamento.matched_by
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao processar evento IoT",
      details: error.message
    });
  }
}
