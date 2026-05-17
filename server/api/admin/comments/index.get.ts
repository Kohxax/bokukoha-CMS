import { QueryCommand } from '@aws-sdk/lib-dynamodb'

const ALL_STATUSES = ['approved', 'rejected_filter', 'rejected_claude', 'deleted']

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const statusFilter = (query.status as string) || 'all'
  const articleIdFilter = query.articleId as string | undefined

  const db = useCommentsDb()
  const TABLE = config.dynamodbTable

  let items: any[]

  if (statusFilter === 'all') {
    const results = await Promise.all(
      ALL_STATUSES.map((status) =>
        db.send(
          new QueryCommand({
            TableName: TABLE,
            IndexName: 'status-createdAt-index',
            KeyConditionExpression: '#st = :st',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':st': status },
          }),
        ),
      ),
    )
    items = results.flatMap((r) => r.Items ?? [])
  } else {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLE,
        IndexName: 'status-createdAt-index',
        KeyConditionExpression: '#st = :st',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: { ':st': statusFilter },
      }),
    )
    items = res.Items ?? []
  }

  if (articleIdFilter) {
    items = items.filter((i) => i.articleId === articleIdFilter)
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return items
})
