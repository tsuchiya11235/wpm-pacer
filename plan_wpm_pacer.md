# wpm_pacer 実装計画

> 注記: リポジトリの物理フォルダ名は `wpm_pacer` にリネーム済みです。プロジェクト名・コード内の名称（package.json, README, ソース内の識別子等）はすべて `wpm_pacer` を採用します。

## 目的

- 開発経験必須のインターン応募に向けて、バックエンド（Java/Spring/SQL）とフロントエンド（React/Next.js/TypeScript）双方の実装経験を示せるポートフォリオを、要件通りに構築する。
- 「英語文章を選択WPMで progressive に着色して読む」という単一の明確な体験（コア機能）を軸に、手入力・ペースト・ファイルからの取り込み・OCRの4入力経路を実装する。
- 本計画は generator（実装）と evaluator（評価）が共通の完了条件で判断できる sprint contract として機能する。

## 技術スタック選定

| 領域 | 選定 | 理由 |
|---|---|---|
| フロントエンド | Next.js (React) + TypeScript + CSS | React/Next.js/TypeScriptの要件を単一フレームワークでまとめて満たせる。SSR/SPAどちらの経験も示せ、Vercel等での無料デプロイも容易。 |
| バックエンド | Spring Boot (Java) + PostgreSQL（開発時はH2併用可） | 要件文が例示する「Java/Spring」を明示的・曖昧さなく満たせる。フロントと言語スタックを完全に分離することで「二領域とも同じJS/TSで済ませた薄い実装」という評価リスクを避け、スキルの幅を示せる。Flywayでスキーマをマイグレーションとして残しSQL経験を可視化する。 |
| OCR | 第一候補: バックエンドで Tess4J（TesseractのJavaラッパー）による画像→テキスト抽出APIを実装<br>フォールバック: フロントエンドで Tesseract.js（ブラウザ内WASM実行、外部APIキー不要） | OCRは自前実装せず既存OCRエンジンを利用するのが妥当（文字認識自体は本アプリの差別化ポイントではない）。バックエンドにOCR処理を持たせることで単なるCRUD以上の「実処理を行うバックエンド」であることを示せる。ただしTess4Jはネイティブ実行体（tesseract本体・言語データ）の導入が必要でWindows環境ではセットアップが不安定になりうるため、詰まった場合はTesseract.js（クライアントサイド）へ切り替える判断をGenerator裁量とし、切替時はprogressログに理由を明記する。 |
| ファイル取り込み | フロントエンドで完結（`<input type="file">` + FileReader API、対象は `.txt` プレーンテキストファイル） | バックエンド呼び出しを介さずクライアントサイドのみでテキストを読み込める最も単純な経路。MVPでは `.txt` のみサポートし、`.docx`/`.pdf`等のパース（後回し）はスコープ外とする。 |

## アーキテクチャ概要

- フロントエンド（Next.js）がSPA的なUIを提供し、以下をバックエンドAPI（REST, JSON/multipart）経由でやり取りする。
  - `POST /api/ocr`（multipart画像）→ 抽出テキストを返す
  - `POST /api/passages`（本文, WPM, 入力元種別）→ DB保存、IDを返す
  - `GET /api/passages` / `GET /api/passages/{id}` → 一覧・詳細取得
- ファイルからの取り込み（`.txt`）はバックエンド呼び出しを介さず、フロントエンドで`FileReader`により読み込んでそのままtextareaに反映する（サーバー通信不要）。
- WPMに応じたプログレッシブ着色（`::selection`）は**フロントエンド側のみで完結**するクライアントサイド処理とする（サーバとの通信は不要、DOM操作とタイマー制御のみ）。
- テキストの永続化（保存・履歴一覧）はバックエンドDB（PostgreSQL, JPA+Flyway）に行う。認証は設けず、MVPでは単一ユーザー・匿名利用を前提とする。
- フロント(localhost:3000)・バック(localhost:8080)は別オリジンとして開発するため、バックエンド側でCORS設定を行う。APIベースURLはフロントの環境変数（`NEXT_PUBLIC_API_BASE_URL`）で外出しにする。

## スコープ定義（MVP / 後回し）

