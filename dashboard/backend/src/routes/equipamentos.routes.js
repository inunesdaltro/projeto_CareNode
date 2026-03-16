// dashboard/backend/src/routes/equipamentos.routes.js

import { Router } from "express";
import {
  listarEquipamentos,
  cadastrarEquipamento,
  vincularDispositivo
} from "../controllers/equipamentos.controller.js";

const router = Router();

// GET /api/equipamentos
router.get("/", listarEquipamentos);

// POST /api/equipamentos
router.post("/", cadastrarEquipamento);

// POST /api/equipamentos/:id/vincular-dispositivo
router.post("/:id/vincular-dispositivo", vincularDispositivo);

export default router;
