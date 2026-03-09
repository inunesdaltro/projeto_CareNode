// dashboard/backend/src/utils/statusMap.js
// Mapeamentos auxiliares de status e conectividade

export const STATUS_MAP = {
  0: "funcional",
  1: "manutencao_curto_prazo",
  2: "indisponivel_prioridade"
};

export const STATUS_LABEL_MAP = {
  funcional: "Funcional",
  manutencao_curto_prazo: "Manutenção (curto prazo)",
  indisponivel_prioridade: "Indisponível (prioridade)",
  desconhecido: "Desconhecido"
};

export const CONNECTIVITY_LABEL_MAP = {
  online: "Online",
  offline: "Offline",
  online_restabelecida: "Online restabelecida",
  desconhecido: "Desconhecido"
};

export function getStatusFromCode(code) {
  const normalized = Number(code);
  return Object.prototype.hasOwnProperty.call(STATUS_MAP, normalized)
    ? STATUS_MAP[normalized]
    : "desconhecido";
}

export function getCodeFromStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  for (const [code, value] of Object.entries(STATUS_MAP)) {
    if (value === normalized) return Number(code);
  }

  return null;
}

export function getStatusLabel(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return STATUS_LABEL_MAP[normalized] || STATUS_LABEL_MAP.desconhecido;
}

export function getConnectivityLabel(connectivity) {
  const normalized = String(connectivity || "").trim().toLowerCase();
  return CONNECTIVITY_LABEL_MAP[normalized] || CONNECTIVITY_LABEL_MAP.desconhecido;
}
