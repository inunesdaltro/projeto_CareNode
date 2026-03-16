import { useEffect, useMemo, useState } from "react";
import DashboardPage from "./pages/DashboardPage.jsx";
import CadastroPage from "./pages/CadastroPage.jsx";
import EquipamentosPage from "./pages/EquipamentosPage.jsx";
import EventosPage from "./pages/EventosPage.jsx";

const PAGES = {
  dashboard: "dashboard",
  equipamentos: "equipamentos",
  cadastro: "cadastro",
  eventos: "eventos"
};

export default function App() {
  const [page, setPage] = useState(PAGES.dashboard);

  const apiUrl = useMemo(() => {
    return import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  }, []);

  const pollIntervalMs = useMemo(() => {
    const v = Number(import.meta.env.VITE_POLL_INTERVAL_MS || 5000);
    return Number.isFinite(v) ? v : 5000;
  }, []);

  useEffect(() => {
    document.title = "CareNode | Engenharia Clínica";
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-kicker">CareNode</div>
          <div className="brand-title">Engenharia Clínica</div>
          <div className="brand-subtitle">Monitoramento IoT inspirado na identidade visual da Ebserh</div>
        </div>

        <nav className="nav">
          <button
            className={page === PAGES.dashboard ? "nav-item active" : "nav-item"}
            onClick={() => setPage(PAGES.dashboard)}
          >
            Dashboard
          </button>

          <button
            className={page === PAGES.equipamentos ? "nav-item active" : "nav-item"}
            onClick={() => setPage(PAGES.equipamentos)}
          >
            Equipamentos
          </button>

          <button
            className={page === PAGES.cadastro ? "nav-item active" : "nav-item"}
            onClick={() => setPage(PAGES.cadastro)}
          >
            Cadastro
          </button>

          <button
            className={page === PAGES.eventos ? "nav-item active" : "nav-item"}
            onClick={() => setPage(PAGES.eventos)}
          >
            Eventos
          </button>
        </nav>

        <div className="sidebar-panel">
          <div className="sidebar-panel-title">Como funciona</div>
          <div className="sidebar-panel-text">
            Cada ESP32 envia apenas o código cadastrado do equipamento e o status atual. O dashboard resolve nome, marca, modelo e setor pelo banco.
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="hint">API: {apiUrl}</div>
          <div className="hint">Polling: {pollIntervalMs} ms</div>
        </div>
      </aside>

      <main className="main">
        {page === PAGES.dashboard && (
          <DashboardPage apiUrl={apiUrl} pollIntervalMs={pollIntervalMs} />
        )}

        {page === PAGES.equipamentos && <EquipamentosPage apiUrl={apiUrl} />}

        {page === PAGES.cadastro && <CadastroPage apiUrl={apiUrl} />}

        {page === PAGES.eventos && <EventosPage apiUrl={apiUrl} />}
      </main>
    </div>
  );
}