| 区分 | 内容 |
|---|---|
| MVPに含む | 手入力・ペースト・ファイルからの取り込み（.txt）・OCRの4入力経路／WPM設定＋`::selection`によるプログレッシブ着色（開始・一時停止・リセット、再生中のWPM変更）／バックエンドAPI（OCR実行、Passageの保存・一覧・詳細取得）／基本的なエラーハンドリング・ローディングUI／README／最低限の自動テスト（backend: controller/serviceテスト、frontend: pacerロジックのユニットテスト） |
| 後回し（スコープ外） | ユーザー認証・複数ユーザー管理／英語以外の多言語OCR・多言語WPM対応／`.docx`・`.pdf`等のリッチファイル形式の取り込み（`.txt`のみMVP対応）／Electron化・PWA化などのパッケージング／読了統計ダッシュボード／本番CI/CD・独自ドメイン運用（Docker化のみ任意stretchとして触れる）／リアルタイム共同編集・共有リンク |

## 主要機能の実装方針

### プログレッシブ着色エンジン（`::selection`）
- 経過時間ベースで「何単語目まで進んだか」を `elapsedMs / (60000 / wpm)` として算出し、`requestAnimationFrame` ループの中で `window.getSelection()` と `Range` を使い、テキスト先頭から該当単語末尾までを選択状態にする。CSSの `::selection { background-color: ... }` によりその選択範囲の背景色が変わる仕組みを利用する。
- `setInterval` のみに頼るとタブのバックグラウンド化でタイマーが間引かれズレが生じるため、必ずタイムスタンプ差分から単語インデックスを再計算する方式にする（ドリフト対策）。
- 単語境界の判定は空白区切りの簡易実装（MVPでは句読点の高度な扱いは後回し）。開始・一時停止・リセット、再生中のWPM変更（現在の経過語数を保ったまま新ペースで再計算）に対応する。
- 具体的な実装（span分割 vs 生テキストノード+オフセット計算など）はGeneratorの判断に委ねる。

### 4つの入力方法
1. **手入力**: `<textarea>` への直接入力。文字数/単語数表示。
2. **コピー＆ペースト**: 同じ`<textarea>`が標準のペーストイベントを自然にサポート。必要に応じClipboard APIによる明示的な「貼り付け」ボタンを追加してもよい。
3. **ファイルからの取り込み**: `<input type="file" accept=".txt">` でローカルの`.txt`ファイルを選択し、`FileReader.readAsText()`で読み込んだ内容をtextareaに反映する（バックエンド通信不要、クライアントサイドのみで完結）。
4. **OCR**: 画像ファイル選択（またはドラッグ&ドロップ）→プレビュー→「テキスト抽出」ボタンでバックエンド `/api/ocr` にmultipart送信→ローディング表示→抽出結果を編集可能な状態でtextareaに反映（OCR精度は完全でないため、必ずユーザーが確認・修正できるようにする）。

## プロジェクト構成案

```
wpm_pacer/
├── frontend/                 # Next.js + TypeScript
│   ├── app/ (or pages/)
│   ├── components/           # TextInputPanel, FileImportControl, OcrUploadPanel, WpmControl, ReadingStage, PassageHistoryList
│   ├── lib/                  # pacer.ts（純粋関数群）, api.ts（backend呼び出し）
│   ├── hooks/                # usePacer.ts
│   └── package.json / tsconfig.json
├── backend/                   # Spring Boot (Java)
│   ├── src/main/java/.../{controller,service,repository,entity}
│   ├── src/main/resources/{application.yml, db/migration/*.sql}  # Flyway
│   ├── src/test/java/...
│   └── pom.xml
├── requirement.md
├── CLAUDE.md                  # 実装後、実際のビルド/テストコマンドに更新
├── README.md                  # セットアップ手順
└── .gitignore
```

初期セットアップコマンド例:
- フロント: `npx create-next-app@latest frontend --typescript --eslint --app`
- バック: Spring Initializr相当（依存: Spring Web, Spring Data JPA, PostgreSQL Driver, H2, Flyway, Validation）

## 変更対象

