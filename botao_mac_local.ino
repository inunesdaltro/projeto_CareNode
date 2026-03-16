// Arquivo gerado automaticamente por run.py
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";
const char* api_url = "http://172.17.24.94:3001/api/iot/eventos";

const int BOTAO_PIN = 4;
const char* CODIGO_EQUIPAMENTO = "BOMBA-INFUSAO-402";

void enviarEvento(int statusCode) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(api_url);
  http.addHeader("Content-Type", "application/json");

  String payload = String("{"c":"") + CODIGO_EQUIPAMENTO +
                   "","s":" + String(statusCode) +
                   ","ip":"esp32","rssi":-50,"uptime_ms":1000}";

  int httpCode = http.POST(payload);
  Serial.print("HTTP: ");
  Serial.println(httpCode);
  if (httpCode > 0) {
    Serial.println(http.getString());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(BOTAO_PIN, INPUT_PULLUP);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi conectado");
  Serial.println(api_url);
}

void loop() {
  if (digitalRead(BOTAO_PIN) == LOW) {
    enviarEvento(1);
    delay(800);
  }
}
