ShootLiff　初期設定
こちらは、ShootGASをバックサーバーにして動かすアプリのフロントです

```bash
git clone https://github.com/JojoYay/ShootLiff.git
```

１．/Config以下の設定を行う
２．firebaseのセットアップを行う
```bash
firebase functions:config:set liff_id="your-api-key" server_url="your-database-url" "ga_id"="your-GA-id"
```
３．package.jsonのdeployコマンドのプロジェクト名などを変更
４．npm run deploy でデプロイする

ほんとはもう少し設定を自動化したいけど、私しかつかわないのでこんな感じになっている