import { eq } from 'drizzle-orm'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'
import { rowToArticle, createArticleSchema, updateArticleSchema } from '../types/article'
import type { ArticleRow } from '../types/article'
import type { H3Event } from 'h3'

type AnyTable = SQLiteTableWithColumns<any>

export async function listArticles(table: AnyTable) {
  const db = useDb()
  const rows = await db.select().from(table).all() as ArticleRow[]
  return rows.map(rowToArticle)
}

export async function getArticle(table: AnyTable, slug: string) {
  const db = useDb()
  const rows = await db.select().from(table).where(eq(table.slug, slug)).limit(1) as ArticleRow[]
  if (!rows[0]) throw createError({ statusCode: 404, message: 'Not found' })
  return rowToArticle(rows[0])
}

export async function createArticle(event: H3Event, table: AnyTable) {
  const body = await readValidatedBody(event, createArticleSchema.parse)
  const db = useDb()

  const existing = await db.select({ slug: table.slug }).from(table).where(eq(table.slug, body.slug)).limit(1)
  if (existing[0]) throw createError({ statusCode: 409, message: 'Slug already exists' })

  const now = new Date().toISOString()
  const rows = await db.insert(table).values({
    ...body,
    tags: JSON.stringify(body.tags),
    createdAt: now,
    updatedAt: now,
  }).returning() as ArticleRow[]

  triggerDeploy()
  return rowToArticle(rows[0]!)
}

export async function updateArticle(event: H3Event, table: AnyTable, slug: string) {
  const body = await readValidatedBody(event, updateArticleSchema.parse)
  const db = useDb()

  const existing = await db.select().from(table).where(eq(table.slug, slug)).limit(1)
  if (!existing[0]) throw createError({ statusCode: 404, message: 'Not found' })

  const updates: Record<string, unknown> = {
    ...body,
    updatedAt: new Date().toISOString(),
  }
  if (body.tags !== undefined) {
    updates.tags = JSON.stringify(body.tags)
  }

  const rows = await db.update(table).set(updates).where(eq(table.slug, slug)).returning() as ArticleRow[]
  triggerDeploy()
  return rowToArticle(rows[0]!)
}

export async function deleteArticle(table: AnyTable, slug: string) {
  const db = useDb()
  const rows = await db.select({ slug: table.slug }).from(table).where(eq(table.slug, slug)).limit(1)
  if (!rows[0]) throw createError({ statusCode: 404, message: 'Not found' })

  await db.delete(table).where(eq(table.slug, slug))
  triggerDeploy()
  return { ok: true }
}
