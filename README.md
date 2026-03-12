# ShootLiff　初期設定

こちらは、ShootGASをバックサーバーにして動かすアプリのフロントです

## セットアップ手順

```bash
git clone https://github.com/JojoYay/ShootLiff.git
```

### 1. 設定ファイルの準備
`/Config`以下の設定を行う

### 2. Firebaseのセットアップ
```bash
firebase functions:config:set liff_id="your-api-key" server_url="your-database-url" "ga_id"="your-GA-id"
```

### 3. デプロイ設定
`package.json`のdeployコマンドのプロジェクト名などを変更

### 4. デプロイ
```bash
npm run deploy
```

This app is built as a **static export** and deployed to **Firebase Hosting only** (no Cloud Run / Frameworks Backend). The Spark (free) plan is sufficient; Blaze is not required.

> ほんとはもう少し設定を自動化したいけど、私しかつかわないのでこんな感じになっている
