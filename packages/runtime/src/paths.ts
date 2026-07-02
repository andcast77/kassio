import { homedir } from 'node:os'
import { join } from 'node:path'

export function getKassioDataDir(): string {
  if (process.env.KASSIO_DATA_DIR) {
    return process.env.KASSIO_DATA_DIR
  }
  if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local')
    return join(base, 'Kassio', 'data')
  }
  return join(homedir(), '.local', 'share', 'kassio', 'data')
}

export function getPostgresDataDir(): string {
  return join(getKassioDataDir(), 'pg')
}
