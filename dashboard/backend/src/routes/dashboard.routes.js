// dashboard/backend/src/routes/dashboard.routes.js

import { Router } from "express";
import { obterResumoDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

// GET /api/dashboard/resumo
router.get("/resumo", obterResumoDashboard);

export default router;
