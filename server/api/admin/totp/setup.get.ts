import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()

  const secret = config.totpSecret || authenticator.generateSecret()
  const isConfigured = !!config.totpSecret

  const otpauthUrl = authenticator.keyuri('admin', 'bokukoha.cms', secret)
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl)

  return {
    secret,
    qrDataUrl,
    otpauthUrl,
    isConfigured,
    // 未設定の場合は環境変数への設定手順を案内
    envHint: isConfigured ? null : `NUXT_TOTP_SECRET=${secret}`,
  }
})
