/**
 * migrate-from-blog.mjs
 *
 * ブログリポジトリのmarkdown記事とローカル画像をCMSへ移行するスクリプト。
 * - 画像を Cloudflare R2 にアップロード
 * - 記事を SQLite DB に INSERT（slug重複はスキップ）
 * - body/coverImage の `/images/...` パスを R2 URL に書き換え
 *
 * 使い方:
 *   node scripts/migrate-from-blog.mjs [options]
 *
 * オプション:
 *   --dry-run              実際には書き込まず、何が起きるかだけ表示
 *   --collection <name>    blog または work のみ移行（デフォルト: 両方）
 *   --slug <slug>          特定のslugだけ移行（テスト用）
 *   --blog-path <path>     ブログリポジトリのルートパス（デフォルト: ../bokukoha-new-home）
 *   --db-path <path>       SQLite DBのパス（デフォルト: .envまたはdata/cms.db）
 *   --skip-images          画像R2アップロードをスキップ（DB挿入のみ）
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, extname, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import Database from 'better-sqlite3'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ─── CLI引数パース ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN    = args.includes('--dry-run')
const SKIP_IMGS  = args.includes('--skip-images')
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null }

const ONLY_COLLECTION = getArg('--collection')  // 'blog' | 'work' | null
const ONLY_SLUG       = getArg('--slug')
const BLOG_PATH       = resolve(getArg('--blog-path') ?? join(ROOT, '../bokukoha-new-home'))
const EXPLICIT_DB     = getArg('--db-path')

if (DRY_RUN) console.log('🔍 DRY RUN モード — 書き込みは行いません\n')

// ─── .env 読み込み ─────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(ROOT, '.env')
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const m = line.match(/^([^=#\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^['"]|['"]$/g, '')
  }
}
loadEnv()

const R2_ACCOUNT_ID      = process.env.NUXT_R2_ACCOUNT_ID       ?? ''
const R2_ACCESS_KEY_ID   = process.env.NUXT_R2_ACCESS_KEY_ID    ?? ''
const R2_SECRET_KEY      = process.env.NUXT_R2_SECRET_ACCESS_KEY ?? ''
const R2_BUCKET          = process.env.NUXT_R2_BUCKET_NAME       ?? ''
const R2_PUBLIC_URL      = (process.env.NUXT_R2_PUBLIC_URL       ?? 'https://images.bokukoha.dev').replace(/\/$/, '')
const DB_PATH            = EXPLICIT_DB ?? process.env.NUXT_DB_PATH ?? join(ROOT, 'data/cms.db')

// ─── バリデーション ────────────────────────────────────────────────────────────

if (!existsSync(BLOG_PATH)) {
  console.error(`❌ ブログパスが見つかりません: ${BLOG_PATH}`)
  console.error('   --blog-path オプションで正しいパスを指定してください')
  process.exit(1)
}
if (!existsSync(DB_PATH)) {
  console.error(`❌ DBファイルが見つかりません: ${DB_PATH}`)
  console.error('   --db-path オプションで正しいパスを指定してください')
  process.exit(1)
}
if (!DRY_RUN && !SKIP_IMGS && (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_KEY || !R2_BUCKET)) {
  console.error('❌ R2の環境変数が不足しています。.envを確認するか --skip-images を使ってください')
  process.exit(1)
}

console.log(`📂 ブログパス : ${BLOG_PATH}`)
console.log(`🗄️  DBパス    : ${DB_PATH}`)
console.log(`🪣  R2バケツ  : ${R2_BUCKET || '(skip)'}`)
console.log(`🌐 R2公開URL : ${R2_PUBLIC_URL}\n`)

// ─── S3クライアント & DB ───────────────────────────────────────────────────────

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_KEY },
})

const db = new Database(DB_PATH, { readonly: DRY_RUN })

// ─── MIMEタイプ ───────────────────────────────────────────────────────────────

const MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml',
}
function getMime(filename) {
  return MIME[extname(filename).toLowerCase()] ?? 'application/octet-stream'
}

// ─── R2アップロード ────────────────────────────────────────────────────────────

async function r2Exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch { return false }
}

async function uploadToR2(localPath, key) {
  if (DRY_RUN) {
    console.log(`  [dry] R2アップロード: ${key}`)
    return `${R2_PUBLIC_URL}/${key}`
  }
  if (await r2Exists(key)) {
    console.log(`  ⏭  スキップ (既存): ${key}`)
    return `${R2_PUBLIC_URL}/${key}`
  }
  const body = readFileSync(localPath)
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: getMime(localPath),
  }))
  console.log(`  ✅ アップロード: ${key}`)
  return `${R2_PUBLIC_URL}/${key}`
}

// ─── URL書き換え ──────────────────────────────────────────────────────────────
// /images/blog/slug/file.jpg  →  https://images.bokukoha.dev/blog/slug/file.jpg

function rewriteImageUrls(text) {
  // Markdownのimg、HTML src、frontmatterのcoverImageなど全パターンを対象
  return text.replaceAll('/images/', `${R2_PUBLIC_URL}/`)
}

/**
 * coverImage を正規化して R2 URL に変換する。
 * - `/images/work/slug/file.jpg` → R2 URL（通常ケース）
 * - `file.jpg` や `./file.jpg` → `/images/{collection}/{slug}/file.jpg` として補完してから変換
 * - すでに http(s):// で始まる場合はそのまま返す
 */
