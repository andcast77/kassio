import { isTauriRuntime } from './tauriRuntime'

export type PendingUpdate = {
  version: string
  body: string | null
}

export async function checkForAppUpdate(): Promise<PendingUpdate | null> {
  if (!isTauriRuntime()) return null

  const { check } = await import('@tauri-apps/plugin-updater')
  const update = await check()
  if (!update?.available) return null

  return {
    version: update.version,
    body: update.body ?? null,
  }
}

export async function beginBackgroundUpdate(): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('begin_background_update')
}

export async function scheduleUpdateOnNextStart(version: string): Promise<void> {
  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('schedule_update_on_next_start', { version })
}
