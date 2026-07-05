import { homedir } from 'node:os'
import { join } from 'node:path'

/** Shared data dir for all OS users on this machine (production installs). */
export function getKassioDataDir(): string {
  if (process.env.KASSIO_DATA_DIR) {
    return process.env.KASSIO_DATA_DIR
  }
  if (process.platform === 'win32') {
    const base = process.env.ProgramData ?? join('C:', 'ProgramData')
    return join(base, 'Kassio', 'data')
  }
  if (process.env.KASSIO_BACKEND_ROOT) {
    return '/var/lib/kassio/data'
  }
  return join(homedir(), '.local', 'share', 'kassio', 'data')
}

export function getPostgresDataDir(): string {
  return join(getKassioDataDir(), 'pg')
}
