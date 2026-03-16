#!/bin/zsh
set -euo pipefail

BASE_URL="http://localhost:3001/api"

echo "1) Health check"
curl -s "$BASE_URL/health" && echo "
"

echo "2) Cadastrando equipamento de teste (pode retornar erro 409 se já existir)"
curl -s -X POST "$BASE_URL/equipamentos"   -H "Content-Type: application/json"   -d '{
    "nome":"Bomba de Infusão 402",
    "codigo":"BOMBA-INFUSAO-402",
    "tipo":"Bomba de infusão",
    "marca":"Exemplo",
    "modelo":"X1",
    "patrimonio":"PAT-402",
    "setor":"UTI Adulto",
    "descricao":"Equipamento de teste automático"
  }' && echo "
"

echo "3) Enviando evento simulado"
curl -s -X POST "$BASE_URL/iot/eventos"   -H "Content-Type: application/json"   -d '{
    "c":"BOMBA-INFUSAO-402",
    "s":0,
    "ip":"192.168.0.50",
    "rssi":-55,
    "uptime_ms":1000
  }' && echo "
"

echo "4) Listando eventos"
curl -s "$BASE_URL/eventos?limit=5" && echo "
"

echo "5) Resumo do dashboard"
curl -s "$BASE_URL/dashboard/resumo" && echo "
"
