import { DeleteCommand } from '@aws-sdk/lib-dynamodb'

export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const articleId = query.articleId as string

  if (!commentId || !articleId) {
    throw createError({ statusCode: 400, message: 'articleId required' })
  }

  const config = useRuntimeConfig()
  const db = useCommentsDb()

  await db.send(new DeleteCommand({
    TableName: config.dynamodbTable,
    Key: { articleId, commentId },
  }))

  return { ok: true }
})
