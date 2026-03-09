// dashboard/backend/src/middlewares/error.middleware.js

export default function errorMiddleware(err, req, res, next) {
  // Se alguém chamou next(err), cai aqui
  console.error("Erro capturado pelo middleware:", err);

  const status = err.statusCode || err.status || 500;

  res.status(status).json({
    error: err.message || "Erro interno do servidor",
    details: err.details || null
  });
}
