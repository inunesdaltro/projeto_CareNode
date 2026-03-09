// dashboard/frontend/src/components/equipamentos/VinculoDispositivoForm.jsx

import { useEffect, useMemo, useState } from "react";

export default function VinculoDispositivoForm({
  equipamentos = [],
  onSubmit,
  loading = false
}) {
  const [equipamentoId, setEquipamentoId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [descricao, setDescricao] = useState("");

  const options = useMemo(() => {
    return (equipamentos || []).map((e) => ({
      id: String(e.id),
      label: `${e.nome} — ${e.codigo}`
    }));
  }, [equipamentos]);

  useEffect(() => {
    // pré-seleciona o primeiro se houver
    if (!equipamentoId && options.length) {
      setEquipamentoId(options[0].id);
    }
  }, [options, equipamentoId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!equipamentoId || !deviceId.trim()) return;

    await onSubmit?.({
      equipamentoId,
      payload: {
        device_id: deviceId.trim(),
        descricao: descricao.trim()
      }
    });

    setDeviceId("");
    setDescricao("");
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3 className="section-title">Vincular dispositivo (botão) ao equipamento</h3>
        <p className="form-description">
          Informe o <code>device_id</code> do ESP32 e selecione o equipamento correspondente.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="equipamento_id">Equipamento</label>
          <select
            id="equipamento_id"
            value={equipamentoId}
            onChange={(e) => setEquipamentoId(e.target.value)}
            required
          >
            {options.length ? (
              options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))
            ) : (
              <option value="">Nenhum equipamento cadastrado</option>
            )}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="device_id">Device ID</label>
          <input
            id="device_id"
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="Ex.: BTN-ESP32-402"
            required
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="descricao_dispositivo">Descrição (opcional)</label>
          <input
            id="descricao_dispositivo"
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex.: Botão instalado na UTI Adulto, ao lado do equipamento"
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="button button-primary"
          disabled={loading || !options.length}
        >
          {loading ? "Vinculando..." : "Vincular dispositivo"}
        </button>
      </div>
    </form>
  );
}