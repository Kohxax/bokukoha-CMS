import { count } from 'drizzle-orm'
import { blog, work } from '../../../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  const [blogCount] = await db.select({ count: count() }).from(blog)
  const [workCount] = await db.select({ count: count() }).from(work)
  return {
    blog: blogCount?.count ?? 0,
    work: workCount?.count ?? 0,
  }
})
