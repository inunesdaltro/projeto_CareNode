// dashboard/backend/src/utils/time.js
// Utilitários de data/hora para backend

export function nowISO() {
  return new Date().toISOString();
}

export function toTimestamp(value) {
  if (!value) return null;

  const date = new Date(value);
  const time = date.getTime();

  return Number.isNaN(time) ? null : time;
}

export function diffMs(from, to = new Date()) {
  const fromTs = toTimestamp(from);
  const toTs = toTimestamp(to);

  if (fromTs === null || toTs === null) return null;
  return toTs - fromTs;
}

export function isExpired(from, timeoutMs, to = new Date()) {
  const difference = diffMs(from, to);
  if (difference === null) return true;
  return difference > timeoutMs;
}

export function formatDateTimeBR(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(date);
}
