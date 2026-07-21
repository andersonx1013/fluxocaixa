#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.presentation-server.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        echo "Servidor da apresentação encerrado (PID $PID)."
    else
        echo "Servidor já não estava rodando."
    fi
    rm -f "$PID_FILE"
else
    echo "Arquivo PID não encontrado. O servidor parece estar desligado."
fi
