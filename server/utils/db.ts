import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'node:path'
import * as schema from '../../db/schema'

let _db: ReturnType<typeof drizzle> | null = null

export function useDb() {
  if (_db) return _db

  const config = useRuntimeConfig()
  const dbPath = config.dbPath || join(process.cwd(), 'data', 'cms.db')

  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')

  _db = drizzle(sqlite, { schema })

  const migrationsFolder = join(process.cwd(), 'migrations')
  migrate(_db, { migrationsFolder })

  return _db
}
