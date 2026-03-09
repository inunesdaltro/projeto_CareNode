// dashboard/backend/src/middlewares/validateJson.middleware.js

export default function validateJsonMiddleware(req, res, next) {
  // Só valida em métodos que normalmente têm body
  const method = req.method.toUpperCase();
  const needsBody = ["POST", "PUT", "PATCH"].includes(method);

  if (!needsBody) return next();

  // Se o Express não conseguiu parsear JSON, normalmente já daria erro,
  // mas aqui garantimos mensagens claras e evitamos body vazio acidental.
  const contentType = req.headers["content-type"] || "";

  if (!contentType.includes("application/json")) {
    return res.status(415).json({
      error: "Content-Type inválido. Use application/json."
    });
  }

  // Body vazio (ex: {} ou nada)
  if (req.body == null || (typeof req.body === "object" && Object.keys(req.body).length === 0)) {
    return res.status(400).json({
      error: "Corpo da requisição vazio ou JSON inválido."
    });
  }

  next();
}
