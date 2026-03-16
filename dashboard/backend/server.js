import http from "node:http";
import env from "./src/config/env.js";
import "./src/database/init.js";
import app from "./src/app.js";

const server = http.createServer(app);

server.listen(env.PORT, () => {
  console.log(`Backend CareNode disponível em http://localhost:${env.PORT}`);
});
