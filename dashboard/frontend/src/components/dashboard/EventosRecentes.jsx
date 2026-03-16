// dashboard/frontend/src/components/dashboard/EventosRecentes.jsx

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

function labelEvento(evt) {
  const v = String(evt || "").toLowerCase();
  if (v === "heartbeat") return "Heartbeat";
  if (v === "status_equipamento") return "Status";
  if (v === "conectividade") return "Conectividade";
  if (v === "telemetria_minima") return "Pacote mínimo";
  return evt || "Evento";
}

export default function EventosRecentes({ eventos = [] }) {
  if (!eventos.length) {
    return (
      <EmptyState
        title="Sem eventos recentes"
        description="Assim que o ESP32 enviar um evento, ele aparecerá aqui."
      />
    );
  }

  return (
    <div className="table-card">
      <div className="table-header">
        <h3 className="section-title">Eventos recentes</h3>
        <span className="table-count">{eventos.length} item(ns)</span>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data/hora</th>
              <th>Equipamento</th>
              <th>Device ID</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Conectividade</th>
              <th>RSSI</th>
            </tr>
          </thead>

          <tbody>
            {eventos.map((ev) => (
              <tr key={ev.id || `${ev.device_id}-${ev.recebido_em}`}>
                <td>{formatDateTime(ev.recebido_em)}</td>
                <td>{ev.equipamento_nome || "-"}</td>
                <td>{ev.device_id || "-"}</td>
                <td>{labelEvento(ev.evento)}</td>

                <td>
                  <StatusBadge value={ev.status} />
                </td>

                <td>
                  <ConnectivityBadge value={ev.conectividade} />
                </td>

                <td>{ev.rssi ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}