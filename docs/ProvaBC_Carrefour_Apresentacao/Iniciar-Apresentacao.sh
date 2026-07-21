#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEB_DIR="$SCRIPT_DIR/web"
PID_FILE="$SCRIPT_DIR/.presentation-server.pid"
URL="http://127.0.0.1:4177"

# Subir infraestrutura Docker se não passado --skip-docker
if [ "$1" != "--skip-docker" ] && [ "$1" != "-SkipDocker" ]; then
    echo "Iniciando infraestrutura Docker..."
    (cd "$PROJECT_ROOT" && docker compose up -d)
fi

# Verificar se servidor já está rodando
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Servidor da apresentação já está ativo (PID $PID)."
    else
        rm -f "$PID_FILE"
    fi
fi

if [ ! -f "$PID_FILE" ]; then
    echo "Iniciando servidor Node.js..."
    (cd "$WEB_DIR" && node server.mjs > /dev/null 2>&1 & echo $! > "$PID_FILE")
    echo "Servidor iniciado (PID $(cat "$PID_FILE"))."
fi

# Aguardar servidor responder
echo "Aguardando servidor em $URL..."
for i in {1..40}; do
    if curl -s --head "$URL" > /dev/null; then
        echo "Apresentação pronta em $URL"
        if [ "$1" != "--no-browser" ] && [ "$1" != "-NoBrowser" ]; then
            if command -v xdg-open >/dev/null 2>&1; then
                xdg-open "$URL"
            elif command -v open >/dev/null 2>&1; then
                open "$URL"
            fi
        fi
        exit 0
    fi
    sleep 0.5
done

echo "Erro: A apresentação não respondeu em $URL"
exit 1
