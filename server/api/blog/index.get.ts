import { eq } from 'drizzle-orm'
import { blog } from '../../../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  const rows = await db
    .select({ slug: blog.slug, updatedAt: blog.updatedAt })
    .from(blog)
    .where(eq(blog.draft, false))
    .all()
  return rows
})
