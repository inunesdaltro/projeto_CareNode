// dashboard/frontend/src/utils/timeoutOffline.js

export function calcularConectividadePorHeartbeat(
  ultimoHeartbeat,
  offlineTimeoutMs = 90000
) {
  if (!ultimoHeartbeat) return "offline";

  const timestamp = new Date(ultimoHeartbeat).getTime();
  if (Number.isNaN(timestamp)) return "offline";

  const diff = Date.now() - timestamp;

  return diff <= offlineTimeoutMs ? "online" : "offline";
}

export function calcularDiffHeartbeatMs(ultimoHeartbeat) {
  if (!ultimoHeartbeat) return null;

  const timestamp = new Date(ultimoHeartbeat).getTime();
  if (Number.isNaN(timestamp)) return null;

  return Date.now() - timestamp;
}