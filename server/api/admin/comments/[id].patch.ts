import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

const ALLOWED_STATUSES = ['approved', 'rejected_filter', 'rejected_claude', 'deleted']

export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { articleId, status } = body ?? {}

  if (!commentId || !articleId || !status || !ALLOWED_STATUSES.includes(status)) {
    throw createError({ statusCode: 400, message: 'articleId and valid status required' })
  }

  const config = useRuntimeConfig()
  const db = useCommentsDb()

  await db.send(
    new UpdateCommand({
      TableName: config.dynamodbTable,
      Key: { articleId, commentId },
      UpdateExpression: 'SET #st = :st',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: { ':st': status },
    }),
  )

  return { ok: true }
})
