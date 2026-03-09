// dashboard/frontend/src/hooks/useEquipamentos.js

import { useCallback, useEffect, useState } from "react";
import {
  getEquipamentos,
  createEquipamento,
  vincularDispositivo
} from "../api/equipamentosApi.js";

export default function useEquipamentos(apiUrl) {
  const [equipamentos, setEquipamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingEquipamento, setSavingEquipamento] = useState(false);
  const [savingVinculo, setSavingVinculo] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const carregarEquipamentos = useCallback(async () => {
    try {
      setError("");
      const data = await getEquipamentos(apiUrl);
      setEquipamentos(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err?.message || "Erro ao carregar equipamentos.");
      setLoading(false);
    }
  }, [apiUrl]);

  const cadastrarEquipamento = useCallback(
    async (payload) => {
      try {
        setSavingEquipamento(true);
        setError("");
        setSuccess("");

        const resp = await createEquipamento(apiUrl, payload);

        setSuccess(resp?.message || "Equipamento cadastrado com sucesso.");
        await carregarEquipamentos();
        return resp;
      } catch (err) {
        const msg = err?.message || "Erro ao cadastrar equipamento.";
        setError(msg);
        throw err;
      } finally {
        setSavingEquipamento(false);
      }
    },
    [apiUrl, carregarEquipamentos]
  );

  const criarVinculoDispositivo = useCallback(
    async ({ equipamentoId, payload }) => {
      try {
        setSavingVinculo(true);
        setError("");
        setSuccess("");

        const resp = await vincularDispositivo(apiUrl, equipamentoId, payload);

        setSuccess(resp?.message || "Dispositivo vinculado com sucesso.");
        await carregarEquipamentos();
        return resp;
      } catch (err) {
        const msg = err?.message || "Erro ao vincular dispositivo.";
        setError(msg);
        throw err;
      } finally {
        setSavingVinculo(false);
      }
    },
    [apiUrl, carregarEquipamentos]
  );

  useEffect(() => {
    carregarEquipamentos();
  }, [carregarEquipamentos]);

  return {
    equipamentos,
    loading,
    savingEquipamento,
    savingVinculo,
    error,
    success,
    recarregar: carregarEquipamentos,
    cadastrarEquipamento,
    criarVinculoDispositivo
  };
}