#!/usr/bin/env bash
set -euo pipefail

# Inicia um servidor HTTP estático na pasta do jogo.
# Isso é necessário porque navegadores bloqueiam módulos ES ao abrir index.html via file://.
cd "$(dirname "${BASH_SOURCE[0]}")"
PORT="${PORT:-8000}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Erro: Python 3 não encontrado. Instale o Python 3 ou execute: python3 -m http.server ${PORT}"
  exit 1
fi

echo "Jogo disponível em: http://localhost:${PORT}"
echo "Para encerrar, pressione Ctrl+C."
exec python3 -m http.server "${PORT}" --bind 0.0.0.0
