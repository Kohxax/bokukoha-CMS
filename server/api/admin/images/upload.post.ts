import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const formData = await readFormData(event)
  const file = formData.get('file') as File | null
  const collection = formData.get('collection') as string | null
  const slug = formData.get('slug') as string | null

  if (!file) throw createError({ statusCode: 400, message: 'ファイルが指定されていません' })
  if (!collection || !slug) throw createError({ statusCode: 400, message: 'collection と slug が必要です' })

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({ statusCode: 400, message: '対応していないファイル形式です（JPEG/PNG/WebP/GIF）' })
  }
  if (file.size > MAX_SIZE) {
    throw createError({ statusCode: 413, message: 'ファイルサイズが大きすぎます（上限 10MB）' })
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
    },
  })

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const key = `${collection}/${slug}/${filename}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await s3.send(
    new PutObjectCommand({
      Bucket: config.r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }),
  )

  const url = `${config.r2PublicUrl}/${key}`
  return { url }
})
