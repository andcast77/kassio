#!/bin/sh
set -e

# Debian postinst — machine-wide data in /var/lib/kassio (all users share one DB).
KASSIO_ROOT="${1:-/usr/lib/Kassio}"
export KASSIO_BACKEND_ROOT="${KASSIO_ROOT}/backend"
export KASSIO_DATA_DIR="/var/lib/kassio/data"
NODE="${KASSIO_ROOT}/node/node"
SETUP="${KASSIO_ROOT}/backend/setup.mjs"

if [ ! -x "$NODE" ] || [ ! -f "$SETUP" ]; then
  echo "[kassio] install setup skipped — bundled backend not found at ${KASSIO_ROOT}" >&2
  exit 0
fi

install -d -m 0755 /var/lib/kassio
install -d -m 0775 /var/lib/kassio/data

echo "[kassio] running install setup (shared data: ${KASSIO_DATA_DIR})…"
export KASSIO_BACKEND_ROOT KASSIO_DATA_DIR
"$NODE" "$SETUP"

# Allow any local user to run the POS against the shared cluster.
chmod -R a+rwX /var/lib/kassio/data 2>/dev/null || true
