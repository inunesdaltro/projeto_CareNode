#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

ROOT = Path(__file__).resolve().parent
DASHBOARD = ROOT / "dashboard"
BACKEND = DASHBOARD / "backend"
FRONTEND = DASHBOARD / "frontend"
RUN_DIR = ROOT / ".run"
LOG_DIR = RUN_DIR / "logs"
PID_FILE = RUN_DIR / "pids.json"
ADDRESS_FILE = ROOT / "ENDERECOS_LOCAIS.txt"
INO_FILE = ROOT / "botao_mac_local.ino"

BACKEND_PORT = 3001
FRONTEND_PORT = 5173
BACKEND_URL = f"http://localhost:{BACKEND_PORT}"
FRONTEND_URL = f"http://localhost:{FRONTEND_PORT}"
HEALTH_URL = f"{BACKEND_URL}/api/health"


def echo(msg: str) -> None:
    print(msg, flush=True)


def require_program(name: str) -> None:
    if shutil.which(name) is None:
        echo(f"❌ Não encontrei '{name}' no PATH.")
        echo("Instale primeiro e rode novamente.")
        sys.exit(1)


def best_local_ip() -> str:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def write_env_files() -> None:
    backend_env = BACKEND / ".env"
    frontend_env = FRONTEND / ".env"
    example = BACKEND / ".env.example"

    if example.exists() and not backend_env.exists():
        backend_env.write_text(example.read_text(encoding="utf-8"), encoding="utf-8")
    elif not backend_env.exists():
        backend_env.write_text(
            "PORT=3001\nOFFLINE_TIMEOUT_MS=90000\nDB_PATH=./src/database/database.sqlite\n",
            encoding="utf-8",
        )

    frontend_env.write_text(
        f"VITE_API_URL={BACKEND_URL}/api\nVITE_POLL_INTERVAL_MS=5000\n",
        encoding="utf-8",
    )


def cleanup_old_files() -> None:
    for lock in [BACKEND / "package-lock.json", FRONTEND / "package-lock.json"]:
        if lock.exists():
            lock.unlink()
    db = BACKEND / "src" / "database" / "database.sqlite"
    if db.exists():
        db.unlink()


def run_cmd(cmd: list[str], cwd: Path, allow_fail: bool = False) -> subprocess.CompletedProcess:
    echo(f"→ {' '.join(cmd)}  (em {cwd})")
    proc = subprocess.run(cmd, cwd=str(cwd), text=True)
    if proc.returncode != 0 and not allow_fail:
        echo(f"❌ Falha ao executar: {' '.join(cmd)}")
        sys.exit(proc.returncode)
    return proc


def ensure_dependencies() -> None:
    run_cmd(["npm", "config", "set", "registry", "https://registry.npmjs.org/"], ROOT, allow_fail=True)
    run_cmd(["npm", "cache", "clean", "--force"], ROOT, allow_fail=True)

    backend_need = not (BACKEND / "node_modules" / "dotenv").exists()
    frontend_need = not (FRONTEND / "node_modules" / "vite").exists()

    if backend_need:
        echo("\n📦 Instalando dependências do backend...")
        result = run_cmd(["npm", "install", "--no-package-lock"], BACKEND, allow_fail=True)
        if result.returncode != 0:
            echo("⚠️ npm install do backend falhou. Tentando fallback mínimo...")
            run_cmd(["npm", "install", "express", "cors", "dotenv", "--save", "--no-package-lock"], BACKEND)

    if frontend_need:
        echo("\n📦 Instalando dependências do frontend...")
        result = run_cmd(["npm", "install", "--no-package-lock"], FRONTEND, allow_fail=True)
        if result.returncode != 0:
            echo("⚠️ npm install do frontend falhou. Tentando fallback mínimo...")
            run_cmd(
                [
                    "npm",
                    "install",
                    "react",
                    "react-dom",
                    "vite",
                    "@vitejs/plugin-react",
                    "--save-dev",
                    "--no-package-lock",
                ],
                FRONTEND,
            )


def is_url_up(url: str, timeout: float = 1.5) -> bool:
    try:
        with urlopen(url, timeout=timeout) as resp:
            return 200 <= resp.status < 500
    except Exception:
        return False


def kill_pid(pid: int) -> None:
    try:
        os.kill(pid, signal.SIGTERM)
    except ProcessLookupError:
        return
    except PermissionError:
        return


def stop_previous() -> None:
    if not PID_FILE.exists():
        return
    try:
        pids = json.loads(PID_FILE.read_text(encoding="utf-8"))
    except Exception:
        pids = {}
    for pid in pids.values():
        if isinstance(pid, int):
            kill_pid(pid)
    time.sleep(1)
    PID_FILE.unlink(missing_ok=True)


