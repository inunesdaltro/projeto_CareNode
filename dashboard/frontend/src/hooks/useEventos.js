// dashboard/frontend/src/hooks/useEventos.js

import { useCallback, useEffect, useState } from "react";
import { getEventos } from "../api/eventosApi.js";

export default function useEventos(apiUrl, limit = 100) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const carregarEventos = useCallback(async () => {
    try {
      setError("");
      const data = await getEventos(apiUrl, limit);
      setEventos(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      setError(err?.message || "Erro ao carregar eventos.");
      setLoading(false);
    }
  }, [apiUrl, limit]);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  return {
    eventos,
    loading,
    error,
    recarregar: carregarEventos
  };
}