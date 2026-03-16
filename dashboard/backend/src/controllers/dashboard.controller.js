// dashboard/backend/src/controllers/dashboard.controller.js

import db from "../config/db.js";
import env from "../config/env.js";

function buscarEquipamentos() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        e.id,
        e.nome,
        e.codigo,
        e.tipo,
        e.marca,
        e.modelo,
        e.patrimonio,
        e.setor,
        e.descricao,
        e.status_atual,
        e.codigo_estado_atual,
        e.conectividade,
        e.ultimo_evento_em,
        e.ultimo_heartbeat_em,
        d.device_id
      FROM equipamentos e
      LEFT JOIN dispositivos d ON d.equipamento_id = e.id
      ORDER BY e.nome ASC
    `;

    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function buscarEventosRecentes(limit = 10) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        ev.id,
        ev.device_id,
        ev.evento,
        ev.status,
        ev.codigo_estado,
        ev.conectividade,
        ev.ip,
        ev.rssi,
        ev.uptime_ms,
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

function calcularConectividade(eq, agora, offlineTimeoutMs) {
  if (eq.ultimo_heartbeat_em) {
    const ultimoHeartbeat = new Date(eq.ultimo_heartbeat_em).getTime();
    const diferenca = agora - ultimoHeartbeat;
    return diferenca <= offlineTimeoutMs ? "online" : "offline";
  }

  const conectividade = String(eq.conectividade || "").toLowerCase();
  if (conectividade.startsWith("online")) return "online";
  if (conectividade === "offline") return "offline";

  return "offline";
}

export async function obterResumoDashboard(req, res) {
  try {
    const offlineTimeoutMs = env.OFFLINE_TIMEOUT_MS;
    const agora = Date.now();

    const [rows, eventosRecentes] = await Promise.all([
      buscarEquipamentos(),
      buscarEventosRecentes(10)
    ]);

    const equipamentos = rows.map((eq) => ({
      ...eq,
      conectividade_calculada: calcularConectividade(eq, agora, offlineTimeoutMs)
    }));

    const resumo = {
      total: equipamentos.length,
      online: equipamentos.filter((e) => e.conectividade_calculada === "online").length,
      offline: equipamentos.filter((e) => e.conectividade_calculada === "offline").length,
      funcional: equipamentos.filter((e) => e.status_atual === "funcional").length,
      manutencao_curto_prazo: equipamentos.filter(
        (e) => e.status_atual === "manutencao_curto_prazo"
      ).length,
      indisponivel_prioridade: equipamentos.filter(
        (e) => e.status_atual === "indisponivel_prioridade"
      ).length,
      equipamentos,
      eventos_recentes: eventosRecentes
    };

    res.json(resumo);
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao obter resumo do dashboard",
      details: error.message
    });
  }
}
