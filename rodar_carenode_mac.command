#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
DASH_DIR="$ROOT_DIR/dashboard"
BACK_DIR="$DASH_DIR/backend"
FRONT_DIR="$DASH_DIR/frontend"
INFO_FILE="$ROOT_DIR/ENDERECOS_LOCAIS.txt"

get_ip() {
  local ip=""
  for iface in en0 en1 en2; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return 0
    fi
  done

  ip="$(ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2; exit}')"
  echo "$ip"
}

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:"$port" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Encerrando processo na porta $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}

ensure_backend_env() {
  cat > "$BACK_DIR/.env" <<'EOF'
PORT=3001
DB_PATH=./src/database/database.sqlite
OFFLINE_TIMEOUT_MS=90000
EOF
}

ensure_frontend_env() {
  cat > "$FRONT_DIR/.env" <<'EOF'
VITE_API_URL=http://localhost:3001/api
VITE_POLL_INTERVAL_MS=5000
EOF
}

install_backend() {
  cd "$BACK_DIR"
  npm config set registry https://registry.npmjs.org/ >/dev/null

  if [[ -d node_modules/dotenv && -d node_modules/express && -d node_modules/cors ]]; then
    echo "Dependências do backend já estão presentes."
    return 0
  fi

  echo "Instalando dependências do backend..."
  rm -rf node_modules package-lock.json
  if ! npm install --no-fund --no-audit --package-lock=false; then
    echo "Falha no npm install do backend. Tentando instalar pacote por pacote..."
    rm -rf node_modules package-lock.json
    npm install dotenv express cors --save --no-fund --no-audit --package-lock=false
  fi
}

install_frontend() {
  cd "$FRONT_DIR"
  npm config set registry https://registry.npmjs.org/ >/dev/null

  if [[ -d node_modules/react && -d node_modules/react-dom && -d node_modules/vite ]]; then
    echo "Dependências do frontend já estão presentes."
    return 0
  fi

  echo "Instalando dependências do frontend..."
  rm -rf node_modules package-lock.json
  if ! npm install --no-fund --no-audit --package-lock=false; then
    echo "Falha no npm install do frontend. Tentando instalar pacote por pacote..."
    rm -rf node_modules package-lock.json
    npm install react react-dom --save --no-fund --no-audit --package-lock=false
    npm install vite @vitejs/plugin-react --save-dev --no-fund --no-audit --package-lock=false
  fi
}

generate_ino_copy() {
  local mac_ip="$1"
  local source_ino="$ROOT_DIR/botao.ino"
  local target_ino="$ROOT_DIR/botao_mac_local.ino"

  if [[ ! -f "$source_ino" ]]; then
    return 0
  fi

  python3 - "$source_ino" "$target_ino" "$mac_ip" <<'PYCODE'
import sys
from pathlib import Path
src = Path(sys.argv[1])
out = Path(sys.argv[2])
ip = sys.argv[3].strip()
text = src.read_text(encoding='utf-8')
text = text.replace('http://IP_DO_MAC:3001/api/iot/eventos', f'http://{ip}:3001/api/iot/eventos' if ip else 'http://IP_DO_MAC:3001/api/iot/eventos')
out.write_text(text, encoding='utf-8')
PYCODE
}

write_info_file() {
  local mac_ip="$1"
  cat > "$INFO_FILE" <<EOF
CARENODE — ENDEREÇOS LOCAIS

Frontend do dashboard:
http://localhost:5173

Backend da API:
http://localhost:3001

Health check da API:
http://localhost:3001/api/health

Rota de eventos para testar no navegador/curl:
http://localhost:3001/api/iot/eventos

URL para colocar no .ino da ESP32 real (na mesma rede Wi-Fi do Mac):
http://${mac_ip:-IP_DO_MAC}:3001/api/iot/eventos

Importante:
- No navegador do Mac, use localhost.
- Na ESP32 real, NÃO use localhost.
- A ESP32 deve usar o IP do seu Mac na rede local.
- O código do equipamento no .ino deve ser igual ao código cadastrado no dashboard.
EOF
}

start_terminals() {
  kill_port 3001
  kill_port 5173

  osascript <<OSA
 tell application "Terminal"
   activate
   do script "cd '$BACK_DIR'; npm start"
   delay 1
   do script "cd '$FRONT_DIR'; npm run dev"
 end tell
OSA
}

main() {
  echo "Preparando projeto CareNode no Mac..."
  ensure_backend_env
  ensure_frontend_env
  install_backend
  install_frontend

  local mac_ip
  mac_ip="$(get_ip)"
  generate_ino_copy "$mac_ip"
  write_info_file "$mac_ip"
  start_terminals

  sleep 3
  open "http://localhost:5173" || true

  echo
  echo "Projeto iniciado."
  echo "Frontend: http://localhost:5173"
  echo "Backend:  http://localhost:3001"
  echo "Health:   http://localhost:3001/api/health"
  echo "ESP32:    http://${mac_ip:-IP_DO_MAC}:3001/api/iot/eventos"
  echo
  echo "Arquivo gerado com os endereços: $INFO_FILE"
  echo "Arquivo gerado para a ESP32:     $ROOT_DIR/botao_mac_local.ino"
}

main "$@"
