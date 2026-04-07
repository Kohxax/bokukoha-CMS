import { blog } from '../../../../db/schema'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')!
  return updateArticle(event, blog, slug)
})
