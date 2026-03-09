// dashboard/frontend/src/utils/statusLabel.js

export function getStatusLabel(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "funcional") return "Funcional";
  if (value === "manutencao_curto_prazo") return "Manutenção (curto prazo)";
  if (value === "indisponivel_prioridade") return "Indisponível (prioridade)";

  return "Desconhecido";
}

export function getConnectivityLabel(connectivity) {
  const value = String(connectivity || "").trim().toLowerCase();

  if (value === "online") return "Online";
  if (value === "offline") return "Offline";
  if (value === "online_restabelecida") return "Online restabelecida";

  return "Desconhecido";
}