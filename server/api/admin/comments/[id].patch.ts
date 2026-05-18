import { UpdateCommand } from '@aws-sdk/lib-dynamodb'

const ALLOWED_STATUSES = ['approved', 'rejected_filter', 'rejected_claude', 'deleted']

export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { articleId, status, pinned } = body ?? {}

  if (!commentId || !articleId) {
    throw createError({ statusCode: 400, message: 'articleId required' })
  }

  const hasPinned = typeof pinned === 'boolean'
  const hasStatus = typeof status === 'string'

  if (!hasPinned && !hasStatus) {
    throw createError({ statusCode: 400, message: 'status or pinned required' })
  }
  if (hasStatus && !ALLOWED_STATUSES.includes(status)) {
    throw createError({ statusCode: 400, message: 'invalid status' })
  }

  const config = useRuntimeConfig()
  const db = useCommentsDb()

  const expressions: string[] = []
  const names: Record<string, string> = {}
  const values: Record<string, unknown> = {}

  if (hasStatus) {
    expressions.push('#st = :st')
    names['#st'] = 'status'
    values[':st'] = status
  }
  if (hasPinned) {
    expressions.push('pinned = :pinned')
    values[':pinned'] = pinned
  }

  await db.send(
    new UpdateCommand({
      TableName: config.dynamodbTable,
      Key: { articleId, commentId },
      UpdateExpression: `SET ${expressions.join(', ')}`,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
    }),
  )

  return { ok: true }
})
