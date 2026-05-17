import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

let _client: DynamoDBDocumentClient | null = null

export function useCommentsDb() {
  if (_client) return _client
  const config = useRuntimeConfig()
  const ddb = new DynamoDBClient({
    region: config.dynamodbRegion || 'ap-northeast-1',
    credentials: {
      accessKeyId: config.dynamodbAccessKeyId,
      secretAccessKey: config.dynamodbSecretAccessKey,
    },
  })
  _client = DynamoDBDocumentClient.from(ddb)
  return _client
}
