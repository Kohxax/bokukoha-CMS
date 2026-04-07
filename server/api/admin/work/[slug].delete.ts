import { work } from '../../../../db/schema'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')!
  return deleteArticle(work, slug)
})
