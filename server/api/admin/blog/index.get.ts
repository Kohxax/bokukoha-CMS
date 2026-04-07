import { blog } from '../../../../db/schema'

export default defineEventHandler(() => listArticles(blog))
