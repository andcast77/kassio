#!/usr/bin/env bash
# Build Kassio Linux AppImage + .deb (native on Linux).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "${HOME}/.cargo/env"

node "${ROOT}/scripts/stage-backend.mjs" --target=linux

cd "${ROOT}/apps/desktop"
pnpm tauri build -b appimage,deb

mkdir -p "${ROOT}/dist"
shopt -s nullglob
for f in "${ROOT}/apps/desktop/src-tauri/target/release/bundle/appimage/"*.AppImage; do
  cp "$f" "${ROOT}/dist/"
done
for f in "${ROOT}/apps/desktop/src-tauri/target/release/bundle/deb/"*.deb; do
  cp "$f" "${ROOT}/dist/"
done
echo "Linux bundles in ${ROOT}/dist/"
