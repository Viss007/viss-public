#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ ! -f .env ]]; then
  if [[ -n "${OPENAI_API_KEY:-}" ]]; then
    printf 'OPENAI_API_KEY=%s\n' "$OPENAI_API_KEY" > .env
  else
    echo "Copy .env.example to .env and set OPENAI_API_KEY (or add OPENAI_API_KEY in Cursor Cloud Secrets)" >&2
    exit 1
  fi
fi
if [[ ! -d node_modules ]]; then
  npm install
fi
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"
export INVOICE_DEMO_MAX_PROCESSES_PER_IP="${INVOICE_DEMO_MAX_PROCESSES_PER_IP:-0}"
exec node server.mjs
