// dashboard/frontend/src/api/eventosApi.js

import { apiGet } from "./client.js";

// OBS: no backend atual ainda não criamos GET /api/eventos.
// Este arquivo já fica pronto para quando você adicionar a rota.
export async function getEventos(apiUrl, limit = 100) {
  return await apiGet(apiUrl, `/eventos?limit=${encodeURIComponent(limit)}`);
}