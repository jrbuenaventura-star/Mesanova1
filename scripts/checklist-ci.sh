#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${CI_CHECKLIST_BASE_URL:-http://127.0.0.1:3001}"
HOST="${CI_CHECKLIST_HOST:-127.0.0.1}"
PORT="${CI_CHECKLIST_PORT:-3001}"
DEV_LOG_PATH="${CI_CHECKLIST_DEV_LOG_PATH:-/tmp/mesanova-checklist-dev.log}"

corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test --runInBand

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

npm run dev -- --hostname "${HOST}" --port "${PORT}" >"${DEV_LOG_PATH}" 2>&1 &
DEV_PID=$!
trap 'kill "${DEV_PID}" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 90); do
  if curl -sf "${BASE_URL}/" >/dev/null; then
    break
  fi
  sleep 1
done

if ! curl -sf "${BASE_URL}/" >/dev/null; then
  echo "Server did not become ready at ${BASE_URL}"
  tail -n 120 "${DEV_LOG_PATH}" || true
  exit 1
fi

DELIVERY_E2E_BASE_URL="${BASE_URL}" corepack pnpm run test:e2e:delivery:ci
GIFT_CARDS_E2E_BASE_URL="${BASE_URL}" corepack pnpm run test:e2e:gift-cards:ci

