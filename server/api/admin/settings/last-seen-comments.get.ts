import { settings } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

const KEY = 'lastSeenCommentsAt'

export default defineEventHandler(async () => {
  const db = useDb()
  const row = await db.select().from(settings).where(eq(settings.key, KEY)).get()
  return { value: row?.value ?? null }
})
