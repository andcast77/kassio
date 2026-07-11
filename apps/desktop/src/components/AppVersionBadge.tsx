import { useEffect, useState } from 'react'
import { isTauriRuntime } from '../lib/tauriRuntime'

/**
 * Shows the running app version in a fixed corner badge, visible on every
 * screen (login included). The version comes from Tauri's getVersion(), which
 * reads the value baked into the binary at build time — the same version the
 * updater compares against. Outside the Tauri runtime (plain browser dev) there
 * is no binary version to report, so the badge renders nothing.
 */
export function AppVersionBadge() {
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    if (!isTauriRuntime()) return
    let active = true
    import('@tauri-apps/api/app')
      .then(({ getVersion }) => getVersion())
      .then((v) => {
        if (active) setVersion(v)
      })
      .catch(() => {
        // Version display is non-critical; ignore failures.
      })
    return () => {
      active = false
    }
  }, [])

  if (!version) return null

  return (
    <span className="app-version-badge" title="Versión instalada">
      v{version}
    </span>
  )
}
