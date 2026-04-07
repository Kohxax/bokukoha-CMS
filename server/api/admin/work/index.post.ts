import { work } from '../../../../db/schema'

export default defineEventHandler(event => createArticle(event, work))
