import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: config.r2BucketName,
    }),
  )

  const items = (result.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    url: `${config.r2PublicUrl}/${obj.Key}`,
    size: obj.Size ?? 0,
    lastModified: obj.LastModified?.toISOString() ?? '',
  }))

  return { items }
})
