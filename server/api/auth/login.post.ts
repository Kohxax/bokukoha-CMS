import { compareSync } from 'bcrypt'
import { z } from 'zod'
import { verifyTOTP } from '../../utils/totp'

const bodySchema = z.object({
  password: z.string(),
  totpToken: z.string().length(6).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const config = useRuntimeConfig()

  if (import.meta.dev) {
    // dev モード: 認証スキップ
    await setUserSession(event, { user: { role: 'admin' } })
    return { ok: true }
  }

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
    if (!verifyTOTP(body.totpToken, config.totpSecret)) {
      throw createError({ statusCode: 401, message: 'Invalid TOTP token' })
    }
  }

  await setUserSession(event, { user: { role: 'admin' } })
  return { ok: true }
})
