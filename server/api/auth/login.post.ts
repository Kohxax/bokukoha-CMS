import { compareSync } from 'bcrypt'
import { z } from 'zod'

const bodySchema = z.object({
  password: z.string().min(1),
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

  await setUserSession(event, { user: { role: 'admin' } })
  return { ok: true }
})
