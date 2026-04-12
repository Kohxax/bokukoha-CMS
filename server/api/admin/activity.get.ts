import { blog, work } from '../../../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 366)
  const cutoffStr = cutoff.toISOString()

  const blogRows = await db
    .select({ createdAt: blog.createdAt, updatedAt: blog.updatedAt })
    .from(blog)
  const workRows = await db
    .select({ createdAt: work.createdAt, updatedAt: work.updatedAt })
    .from(work)

  const counts = new Map<string, number>()

  for (const row of [...blogRows, ...workRows]) {
    const createdDay = row.createdAt.slice(0, 10)
    const updatedDay = row.updatedAt.slice(0, 10)

    if (row.createdAt >= cutoffStr) {
      counts.set(createdDay, (counts.get(createdDay) ?? 0) + 1)
    }
    if (row.updatedAt >= cutoffStr && createdDay !== updatedDay) {
      counts.set(updatedDay, (counts.get(updatedDay) ?? 0) + 1)
    }
  }

  const days = Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return { days }
})
