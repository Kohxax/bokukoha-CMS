import { eq } from 'drizzle-orm'
import { work } from '../../../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  const rows = await db
    .select({ slug: work.slug, updatedAt: work.updatedAt })
    .from(work)
    .where(eq(work.draft, false))
    .all()
  return rows
})
