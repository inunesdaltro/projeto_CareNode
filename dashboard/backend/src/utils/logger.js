// dashboard/backend/src/utils/logger.js
// Logger simples para uso no backend

function timestamp() {
  return new Date().toISOString();
}

export function logInfo(message, meta = null) {
  if (meta) {
    console.log(`[INFO] ${timestamp()} - ${message}`, meta);
  } else {
    console.log(`[INFO] ${timestamp()} - ${message}`);
  }
}

export function logWarn(message, meta = null) {
  if (meta) {
    console.warn(`[WARN] ${timestamp()} - ${message}`, meta);
  } else {
    console.warn(`[WARN] ${timestamp()} - ${message}`);
  }
}

export function logError(message, meta = null) {
  if (meta) {
    console.error(`[ERROR] ${timestamp()} - ${message}`, meta);
  } else {
    console.error(`[ERROR] ${timestamp()} - ${message}`);
  }
}

const logger = {
  info: logInfo,
  warn: logWarn,
  error: logError
};

export default logger;
