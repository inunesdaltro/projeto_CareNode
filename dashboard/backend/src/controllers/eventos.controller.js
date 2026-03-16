import db from "../config/db.js";
import { getCodeFromStatus, getStatusFromCode } from "../utils/statusMap.js";

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
        e.codigo AS equipamento_codigo,
        e.tipo AS equipamento_tipo,
        e.marca AS equipamento_marca,
        e.modelo AS equipamento_modelo
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

function normalizarCodigoEquipamento(body = {}) {
  const value = body.c ?? body.codigo ?? body.codigo_equipamento ?? body.id_equipamento ?? null;
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizarDeviceId(body = {}) {
  const value = body.device_id ?? body.codigo_dispositivo ?? null;
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizarCodigoEstado(body = {}) {
  const rawCode = body.s ?? body.codigo_estado ?? body.codigo_estado_atual ?? null;

  if (rawCode !== null && rawCode !== undefined && rawCode !== "") {
    const numeric = Number(rawCode);
    if (Number.isFinite(numeric)) return numeric;
  }

  const rawStatus = body.status ?? body.status_atual ?? null;
  if (rawStatus !== null && rawStatus !== undefined && String(rawStatus).trim()) {
    const statusCode = getCodeFromStatus(rawStatus);
    return statusCode === null ? null : statusCode;
  }

  return null;
}

function normalizarStatus(body = {}, codigoEstado = null) {
  const rawStatus = body.status ?? body.status_atual ?? null;
  const normalized = String(rawStatus || "").trim().toLowerCase();

  if (normalized) return normalized;
  if (codigoEstado !== null && codigoEstado !== undefined) {
    return getStatusFromCode(codigoEstado);
  }

  return null;
}

function normalizarEvento(body = {}, hasStatus = false) {
  const explicit = String(body.evento || "").trim().toLowerCase();
  if (explicit) return explicit;
  return hasStatus ? "status_equipamento" : "heartbeat";
}

function buscarEquipamento({ codigoEquipamento, deviceId }) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        e.id AS equipamento_id,
        e.nome,
        e.codigo,
        e.tipo,
        e.marca,
        e.modelo,
        d.device_id,
        CASE
          WHEN ? IS NOT NULL AND e.codigo = ? THEN 'codigo'
          WHEN ? IS NOT NULL AND d.device_id = ? THEN 'device_id'
          ELSE 'desconhecido'
        END AS matched_by
      FROM equipamentos e
      LEFT JOIN dispositivos d
        ON e.id = d.equipamento_id
      WHERE (? IS NOT NULL AND e.codigo = ?)
         OR (? IS NOT NULL AND d.device_id = ?)
      ORDER BY
        CASE WHEN ? IS NOT NULL AND e.codigo = ? THEN 0 ELSE 1 END,
        CASE WHEN ? IS NOT NULL AND d.device_id = ? THEN 0 ELSE 1 END,
        e.id ASC
      LIMIT 1
    `;

    const params = [
      codigoEquipamento,
      codigoEquipamento,
      deviceId,
      deviceId,
      codigoEquipamento,
      codigoEquipamento,
      deviceId,
      deviceId,
      codigoEquipamento,
      codigoEquipamento,
      deviceId,
      deviceId
    ];

    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
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

function atualizarStatusEquipamento(equipamentoId, eventoNormalizado) {
  return new Promise((resolve, reject) => {
    const isHeartbeat = eventoNormalizado.evento === "heartbeat";

    const sql = `
      UPDATE equipamentos
      SET
        status_atual = CASE
          WHEN ? IS NOT NULL THEN ?
          ELSE status_atual
        END,
        codigo_estado_atual = CASE
          WHEN ? IS NOT NULL THEN ?
          ELSE codigo_estado_atual
        END,
        conectividade = COALESCE(?, conectividade, 'offline'),
        ultimo_evento_em = CASE
          WHEN ? = 1 THEN ultimo_evento_em
          ELSE CURRENT_TIMESTAMP
        END,
        ultimo_heartbeat_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(
      sql,
      [
        eventoNormalizado.status,
        eventoNormalizado.status,
        eventoNormalizado.codigo_estado,
        eventoNormalizado.codigo_estado,
        eventoNormalizado.conectividade || "online",
        isHeartbeat ? 1 : 0,
        equipamentoId
      ],
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
    const body = req.body || {};
    const codigoEquipamento = normalizarCodigoEquipamento(body);
    const deviceId = normalizarDeviceId(body);

    if (!codigoEquipamento && !deviceId) {
      return res.status(400).json({
        error: "Informe o código do equipamento em 'c'/'codigo' ou um 'device_id'."
      });
    }

    const equipamento = await buscarEquipamento({ codigoEquipamento, deviceId });

    if (!equipamento) {
      return res.status(404).json({
        error: "Nenhum equipamento encontrado para o identificador informado.",
        codigo: codigoEquipamento,
        device_id: deviceId
      });
    }

    const codigoEstado = normalizarCodigoEstado(body);
    const status = normalizarStatus(body, codigoEstado);
    const evento = normalizarEvento(body, codigoEstado !== null || Boolean(status));

    const eventoNormalizado = {
      equipamento_id: equipamento.equipamento_id,
      device_id: equipamento.device_id || deviceId || null,
      evento,
      status,
      codigo_estado: codigoEstado,
      conectividade: body.conectividade || "online",
      ip: body.ip || null,
      rssi: body.rssi ?? null,
      uptime_ms: body.uptime_ms ?? null,
      payload_json: body
    };

    const eventoId = await inserirEvento(eventoNormalizado);
    await atualizarStatusEquipamento(equipamento.equipamento_id, eventoNormalizado);

    return res.status(201).json({
      message: "Evento recebido com sucesso.",
      evento_id: eventoId,
      equipamento: {
        id: equipamento.equipamento_id,
        nome: equipamento.nome,
        codigo: equipamento.codigo,
        tipo: equipamento.tipo,
        marca: equipamento.marca,
        modelo: equipamento.modelo,
        device_id: equipamento.device_id || deviceId || null,
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
