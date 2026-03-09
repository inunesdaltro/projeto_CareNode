// dashboard/frontend/src/pages/CadastroPage.jsx

import Header from "../components/layout/Header.jsx";
import PageContainer from "../components/layout/PageContainer.jsx";
import EquipamentoForm from "../components/equipamentos/EquipamentoForm.jsx";
import VinculoDispositivoForm from "../components/equipamentos/VinculoDispositivoForm.jsx";
import useEquipamentos from "../hooks/useEquipamentos.js";

export default function CadastroPage({ apiUrl }) {
  const {
    equipamentos,
    loading,
    savingEquipamento,
    savingVinculo,
    error,
    success,
    cadastrarEquipamento,
    criarVinculoDispositivo
  } = useEquipamentos(apiUrl);

  async function handleCadastrarEquipamento(payload) {
    await cadastrarEquipamento(payload);
  }

  async function handleVincularDispositivo({ equipamentoId, payload }) {
    await criarVinculoDispositivo({ equipamentoId, payload });
  }

  return (
    <PageContainer>
      <Header
        title="Cadastro"
        subtitle="Cadastre equipamentos e vincule cada botão/dispositivo IoT ao equipamento correspondente."
      />

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="page-grid">
        <EquipamentoForm
          onSubmit={handleCadastrarEquipamento}
          loading={savingEquipamento}
          submitLabel="Cadastrar equipamento"
        />

        <VinculoDispositivoForm
          equipamentos={equipamentos}
          onSubmit={handleVincularDispositivo}
          loading={savingVinculo || loading}
        />
      </div>
    </PageContainer>
  );
}