// dashboard/frontend/src/components/dashboard/EquipamentosTable.jsx

import EmptyState from "../common/EmptyState.jsx";
import StatusBadge from "./StatusBadge.jsx";
import ConnectivityBadge from "./ConnectivityBadge.jsx";

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(date);
}

export default function EquipamentosTable({ equipamentos = [] }) {
  if (!equipamentos.length) {
    return (
      <EmptyState
        title="Nenhum equipamento encontrado"
        description="Cadastre equipamentos ou aguarde o recebimento de eventos do sistema."
      />
    );
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3 className="section-title">Equipamentos monitorados</h3>
        <span className="table-count">{equipamentos.length} item(ns)</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Equipamento</th>
              <th>Código</th>
              <th>Tipo / Marca / Modelo</th>
              <th>Setor</th>
              <th>Device ID</th>
              <th>Status</th>
              <th>Conectividade</th>
              <th>Último evento</th>
              <th>Último heartbeat</th>
            </tr>
          </thead>

          <tbody>
            {equipamentos.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="table-primary">{item.nome}</div>
                  <div className="table-secondary">{item.patrimonio || item.descricao || "-"}</div>
                </td>

                <td>{item.codigo || "-"}</td>
                <td>{[item.tipo, item.marca, item.modelo].filter(Boolean).join(" / ") || "-"}</td>
                <td>{item.setor || "-"}</td>
                <td>{item.device_id || "-"}</td>

                <td>
                  <StatusBadge value={item.status_atual} />
                </td>

                <td>
                  <ConnectivityBadge
                    value={item.conectividade_calculada || item.conectividade}
                  />
                </td>

                <td>{formatDateTime(item.ultimo_evento_em)}</td>
                <td>{formatDateTime(item.ultimo_heartbeat_em)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