| ファイル/ディレクトリ | 操作 | 変更内容 |
|---|---|---|
| `.gitignore`, `README.md` | 新規作成 | ルート雛形 |
| `backend/` 一式（pom.xml, Application.java, application.yml） | 新規作成 | Spring Boot雛形 |
| `backend/.../entity/Passage.java`, `repository/PassageRepository.java`, `service/PassageService.java`, `controller/PassageController.java` | 新規作成 | Passage CRUD API |
| `backend/src/main/resources/db/migration/V1__create_passages_table.sql` | 新規作成 | Flywayスキーマ定義 |
| `backend/.../controller/OcrController.java`, `service/OcrService.java` | 新規作成 | OCR API（Tess4J、またはフォールバック方針記載） |
| `backend/.../config/WebConfig.java`, `GlobalExceptionHandler.java` | 新規作成 | CORS・共通エラーハンドリング |
| `frontend/` 一式（create-next-app生成物） | 新規作成 | Next.js雛形 |
| `frontend/components/TextInputPanel.tsx` | 新規作成 | 手入力・ペーストUI |
| `frontend/components/FileImportControl.tsx` | 新規作成 | `.txt`ファイル選択・FileReader読み込みUI |
| `frontend/components/OcrUploadPanel.tsx`, `frontend/lib/api.ts` | 新規作成 | OCRアップロードUI＋API連携 |
| `frontend/lib/pacer.ts`, `frontend/hooks/usePacer.ts`, `frontend/components/ReadingStage.tsx` | 新規作成 | WPM着色エンジン |
| `frontend/components/WpmControl.tsx` | 新規作成 | WPM設定UI |
| `frontend/components/PassageHistoryList.tsx` | 新規作成 | 保存済みPassage一覧 |
| `README.md`, `CLAUDE.md` | 更新 | セットアップ手順、実コマンド反映 |

## 実装手順

1. **リポジトリ雛形作成**: `.gitignore`, `README.md`（骨子のみ）を作成し、`frontend/` `backend/` ディレクトリを用意する。
2. **バックエンド雛形（Spring Boot）**: `backend/`に`pom.xml`, `WpmPacerApplication.java`, `application.yml`を生成。`GET /api/health`が200を返すことを確認できる状態にする。
3. **Passage永続化API**: `Passage.java`（entity）, `PassageRepository.java`, `PassageService.java`, `PassageController.java`, `V1__create_passages_table.sql`（Flyway）を実装し、`POST/GET /api/passages`, `GET /api/passages/{id}` を提供する。
4. **OCR API**: `OcrController.java`, `OcrService.java`（Tess4J）を実装し `POST /api/ocr` を提供。ネイティブTesseract導入がGenerator環境で困難な場合はTesseract.js（クライアントサイド）へ切替し、判断理由をprogressログに残す。
5. **CORS・共通エラーハンドリング**: `WebConfig.java`（CORS許可設定）、`GlobalExceptionHandler.java`（`@ControllerAdvice`）を実装する。
6. **フロントエンド雛形（Next.js+TS）**: `create-next-app`で生成し、`npm run dev`でデフォルトページ表示を確認する。
7. **テキスト入力パネル**: `TextInputPanel.tsx`で手入力・ペーストに対応するtextareaを実装し、親状態（本文）に反映する。
8. **ファイル取り込み**: `FileImportControl.tsx`で`.txt`ファイル選択→`FileReader.readAsText()`→textarea反映のフローを実装する（不正な拡張子・読み込み失敗時のエラー表示を含む）。
9. **OCRアップロードパネル**: `OcrUploadPanel.tsx`と`lib/api.ts`を実装し、画像選択→プレビュー→抽出→textarea反映（編集可能）のフローを作る。
10. **WPMプログレッシブ着色エンジン**: `lib/pacer.ts`（msPerWord計算、経過時間→単語インデックス算出などの純粋関数）、`hooks/usePacer.ts`（start/pause/reset状態管理）、`components/ReadingStage.tsx`（Selection API適用＋`::selection`のCSS）を実装する。
11. **WPMコントロールUI**: `WpmControl.tsx`でスライダー/数値入力を実装し、再生中の変更にも追従させる。
12. **フロント-バック結合（保存/読込）**: `lib/api.ts`にPassage CRUD呼び出しを追加し、`PassageHistoryList.tsx`と`app/page.tsx`で「保存」「一覧から再読込」のフローを結合する。
13. **統合動作確認**: 手入力/ペースト/ファイル取り込み/OCRの4経路すべてから着色再生・保存・再読込までの一連の流れを手動（および可能なら簡易自動）で確認する。
14. **ドキュメント整備**: `README.md`にセットアップ手順・アーキ概要・スクリーンショットを追記し、`CLAUDE.md`を実コマンド（lint/test/dev起動コマンド等）に更新する。
15. **（任意/stretch）Docker化**: `docker-compose.yml`でbackend+PostgreSQLを一括起動できるようにする。

