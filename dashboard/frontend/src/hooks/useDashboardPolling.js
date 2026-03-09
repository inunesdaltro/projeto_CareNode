// dashboard/frontend/src/hooks/useDashboardPolling.js

import { useEffect, useRef, useState } from "react";
import { getResumoDashboard } from "../api/dashboard.Api.js";

export default function useDashboardPolling(apiUrl, pollIntervalMs = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const timerRef = useRef(null);

  async function fetchResumo() {
    try {
      setError("");
      const resp = await getResumoDashboard(apiUrl);
      setData(resp);
      setLoading(false);
    } catch (err) {
      setError(err?.message || "Erro ao carregar dashboard.");
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResumo();

    timerRef.current = setInterval(() => {
      fetchResumo();
    }, pollIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, pollIntervalMs]);

  return { data, loading, error, refresh: fetchResumo };
}