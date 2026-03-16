// dashboard/frontend/src/components/equipamentos/EquipamentoCard.jsx

import StatusBadge from "../dashboard/StatusBadge.jsx";
import ConnectivityBadge from "../dashboard/ConnectivityBadge.jsx";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(date);
}

export default function EquipamentoCard({ equipamento }) {
  if (!equipamento) return null;

  return (
    <div className="equipment-card">
      <div className="equipment-card-header">
        <div>
          <h3 className="equipment-title">{equipamento.nome}</h3>
          <p className="equipment-subtitle">
            {equipamento.tipo || "Tipo não informado"}
            {equipamento.marca || equipamento.modelo
              ? ` · ${[equipamento.marca, equipamento.modelo].filter(Boolean).join(" / ")}`
              : ""}
          </p>
        </div>

        <div className="equipment-badges">
          <StatusBadge value={equipamento.status_atual} />
          <ConnectivityBadge
            value={equipamento.conectividade_calculada || equipamento.conectividade}
          />
        </div>
      </div>

      <div className="equipment-grid">
        <div>
          <span className="equipment-label">Código</span>
          <span className="equipment-value">{equipamento.codigo || "-"}</span>
        </div>

        <div>
          <span className="equipment-label">Patrimônio</span>
          <span className="equipment-value">{equipamento.patrimonio || "-"}</span>
        </div>

        <div>
          <span className="equipment-label">Setor</span>
          <span className="equipment-value">{equipamento.setor || "-"}</span>
        </div>

        <div>
          <span className="equipment-label">Device ID</span>
          <span className="equipment-value">{equipamento.device_id || "-"}</span>
        </div>

        <div>
          <span className="equipment-label">Marca</span>
          <span className="equipment-value">{equipamento.marca || "-"}</span>
        </div>

        <div>
          <span className="equipment-label">Modelo</span>
          <span className="equipment-value">{equipamento.modelo || "-"}</span>
        </div>

        <div>
          <span className="equipment-label">Último evento</span>
          <span className="equipment-value">{formatDateTime(equipamento.ultimo_evento_em)}</span>
        </div>

        <div>
          <span className="equipment-label">Último heartbeat</span>
          <span className="equipment-value">{formatDateTime(equipamento.ultimo_heartbeat_em)}</span>
        </div>

        <div>
          <span className="equipment-label">Descrição</span>
          <span className="equipment-value">{equipamento.descricao || "-"}</span>
        </div>
      </div>
    </div>
  );
}
