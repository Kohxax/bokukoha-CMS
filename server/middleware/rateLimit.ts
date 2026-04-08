// ログインエンドポイントへのブルートフォース対策
// IPごとに5分間で最大10回まで許可
const WINDOW_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 10

interface AttemptRecord {
  count: number
  resetAt: number
}

const attempts = new Map<string, AttemptRecord>()

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  if (url.pathname !== '/api/auth/login') return

  const ip =
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
    event.node.req.socket?.remoteAddress ??
    'unknown'

  const now = Date.now()
  const record = attempts.get(ip)

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  record.count++

  if (record.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    setResponseHeader(event, 'Retry-After', String(retryAfter))
    throw createError({
      statusCode: 429,
      message: 'Too many login attempts. Please try again later.',
    })
  }
})
