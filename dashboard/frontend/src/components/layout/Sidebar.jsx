// dashboard/frontend/src/components/layout/Sidebar.jsx

export default function Sidebar({
  currentPage,
  onNavigate,
  apiUrl,
  pollIntervalMs
}) {
  const items = [
    { key: "dashboard", label: "Dashboard" },
    { key: "equipamentos", label: "Equipamentos" },
    { key: "cadastro", label: "Cadastro" },
    { key: "eventos", label: "Eventos" }
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-title">Engenharia Clínica</div>
        <div className="brand-subtitle">Monitoramento IoT</div>
      </div>

      <nav className="nav">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={currentPage === item.key ? "nav-item active" : "nav-item"}
            onClick={() => onNavigate?.(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="hint">API: {apiUrl}</div>
        <div className="hint">Polling: {pollIntervalMs} ms</div>
      </div>
    </aside>
  );
}