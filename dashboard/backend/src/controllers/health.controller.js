// dashboard/backend/src/controllers/health.controller.js

import env from "../config/env.js";

export function healthCheck(req, res) {
  res.json({
    status: "ok",
    service: "dashboard-backend",
    port: env.PORT,
    offline_timeout_ms: env.OFFLINE_TIMEOUT_MS
  });
}
