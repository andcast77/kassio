#!/bin/sh
set -e

# Debian postinst / manual install helper. $1 = install root (default /usr/lib/Kassio).
KASSIO_ROOT="${1:-/usr/lib/Kassio}"
export KASSIO_BACKEND_ROOT="${KASSIO_ROOT}/backend"
NODE="${KASSIO_ROOT}/node/node"
SETUP="${KASSIO_ROOT}/backend/setup.mjs"

run_as_user() {
  user="$1"
  home="$2"
  echo "[kassio] running install setup as ${user}…"
  sudo -u "$user" env HOME="$home" KASSIO_BACKEND_ROOT="$KASSIO_BACKEND_ROOT" "$NODE" "$SETUP"
}

if [ ! -x "$NODE" ] || [ ! -f "$SETUP" ]; then
  echo "[kassio] install setup skipped — bundled backend not found at ${KASSIO_ROOT}" >&2
  exit 0
fi

if [ -n "$SUDO_USER" ] && [ "$SUDO_USER" != "root" ]; then
  HOME_DIR=$(getent passwd "$SUDO_USER" | cut -d: -f6)
  run_as_user "$SUDO_USER" "$HOME_DIR"
elif [ "$(id -u)" -eq 0 ] && [ -n "$USER" ] && [ "$USER" != "root" ]; then
  run_as_user "$USER" "$HOME"
else
  export KASSIO_BACKEND_ROOT
  "$NODE" "$SETUP"
fi