function normalizeCoverImage(raw, collection, slug) {
  if (!raw) return ''
  // すでに絶対URL
  if (/^https?:\/\//.test(raw)) return raw
  // /images/ から始まる正規パス
  if (raw.startsWith('/images/')) return rewriteImageUrls(raw)
  // 裸のファイル名（例: "main.png", "./main.png"）→ パスを補完
  const filename = raw.replace(/^\.\//, '')
  const completed = `/images/${collection}/${slug}/${filename}`
  console.log(`   ⚠️  coverImage 補完: "${raw}" → "${completed}"`)
  return rewriteImageUrls(completed)
}

// ─── 日付を YYYY-MM-DD 文字列に正規化 ─────────────────────────────────────────

function normalizeDate(d) {
  if (!d) return new Date().toISOString().slice(0, 10)
  if (d instanceof Date) return d.toISOString().slice(0, 10)
  return String(d).slice(0, 10)
}

// ─── カテゴリを文字列に正規化（配列の場合は先頭要素） ─────────────────────────

function normalizeCategory(c) {
  if (Array.isArray(c)) return String(c[0] ?? '未分類')
  return String(c ?? '未分類')
}

// ─── 記事1件を移行 ────────────────────────────────────────────────────────────

async function migrateArticle(collection, slug) {
  const mdPath   = join(BLOG_PATH, 'content', collection, slug, 'index.md')
  const imgDir   = join(BLOG_PATH, 'public', 'images', collection, slug)

  if (!existsSync(mdPath)) {
    console.log(`⚠️  index.md が見つかりません: ${mdPath}`)
    return { status: 'skip', reason: 'no index.md' }
  }

  // slug重複チェック
  const existing = db.prepare(`SELECT slug FROM ${collection} WHERE slug = ?`).get(slug)
  if (existing) {
    console.log(`⏭  スキップ (DB既存): ${collection}/${slug}`)
    return { status: 'skip', reason: 'already exists' }
  }

  // frontmatterパース
  const raw = readFileSync(mdPath, 'utf-8')
  const { data: fm, content: body } = matter(raw)

  const title       = String(fm.title ?? '')
  const date        = normalizeDate(fm.date)
  const category    = normalizeCategory(fm.category)
  const tags        = Array.isArray(fm.tags) ? fm.tags.map(String) : (fm.tags ? [String(fm.tags)] : [])
  const draft       = fm.draft === 0 || fm.draft === false ? false : true
  const description = String(fm.description ?? '')
  const coverImage  = String(fm.coverImage ?? '')

  console.log(`\n📝 ${collection}/${slug}`)
  console.log(`   title    : ${title}`)
  console.log(`   date     : ${date}`)
  console.log(`   category : ${category}`)
  console.log(`   draft    : ${draft}`)
  console.log(`   cover    : ${coverImage}`)

  // ─ 画像アップロード ─
  let finalCover = SKIP_IMGS ? coverImage : normalizeCoverImage(coverImage, collection, slug)

  if (!SKIP_IMGS) {
    if (existsSync(imgDir)) {
      const imgFiles = readdirSync(imgDir).filter(f => MIME[extname(f).toLowerCase()])
      console.log(`   🖼  画像 ${imgFiles.length} 件`)
      for (const imgFile of imgFiles) {
        const key = `${collection}/${slug}/${imgFile}`
        await uploadToR2(join(imgDir, imgFile), key)
      }
    } else {
      console.log(`   ⚠️  画像ディレクトリなし: ${imgDir}`)
    }

  }

  // body 内の画像URLを書き換え
  const finalBody = SKIP_IMGS ? body : rewriteImageUrls(body)

  if (DRY_RUN) {
    console.log(`   [dry] DB INSERT: ${collection}/${slug}`)
    console.log(`         cover → ${finalCover}`)
    return { status: 'dry-run' }
  }

  // DB INSERT
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO ${collection} (slug, title, date, category, tags, cover_image, draft, description, body, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    slug, title, date, category,
    JSON.stringify(tags),
    finalCover,
    draft ? 1 : 0,
    description, finalBody,
    now, now
  )

  console.log(`   ✅ INSERT 完了`)
  return { status: 'inserted' }
}

// ─── メイン ───────────────────────────────────────────────────────────────────

async function main() {
  const collections = ONLY_COLLECTION ? [ONLY_COLLECTION] : ['blog', 'work']
  const stats = { inserted: 0, skipped: 0, dryRun: 0, errors: 0 }

  for (const collection of collections) {
    const contentDir = join(BLOG_PATH, 'content', collection)
    if (!existsSync(contentDir)) {
      console.log(`⚠️  コレクションディレクトリなし: ${contentDir}`)
      continue
    }

    const slugs = ONLY_SLUG ? [ONLY_SLUG] : readdirSync(contentDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)

    console.log(`\n═══ ${collection.toUpperCase()} (${slugs.length}件) ═══`)

    for (const slug of slugs) {
      try {
        const result = await migrateArticle(collection, slug)
        if (result.status === 'inserted') stats.inserted++
        else if (result.status === 'dry-run') stats.dryRun++
        else stats.skipped++
      } catch (err) {
        console.error(`   ❌ エラー: ${collection}/${slug}`)
        console.error(`      ${err.message}`)
        stats.errors++
      }
    }
  }

  console.log('\n─────────────────────────────')
  if (DRY_RUN) {
    console.log(`🔍 処理対象: ${stats.dryRun}件 (INSERT予定)`)
    console.log(`⏭  スキップ: ${stats.skipped}件 (DB既存)`)
  } else {
    console.log(`✅ INSERT : ${stats.inserted}件`)
    console.log(`⏭  スキップ: ${stats.skipped}件`)
  }
  if (stats.errors) console.log(`❌ エラー  : ${stats.errors}件`)
  if (DRY_RUN) console.log('\n💡 --dry-run のため実際には何も書き込んでいません')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
