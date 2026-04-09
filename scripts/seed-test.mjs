import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, '../data/cms.db'))

const now = new Date().toISOString()

const body = `# テスト記事

これはスタイル確認用のテスト記事です。

## 見出し2

本文テキストが入ります。**太字**や*イタリック*、\`インラインコード\`も含みます。

### 見出し3

箇条書き:

- アイテム1
- アイテム2
- アイテム3

番号付きリスト:

1. ステップ1
2. ステップ2
3. ステップ3

## コードブロック

\`\`\`typescript
const hello = (name: string) => {
  console.log(\`Hello, \${name}!\`);
};
hello('world');
\`\`\`

## 引用

> これは引用ブロックです。引用文が入ります。

## リンク

[ぼくこは.dev](https://www.bokukoha.dev) へのリンクです。

---

以上がテスト記事の内容です。
`

db.prepare(`
  INSERT OR REPLACE INTO blog (slug, title, date, category, tags, cover_image, draft, description, body, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'test-style-article',
  'スタイル確認用テスト記事',
  '2026-04-08',
  'テスト',
  JSON.stringify(['テスト', 'スタイル']),
  'https://images.bokukoha.dev/blog/test-cover.jpg',
  0,
  'CMSのスタイル確認のために作成したテスト記事です。',
  body,
  now,
  now
)

console.log('✓ テスト記事を挿入しました: /blog/test-style-article')
db.close()
