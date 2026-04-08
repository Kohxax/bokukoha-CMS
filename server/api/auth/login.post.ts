import { authenticator } from 'otplib'
import { compareSync } from 'bcrypt'
import { z } from 'zod'

const bodySchema = z.object({
  password: z.string().min(1),
  totpToken: z.string().length(6).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const config = useRuntimeConfig()

  if (!config.adminPasswordHash) {
    throw createError({ statusCode: 500, message: 'Server misconfiguration' })
  }

  const valid = compareSync(body.password, config.adminPasswordHash)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid password' })
  }

  // TOTP が設定されている場合はコードの検証も必要
  if (config.totpSecret) {
    if (!body.totpToken) {
      throw createError({ statusCode: 401, message: 'TOTP token required' })
    }
    const totpValid = authenticator.verify({
      token: body.totpToken,
      secret: config.totpSecret,
    })
    if (!totpValid) {
      throw createError({ statusCode: 401, message: 'Invalid TOTP token' })
    }
  }

  await setUserSession(event, { user: { role: 'admin' } })
  return { ok: true }
})
