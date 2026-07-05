import { useCallback, useEffect, useState } from 'react'
import {
  beginBackgroundUpdate,
  checkForAppUpdate,
  scheduleUpdateOnNextStart,
  type PendingUpdate,
} from '../lib/appUpdater'
import { isPackagedTauriApp } from '../lib/tauriRuntime'

type Phase = 'idle' | 'checking' | 'available' | 'error'

export function UpdateBanner() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [update, setUpdate] = useState<PendingUpdate | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runCheck = useCallback(async () => {
    if (!isPackagedTauriApp()) return
    setPhase('checking')
    try {
      const pending = await checkForAppUpdate()
      if (!pending) {
        setPhase('idle')
        setUpdate(null)
        return
      }
      setUpdate(pending)
      setPhase('available')
    } catch (e) {
      console.warn('[kassio] update check failed', e)
      setPhase('idle')
    }
  }, [])

  useEffect(() => {
    void runCheck()
    const timer = window.setInterval(() => void runCheck(), 4 * 60 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [runCheck])

  async function handleInstallNow() {
    if (!update) return
    setError(null)
    try {
      await beginBackgroundUpdate()
    } catch (e) {
      setPhase('error')
      setError(e instanceof Error ? e.message : 'No se pudo iniciar la actualización')
    }
  }

  async function handleInstallOnNextStart() {
    if (!update) return
    try {
      await scheduleUpdateOnNextStart(update.version)
      setUpdate(null)
      setPhase('idle')
    } catch (e) {
      setPhase('error')
      setError(e instanceof Error ? e.message : 'No se pudo programar la actualización')
    }
  }

  if (phase === 'idle' || phase === 'checking') return null

  return (
    <div className="update-banner" role="status" aria-live="polite">
      <div className="update-banner-body">
        {phase === 'available' && (
          <>
            <strong>Actualización disponible</strong>
            <span>
              Versión {update?.version}
              {update?.body ? ` — ${update.body}` : ''}
            </span>
          </>
        )}
        {phase === 'error' && (
          <>
            <strong>No se pudo actualizar</strong>
            <span>{error}</span>
          </>
        )}
      </div>
      <div className="update-banner-actions">
        {phase === 'available' && (
          <>
            <button type="button" onClick={() => void handleInstallNow()}>
              Instalar ahora
            </button>
            <button type="button" className="ghost" onClick={() => void handleInstallOnNextStart()}>
              Al próximo inicio
            </button>
          </>
        )}
        {phase === 'error' && (
          <>
            <button type="button" onClick={() => void handleInstallNow()}>
              Reintentar
            </button>
            <button type="button" className="ghost" onClick={() => void handleInstallOnNextStart()}>
              Al próximo inicio
            </button>
          </>
        )}
      </div>
    </div>
  )
}
