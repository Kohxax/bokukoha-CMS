export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  if (!url.pathname.startsWith('/api/admin')) return

  const session = await getUserSession(event)
  if (!session?.user?.role) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
})
