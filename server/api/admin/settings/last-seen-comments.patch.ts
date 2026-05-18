import { settings } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

const KEY = 'lastSeenCommentsAt'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const value: string = body?.value ?? new Date().toISOString()

  const db = useDb()
  await db
    .insert(settings)
    .values({ key: KEY, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })

  return { value }
})
