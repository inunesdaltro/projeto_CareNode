// dashboard/backend/src/services/heartbeat.service.js
//
// Responsável por determinar "online/offline" por timeout de heartbeat.
// A regra: se agora - ultimo_heartbeat_em > OFFLINE_TIMEOUT_MS => offline
// Caso não exista heartbeat ainda => offline (ou "desconhecido" se preferir)

import env from "../config/env.js";

export function calcularConectividadePorHeartbeat(ultimoHeartbeatISO) {
  if (!ultimoHeartbeatISO) return "offline";

  const ultimo = new Date(ultimoHeartbeatISO).getTime();
  if (Number.isNaN(ultimo)) return "offline";

  const agora = Date.now();
  const diff = agora - ultimo;

  return diff <= env.OFFLINE_TIMEOUT_MS ? "online" : "offline";
}

export function calcularDiffHeartbeatMs(ultimoHeartbeatISO) {
  if (!ultimoHeartbeatISO) return null;

  const ultimo = new Date(ultimoHeartbeatISO).getTime();
  if (Number.isNaN(ultimo)) return null;

  return Date.now() - ultimo;
}

/**
 * Helper para enriquecer um equipamento vindo do banco
 * com conectividade_calculada (online/offline).
 */
export function enriquecerEquipamentoComConectividade(equipamentoRow) {
  const conectividade_calculada = calcularConectividadePorHeartbeat(
    equipamentoRow.ultimo_heartbeat_em
  );

  const diff_heartbeat_ms = calcularDiffHeartbeatMs(
    equipamentoRow.ultimo_heartbeat_em
  );

  return {
    ...equipamentoRow,
    conectividade_calculada,
    diff_heartbeat_ms
  };
}
