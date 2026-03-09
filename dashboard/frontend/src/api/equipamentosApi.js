// dashboard/frontend/src/api/equipamentosApi.js

import { apiGet, apiPost } from "./client.js";

export async function getEquipamentos(apiUrl) {
  return await apiGet(apiUrl, "/equipamentos");
}

export async function createEquipamento(apiUrl, payload) {
  return await apiPost(apiUrl, "/equipamentos", payload);
}

export async function vincularDispositivo(apiUrl, equipamentoId, payload) {
  return await apiPost(
    apiUrl,
    `/equipamentos/${equipamentoId}/vincular-dispositivo`,
    payload
  );
}