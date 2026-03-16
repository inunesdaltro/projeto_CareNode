// dashboard/frontend/src/pages/EventosPage.jsx

import Header from "../components/layout/Header.jsx";
import PageContainer from "../components/layout/PageContainer.jsx";
import EventosRecentes from "../components/dashboard/EventosRecentes.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import useEventos from "../hooks/useEventos.js";

export default function EventosPage({ apiUrl }) {
  const { eventos, loading, error, recarregar } = useEventos(apiUrl, 100);

  return (
    <PageContainer>
      <Header
        title="Eventos"
        subtitle="Histórico dos eventos recebidos dos dispositivos IoT."
        rightContent={
          <button className="button button-primary" onClick={recarregar}>
            Atualizar eventos
          </button>
        }
      />

      {loading ? (
        <LoadingState
          title="Carregando eventos"
          description="Buscando histórico recente do backend."
        />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : !eventos.length ? (
        <EmptyState
          title="Nenhum evento encontrado"
          description="Assim que os dispositivos enviarem dados, eles aparecerão aqui."
        />
      ) : (
        <EventosRecentes eventos={eventos} />
      )}
    </PageContainer>
  );
}