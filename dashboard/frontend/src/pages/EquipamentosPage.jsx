// dashboard/frontend/src/pages/EquipamentosPage.jsx

import { useMemo, useState } from "react";
import Header from "../components/layout/Header.jsx";
import PageContainer from "../components/layout/PageContainer.jsx";
import EquipamentoCard from "../components/equipamentos/EquipamentoCard.jsx";
import FiltroEquipamentos from "../components/equipamentos/FiltroEquipamentos.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import EmptyState from "../components/common/EmptyState.jsx";
import useEquipamentos from "../hooks/useEquipamentos.js";

function filtrarEquipamentos(lista, termo) {
  const q = String(termo || "").trim().toLowerCase();
  if (!q) return lista;

  return lista.filter((item) => {
    const fields = [
      item.nome,
      item.codigo,
      item.tipo,
      item.marca,
      item.modelo,
      item.setor,
      item.device_id,
      item.patrimonio,
      item.descricao
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return fields.includes(q);
  });
}

export default function EquipamentosPage({ apiUrl }) {
  const [search, setSearch] = useState("");

  const { equipamentos, loading, error, recarregar } = useEquipamentos(apiUrl);

  const filtrados = useMemo(() => {
    return filtrarEquipamentos(equipamentos, search);
  }, [equipamentos, search]);

  return (
    <PageContainer>
      <Header
        title="Equipamentos"
        subtitle="Consulte os equipamentos cadastrados, seus vínculos com botões IoT e o último estado conhecido."
        rightContent={
          <button className="button button-primary" onClick={recarregar}>
            Atualizar lista
          </button>
        }
      />

      <FiltroEquipamentos
        search={search}
        onSearchChange={setSearch}
        total={filtrados.length}
      />

      {loading ? (
        <LoadingState
          title="Carregando equipamentos"
          description="Buscando dados do backend."
        />
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : !filtrados.length ? (
        <EmptyState
          title="Nenhum equipamento encontrado"
          description="Cadastre equipamentos ou ajuste o filtro de busca."
        />
      ) : (
        <div className="equipment-list">
          {filtrados.map((equipamento) => (
            <EquipamentoCard key={equipamento.id} equipamento={equipamento} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
