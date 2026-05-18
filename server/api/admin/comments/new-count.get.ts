import { QueryCommand } from '@aws-sdk/lib-dynamodb'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const since = query.since as string | undefined

  if (!since) {
    return { count: 0 }
  }

  const db = useCommentsDb()
  const config = useRuntimeConfig()

  try {
    const res = await db.send(
      new QueryCommand({
        TableName: config.dynamodbTable,
        IndexName: 'status-createdAt-index',
        KeyConditionExpression: '#st = :st AND #ca > :since',
        ExpressionAttributeNames: { '#st': 'status', '#ca': 'createdAt' },
        ExpressionAttributeValues: { ':st': 'approved', ':since': since },
        Select: 'COUNT',
      }),
    )
    return { count: res.Count ?? 0 }
  } catch {
    return { count: 0 }
  }
})
