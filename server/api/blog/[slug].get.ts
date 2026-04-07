import { and, eq } from 'drizzle-orm'
import { blog } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')!
  const db = useDb()

  const rows = await db
    .select()
    .from(blog)
    .where(and(eq(blog.slug, slug), eq(blog.draft, false)))
    .limit(1)

  if (!rows[0]) throw createError({ statusCode: 404, message: 'Not found' })

  const row = rows[0]
  const tags: string[] = JSON.parse(row.tags || '[]')

  // Nuxt Content defineCollectionSource format
  return {
    title: row.title,
    date: row.date,
    draft: row.draft,
    category: row.category,
    tags,
    coverImage: row.coverImage,
    description: row.description,
    rawbody: row.body,
    _id: `blog:${row.slug}`,
    _path: `/blog/${row.slug}`,
    _type: 'markdown' as const,
  }
})
