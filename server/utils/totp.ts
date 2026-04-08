import { createHmac, randomBytes } from 'crypto'

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, '').replace(/\s/g, '')
  const output: number[] = []
  let bits = 0
  let value = 0

  for (const char of clean) {
    const idx = BASE32_CHARS.indexOf(char)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(output)
}

function base32Encode(buf: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (const byte of buf) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31]
  }
  return output
}

function hotp(secret: Buffer, counter: bigint): string {
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(counter)

  const hash = createHmac('sha1', secret).update(buf).digest()
  const offset = hash[hash.length - 1] & 0x0f
  const code =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)

  return (code % 1_000_000).toString().padStart(6, '0')
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20))
}

export function verifyTOTP(token: string, secret: string): boolean {
  const key = base32Decode(secret)
  const step = Math.floor(Date.now() / 1000 / 30)
  // ±1 window（30秒のずれを許容）
  for (const w of [-1, 0, 1]) {
    if (hotp(key, BigInt(step + w)) === token) return true
  }
  return false
}

export function keyuri(account: string, issuer: string, secret: string): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params}`
}
