// dashboard/frontend/src/components/equipamentos/EquipamentoForm.jsx

import { useState } from "react";

const initialFormState = {
  nome: "",
  codigo: "",
  patrimonio: "",
  setor: "",
  descricao: ""
};

export default function EquipamentoForm({
  onSubmit,
  loading = false,
  initialValues = initialFormState,
  submitLabel = "Cadastrar equipamento"
}) {
  const [form, setForm] = useState({
    ...initialFormState,
    ...initialValues
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.nome.trim() || !form.codigo.trim()) {
      return;
    }

    await onSubmit?.({
      nome: form.nome.trim(),
      codigo: form.codigo.trim(),
      patrimonio: form.patrimonio.trim(),
      setor: form.setor.trim(),
      descricao: form.descricao.trim()
    });

    setForm(initialFormState);
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3 className="section-title">Cadastro de equipamento</h3>
        <p className="form-description">
          Informe os dados básicos do equipamento para incluí-lo no dashboard.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="nome">Nome do equipamento</label>
          <input
            id="nome"
            name="nome"
            type="text"
            value={form.nome}
            onChange={handleChange}
            placeholder="Ex.: Bomba de Infusão 402"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="codigo">Código</label>
          <input
            id="codigo"
            name="codigo"
            type="text"
            value={form.codigo}
            onChange={handleChange}
            placeholder="Ex.: BOMBA-INFUSAO-402"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="patrimonio">Patrimônio</label>
          <input
            id="patrimonio"
            name="patrimonio"
            type="text"
            value={form.patrimonio}
            onChange={handleChange}
            placeholder="Ex.: PAT-000402"
          />
        </div>

        <div className="form-field">
          <label htmlFor="setor">Setor</label>
          <input
            id="setor"
            name="setor"
            type="text"
            value={form.setor}
            onChange={handleChange}
            placeholder="Ex.: UTI Adulto"
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="descricao">Descrição</label>
          <textarea
            id="descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descreva brevemente o equipamento"
            rows={4}
          />
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="button button-primary"
          disabled={loading}
        >
          {loading ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}