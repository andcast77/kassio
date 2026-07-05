#!/usr/bin/env node
/**
 * Installer-time setup: init Postgres, migrate, seed. Exits when done.
 */
import { initializeKassioData } from '@kassio/runtime'

await initializeKassioData({ seed: true })
