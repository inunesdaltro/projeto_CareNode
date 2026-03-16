#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import signal
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PID_FILE = ROOT / ".run" / "pids.json"

if not PID_FILE.exists():
    print("Nenhum processo salvo para encerrar.")
    raise SystemExit(0)

try:
    pids = json.loads(PID_FILE.read_text(encoding="utf-8"))
except Exception:
    print("Não consegui ler o arquivo de PIDs.")
    raise SystemExit(1)

for name, pid in pids.items():
    try:
        os.kill(pid, signal.SIGTERM)
        print(f"Encerrado: {name} (PID {pid})")
    except ProcessLookupError:
        print(f"Processo já não existe: {name} (PID {pid})")
    except PermissionError:
        print(f"Sem permissão para encerrar: {name} (PID {pid})")

PID_FILE.unlink(missing_ok=True)
print("Concluído.")
