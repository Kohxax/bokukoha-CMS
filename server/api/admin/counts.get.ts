import { count } from 'drizzle-orm'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import { blog, work } from '../../../db/schema'

export default defineEventHandler(async () => {
  const db = useDb()
  const config = useRuntimeConfig()

  const [blogCount] = await db.select({ count: count() }).from(blog)
  const [workCount] = await db.select({ count: count() }).from(work)

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  let mediaCount = 0
  let continuationToken: string | undefined
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: config.r2BucketName,
        ContinuationToken: continuationToken,
      }),
    )
    mediaCount += res.KeyCount ?? 0
    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)

  const commentsDb = useCommentsDb()
  let commentsTotal = 0
  try {
    const results = await Promise.all(
      ['approved', 'rejected_filter', 'rejected_claude', 'deleted'].map((status) =>
        commentsDb.send(
          new QueryCommand({
            TableName: config.dynamodbTable,
            IndexName: 'status-createdAt-index',
            KeyConditionExpression: '#st = :st',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: { ':st': status },
            Select: 'COUNT',
          }),
        ),
      ),
    )
    commentsTotal = results.reduce((sum, r) => sum + (r.Count ?? 0), 0)
  } catch {
    // DynamoDB unavailable — don't fail the whole counts endpoint
  }

  return {
    blog: blogCount?.count ?? 0,
    work: workCount?.count ?? 0,
    media: mediaCount,
    comments: commentsTotal,
  }
})
