# wpm_pacer

英語文章を、選択した **WPM（words per minute）** の速さで先頭から順に着色（`::selection` によるテキスト背景の色付け）していく、リーディング・ペースメーカー Web アプリです。

手入力・コピー＆ペースト・`.txt` ファイル取り込み・画像からの OCR の 4 経路でテキストを入力し、設定した速度で progressive にハイライトしながら読み進められます。読んだ文章はバックエンド（Spring Boot + PostgreSQL）に保存し、履歴から再読込できます。

> ポートフォリオ用途のため、フロントエンド（Next.js / React / TypeScript）とバックエンド（Java / Spring Boot / SQL）を意図的に別スタックで構成しています。

## アーキテクチャ

| 領域 | 技術 |
|---|---|
| フロントエンド | Next.js (App Router) + React + TypeScript |
| バックエンド | Spring Boot (Java 17) + Spring Data JPA + Flyway |
| データベース | PostgreSQL（本番/開発） / H2（テスト・お試し起動） |
| OCR | バックエンドで Tess4J（Tesseract の Java ラッパー）による画像→テキスト抽出 |

```
[Next.js :3000]  --REST/JSON, multipart-->  [Spring Boot :8080]  -->  [PostgreSQL]
   ::selection 着色 / FileReader 取込               OCR実処理 / Passage永続化
```

- 着色（`::selection`）と`.txt`取り込みはフロントエンドのみで完結（サーバ通信不要）。
- OCR と Passage の保存・一覧・詳細はバックエンド API 経由。
- フロント(3000)・バック(8080)は別オリジンのため、バックエンドで CORS を許可。

## ディレクトリ構成

```
wpm_pacer/
├── frontend/   # Next.js + TypeScript
├── backend/    # Spring Boot (Java) + Flyway
├── README.md
└── CLAUDE.md
```

セットアップ手順・コマンドは実装完了後にこの README を更新します（各セクションは実装ステップの進行に合わせて追記）。

## セットアップ

詳細な前提ソフト・起動手順は末尾「開発環境セットアップ」を参照してください（実装完了時に確定）。
