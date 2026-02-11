# バックエンドセットアップガイド

## 概要

このアプリケーションは、フロントエンドとバックエンドで構成されています：

- **フロントエンド**: React + TypeScript + Material-UI（データ入力UI）
- **バックエンド**: FastAPI + Python（詳細な熱負荷計算エンジン）

バックエンドを起動すると、以下の機能が有効になります：
- 詳細な熱負荷計算（ASHRAE準拠）
- 参照データベース（気象データ、材料物性値など）
- データ検証とエクスポート機能

## バックエンド起動手順

### 1. 依存関係のインストール

```bash
cd backend
pip install -r requirements.txt
```

### 2. バックエンドサーバーの起動

```bash
# backend ディレクトリで実行
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

または、プロジェクトルートから：

```bash
cd backend && uvicorn app.main:app --reload
```

### 3. 動作確認

ブラウザで以下にアクセス：
- API ドキュメント: http://localhost:8000/docs
- ヘルスチェック: http://localhost:8000/

### 4. フロントエンドとの接続

フロントエンドは自動的にバックエンドに接続を試みます。
`frontend/.env` ファイルで接続先を設定できます：

```
VITE_API_URL=http://localhost:8000
```

## フロントエンド起動手順

別のターミナルで：

```bash
cd frontend
npm install  # 初回のみ
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

## バックエンドなしでの動作

バックエンドが起動していない場合、フロントエンドは自動的に**簡易計算モード**に切り替わります：
- 基本的な熱負荷計算（簡易式）
- IndexedDBによるローカルデータ保存
- 参照データベースへのアクセスなし

## APIエンドポイント

主要なエンドポイント：

- `POST /calc/run` - 熱負荷計算実行
- `GET /reference/{table_name}` - 参照データ取得
- `GET /reference/nearest_region` - 最寄り地域検索
- `POST /projects/validate` - プロジェクトデータ検証

詳細は http://localhost:8000/docs を参照

## 参照データ

バックエンドには以下の参照データが含まれています：

- `design_outdoor_conditions.json` - 設計外気条件（全国800地点以上）
- `material_thermal_constants.json` - 建材熱定数
- `glass_properties_sc_u_value.json` - ガラス性能データ
- `standard_solar_gain.json` - 標準日射量
- `heating_ground_temperature.json` - 地中温度
- `lighting_power_density.json` - 照明密度
- `occupancy_density_and_heat_gain.json` - 在室人数と発熱量
- など18種類のデータテーブル

## トラブルシューティング

### バックエンドに接続できない

1. バックエンドが起動しているか確認：
   ```bash
   curl http://localhost:8000/
   ```

2. ポートが使用中の場合、別のポートで起動：
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```
   その場合、`frontend/.env` の `VITE_API_URL` も変更してください。

### CORS エラー

バックエンドのCORS設定を確認してください（`backend/app/main.py`）。
デフォルトでは localhost からのアクセスを許可しています。

### 計算エラー

1. プロジェクトデータが完全か確認
2. バックエンドログでエラー詳細を確認
3. `/projects/validate` エンドポイントでデータを検証

## 開発モード vs 本番モード

### 開発モード（現在の設定）
- `--reload` オプションでコード変更時に自動再起動
- デバッグログ出力
- CORS 緩和設定

### 本番モード
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## さらなる情報

- FastAPI ドキュメント: https://fastapi.tiangolo.com/
- API スキーマ: `backend/app/models/schemas.py`
- 計算ロジック: `backend/app/domain/` 以下
- 参照データ: `backend/reference_data/`