## 検証方法

### Generator自己チェック
- [ ] backend: `mvn test`（or `./mvnw test`）がすべて通る
- [ ] backend: アプリ起動後 `GET /api/health` が200を返す
- [ ] frontend: `npm run lint` / `tsc --noEmit` がエラーなし
- [ ] frontend: pacerロジックのユニットテスト（fake timer使用）が通る
- [ ] 手入力・ペースト・ファイル取り込み・OCRの4経路すべてでテキストがtextareaに反映されることを手動確認した
- [ ] WPM設定を変更して再生した際、`::selection`によるハイライトが設定速度通りに進行することを目視確認した
- [ ] 保存→一覧→再読込のフローが成功した
- [ ] README.mdの手順通りに第三者環境でセットアップを再現できることを確認した
- [ ] 各ステップ完了ごとに`git commit`している（メッセージに計画のステップ番号を含む）

### Evaluator評価チェック
- [ ] backend/frontendのコードがスタブ・モックのみで完結していないか（Product depth）
- [ ] 4入力経路→WPM着色→保存→再読込のワークフローがエンドツーエンドで実際に動くか（Functionality）
- [ ] OCR失敗・ファイル読み込み失敗・API失敗・不正入力時のUXが破綻していないか（Visual/UX）
- [ ] バックエンドがJava/Spring/SQLの実務的な使い方（Flywayマイグレーション、実DB接続、実処理としてのOCR）を示しているか
- [ ] フロントエンドがReact/Next.js/TypeScriptの実務的な使い方（コンポーネント分割、型付け、状態管理）を示しているか
- [ ] 可読性・エラーハンドリング・DRYが守られているか（Code quality）
- [ ] git履歴に意味のあるコミットが積まれているか（バージョン管理経験の証跡）
- [ ] READMEのみを見て第三者が環境構築・起動できるか

## リスク

- Tess4Jはネイティブのtesseract実行体・言語データの導入が必要で、特にWindows環境ではPATHやDLL依存関係のセットアップが不安定になりうる。詰まった場合はTesseract.js（クライアントサイド）へのフォールバックを許容する。
- `::selection`とSelection APIはモバイルブラウザやIME操作中で挙動が不安定になりうる。MVPではデスクトップ・英語テキスト前提として許容する。
- `setInterval`のみに依存するとバックグラウンドタブでの間引きにより着色速度がずれる。タイムスタンプベースの補正を必須とする。
- フロント(3000)/バック(8080)の別オリジン構成によるCORSエラーのリスク。APIベースURLを環境変数化し、CORS設定を明示的にテストする。
- OCR認識精度は撮影条件（傾き・手ブレ・明るさ）に強く依存し完全ではない。抽出結果をユーザーが編集可能にすることで吸収する。
- ファイル取り込みは`.txt`（プレーンテキスト、UTF-8想定）のみをMVP対象とする。文字コードが異なるファイルや`.docx`/`.pdf`はスコープ外とし、選択時にエラーメッセージで案内する。
- Java/Spring・Next.js/Reactの2スタックを同時に立ち上げるため初期環境構築コスト（JDK, Maven, Node.js, DB）が高い。README整備で緩和する。
- Flyway導入によりスキーマ変更のたびにマイグレーションファイル追加が必須になる（破壊的変更を防ぐための運用ルールとしてGeneratorが遵守する必要がある）。
- 本プロジェクトは新規リポジトリのため既存テスト・CIは存在しないが、今回追加するテストが将来変更時の回帰防止基盤となることを意識して実装する。
- スコープ肥大化リスク（認証、多言語対応、リアルタイム共同編集等）は上記「後回し」区分に明記し、MVPには含めない。
- 物理フォルダ名は`wpm_pacer`にリネーム済みのため、コード内のパッケージ名・READMEタイトル等も`wpm_pacer`で統一する。
