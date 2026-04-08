export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const url = config.cfDeployHookUrl

  if (!url) {
    throw createError({ statusCode: 503, message: 'Deploy hook URL が設定されていません' })
  }

  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) {
    throw createError({ statusCode: 502, message: 'Deploy hook の呼び出しに失敗しました' })
  }

  return { ok: true }
})
