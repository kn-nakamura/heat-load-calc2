# デプロイ設定ガイド

このドキュメントでは、フロントエンド（Vercel）とバックエンド（Railway）のデプロイ設定手順を説明します。

## 問題: バックエンドに接続できない

フロントエンドがVercel、バックエンドがRailwayにデプロイされている場合、以下の環境変数を正しく設定しないと接続エラーが発生します。

## 解決策

### 1. Railwayのバックエンド設定

#### 1.1 RailwayのバックエンドURLを確認
1. Railwayのダッシュボードにアクセス
2. バックエンドプロジェクトを選択
3. "Settings" → "Networking" で公開URLを確認（例: `https://your-backend.railway.app`）

#### 1.2 Railway環境変数の設定
Railwayのダッシュボードで以下の環境変数を設定：

```bash
# Vercelのフロントエンドドメインを指定（セキュリティのため）
CORS_ORIGINS=https://your-frontend.vercel.app

# 複数のドメインを許可する場合はカンマ区切り
# CORS_ORIGINS=https://your-frontend.vercel.app,https://www.your-frontend.vercel.app
```

**設定手順：**
1. Railwayダッシュボード → プロジェクト選択
2. "Variables" タブを選択
3. "New Variable" をクリック
4. Variable: `CORS_ORIGINS`
5. Value: `https://your-frontend.vercel.app`
6. "Add" をクリック

### 2. Vercelのフロントエンド設定

#### 2.1 Vercel環境変数の設定
Vercelのダッシュボードで以下の環境変数を設定：

```bash
# RailwayのバックエンドURLを指定
VITE_API_URL=https://your-backend.railway.app
```

**設定手順：**
1. Vercelダッシュボード → プロジェクト選択
2. "Settings" → "Environment Variables" を選択
3. 以下を入力：
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.railway.app`（RailwayのURL）
   - Environment: "Production" を選択（必要に応じて "Preview" も）
4. "Save" をクリック

#### 2.2 再デプロイ
環境変数を設定した後、Vercelで再デプロイが必要です：

1. "Deployments" タブを選択
2. 最新のデプロイの右側にある "..." メニューをクリック
3. "Redeploy" を選択

## 3. 動作確認

### 3.1 バックエンドのヘルスチェック
ブラウザまたはcurlでバックエンドのヘルスチェックエンドポイントにアクセス：

```bash
curl https://your-backend.railway.app/health
```

期待される応答：
```json
{"status":"ok"}
```

### 3.2 フロントエンドの接続確認
1. Vercelのフロントエンドにアクセス
2. 「負荷確認」ページを開く
3. 以下のエラーメッセージが**表示されない**ことを確認：
   - ❌ "バックエンドに接続できません。フロントエンド計算を使用します。"
   - ❌ "バックエンド未接続・簡易計算モードで動作します（参照データとの連携なし）"

### 3.3 ブラウザの開発者ツールで確認
1. ブラウザで F12 キーを押して開発者ツールを開く
2. "Network" タブを選択
3. フロントエンドで何か操作を実行
4. リクエストが `https://your-backend.railway.app/v1/...` に送信されていることを確認
5. CORS エラーが発生していないことを確認

## 4. トラブルシューティング

### 問題: CORSエラーが発生する

**症状：**
ブラウザのコンソールに以下のようなエラーが表示される：
```
Access to fetch at 'https://your-backend.railway.app/v1/...' from origin 'https://your-frontend.vercel.app' has been blocked by CORS policy
```

**解決策：**
1. Railwayの `CORS_ORIGINS` 環境変数を確認
2. Vercelのドメインが正しく設定されているか確認
3. Railway環境変数を更新した後、バックエンドが再起動されるまで待つ（通常は自動）

### 問題: 環境変数が反映されない

**症状：**
環境変数を設定したのに、まだ接続エラーが発生する

**解決策：**
1. **Vercel**: 環境変数設定後、必ず再デプロイが必要
2. **Railway**: 環境変数設定後、自動的に再起動されるが、数分かかる場合がある
3. ブラウザのキャッシュをクリアして再度アクセス

### 問題: バックエンドURLが間違っている

**症状：**
`https://your-backend.railway.app/health` にアクセスできない

**解決策：**
1. RailwayのダッシュボードでURLを確認
2. ドメインの末尾に `/` が含まれていないことを確認
3. HTTPSを使用していることを確認（HTTPではなく）

## 5. 環境変数の設定例

### 開発環境（ローカル）
```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
```

```bash
# backend環境変数（なし、またはデフォルトで "*" を使用）
# ローカル開発ではCORS_ORIGINSの設定は不要
```

### 本番環境
```bash
# Vercel環境変数
VITE_API_URL=https://your-backend.railway.app
```

```bash
# Railway環境変数
CORS_ORIGINS=https://your-frontend.vercel.app
```

## 6. セキュリティに関する注意事項

1. **CORS_ORIGINS**: 本番環境では `"*"` を使用せず、具体的なドメインを指定してください
2. **HTTPS**: 本番環境では必ずHTTPSを使用してください
3. **環境変数の管理**: 機密情報（APIキーなど）は絶対にコードにコミットしないでください

## 7. 参考資料

- **フロントエンドAPI設定**: `frontend/src/services/api.ts:10-14`
- **バックエンドCORS設定**: `backend/app/main.py:10-22`
- **Railway設定**: `railway.json`
