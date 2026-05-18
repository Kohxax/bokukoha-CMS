import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const blog = sqliteTable('blog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull(),
  tags: text('tags').notNull().default('[]'),
  coverImage: text('cover_image').notNull(),
  draft: integer('draft', { mode: 'boolean' }).notNull().default(true),
  description: text('description').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const settings = sqliteTable('settings', {
  key: text('key').notNull(),
  value: text('value').notNull(),
}, (t) => [primaryKey({ columns: [t.key] })])

export const work = sqliteTable('work', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  date: text('date').notNull(),
  category: text('category').notNull(),
  tags: text('tags').notNull().default('[]'),
  coverImage: text('cover_image').notNull(),
  draft: integer('draft', { mode: 'boolean' }).notNull().default(true),
  description: text('description').notNull(),
  body: text('body').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
