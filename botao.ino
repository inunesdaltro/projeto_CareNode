#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// =====================================================
// 1. CONFIGURAÇÕES DE REDE E API
// =====================================================
const char* ssid     = "Wokwi-GUEST";
const char* password = "";
const char* api_url  = "http://SEU_BACKEND:3001/api/iot/eventos";

const String id_equipamento = "BTN-ESP32-402";

// =====================================================
// 2. MAPEAMENTO DE PINOS
// =====================================================
const int pinoBotao   = 4;
const int ledVerde    = 12;
const int ledAmarelo  = 14;
const int ledVermelho = 27;
const int ledAzul     = 13;

// =====================================================
// 3. TEMPOS E INTERVALOS
// =====================================================
const unsigned long tempoDebounce        = 50;
const unsigned long tempoConfirmacao     = 2000;   // 2 s
const unsigned long tempoTimeoutSelecao  = 5000;   // 5 s para voltar ao estado anterior
const unsigned long intervaloHeartbeat   = 30000;  // 30 s
const unsigned long intervaloReconnect   = 5000;   // 5 s

const unsigned long periodoPiscaAzul     = 500;
const unsigned long periodoPiscaVermelho = 250;

// =====================================================
// 4. ESTADOS
// =====================================================
// 0 = Verde
// 1 = Amarelo
// 2 = Vermelho
int estadoSelecionado = 0;
int estadoAtual = 0; // último estado confirmado

bool selecaoTemporariaAtiva = false;
unsigned long instanteSelecao = 0;

// =====================================================
// 5. CONTROLE DO BOTÃO
// =====================================================
bool leituraBrutaAnterior = HIGH;
bool estadoEstavelBotao = HIGH;
unsigned long instanteUltimaMudanca = 0;

bool pressInProgress = false;
bool longPressExecutado = false;
unsigned long tempoInicioPress = 0;

// =====================================================
// 6. CONTROLE DE WIFI E LEDS
// =====================================================
bool wifiConectado = false;
bool wifiConectadoAnterior = false;

unsigned long ultimaTentativaReconnect = 0;
unsigned long ultimoHeartbeat = 0;

unsigned long ultimoPiscaAzul = 0;
bool estadoPiscaAzul = false;

unsigned long ultimoPiscaVermelho = 0;
bool estadoPiscaVermelho = false;

// =====================================================
// 7. PERSISTÊNCIA
// =====================================================
Preferences prefs;

// =====================================================
// 8. DECLARAÇÕES
// =====================================================
String textoEstado(int estado);
void iniciarWiFi();
void gerenciarWiFi();
void atualizarLEDs();
void lerBotao();
void verificarTimeoutSelecao();
void confirmarEstado();
bool enviarJSON(const String& payload);
void salvarPendencia(const char* chave, const String& payload);
void enviarPendencias();
void registrarPerdaConexao();
void prepararEventoReconexao();
void enviarHeartbeat(bool forcar = false);
String montarPayloadStatus(int estado);
String montarPayloadHeartbeat();
String montarPayloadReconexao(unsigned long duracaoOfflineMs);
void piscarTodosLEDsConfirmacao();
void piscarErroServidor();
void apagarLEDsEstado();
void mostrarEstadoSelecionado();

// =====================================================
// 9. SETUP
// =====================================================
void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(pinoBotao, INPUT_PULLUP);

  pinMode(ledVerde, OUTPUT);
  pinMode(ledAmarelo, OUTPUT);
  pinMode(ledVermelho, OUTPUT);
  pinMode(ledAzul, OUTPUT);

  prefs.begin("ec-iot", false);

  estadoAtual = prefs.getInt("estado", 0);
  estadoSelecionado = estadoAtual;

  iniciarWiFi();

  Serial.println("Sistema iniciado.");
  Serial.print("Estado recuperado da memória: ");
  Serial.println(textoEstado(estadoAtual));
}

// =====================================================
// 10. LOOP
// =====================================================
void loop() {
  gerenciarWiFi();
  verificarTimeoutSelecao();
  atualizarLEDs();
  lerBotao();

  if (wifiConectado) {
    enviarPendencias();
    enviarHeartbeat();
  }
}

// =====================================================
// 11. TEXTO DO ESTADO
// =====================================================
String textoEstado(int estado) {
  if (estado == 0) return "funcional";
  if (estado == 1) return "manutencao_curto_prazo";
  return "indisponivel_prioridade";
}

// =====================================================
// 12. WIFI
// =====================================================
void iniciarWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
}

