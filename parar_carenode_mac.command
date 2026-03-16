#!/bin/zsh
set -euo pipefail
for port in 3001 5173; do
  pids="$(lsof -ti tcp:$port 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Encerrando porta $port..."
    echo "$pids" | xargs kill -9 2>/dev/null || true
  else
    echo "Nada rodando na porta $port."
  fi
done
