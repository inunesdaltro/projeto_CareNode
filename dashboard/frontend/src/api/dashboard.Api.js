// dashboard/frontend/src/api/dashboard.Api.js

import { apiGet } from "./client.js";

export async function getResumoDashboard(apiUrl) {
  return await apiGet(apiUrl, "/dashboard/resumo");
}