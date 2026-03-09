# Fluxo do Dispositivo IoT (ESP32) — Botão Único + LEDs + JSON

## 1. Visão geral
Este documento descreve o comportamento esperado do dispositivo IoT baseado em ESP32 utilizado para registrar o estado operacional de equipamentos médico-hospitalares e enviar eventos em formato JSON para o backend do dashboard.

O dispositivo possui:
- 1 botão (entrada)
- 3 LEDs de estado (Verde, Amarelo, Vermelho)
- 1 LED de conectividade (Azul)

Além disso, o dispositivo:
- implementa seleção e confirmação com um único botão
- evita acionamentos acidentais via clique longo
- envia eventos estruturados ao backend (status / heartbeat / conectividade)
- mantém memória do último estado confirmado
- tenta recuperar comunicação em caso de queda de rede

---

## 2. Estados do equipamento
O dispositivo trabalha com 3 estados operacionais, mapeados por `codigo_estado`:

| LED | `codigo_estado` | `status`                    | Significado clínico/técnico |
|-----|------------------|----------------------------|------------------------------|
| Verde    | 0 | `funcional`               | Equipamento funcional |
| Amarelo  | 1 | `manutencao_curto_prazo`   | Funcional, mas requer manutenção em curto prazo |
| Vermelho | 2 | `indisponivel_prioridade`  | Indisponível, requer manutenção com prioridade |

---

## 3. Interface do usuário (botão único)
O botão executa duas ações principais:

### 3.1 Clique curto (seleção)
- Cada clique curto avança a seleção entre os 3 estados.
- A seleção é visualizada pelo LED do estado aceso.

#### Seleção temporária (timeout)
- Após um clique curto, inicia-se uma janela de tempo de **5 segundos**.
- Se o usuário **não confirmar** a seleção dentro desse período:
  - a seleção é cancelada
  - o dispositivo retorna ao **último estado confirmado** (`estadoAtual`)
  - isso evita que o equipamento permaneça em estado “selecionado” sem confirmação.

### 3.2 Clique longo (confirmação)
- O clique longo (≥ 2 segundos) confirma o estado selecionado.
- Ao confirmar:
  - o estado confirmado é persistido em memória (NVS / Preferences)
  - o dispositivo executa feedback visual de confirmação
  - o dispositivo tenta enviar o evento JSON de status

---

## 4. Feedback visual (LEDs)

### 4.1 Quando há conexão (Wi-Fi online)
- LED azul pisca continuamente para indicar conectividade ativa.
- Um dos LEDs de estado (verde/amarelo/vermelho) permanece aceso, representando o estado selecionado.

### 4.2 Confirmação de seleção
Ao confirmar um estado via clique longo:
- **todos os LEDs de estado (verde + amarelo + vermelho) piscam 3 vezes**
- após isso, o LED do estado confirmado permanece aceso

### 4.3 Quando não há conexão (Wi-Fi offline)
Se o dispositivo perder a conexão:
- LED azul apaga
- LED verde apaga
- LED amarelo apaga
- LED vermelho pisca continuamente
- o dispositivo tenta reconectar automaticamente em intervalos regulares

---

## 5. Memória (persistência após queda de energia)
O dispositivo mantém o último estado confirmado para garantir consistência após:
- reinicialização
- queda de energia
- desconexão e retorno

### Regra
- o estado só é salvo definitivamente na memória quando houver **confirmação** (clique longo)
- seleções temporárias não alteram a memória do equipamento

---

## 6. Eventos JSON enviados
O dispositivo envia eventos estruturados ao backend para registro e monitoramento.

### 6.1 Evento de status do equipamento (`status_equipamento`)
Enviado quando o usuário confirma um estado.

Campos mínimos recomendados:
- `device_id`
- `evento`
- `codigo_estado`
- `status`
- `conectividade`
- `ip`
- `rssi`
- `uptime_ms`

Exemplo:
```json
{
  "device_id": "BTN-ESP32-402",
  "evento": "status_equipamento",
  "codigo_estado": 2,
  "status": "indisponivel_prioridade",
  "conectividade": "online",
  "ip": "192.168.0.50",
  "rssi": -58,
  "uptime_ms": 123456
}
6.3 Evento de reconexão (conectividade)

Quando o dispositivo perde a rede, ele não consegue enviar um evento imediato.
Portanto:

ele registra localmente o momento em que ficou offline

quando a rede volta, ele envia um evento informando que o online foi restabelecido

inclui a duração aproximada do período offline

Exemplo:

{
  "device_id": "BTN-ESP32-402",
  "evento": "conectividade",
  "conectividade": "online_restabelecida",
  "duracao_offline_ms": 12000,
  "ip": "192.168.0.50",
  "rssi": -56,
  "uptime_ms": 145000
}
7. Estratégia de envio e tolerância a falhas
7.1 Falha de rede (offline)

Se o dispositivo estiver sem rede:

o evento de status é armazenado localmente (pendência)

o envio será feito assim que a rede voltar

7.2 Falha de servidor (HTTP error)

Se houver rede, mas o servidor retornar erro:

o dispositivo pode armazenar o último status como pendência

o dispositivo tentará enviar novamente quando houver novas oportunidades

Observação: em protótipos simples, é recomendado manter apenas uma pendência de status (o último evento), para reduzir uso de memória.

8. Resumo do fluxo (passo a passo)

Dispositivo inicia e lê estadoAtual salvo.

Tenta conectar ao Wi-Fi.

Se online: LED azul pisca e mostra estado atual.

Usuário pressiona botão:

clique curto: seleciona próximo estado (temporário)

se não confirmar em 5s: volta ao estado anterior

Usuário segura botão por 2s:

confirma seleção

salva estado

pisca todos LEDs 3 vezes

envia JSON de status

Dispositivo envia heartbeats em intervalos regulares.

Se perder Wi-Fi:

entra modo offline (vermelho piscando)

tenta reconectar

Ao reconectar:

envia evento de reconexão

envia pendências acumuladas (se existirem)

9. Observações finais

Este fluxo foi desenhado para reduzir acionamentos acidentais, manter consistência do status informado e garantir rastreabilidade de conectividade, atendendo ao contexto de Engenharia Clínica em ambiente hospitalar.