void gerenciarWiFi() {
  wifiConectado = (WiFi.status() == WL_CONNECTED);

  if (!wifiConectadoAnterior && wifiConectado) {
    Serial.println();
    Serial.println("Wi-Fi conectado!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());

    prepararEventoReconexao();
    enviarPendencias();
    enviarHeartbeat(true);
  }

  if (wifiConectadoAnterior && !wifiConectado) {
    Serial.println("Wi-Fi perdido.");
    registrarPerdaConexao();
  }

  if (!wifiConectado) {
    unsigned long agora = millis();
    if (agora - ultimaTentativaReconnect >= intervaloReconnect) {
      ultimaTentativaReconnect = agora;
      Serial.println("Tentando reconectar ao Wi-Fi...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
  }

  wifiConectadoAnterior = wifiConectado;
}

// =====================================================
// 13. LEDS
// =====================================================
void apagarLEDsEstado() {
  digitalWrite(ledVerde, LOW);
  digitalWrite(ledAmarelo, LOW);
  digitalWrite(ledVermelho, LOW);
}

void mostrarEstadoSelecionado() {
  digitalWrite(ledVerde,    estadoSelecionado == 0 ? HIGH : LOW);
  digitalWrite(ledAmarelo,  estadoSelecionado == 1 ? HIGH : LOW);
  digitalWrite(ledVermelho, estadoSelecionado == 2 ? HIGH : LOW);
}

void atualizarLEDs() {
  unsigned long agora = millis();

  if (wifiConectado) {
    if (agora - ultimoPiscaAzul >= periodoPiscaAzul) {
      ultimoPiscaAzul = agora;
      estadoPiscaAzul = !estadoPiscaAzul;
      digitalWrite(ledAzul, estadoPiscaAzul ? HIGH : LOW);
    }

    mostrarEstadoSelecionado();
  } else {
    digitalWrite(ledAzul, LOW);
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, LOW);

    if (agora - ultimoPiscaVermelho >= periodoPiscaVermelho) {
      ultimoPiscaVermelho = agora;
      estadoPiscaVermelho = !estadoPiscaVermelho;
      digitalWrite(ledVermelho, estadoPiscaVermelho ? HIGH : LOW);
    }
  }
}

// =====================================================
// 14. BOTÃO
// =====================================================
void lerBotao() {
  int leituraAtual = digitalRead(pinoBotao);

  if (leituraAtual != leituraBrutaAnterior) {
    instanteUltimaMudanca = millis();
    leituraBrutaAnterior = leituraAtual;
  }

  if ((millis() - instanteUltimaMudanca) > tempoDebounce) {
    if (leituraAtual != estadoEstavelBotao) {
      estadoEstavelBotao = leituraAtual;

      if (estadoEstavelBotao == LOW) {
        pressInProgress = true;
        longPressExecutado = false;
        tempoInicioPress = millis();
      } else {
        if (pressInProgress) {
          unsigned long duracao = millis() - tempoInicioPress;

          if (!longPressExecutado && duracao < tempoConfirmacao) {
            estadoSelecionado = (estadoSelecionado + 1) % 3;
            selecaoTemporariaAtiva = true;
            instanteSelecao = millis();

            Serial.print("Estado selecionado temporariamente: ");
            Serial.println(textoEstado(estadoSelecionado));
          }

          pressInProgress = false;
        }
      }
    }
  }

  if (pressInProgress && !longPressExecutado) {
    if ((millis() - tempoInicioPress) >= tempoConfirmacao) {
      longPressExecutado = true;
      confirmarEstado();
    }
  }
}

void verificarTimeoutSelecao() {
  if (selecaoTemporariaAtiva) {
    if (millis() - instanteSelecao >= tempoTimeoutSelecao) {
      estadoSelecionado = estadoAtual;
      selecaoTemporariaAtiva = false;

      Serial.println("Tempo de seleção expirou. Retornando ao último estado confirmado.");
      Serial.print("Estado restaurado: ");
      Serial.println(textoEstado(estadoAtual));
    }
  }
}

// =====================================================
// 15. CONFIRMAÇÃO
// =====================================================
void confirmarEstado() {
  estadoAtual = estadoSelecionado;
  selecaoTemporariaAtiva = false;

  prefs.putInt("estado", estadoAtual);

  Serial.print("Estado confirmado: ");
  Serial.println(textoEstado(estadoAtual));

  piscarTodosLEDsConfirmacao();

  String payload = montarPayloadStatus(estadoAtual);

  if (wifiConectado) {
    if (enviarJSON(payload)) {
      Serial.println("Status enviado com sucesso.");
    } else {
      Serial.println("Falha no envio. Salvando pendência.");
      salvarPendencia("pend_status", payload);
      piscarErroServidor();
    }
  } else {
    Serial.println("Sem rede. Status armazenado para envio posterior.");
    salvarPendencia("pend_status", payload);
  }
}

// =====================================================
// 16. JSON
// =====================================================
String montarPayloadStatus(int estado) {
  StaticJsonDocument<256> doc;

  doc["id_equipamento"] = id_equipamento;
  doc["evento"] = "status_equipamento";
  doc["codigo_estado"] = estado;
  doc["status"] = textoEstado(estado);
  doc["conectividade"] = wifiConectado ? "online" : "offline";
  doc["ip"] = wifiConectado ? WiFi.localIP().toString() : "";
  doc["rssi"] = wifiConectado ? WiFi.RSSI() : 0;
  doc["uptime_ms"] = millis();

  String payload;
  serializeJson(doc, payload);
  return payload;
}

String montarPayloadHeartbeat() {
  StaticJsonDocument<256> doc;

  doc["id_equipamento"] = id_equipamento;
  doc["evento"] = "heartbeat";
  doc["conectividade"] = "online";
  doc["status_atual"] = textoEstado(estadoAtual);
  doc["codigo_estado_atual"] = estadoAtual;
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["uptime_ms"] = millis();

  String payload;
  serializeJson(doc, payload);
  return payload;
}

String montarPayloadReconexao(unsigned long duracaoOfflineMs) {
  StaticJsonDocument<256> doc;

  doc["id_equipamento"] = id_equipamento;
  doc["evento"] = "conectividade";
  doc["conectividade"] = "online_restabelecida";
  doc["duracao_offline_ms"] = duracaoOfflineMs;
  doc["status_atual"] = textoEstado(estadoAtual);
  doc["codigo_estado_atual"] = estadoAtual;
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["uptime_ms"] = millis();

  String payload;
  serializeJson(doc, payload);
  return payload;
}

// =====================================================
// 17. HTTP
// =====================================================
bool enviarJSON(const String& payload) {
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;

  if (!http.begin(client, api_url)) {
    Serial.println("Falha ao iniciar HTTP.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");

  Serial.println("Enviando JSON:");
  Serial.println(payload);

  int httpResponseCode = http.POST(payload);

  Serial.print("HTTP Response Code: ");
  Serial.println(httpResponseCode);

  http.end();

  return (httpResponseCode > 0 && httpResponseCode < 400);
}

// =====================================================
// 18. PENDÊNCIAS
// =====================================================
void salvarPendencia(const char* chave, const String& payload) {
  prefs.putString(chave, payload);
}

void enviarPendencias() {
  if (!wifiConectado) return;

  String pendConexao = prefs.getString("pend_conexao", "");
  if (pendConexao.length() > 0) {
    Serial.println("Enviando pendência de conectividade...");
    if (enviarJSON(pendConexao)) {
      prefs.remove("pend_conexao");
      Serial.println("Pendência de conectividade enviada.");
    } else {
      Serial.println("Falha ao enviar pendência de conectividade.");
      return;
    }
  }

  String pendStatus = prefs.getString("pend_status", "");
  if (pendStatus.length() > 0) {
    Serial.println("Enviando pendência de status...");
    if (enviarJSON(pendStatus)) {
      prefs.remove("pend_status");
      Serial.println("Pendência de status enviada.");
    } else {
      Serial.println("Falha ao enviar pendência de status.");
    }
  }
}

// =====================================================
// 19. CONECTIVIDADE
// =====================================================
void registrarPerdaConexao() {
  prefs.putBool("offline_pendente", true);
  prefs.putULong("offline_inicio", millis());
}

void prepararEventoReconexao() {
  bool offlinePendente = prefs.getBool("offline_pendente", false);

  if (offlinePendente) {
    unsigned long inicioOffline = prefs.getULong("offline_inicio", millis());
    unsigned long duracaoOffline = millis() - inicioOffline;

    String payload = montarPayloadReconexao(duracaoOffline);
    salvarPendencia("pend_conexao", payload);

    prefs.putBool("offline_pendente", false);
    prefs.remove("offline_inicio");
  }
}

// =====================================================
// 20. HEARTBEAT
// =====================================================
void enviarHeartbeat(bool forcar) {
  if (!wifiConectado) return;

  unsigned long agora = millis();

  if (forcar || (agora - ultimoHeartbeat >= intervaloHeartbeat)) {
    ultimoHeartbeat = agora;

    String payload = montarPayloadHeartbeat();

    Serial.println("Enviando heartbeat...");
    enviarJSON(payload);
  }
}

// =====================================================
// 21. FEEDBACK VISUAL
// =====================================================
void piscarTodosLEDsConfirmacao() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledVerde, HIGH);
    digitalWrite(ledAmarelo, HIGH);
    digitalWrite(ledVermelho, HIGH);
    delay(150);

    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, LOW);
    digitalWrite(ledVermelho, LOW);
    delay(150);
  }

  mostrarEstadoSelecionado();
}

void piscarErroServidor() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(ledVerde, LOW);
    digitalWrite(ledAmarelo, LOW);
    digitalWrite(ledVermelho, HIGH);
    delay(100);

    digitalWrite(ledVermelho, LOW);
    delay(100);
  }

  mostrarEstadoSelecionado();
}
