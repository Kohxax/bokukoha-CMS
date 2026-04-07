import { blog } from '../../../../db/schema'

export default defineEventHandler(event => createArticle(event, blog))