def start_process(cmd: list[str], cwd: Path, log_name: str) -> int:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOG_DIR / log_name
    log_file = open(log_path, "a", encoding="utf-8")
    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        stdout=log_file,
        stderr=subprocess.STDOUT,
        stdin=subprocess.DEVNULL,
        start_new_session=True,
        env=os.environ.copy(),
    )
    return proc.pid


def wait_for(url: str, label: str, timeout: int = 45) -> None:
    echo(f"⏳ Aguardando {label} em {url} ...")
    start = time.time()
    while time.time() - start < timeout:
        if is_url_up(url):
            echo(f"✅ {label} pronto.")
            return
        time.sleep(1)
    echo(f"⚠️ {label} não respondeu dentro de {timeout}s. Veja os logs em {LOG_DIR}")


def write_addresses(ip: str) -> None:
    content = f"""CARENODE - ENDEREÇOS LOCAIS

Frontend (dashboard no navegador)
{FRONTEND_URL}

Backend (API)
{BACKEND_URL}

Health check
{HEALTH_URL}

URL para a ESP32 (.ino)
http://{ip}:{BACKEND_PORT}/api/iot/eventos

Observação importante:
No navegador do Mac você usa localhost.
Na ESP32 você usa o IP do Mac, nunca localhost.
"""
    ADDRESS_FILE.write_text(content, encoding="utf-8")


def write_ino(ip: str) -> None:
    ino = f'''// Arquivo gerado automaticamente por run.py
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "SEU_WIFI";
const char* password = "SUA_SENHA";
const char* api_url = "http://{ip}:{BACKEND_PORT}/api/iot/eventos";

const int BOTAO_PIN = 4;
const char* CODIGO_EQUIPAMENTO = "BOMBA-INFUSAO-402";

void enviarEvento(int statusCode) {{
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(api_url);
  http.addHeader("Content-Type", "application/json");

  String payload = String("{{\"c\":\"") + CODIGO_EQUIPAMENTO +
                   "\",\"s\":" + String(statusCode) +
                   ",\"ip\":\"esp32\",\"rssi\":-50,\"uptime_ms\":1000}}";

  int httpCode = http.POST(payload);
  Serial.print("HTTP: ");
  Serial.println(httpCode);
  if (httpCode > 0) {{
    Serial.println(http.getString());
  }}
  http.end();
}}

void setup() {{
  Serial.begin(115200);
  pinMode(BOTAO_PIN, INPUT_PULLUP);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {{
    delay(500);
    Serial.print(".");
  }}
  Serial.println("\\nWi-Fi conectado");
  Serial.println(api_url);
}}

void loop() {{
  if (digitalRead(BOTAO_PIN) == LOW) {{
    enviarEvento(1);
    delay(800);
  }}
}}
'''
    INO_FILE.write_text(ino, encoding="utf-8")


def save_pids(backend_pid: int, frontend_pid: int) -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    PID_FILE.write_text(json.dumps({"backend": backend_pid, "frontend": frontend_pid}, indent=2), encoding="utf-8")


def main() -> None:
    os.chdir(ROOT)
    echo("🚀 Iniciando CareNode no Mac...\n")
    require_program("npm")
    require_program("node")

    ip = best_local_ip()
    write_env_files()
    cleanup_old_files()
    stop_previous()
    ensure_dependencies()

    echo("\n🟢 Subindo backend...")
    backend_pid = start_process(["npm", "start"], BACKEND, "backend.log")
    wait_for(HEALTH_URL, "backend")

    echo("\n🟣 Subindo frontend...")
    frontend_pid = start_process(["npm", "run", "dev", "--", "--host", "0.0.0.0"], FRONTEND, "frontend.log")
    wait_for(FRONTEND_URL, "frontend")

    save_pids(backend_pid, frontend_pid)
    write_addresses(ip)
    write_ino(ip)

    echo("\n✅ Projeto iniciado.")
    echo(f"\nFrontend: {FRONTEND_URL}")
    echo(f"Backend:  {BACKEND_URL}")
    echo(f"Health:   {HEALTH_URL}")
    echo(f"ESP32:    http://{ip}:{BACKEND_PORT}/api/iot/eventos")
    echo(f"\nArquivos gerados:")
    echo(f"- {ADDRESS_FILE.name}")
    echo(f"- {INO_FILE.name}")
    echo(f"- logs em {LOG_DIR}")
    echo("\nPara parar tudo depois, rode: python3 stop.py")


if __name__ == "__main__":
    main()
