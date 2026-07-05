export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function isPackagedTauriApp(): boolean {
  return isTauriRuntime() && import.meta.env.PROD
}
