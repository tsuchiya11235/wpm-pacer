# wpm_pacer

英語文章を、選択した **WPM（words per minute）** の速さで先頭から順に着色（`::selection` によるテキスト背景の色付け）していく、リーディング・ペースメーカー Web アプリです。

手入力・コピー＆ペースト・`.txt` ファイル取り込み・画像からの OCR の 4 経路でテキストを入力し、設定した速度で progressive にハイライトしながら読み進められます。読んだ文章はバックエンド（Spring Boot + PostgreSQL）に保存し、履歴から再読込できます。

> ポートフォリオ用途のため、フロントエンド（Next.js / React / TypeScript）とバックエンド（Java / Spring Boot / SQL）を意図的に別スタックで構成しています。

## デモの流れ（コア体験）

1. 左カラムの入力パネルで、4 経路のいずれかで英語テキストを用意する。
2. 「Reading speed」で WPM を設定する（再生中でも変更可）。
3. 右カラムの「Reading stage」で **Start** を押すと、設定速度で単語が先頭から順にハイライトされる。
4. 「Save passage」で保存 →「Saved passages」に一覧表示 → クリックで本文・WPM を復元。

## アーキテクチャ

| 領域 | 技術 |
|---|---|
| フロントエンド | Next.js 14 (App Router) + React 18 + TypeScript |
| バックエンド | Spring Boot 3 (Java 17) + Spring Data JPA + Flyway |
| データベース | PostgreSQL（開発/本番） / H2（テスト・`h2` プロファイルでのお試し起動） |
| OCR | バックエンドで Tess4J（Tesseract の Java ラッパー）による画像→テキスト抽出 |
| テスト | backend: JUnit 5 + MockMvc / frontend: Jest (ts-jest, jsdom) |

```
[Next.js :3000]  --REST/JSON, multipart-->  [Spring Boot :8080]  -->  [PostgreSQL]
   ::selection 着色 / FileReader 取込               OCR実処理 / Passage永続化
```

- 着色（`::selection`）と `.txt` 取り込みはフロントエンドのみで完結（サーバ通信不要）。
- OCR と Passage の保存・一覧・詳細はバックエンド API 経由。
- フロント(3000)・バック(8080)は別オリジンのため、バックエンドで CORS を許可（`wpm-pacer.cors.allowed-origins`）。

### REST API

| メソッド | パス | 説明 |
|---|---|---|
| GET | `/api/health` | 稼働確認（`{"status":"UP",...}`） |
| POST | `/api/passages` | Passage 保存（JSON: title?, content, wpm, sourceType） |
| GET | `/api/passages` | 一覧（新しい順、要約） |
| GET | `/api/passages/{id}` | 詳細（本文込み） |
| POST | `/api/ocr` | 画像から OCR 抽出（multipart, フィールド名 `image`） |

## ディレクトリ構成

```
wpm_pacer/
├── frontend/                     # Next.js + TypeScript
│   ├── app/                      # App Router（layout, page, globals.css）
│   ├── components/               # TextInputPanel, FileImportControl, OcrUploadPanel,
│   │                             #   WpmControl, ReadingStage, PassageHistoryList
│   ├── hooks/usePacer.ts         # 再生状態管理（rAF + タイムスタンプ補正）
│   └── lib/                      # pacer.ts（純粋関数）, text.ts, api.ts, types.ts
├── backend/                      # Spring Boot (Java)
│   ├── src/main/java/com/wpmpacer/{controller,service,repository,entity,dto,config,exception}
│   ├── src/main/resources/{application.yml, db/migration/*.sql}   # Flyway
│   └── src/test/java/com/wpmpacer/...
├── README.md
└── CLAUDE.md
```

## 前提ソフトウェア

- **Node.js 18.18 以上**（フロントエンド）
- **JDK 17**（バックエンド）
- **Maven 3.9 以上**（同梱の Maven Wrapper `./mvnw` を使えば個別インストール不要）
- **PostgreSQL 14 以上**（`h2` プロファイルで起動する場合は不要）
- OCR を使う場合は **Tesseract 言語データ**（後述）

## セットアップと起動

### 1. バックエンド（Spring Boot）

```bash
cd backend

# --- お試し起動（PostgreSQL 不要・インメモリ H2）---
./mvnw spring-boot:run -Dspring-boot.run.profiles=h2
#   Windows PowerShell: .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=h2"

# --- PostgreSQL で起動する場合 ---
# 1) DB を用意（例）
#    createdb wpm_pacer
#    createuser wpm_pacer --pwprompt   # パスワードも wpm_pacer にする例
# 2) 接続情報を環境変数で渡す（未指定なら下記デフォルト）
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/wpm_pacer
export SPRING_DATASOURCE_USERNAME=wpm_pacer
export SPRING_DATASOURCE_PASSWORD=wpm_pacer
# 3) 起動（Flyway が V1 マイグレーションで passages テーブルを作成）
./mvnw spring-boot:run
```

起動後、`http://localhost:8080/api/health` が `200` を返せば OK。

### 2. フロントエンド（Next.js）

```bash
cd frontend
npm install
cp .env.local.example .env.local     # 必要なら NEXT_PUBLIC_API_BASE_URL を編集
npm run dev
```

`http://localhost:3000` を開く。

### 3. OCR 用の言語データ（任意）

OCR（`/api/ocr`）を使う場合、Tesseract の英語モデルを配置します。

```bash
# backend/tessdata/eng.traineddata を用意
curl -L -o backend/tessdata/eng.traineddata \
  https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata
```

配置先と言語は `wpm-pacer.ocr.datapath` / `wpm-pacer.ocr.language`
（または環境変数 `WPM_PACER_OCR_DATAPATH` / `WPM_PACER_OCR_LANGUAGE`）で変更できます。
デフォルトはプロセスの作業ディレクトリ直下の `./tessdata`（＝`backend/` で起動した場合は `backend/tessdata`）。
未配置の場合、OCR エンドポイントは「言語データが見つからない」旨を返し、
フロントは手入力での修正を促します（他の 3 入力経路は影響を受けません）。

## テスト

```bash
# バックエンド（JUnit + MockMvc、H2 上で実行。ネイティブ Tesseract 不要）
cd backend && ./mvnw test

# フロントエンド
cd frontend
npm run lint        # ESLint（next/core-web-vitals）
npm run type-check  # tsc --noEmit
npm test            # Jest（pacer ロジックのユニットテスト等、fake timer 使用）
```

## 実装上のポイント

- **着色エンジン**: `lib/pacer.ts` に純粋関数（`msPerWord` / `readWordCount` / `reanchor` 等）を集約。
  進行度は経過時間から都度計算するため、バックグラウンドタブでのタイマー間引きでもドリフトしない。
  `hooks/usePacer.ts` が `requestAnimationFrame` で描画し、再生中の WPM 変更は現在位置を保ったまま再アンカーする。
- **OCR は実処理**: バックエンドで画像をデコードし Tesseract に渡す（スタブではない）。認識結果は編集可能な textarea に反映。
- **永続化**: Flyway マイグレーション（`V1__create_passages_table.sql`）でスキーマを管理し、JPA は `validate` で整合性を確認。

## スコープ（MVP）

含む: 4 入力経路 / WPM 着色（開始・一時停止・リセット・再生中変更）/ Passage 保存・一覧・詳細 / OCR / 基本的なエラーハンドリング / 自動テスト。
後回し: 認証・多ユーザー / 多言語 OCR / `.docx`・`.pdf` 取り込み / Electron・PWA 化 / 読了統計 / CI・CD。
