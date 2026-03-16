// dashboard/frontend/src/components/dashboard/StatusBadge.jsx

function classByStatus(value) {
  const v = String(value || "").toLowerCase();

  if (v === "funcional") return "badge badge-success";
  if (v === "manutencao_curto_prazo") return "badge badge-warning";
  if (v === "indisponivel_prioridade") return "badge badge-danger";

  return "badge badge-unknown";
}

function labelByStatus(value) {
  const v = String(value || "").toLowerCase();

  if (v === "funcional") return "Funcional";
  if (v === "manutencao_curto_prazo") return "Manutenção (curto prazo)";
  if (v === "indisponivel_prioridade") return "Indisponível (prioridade)";

  return "Desconhecido";
}

export default function StatusBadge({ value }) {
  return <span className={classByStatus(value)}>{labelByStatus(value)}</span>;
}