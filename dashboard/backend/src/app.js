// dashboard/backend/src/app.js

import express from "express";
import cors from "cors";

import validateJsonMiddleware from "./middlewares/validateJson.middleware.js";
import notFoundMiddleware from "./middlewares/notFound.middleware.js";
import errorMiddleware from "./middlewares/error.middleware.js";

import healthRoutes from "./routes/health.routes.js";
import equipamentosRoutes from "./routes/equipamentos.routes.js";
import eventosRoutes from "./routes/eventos.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(validateJsonMiddleware);

app.use("/api/health", healthRoutes);
app.use("/api/equipamentos", equipamentosRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/iot/eventos", eventosRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
