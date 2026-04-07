import { work } from '../../../../db/schema'

export default defineEventHandler(() => listArticles(work))
