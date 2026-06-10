#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f .env ]]; then
  echo "Copy .env.example to .env and set OPENAI_API_KEY" >&2
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm install
fi
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
export INVOICE_DEMO_MAX_PROCESSES_PER_IP="${INVOICE_DEMO_MAX_PROCESSES_PER_IP:-0}"
exec node server.mjs
