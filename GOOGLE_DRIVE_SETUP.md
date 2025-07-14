# Google Drive API 設定ガイド

このガイドでは、ShootLiffプロジェクトでGoogle Drive APIを使用して動画をアップロードするための設定方法を説明します。

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択

### 1.2 Google Drive APIの有効化
1. 「APIとサービス」→「ライブラリ」に移動
2. 「Google Drive API」を検索して有効化

### 1.3 サービスアカウントの作成
1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例：`shootliff-drive-upload`）
4. 「キーを作成」→「JSON」を選択してキーファイルをダウンロード

### 1.4 Google Driveフォルダの準備
1. Google Driveで動画を保存するフォルダを作成
2. フォルダのIDを取得（URLの最後の部分）

## 2. 設定ファイルの更新

### 2.1 設定ファイルの編集
各環境の設定ファイル（`config/config.test.json`、`config/config.prod.json`、`config/config.bvs.json`）に以下の値を設定：

```json
{
  "driveClientEmail": "your-service-account@project.iam.gserviceaccount.com",
  "drivePrivateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "driveFolderId": "your-google-drive-folder-id"
}
```

### 2.2 値の取得方法
- `driveClientEmail`: ダウンロードしたJSONファイルの`client_email`フィールド
- `drivePrivateKey`: ダウンロードしたJSONファイルの`private_key`フィールド
- `driveFolderId`: Google DriveフォルダのURLから取得（例：`1ABC123DEF456GHI789JKL`）

## 3. フォルダの共有設定

1. Google Driveで作成したフォルダを右クリック
2. 「共有」を選択
3. サービスアカウントのメールアドレスを追加
4. 権限を「編集者」に設定

## 4. 環境変数の確認

設定後、以下の環境変数が正しく設定されていることを確認：

```bash
NEXT_PUBLIC_DRIVE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
NEXT_PUBLIC_DRIVE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
NEXT_PUBLIC_DRIVE_FOLDER_ID=your-google-drive-folder-id
```

## 5. 動作確認

1. 開発サーバーを起動：`npm run dev`
2. 動画アップロード機能をテスト
3. Google Driveフォルダに動画がアップロードされることを確認

## 6. トラブルシューティング

### よくあるエラー

1. **認証エラー**
   - サービスアカウントのキーが正しく設定されているか確認
   - フォルダの共有設定を確認

2. **フォルダアクセスエラー**
   - フォルダIDが正しいか確認
   - サービスアカウントにフォルダへのアクセス権限があるか確認

3. **ファイルサイズエラー**
   - Google Driveのファイルサイズ制限（5TB）を確認
   - 動画ファイルが適切な形式か確認

## 7. セキュリティ注意事項

- サービスアカウントのキーは絶対に公開リポジトリにコミットしない
- 本番環境では適切なアクセス制御を設定
- 定期的にキーのローテーションを実施

## 8. 参考リンク

- [Google Drive API ドキュメント](https://developers.google.com/drive/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [サービスアカウントの作成](https://cloud.google.com/iam/docs/creating-managing-service-accounts) 