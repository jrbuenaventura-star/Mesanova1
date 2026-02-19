#!/usr/bin/env bash
set -euo pipefail

corepack pnpm dev --port 3000 >/tmp/mesanova-dev.log 2>&1 &
PID=$!

cleanup() {
  kill "$PID" >/dev/null 2>&1 || true
  wait "$PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 90); do
  if rg -q "Ready in" /tmp/mesanova-dev.log; then
    break
  fi
  sleep 1
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "Dev server died" >&2
    cat /tmp/mesanova-dev.log >&2 || true
    exit 1
  fi
done

node <<'NODE'
const fs = require('fs');
const { execSync } = require('child_process');

const data = JSON.parse(fs.readFileSync('scripts/audit-interactives-output.json', 'utf8'));
const paths = [...new Set(
  data.records
    .filter((r) => r.kind === 'Link' || r.kind === 'Anchor' || String(r.kind).startsWith('Router.'))
    .map((r) => r.actionPath)
    .filter(Boolean)
    .filter((p) => p.startsWith('/'))
    .filter((p) => !p.includes('[') && !p.includes(']') && !p.includes('{') && !p.includes('}') && !p.includes('x') && !p.includes('javascript:'))
)].sort();

const out = [];
for (const p of paths) {
  try {
    const status = execSync(`curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000${p}"`, { encoding: 'utf8' }).trim();
    out.push({ path: p, status: Number(status) });
  } catch (e) {
    out.push({ path: p, status: 0, error: String(e.message || e) });
  }
}

fs.writeFileSync('scripts/audit-http-status.json', JSON.stringify(out, null, 2));

const bad = out.filter((x) => x.status >= 400 || x.status === 0);
const redirects = out.filter((x) => x.status >= 300 && x.status < 400);
const ok = out.filter((x) => x.status >= 200 && x.status < 300);

console.log(JSON.stringify({
  tested: out.length,
  ok: ok.length,
  redirects: redirects.length,
  bad: bad.length,
  badList: bad.slice(0, 50),
}, null, 2));
NODE
