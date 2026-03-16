#include <WiFi.h>
#include <WiFiClient.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// =====================================================
// 1. CONFIGURAÇÕES DE REDE E API
// =====================================================
const char* ssid     = "Wokwi-GUEST";
const char* password = "";
const char* api_url  = "http://IP_DO_MAC:3001/api/iot/eventos";

// Use exatamente o mesmo CÓDIGO cadastrado do equipamento no dashboard.
// Em ESP32 real, use o IP do seu Mac na rede local; localhost não funciona no microcontrolador.
const String codigoEquipamento = "BOMBA-INFUSAO-402";

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
const unsigned long tempoConfirmacao     = 2000;
const unsigned long tempoTimeoutSelecao  = 5000;
const unsigned long intervaloHeartbeat   = 30000;
const unsigned long intervaloReconnect   = 5000;

const unsigned long periodoPiscaAzul     = 500;
const unsigned long periodoPiscaVermelho = 250;

// =====================================================
// 4. ESTADOS
// =====================================================
// 0 = funcional
// 1 = manutencao_curto_prazo
// 2 = indisponivel_prioridade
int estadoSelecionado = 0;
int estadoAtual = 0;

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
WiFiClient clientHttp;
WiFiClientSecure clientHttps;

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
String montarPayloadMinimo(int estado);
void piscarTodosLEDsConfirmacao();
void piscarErroServidor();
void apagarLEDsEstado();
void mostrarEstadoSelecionado();
bool urlEhHttps();

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

String textoEstado(int estado) {
  if (estado == 0) return "funcional";
  if (estado == 1) return "manutencao_curto_prazo";
  return "indisponivel_prioridade";
}

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

void confirmarEstado() {
  estadoAtual = estadoSelecionado;
  selecaoTemporariaAtiva = false;

  prefs.putInt("estado", estadoAtual);

  Serial.print("Estado confirmado: ");
  Serial.println(textoEstado(estadoAtual));

  piscarTodosLEDsConfirmacao();

  String payload = montarPayloadMinimo(estadoAtual);

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

String montarPayloadMinimo(int estado) {
  StaticJsonDocument<64> doc;
  doc["c"] = codigoEquipamento;
  doc["s"] = estado;

  String payload;
  serializeJson(doc, payload);
  return payload;
}

bool urlEhHttps() {
  return String(api_url).startsWith("https://");
}

bool enviarJSON(const String& payload) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  bool iniciado = false;

  if (urlEhHttps()) {
    clientHttps.setInsecure();
    iniciado = http.begin(clientHttps, api_url);
  } else {
    iniciado = http.begin(clientHttp, api_url);
  }

  if (!iniciado) {
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

void salvarPendencia(const char* chave, const String& payload) {
  prefs.putString(chave, payload);
}

void enviarPendencias() {
  if (!wifiConectado) return;

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

void registrarPerdaConexao() {
  // O backend calcula offline pelo timeout entre heartbeats.
}

void prepararEventoReconexao() {
  // Na estratégia mínima, basta forçar um envio ao reconectar.
}

void enviarHeartbeat(bool forcar) {
  if (!wifiConectado) return;

  unsigned long agora = millis();

  if (forcar || (agora - ultimoHeartbeat >= intervaloHeartbeat)) {
    ultimoHeartbeat = agora;

    String payload = montarPayloadMinimo(estadoAtual);

    Serial.println("Enviando heartbeat mínimo...");
    enviarJSON(payload);
  }
}

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
