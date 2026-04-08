import { z } from 'zod'

// DB row → API response
export interface ArticleRow {
  id: number
  slug: string
  title: string
  date: string
  category: string
  tags: string   // raw JSON text from DB
  coverImage: string
  draft: boolean
  description: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface Article {
  id: number
  slug: string
  title: string
  date: string
  category: string
  tags: string[]
  coverImage: string
  draft: boolean
  description: string
  body: string
  createdAt: string
  updatedAt: string
}

export function rowToArticle(row: ArticleRow): Article {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    draft: Boolean(row.draft),
  }
}

// Zod schemas
export const createArticleSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  title: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  coverImage: z.string().min(1),
  draft: z.boolean().default(true),
  description: z.string().min(1),
  body: z.string().default(''),
})

export const updateArticleSchema = createArticleSchema.omit({ slug: true }).partial().extend({
  draft: z.boolean().optional(),
})

export type CreateArticleInput = z.infer<typeof createArticleSchema>
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>
