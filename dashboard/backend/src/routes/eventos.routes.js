// dashboard/backend/src/routes/eventos.routes.js

import { Router } from "express";
import {
  listarEventosIoT,
  receberEventoIoT
} from "../controllers/eventos.controller.js";

const router = Router();

// GET /api/eventos
router.get("/", listarEventosIoT);

// POST /api/iot/eventos
router.post("/", receberEventoIoT);

export default router;
