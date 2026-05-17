import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { randomBytes } from 'node:crypto'

function generateId() {
  const ts = Date.now().toString(36).toUpperCase().padStart(9, '0')
  const rnd = randomBytes(6).toString('hex').toUpperCase()
  return `${ts}${rnd}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { articleId, content, parentId } = body ?? {}

  if (!articleId || !content?.trim()) {
    throw createError({ statusCode: 400, message: 'articleId and content required' })
  }

  const config = useRuntimeConfig()
  const db = useCommentsDb()

  if (parentId) {
    const parent = await db.send(
      new GetCommand({ TableName: config.dynamodbTable, Key: { articleId, commentId: parentId } }),
    )
    if (!parent.Item) {
      throw createError({ statusCode: 400, message: 'parent comment not found' })
    }
    if (parent.Item.parentId) {
      throw createError({ statusCode: 400, message: 'nested replies not allowed' })
    }
  }

  const commentId = generateId()
  const createdAt = new Date().toISOString()

  await db.send(
    new PutCommand({
      TableName: config.dynamodbTable,
      Item: {
        articleId,
        commentId,
        authorName: 'こは',
        content: content.trim(),
        parentId: parentId ?? null,
        status: 'approved',
        isAdmin: true,
        filterScore: 0,
        filterReasons: [],
        createdAt,
      },
    }),
  )

  return { commentId, status: 'approved' }
})
