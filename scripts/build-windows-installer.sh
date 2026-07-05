#!/usr/bin/env bash
# Build Kassio Windows NSIS installer from Linux (Arch).
# Requires: rust, clang, lld, llvm, cargo-xwin, NSIS makensis (see docs/09-RELEASE-WINDOWS.md).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="${HOME}/.local/nsis:${PATH}"
export NSISDIR="${HOME}/.local/nsis/nsis-3.10"

# NSIS data paths (makensis PREFIX quirk on Linux cross-build)
for d in Stubs Plugins Include Contrib; do
  ln -sfn "${NSISDIR}/${d}" "${HOME}/.local/${d}" 2>/dev/null || true
done

source "${HOME}/.cargo/env"

cd "${ROOT}/apps/desktop"
pnpm tauri build -r cargo-xwin -t x86_64-pc-windows-msvc -b nsis

INSTALLER="${ROOT}/apps/desktop/src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/Kassio_"*"_x64-setup.exe"
mkdir -p "${ROOT}/dist"
cp ${INSTALLER} "${ROOT}/dist/"
echo "Installer ready: ${ROOT}/dist/$(basename ${INSTALLER})"
