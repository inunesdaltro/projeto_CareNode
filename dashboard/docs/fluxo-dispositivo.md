# Fluxo do Dispositivo IoT (ESP32) — Botão Único + LEDs + JSON mínimo

## 1. Visão geral
Este documento descreve o comportamento esperado do dispositivo IoT baseado em ESP32 utilizado para registrar o estado operacional de equipamentos médico-hospitalares e enviar telemetria mínima ao backend do dashboard.

O dispositivo possui:
- 1 botão (entrada)
- 3 LEDs de estado (Verde, Amarelo, Vermelho)
- 1 LED de conectividade (Azul)

Além disso, o dispositivo:
- implementa seleção e confirmação com um único botão
- evita acionamentos acidentais via clique longo
- envia somente o código do equipamento e o status atual
- mantém memória do último estado confirmado
- usa heartbeats mínimos para o backend calcular online/offline por timeout

---

## 2. Estados do equipamento
O dispositivo trabalha com 3 estados operacionais, mapeados pelo campo `s`:

| LED | `s` | Status resolvido no backend | Significado clínico/técnico |
|-----|-----|-----------------------------|------------------------------|
| Verde    | 0 | `funcional`               | Equipamento funcional |
| Amarelo  | 1 | `manutencao_curto_prazo`  | Funcional, mas requer manutenção em curto prazo |
| Vermelho | 2 | `indisponivel_prioridade` | Indisponível, requer manutenção com prioridade |

---

## 3. JSON mínimo enviado
O backend passa a resolver nome, tipo, marca, modelo, patrimônio e setor a partir do cadastro do equipamento. Assim, a ESP32 precisa enviar apenas:

- `c`: código do equipamento
- `s`: código do status atual

Exemplo:

```json
{
  "c": "BOMBA-INFUSAO-402",
  "s": 2
}
```

Esse mesmo formato pode ser usado tanto para confirmação do estado quanto para heartbeat periódico.

---

## 4. Estratégia de conectividade
O backend calcula se o equipamento está online ou offline comparando o horário do último pacote recebido com o timeout de heartbeat.

### Consequência prática
- quando a ESP32 confirma um novo estado, envia um pacote mínimo
- enquanto estiver conectada, envia o mesmo pacote mínimo periodicamente como heartbeat
- se parar de enviar por tempo demais, o dashboard marca como offline
- quando reconectar, o primeiro heartbeat já restabelece o estado online
