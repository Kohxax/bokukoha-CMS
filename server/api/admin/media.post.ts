import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_DIMENSION = 2048

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

  const rawBuffer = Buffer.from(await file.arrayBuffer())
  const isGif = file.type === 'image/gif'
  const baseName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '')

  let buffer: Buffer
  let contentType: string
  let filename: string

  if (isGif) {
    buffer = rawBuffer
    contentType = 'image/gif'
    filename = `${baseName}.gif`
  } else {
    buffer = await sharp(rawBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
    contentType = 'image/webp'
    filename = `${baseName}.webp`
  }

  const key = `${collection}/${slug}/${filename}`

  await s3.send(
    new PutObjectCommand({
      Bucket: config.r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )

  const url = `${config.r2PublicUrl}/${key}`
  return { url }
})
