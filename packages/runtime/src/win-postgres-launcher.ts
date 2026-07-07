import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { dirname, join } from 'node:path'
import type { Readable } from 'node:stream'
import { fileURLToPath } from 'node:url'

export type PostgresLauncherProcess = ChildProcessByStdio<null, Readable, Readable>

const __dirname = dirname(fileURLToPath(import.meta.url))
const LAUNCHER_SCRIPT = join(__dirname, '..', 'resources', 'priv-drop-launcher.ps1')

const READY_MESSAGE = 'database system is ready to accept connections'

/**
 * Starts postgres.exe with a Windows SAFER "normal user" token, so it starts
 * even when the app itself is running under an admin account. postmaster
 * refuses to start otherwise (pgwin32_is_admin check, no config override).
 */
export function spawnPostgresUnprivileged(
  postgresBinary: string,
  databaseDir: string,
  port: number,
  onLog: (message: string) => void,
): Promise<PostgresLauncherProcess> {
  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', LAUNCHER_SCRIPT, postgresBinary, '-D', databaseDir, '-p', String(port)],
    { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
  )

  return new Promise((resolve, reject) => {
    const onData = (chunk: Buffer) => {
      const message = chunk.toString('utf-8')
      onLog(message)
      if (message.includes(READY_MESSAGE)) {
        cleanup()
        resolve(child)
      }
    }
    const onExit = (code: number | null) => {
      cleanup()
      reject(new Error(`postgres launcher exited before becoming ready (code ${code})`))
    }
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      child.stdout.off('data', onData)
      child.stderr.off('data', onData)
      child.off('exit', onExit)
      child.off('error', onError)
    }

    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('exit', onExit)
    child.on('error', onError)
  })
}

export function stopPostgresUnprivileged(child: PostgresLauncherProcess): Promise<void> {
  return new Promise((resolve) => {
    if (!child.pid) {
      resolve()
      return
    }
    child.once('exit', () => resolve())
    spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'])
  })
}
