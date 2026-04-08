import { z } from 'zod'
import { verifyTOTP } from '~/server/utils/totp'

const bodySchema = z.object({
  token: z.string().length(6),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.totpSecret) {
    throw createError({ statusCode: 400, message: 'TOTP is not configured' })
  }

  const { token } = await readValidatedBody(event, bodySchema.parse)
  const valid = verifyTOTP(token, config.totpSecret)

  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid TOTP token' })
  }

  return { ok: true }
})
