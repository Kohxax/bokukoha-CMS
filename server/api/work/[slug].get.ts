import { and, eq } from 'drizzle-orm'
import { work } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const db = useDb()

  const rows = await db
    .select()
    .from(work)
    .where(and(eq(work.slug, slug), eq(work.draft, false)))
    .limit(1)

  if (!rows[0]) throw createError({ statusCode: 404, message: 'Not found' })

  const row = rows[0]
  const tags: string[] = JSON.parse(row.tags || '[]')

  return {
    title: row.title,
    date: row.date,
    draft: row.draft,
    category: row.category,
    tags,
    coverImage: row.coverImage,
    description: row.description,
    rawbody: row.body,
    _id: `work:${row.slug}`,
    _path: `/work/${row.slug}`,
    _type: 'markdown' as const,
  }
})
