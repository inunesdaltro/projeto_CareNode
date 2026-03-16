// dashboard/backend/src/middlewares/notFound.middleware.js

export default function notFoundMiddleware(req, res, next) {
  res.status(404).json({
    error: "Rota não encontrada",
    method: req.method,
    path: req.originalUrl
  });
}
