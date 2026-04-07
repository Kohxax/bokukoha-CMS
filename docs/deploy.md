# デプロイ手順書

bokukoha CMS を Proxmox + Docker Compose + Cloudflare Tunnel で公開する手順。

---

## 1. Proxmox での Docker 実行環境準備

### LXC コンテナを作成する場合

1. Proxmox WebUI → **Create CT**
2. テンプレート: `ubuntu-24.04-standard`（または Debian 12）
3. スペック目安: CPU 2コア / RAM 1GB / Storage 20GB
4. **Unprivileged container のチェックを外す**（Docker ボリュームの権限問題を回避）
5. コンテナを起動後 SSH でログイン

```bash
# Docker インストール（Ubuntu 24.04）
apt update && apt install -y ca-certificates curl
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt update && apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### VM を使う場合

Docker がインストール済みであれば LXC と同じ手順でOK。

---

## 2. Cloudflare Tunnel ネットワークの準備

CMS コンテナは `tunnel_net` という外部 Docker ネットワーク経由で cloudflared コンテナと通信する。
cloudflared をまだ設定していない場合はここで作成する。

```bash
# 外部ネットワーク作成（cloudflared と CMS で共有）
docker network create tunnel_net
```

cloudflared の設定については [手順 5](#5-cloudflare-tunnel-の設定) を参照。

---

## 3. リポジトリの clone と .env 設定

```bash
cd /opt
git clone https://github.com/yourname/bokukoha-CMS.git
cd bokukoha-CMS

# .env.example をコピーして編集
cp .env.example .env
nano .env   # または vim .env
```

### 各環境変数の設定方法

#### `NUXT_SESSION_PASSWORD`
32文字以上のランダム文字列を生成して設定する。

```bash
openssl rand -hex 32
```

#### `NUXT_ADMIN_PASSWORD_HASH`
bcrypt ハッシュを生成する（コスト係数 12 推奨）。

```bash
# Node.js が使える環境で実行
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('YOUR_PASSWORD', 12).then(h => console.log(h));
"
```

生成されたハッシュ（`$2b$12$...`）をそのまま `.env` に貼り付ける。

#### `NUXT_R2_ACCOUNT_ID`
Cloudflare ダッシュボード → 右サイドバー下部の「Account ID」をコピー。

#### `NUXT_R2_ACCESS_KEY_ID` / `NUXT_R2_SECRET_ACCESS_KEY`

1. Cloudflare ダッシュボード → **R2** → **Manage R2 API Tokens**
2. **Create API token** をクリック
3. Permissions: **Object Read & Write**（バケットを絞り込む場合は Specify bucket）
4. 生成された **Access Key ID** と **Secret Access Key** をコピー

> シークレットは生成時にしか表示されないので必ず控えること。

#### `NUXT_R2_BUCKET_NAME`
使用する R2 バケットの名前（例: `bokukoha-images`）。

バケットがない場合は R2 ダッシュボードから作成する。

#### `NUXT_R2_PUBLIC_URL`
R2 バケットのカスタムドメイン URL（末尾スラッシュなし）。
設定方法は [手順 6](#6-r2-カスタムドメインの設定) を参照。

#### `NUXT_CF_DEPLOY_HOOK_URL`
1. Cloudflare Pages → ブログプロジェクト → **Settings** → **Builds & deployments**
2. **Deploy Hooks** セクション → **Add deploy hook**
3. 名前を入力（例: `cms-trigger`）して URL をコピー

---

## 4. Docker Compose での起動

```bash
cd /opt/bokukoha-CMS

# データディレクトリを作成（初回のみ）
mkdir -p data

# イメージビルドと起動
docker compose up -d --build

# ログ確認
docker compose logs -f cms
```

コンテナが起動したら `http://<サーバーIP>:3100` でアクセスできることを確認する。

### よくあるトラブル

| 症状 | 原因 | 対処 |
|---|---|---|
| `better-sqlite3` で Segfault | Node.js バージョン不一致 | Dockerfile の `FROM node:22-alpine` のバージョンを統一する |
| `tunnel_net not found` | 外部ネットワーク未作成 | `docker network create tunnel_net` を実行 |
| DB が初期化されない | `/app/data` のパーミッション不足 | `chmod 777 ./data` または `chown` で調整 |

---

## 5. Cloudflare Tunnel の設定

### cloudflared のインストールと認証

```bash
# cloudflared をインストール（Ubuntu/Debian）
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb \
  -o cloudflared.deb
dpkg -i cloudflared.deb

# Cloudflare 認証
cloudflared tunnel login
```

### Tunnel 作成と設定

```bash
# Tunnel を作成
cloudflared tunnel create bokukoha-tunnel

# 設定ファイルを編集
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: <TUNNEL_ID>   # 上のコマンドで表示された ID
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: cms.bokukoha.dev
    service: http://cms:3000    # Docker ネットワーク内のサービス名
  - service: http_status:404
EOF
```

### Docker Compose で cloudflared を管理する場合

`docker-compose.yml` に追記する:

```yaml
services:
  # ... 既存の cms サービス ...

  cloudflared:
    image: cloudflare/cloudflared:latest
    restart: unless-stopped
    command: tunnel run
    volumes:
      - ~/.cloudflared:/etc/cloudflared:ro
    networks:
      - tunnel_net
```

### DNS レコードの設定

```bash
cloudflared tunnel route dns bokukoha-tunnel cms.bokukoha.dev
```

Cloudflare DNS に `cms.bokukoha.dev` → Tunnel の CNAME が自動追加される。

---

## 6. R2 カスタムドメインの設定

`images.bokukoha.dev` を R2 バケットのパブリック URL として設定する。

1. Cloudflare ダッシュボード → **R2** → 対象バケット → **Settings**
2. **Custom Domains** → **Connect Domain**
3. `images.bokukoha.dev` を入力して **Connect**
4. Cloudflare DNS に CNAME レコードが自動追加される（`images.bokukoha.dev` → R2 バケット）
5. HTTPS が有効になるまで数分待つ

設定完了後、`.env` の `NUXT_R2_PUBLIC_URL=https://images.bokukoha.dev` を確認する。

---

## 更新・再デプロイ

```bash
cd /opt/bokukoha-CMS

git pull

# イメージの再ビルドと再起動
docker compose up -d --build

# 古いイメージを削除（ディスク節約）
docker image prune -f
```
