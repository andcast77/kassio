import { afterEach, describe, expect, it, vi } from 'vitest'

describe('getKassioDataDir', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('honors KASSIO_DATA_DIR override', async () => {
    vi.stubEnv('KASSIO_DATA_DIR', '/tmp/kassio-test-data')
    const { getKassioDataDir } = await import('../paths.js')
    expect(getKassioDataDir()).toBe('/tmp/kassio-test-data')
  })

  it('uses /var/lib/kassio for bundled Linux backend', async () => {
    delete process.env.KASSIO_DATA_DIR
    vi.stubEnv('KASSIO_BACKEND_ROOT', '/usr/lib/Kassio/backend')
    const { getKassioDataDir } = await import('../paths.js')
    if (process.platform === 'win32') {
      expect(getKassioDataDir()).toMatch(/Local[\\/]Kassio[\\/]data/)
    } else {
      expect(getKassioDataDir()).toBe('/var/lib/kassio/data')
    }
  })
})
