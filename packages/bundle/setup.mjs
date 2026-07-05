#!/usr/bin/env node
/**
 * Installer-time setup: init Postgres, migrate, technical bootstrap. Exits when done.
 */
import { initializeKassioData } from '@kassio/runtime'

await initializeKassioData({ seed: false })
