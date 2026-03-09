// dashboard/frontend/src/pages/DashboardPage.jsx

import Header from "../components/layout/Header.jsx";
import PageContainer from "../components/layout/PageContainer.jsx";
import MetricCard from "../components/dashboard/MetricCard.jsx";
import EquipamentosTable from "../components/dashboard/EquipamentosTable.jsx";
import EventosRecentes from "../components/dashboard/EventosRecentes.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import useDashboardPolling from "../hooks/useDashboardPolling.js";

export default function DashboardPage({ apiUrl, pollIntervalMs }) {
  const { data, loading, error, refresh } = useDashboardPolling(apiUrl, pollIntervalMs);

  if (loading) {
    return (
      <PageContainer>
        <Header
          title="Dashboard"
          subtitle="Visão geral do parque tecnológico monitorado por dispositivos IoT."
        />
        <LoadingState
          title="Carregando dashboard"
          description="Buscando status dos equipamentos e conectividade."
        />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Header
          title="Dashboard"
          subtitle="Visão geral do parque tecnológico monitorado por dispositivos IoT."
          rightContent={
            <button className="button button-primary" onClick={refresh}>
              Tentar novamente
            </button>
          }
        />
        <div className="alert alert-error">{error}</div>
      </PageContainer>
    );
  }

  const equipamentos = data?.equipamentos || [];

  return (
    <PageContainer>
      <Header
        title="Dashboard"
        subtitle="Acompanhe status operacional, conectividade e panorama do parque tecnológico."
        rightContent={
          <button className="button button-primary" onClick={refresh}>
            Atualizar agora
          </button>
        }
      />

      <div className="metrics-grid">
        <MetricCard title="Total de equipamentos" value={data?.total ?? 0} />
        <MetricCard title="Online" value={data?.online ?? 0} tone="success" />
        <MetricCard title="Offline" value={data?.offline ?? 0} tone="danger" />
        <MetricCard title="Funcional" value={data?.funcional ?? 0} tone="success" />
        <MetricCard
          title="Manutenção"
          value={data?.manutencao_curto_prazo ?? 0}
          tone="warning"
        />
        <MetricCard
          title="Indisponível"
          value={data?.indisponivel_prioridade ?? 0}
          tone="danger"
        />
      </div>

      <div className="page-stack">
        <EquipamentosTable equipamentos={equipamentos} />

        <EventosRecentes eventos={data?.eventos_recentes || []} />

        {!equipamentos.length ? (
          <EmptyState
            title="Sem equipamentos cadastrados"
            description="Cadastre um equipamento e vincule um dispositivo para começar o monitoramento."
          />
        ) : null}
      </div>
    </PageContainer>
  );
}