# Deployment Guide: Railway (Backend) + Vercel (Frontend)

このガイドでは、Railway にバックエンド、Vercel にフロントエンドをデプロイし、プレビュー環境でも正しく接続する方法を説明します。

## Railway（バックエンド）設定

### 1. 環境変数の設定

Railway のダッシュボードで以下の環境変数を設定します：

```bash
# CORS設定（重要）
CORS_ORIGINS=https://*.vercel.app,https://your-production-domain.vercel.app

# ポート（Railwayが自動で設定）
PORT=8000
```

**注意点:**
- `https://*.vercel.app` でVercelのすべてのプレビューとプロダクションドメインを許可
- カンマ区切りで複数のオリジンを指定可能
- プロトコル（https://）を必ず含める
- ワイルドカード（*）を使用可能

### 2. Publicドメインの確認

1. Railway ダッシュボードで "Settings" → "Networking" を開く
2. "Public Networking" セクションで **Generate Domain** をクリック（まだの場合）
3. 生成されたURLをコピー（例: `https://your-app-production.up.railway.app`）

このURLがバックエンドのAPIエンドポイントになります。

---

## Vercel（フロントエンド）設定

### 1. 環境変数の設定

Vercel のダッシュボードで以下を設定します：

#### Production環境
1. Project Settings → Environment Variables
2. 以下の変数を追加：

```bash
VITE_API_URL=https://your-app-production.up.railway.app
```

**Environment:** `Production` を選択

#### Preview環境
同じ変数を追加しますが、`Environment` で `Preview` を選択：

```bash
VITE_API_URL=https://your-app-production.up.railway.app
```

**Environment:** `Preview` を選択

#### Development環境（オプション）
ローカル開発用：

```bash
VITE_API_URL=http://localhost:8000
```

**Environment:** `Development` を選択

### 2. ビルド設定の確認

Vercel の Project Settings → General で以下を確認：

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `frontend` （リポジトリのルートでない場合）

---

## 動作確認

### 1. バックエンドの確認

ブラウザまたはcurlでヘルスチェック：

```bash
curl https://your-app-production.up.railway.app/health
```

期待される応答:
```json
{"status":"ok"}
```

### 2. フロントエンドの確認

Vercel のプレビューまたはプロダクションURLにアクセス：

1. ブラウザの開発者ツール（F12）を開く
2. Console タブを確認
3. エラーがないか確認
4. Network タブで API リクエストが成功しているか確認

### 3. CORS エラーの確認

もしCORSエラーが出る場合：

1. **Network タブ**で失敗したリクエストを確認
2. **Response Headers** に `Access-Control-Allow-Origin` が含まれているか確認
3. Railway の環境変数 `CORS_ORIGINS` が正しく設定されているか確認
4. Railway のサービスを再起動（環境変数の変更後）

---

## トラブルシューティング

### CORS エラーが出る

**症状:**
```
Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS policy
```

**解決策:**

1. **Railway の CORS_ORIGINS を確認:**
   ```bash
   CORS_ORIGINS=https://*.vercel.app
   ```

2. **Railwayを再デプロイ:**
   - 環境変数を変更後、Railwayは自動的に再デプロイされるはずですが、されない場合は手動で再デプロイ

3. **ブラウザのキャッシュをクリア:**
   - Shift + Ctrl + R（Windows/Linux）
   - Shift + Cmd + R（Mac）

### フロントエンドがバックエンドに接続できない

**症状:**
- データが読み込まれない
- "データがありません" と表示される
- Console に Network エラー

**解決策:**

1. **Vercel の環境変数を確認:**
   ```bash
   VITE_API_URL=https://your-app-production.up.railway.app
   ```
   - `/v1` を**含めない**（自動的に追加されます）

2. **Vercel を再デプロイ:**
   - 環境変数を変更後、新しいデプロイが必要
   - Deployments → ... → Redeploy

3. **Railway の URL が正しいか確認:**
   ```bash
   curl https://your-app-production.up.railway.app/health
   ```

### プレビュー環境だけ動かない

**症状:**
- Production は動作するが Preview で CORS エラー

**解決策:**

1. **Vercel の環境変数で Preview を選択したか確認**
2. **Railway の CORS_ORIGINS にワイルドカードが含まれているか確認:**
   ```bash
   CORS_ORIGINS=https://*.vercel.app
   ```

3. **Preview の URL を確認:**
   - Preview の URL は `https://your-app-git-branch-username.vercel.app` のような形式
   - この形式が `*.vercel.app` にマッチしているか確認

---

## コードの変更内容

### backend/app/main.py

以下の変更を行いました：

1. **動的 CORS ミドルウェアを追加:**
   - ワイルドカード（`*`）を含むオリジンパターンをサポート
   - 正規表現でオリジンをマッチング
   - Vercel のプレビューとプロダクションドメインを自動的に許可

2. **環境変数の処理を改善:**
   - `CORS_ORIGINS` が `*` の場合は全てのオリジンを許可
   - カンマ区切りで複数のオリジンを指定可能
   - ワイルドカードと完全一致を混在可能

### 使用例

```bash
# 全てのオリジンを許可（開発時のみ）
CORS_ORIGINS=*

# 特定のドメインのみ許可
CORS_ORIGINS=https://myapp.vercel.app

# Vercelの全ドメインを許可
CORS_ORIGINS=https://*.vercel.app

# 複数のパターンを許可
CORS_ORIGINS=https://*.vercel.app,https://custom-domain.com,http://localhost:3000
```

---

## 推奨設定

### 本番環境（Production）

**Railway:**
```bash
CORS_ORIGINS=https://your-production-domain.vercel.app
```

**Vercel:**
```bash
VITE_API_URL=https://your-app-production.up.railway.app
```

### プレビュー環境（Preview）

**Railway:**
```bash
CORS_ORIGINS=https://*.vercel.app
```

**Vercel:**
```bash
VITE_API_URL=https://your-app-production.up.railway.app
```

### 開発環境（Development）

**ローカル (.env):**
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
VITE_API_URL=http://localhost:8000
```

---

## セキュリティの考慮事項

1. **本番環境では特定のドメインを指定:**
   - `CORS_ORIGINS=*` は開発時のみ使用
   - 本番では完全なドメインを指定することを推奨

2. **HTTPSを使用:**
   - Railway と Vercel は自動的に HTTPS を提供
   - ローカル開発以外では HTTP を使用しない

3. **認証情報の保護:**
   - 環境変数に機密情報を保存
   - `.env` ファイルを `.gitignore` に追加

---

## 参考リンク

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [FastAPI CORS](https://fastapi.tiangolo.com/tutorial/cors/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
