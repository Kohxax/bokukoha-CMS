import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const secret = config.totpSecret || authenticator.generateSecret()
  const isConfigured = !!config.totpSecret

  const otpauthUrl = authenticator.keyuri('admin', 'bokukoha.cms', secret)
  // toDataURL はサーバー環境で canvas が必要なので SVG を使う
  const qrSvg = await QRCode.toString(otpauthUrl, { type: 'svg' })

  return {
    secret,
    qrSvg,
    otpauthUrl,
    isConfigured,
    envHint: isConfigured ? null : `NUXT_TOTP_SECRET=${secret}`,
  }
})
