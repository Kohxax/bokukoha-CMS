import { authenticator } from 'otplib'
import { z } from 'zod'

const bodySchema = z.object({
  token: z.string().length(6),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.totpSecret) {
    throw createError({ statusCode: 400, message: 'TOTP is not configured' })
  }

  const { token } = await readValidatedBody(event, bodySchema.parse)
  const valid = authenticator.verify({ token, secret: config.totpSecret })

  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid TOTP token' })
  }

  return { ok: true }
})
