import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const key = query.key as string | undefined

  if (!key) throw createError({ statusCode: 400, message: 'key が必要です' })

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.r2BucketName,
      Key: key,
    }),
  )

  return { ok: true }
})
