// dashboard/backend/src/services/status.service.js
//
// Centraliza regras de status operacional e tradução de códigos.
// Use este serviço para manter consistência entre firmware, banco e dashboard.

export const ESTADOS = {
  0: "funcional",
  1: "manutencao_curto_prazo",
  2: "indisponivel_prioridade"
};

export function statusPorCodigoEstado(codigoEstado) {
  if (codigoEstado === null || codigoEstado === undefined) return null;
  const n = Number(codigoEstado);
  return Object.prototype.hasOwnProperty.call(ESTADOS, n) ? ESTADOS[n] : null;
}

export function codigoEstadoPorStatus(status) {
  if (!status) return null;

  const normalized = String(status).trim().toLowerCase();
  for (const [k, v] of Object.entries(ESTADOS)) {
    if (v === normalized) return Number(k);
  }
  return null;
}

/**
 * Normaliza o payload que vem do ESP32/IoT:
 * - garante strings padronizadas
 * - completa status <-> codigo_estado quando possível
 */
export function normalizarPayloadStatus(payload) {
  const out = { ...payload };

  // Normaliza evento
  if (!out.evento) out.evento = "status_equipamento";

  // Normaliza conectividade
  if (out.conectividade) {
    const c = String(out.conectividade).trim().toLowerCase();
    out.conectividade = c === "online" ? "online" : c === "offline" ? "offline" : out.conectividade;
  }

  // Se tiver codigo_estado mas não tiver status, preenche
  if ((out.codigo_estado !== undefined && out.codigo_estado !== null) && !out.status) {
    const s = statusPorCodigoEstado(out.codigo_estado);
    if (s) out.status = s;
  }

  // Se tiver status mas não tiver codigo_estado, tenta mapear
  if (out.status && (out.codigo_estado === undefined || out.codigo_estado === null)) {
    const k = codigoEstadoPorStatus(out.status);
    if (k !== null) out.codigo_estado = k;
  }

  return out;
}

/**
 * Decide quais campos do equipamento atualizar com base no evento.
 * Retorna um objeto pronto para repository atualizarEquipamento().
 */
export function prepararAtualizacaoEquipamento(payload) {
  const update = {};

  // Conectividade se vier explícito
  if (typeof payload.conectividade === "string") {
    update.conectividade = payload.conectividade;
  }

  // Atualiza status para evento de status
  if (payload.evento === "status_equipamento") {
    if (typeof payload.status === "string") update.status_atual = payload.status;
    if (payload.codigo_estado !== undefined && payload.codigo_estado !== null) {
      update.codigo_estado_atual = payload.codigo_estado;
    }
    // evento de status normalmente implica online
    if (!update.conectividade) update.conectividade = "online";
  }

  // Heartbeat não muda status operacional; só garante online
  if (payload.evento === "heartbeat") {
    update.conectividade = "online";
  }

  // Reconexão também implica online
  if (payload.evento === "conectividade" && payload.conectividade === "online_restabelecida") {
    update.conectividade = "online";
  }

  return update;
}

/**
 * (Opcional) Labels para UI (frontend), se você quiser reaproveitar no backend.
 */
export function labelStatus(status) {
  const s = String(status || "").toLowerCase();
  if (s === "funcional") return "Funcional";
  if (s === "manutencao_curto_prazo") return "Manutenção (curto prazo)";
  if (s === "indisponivel_prioridade") return "Indisponível (prioridade)";
  return "Desconhecido";
}
