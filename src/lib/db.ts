import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

/**
 * Resolve the SQLite database URL for the current environment.
 *
 * - Local dev / self-hosted: use DATABASE_URL as-is (file:./db/custom.db).
 * - Vercel: the serverless filesystem is READ-ONLY except /tmp, so we copy the
 *   bundled seed database to /tmp once per lambda instance and point Prisma
 *   at the writable copy. Reads always serve the full seed data; writes
 *   (demo purchases / payout requests) live for the lifetime of that instance.
 */
function resolveDatabaseUrl(): string {
  const fallback = process.env.DATABASE_URL || 'file:./db/custom.db'

  if (process.env.VERCEL) {
    try {
      const source = path.join(process.cwd(), 'db', 'custom.db')
      const target = '/tmp/custom.db'
      if (!fs.existsSync(target)) {
        if (!fs.existsSync(source)) {
          console.error('[db] bundled db/custom.db not found in bundle; falling back to DATABASE_URL')
          return fallback
        }
        fs.copyFileSync(source, target)
      }
      return `file:${target}`
    } catch (err) {
      console.error('[db] failed to stage database into /tmp:', err)
      return fallback
    }
  }

  return fallback
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
