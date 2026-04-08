import QRCode from 'qrcode'
import { generateSecret, keyuri } from '../../../utils/totp'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const secret = config.totpSecret || generateSecret()
  const isConfigured = !!config.totpSecret

  const otpauthUrl = keyuri('admin', 'bokukoha.cms', secret)
  const qrSvg = await QRCode.toString(otpauthUrl, { type: 'svg' })

  return {
    secret,
    qrSvg,
    otpauthUrl,
    isConfigured,
    envHint: isConfigured ? null : `NUXT_TOTP_SECRET=${secret}`,
  }
})
