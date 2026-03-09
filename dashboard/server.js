// dashboard/backend/server.js

import env from "./src/config/env.js";
import app from "./src/app.js";
import "./src/database/init.js";

const server = app.listen(env.PORT, () => {
  console.log(`Servidor rodando em http://localhost:${env.PORT}`);
});

export default server;
