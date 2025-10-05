# RiffQuest 要件定義（SRS）v0.2

最終更新: 2025-10-04 / 作成者: 霧島フェニックス × AI

---

## 0. コンセプト
**RiffQuest** は、ギター練習を配信中に「可視化・計測・ゲーム化」する OBS 連携ツール群（コンパニオンアプリ＋オーバーレイ）。
- 練習のフォーカス時間・BPM・PB（自己ベスト）・ミスなどを自動記録
- ポモドーロ運用で「黙って練習・休憩で会話」を明確化
- XP/クエスト/実績で継続を促進
- 生成曲（Suno 有料プラン）を用いた“未知曲トレーニング”前提

---

## 1. スコープ / 非スコープ
### スコープ（MVP）
- OBS と WebSocket 連携（v5）
- `Practice_*` シーン中のみフォーカス時間カウント
- ポモドーロ（25/5 変更可）
- ホットキー/MIDI でマーカー（miss/pb/bpm±）
  - **MIDI Learn 機能**: GUI上でボタンを押してMIDIデバイスを操作し、自動マッピング
- XP 計算・クエスト・実績（初期セット）
- オーバーレイ表示（Browser Source）
  - **テーマ切替**: ダーク/ネオン/ミニマル（CSS変数ベース）
- JSON/CSV エクスポート（日次/週次）
- チャット `!status`（どちらか一方: Twitch または YouTube）
- **練習セッションのタグ付け**: 手動でタグ入力（`#alternate-picking`, `#sweep` など）

### スコープ（MVP+α: v1.1-1.2 想定）
- **BPM 自動検出**: メトロノーム音を FFT 解析して BPM を推定
- **練習曲ライブラリ**: Suno生成曲を管理、難易度・ジャンル・タグで分類
- **チャットコマンド拡張**: `!pb`, `!quest`, `!streak` など複数コマンド対応
- **音声解析の高度化**: 周波数帯域フィルタ（80-5kHz）+ 短時間フーリエ変換で誤検知削減
- **SQLite 自動バックアップ**: 日次/週次で圧縮バックアップを `backups/` に保存

### 非スコープ（v2.0 以降）
- DAW 連携、譜面解析、音程認識、自動採譜
- マルチ楽器高度解析（MVPはギター想定）
- **コミュニティ機能**: 匿名ランキング（オプトイン）、週次チャレンジ
- **AI 分析**: ミスパターン分析「16分音符の3-4番目で頻発」
- **Twitch 拡張機能**: パネルに進捗表示、視聴者投票機能

---

## 2. アーキテクチャ
```
OBS ←→ obs-websocket(v5) ←→ Companion App(Electron/Node/TS)
                                     ↓
                          SQLite(WAL) + Auto Backup
                                     ↓
                      WebSocket Server (localhost:3030)
                                     ↓
                           Overlay UI(React/Vite/SPA)
                                ↓         ↓
                         BrowserSource   Settings UI
                                     ↓
                       Hotkey / MIDI / Chat(Twitch|YT)
```

### 主要コンポーネント
- **Companion App (Electron)**:
  - バックエンド: Node.js/TypeScript、計測ロジック、XP/クエスト管理、SQLite 永続化
  - フロントエンド: React（設定UI）、Vite ビルド
  - WebSocket Server: `ws://127.0.0.1:3030` でオーバーレイとリアルタイム通信
  - 配布: Windows `.exe` (electron-builder), macOS `.dmg`

- **Overlay UI**:
  - React SPA (`http://127.0.0.1:3030/overlay`)
  - OBS Browser Source で表示、WebSocket でリアルタイム更新
  - テーマ切替（CSS変数）、アニメーション（Framer Motion）

- **通信プロトコル**:
  - OBS ↔ App: obs-websocket v5 (JSON-RPC)
  - App ↔ Overlay: WebSocket (カスタムイベント)
  - App ↔ Chat: Twitch IRC / YouTube Live Chat API

---

## 3. ユースケース（拡張版）

### 基本フロー
- **U1**: `Practice_*` シーン滞在中のみフォーカス時間を自動加算したい
- **U2**: ポモドーロの練/休憩をオーバーレイに反映し、自動停止したい
- **U3**: MIDI ペダルで PB/ミス/BPM±を記録したい
  - **U3.1**: MIDI Learn 機能で GUI 上でペダルを踏んで自動マッピング
- **U4**: ターゲット BPM 到達で XP/実績を付与したい
- **U5**: 配信終了時に日次 JSON/CSV を自動出力したい
- **U6**: 視聴者が `!status` で進捗を確認できるようにしたい

### 新規追加（v1.1-1.2）
- **U7**: 練習セッションにタグを付けて、タグ別の進捗を確認したい
  - 例: `#alternate-picking` で今週の合計フォーカス時間を表示
- **U8**: メトロノーム音から BPM を自動検出して手動入力を省略したい
- **U9**: Suno で生成した曲をライブラリに登録し、難易度・ジャンル・タグで管理したい
  - 曲ごとの PB・プレイ回数・初見/リピート回数を記録
- **U10**: チャットで `!pb`, `!quest`, `!streak` など個別の情報を確認したい
- **U11**: オーバーレイのテーマをダーク/ネオン/ミニマルで切り替えたい
- **U12**: 異常終了時でも SQLite のバックアップから復旧したい

---

## 4. 機能要件
### 4.1 計測（拡張版）
- **シーン判定**: 現在プログラムシーン名が `Practice_` で始まる間だけ `focus_seconds++`
- **音入力検知**（設定で ON/OFF）:
  - **MVP**: 指定デバイスの RMS/ピーク>閾値 で「演奏中」。閾値・ホールド時間を設定可能
  - **v1.1+**: 周波数帯域フィルタ（80-5kHz）+ 短時間フーリエ変換（STFT）で誤検知削減
  - **競合解決**: 休憩中に音入力があってもカウント停止を維持（ポモドーロ優先）
- **ポモドーロ**: 練習 N 分 / 休憩 M 分（デフォルト 25/5）。休憩中はカウント停止
  - 休憩終了時にチャイム音（オプション）、自動で練習モードに復帰
- **Streak**: 1 日 X 分（既定 30 分）以上達成で +1
- **BPM 自動検出**（v1.1+）:
  - メトロノーム音を FFT 解析して BPM を推定（80-240 BPM 範囲）
  - 検出精度 ±2 BPM、3秒間のサンプリングで確定
  - 手動上書き可能

### 4.2 ゲーミフィケーション
- XP: `XP = focus_minutes * base_rate * difficulty * focus_multiplier`
  - `base_rate` 初期 10/min
  - `difficulty = 1 + (target_bpm - 80) / 100`
  - `focus_multiplier` = 演奏入力 ON=1.0 / OFF=0.5
- クエスト（例）
  - デイリー: フォーカス 60 分 / PB 更新 / ミスマーカー 10→5
  - ウィークリー: ターゲット BPM +8 達成 ×3 日
- 実績（バッジ）
  - Zen Mode（チャット非表示で 25 分）
  - No Undo（休憩スキップなしで 60 分）
  - Clutch（ラスト 5 分で PB 更新）

### 4.3 入出力（拡張版）
- **ホットキー**: `Ctrl+Alt+M`=miss, `Ctrl+Alt+P`=pb, `Ctrl+Alt+↑/↓`=BPM±
  - カスタマイズ可能（設定UIで変更）
- **MIDI**:
  - **MIDI Learn 機能**: GUI上で「Learn」ボタンを押してMIDIデバイスを操作し、自動マッピング
  - CC/Note 対応、長押し/ダブルタップの判定は v1.2 で検討
  - 複数デバイス対応（最大3デバイス）
- **チャット**:
  - **MVP**: `!status`→「今日: 62 分 / PB 132 BPM / XP 620 / Streak 12」
  - **v1.1+**: `!pb`, `!quest`, `!streak`, `!tag <tag_name>` など個別コマンド対応
  - レート制限: 同一ユーザーからのコマンドは 10 秒に 1 回まで
- **エクスポート**:
  - **MVP**: `exports/YYYY-MM-DD.(json|csv)`
  - **v1.1+**: 週次レポート `exports/YYYY-Www.(json|csv|html)`
  - HTML レポート: グラフ（Chart.js）、実績バッジ表示
- **タグ管理**（v1.1+）:
  - セッション開始時にタグ入力（複数可、カンマ区切り）
  - タグ別の統計表示（フォーカス時間、XP、PB）

### 4.4 オーバーレイ（表示要素・拡張版）
- **上段**: Day/Season, BPM(target/now), XP, Streak
- **中央**: 進捗バー（今日の目標分数 / クエスト進捗）
- **下段**: ミス Top3 タグ（任意）、現在のタグ表示
- **状態色**:
  - 練習=通常（テーマ依存）
  - 休憩=グレー/半透明
  - PB=1 秒フラッシュ（ゴールド/ネオングリーン）
- **更新間隔**: 1 秒（WebSocket プッシュ）
- **テーマ切替**（v1.1+）:
  - **ダーク**: 黒背景、白文字、青/紫アクセント
  - **ネオン**: 暗背景、ネオンピンク/シアン、グロー効果
  - **ミニマル**: 白背景、グレー文字、薄いアクセント
  - CSS変数ベース、リアルタイム切替
- **アニメーション**（v1.1+）:
  - PB 更新時: 拡大→縮小アニメーション（Framer Motion）
  - XP 加算時: カウントアップアニメーション
  - クエスト達成時: チェックマークアニメーション

### 4.5 設定/管理（拡張版）
- **ローカル Web GUI**: 5 タブに拡張
  1) **Connection**（OBS/Chat）
     - OBS WebSocket URL/パスワード、接続テスト
     - Twitch/YouTube チャット認証（OAuth）
  2) **Practice Logic**（シーン/ポモ/閾値/BPM）
     - シーンプレフィックス設定
     - ポモドーロタイマー設定（練習/休憩時間）
     - 音入力検知（デバイス選択、RMS閾値、ホールド時間）
     - BPM 設定（手動/自動検出）
  3) **Gamification**（XP/クエスト/実績）
     - XP 係数調整（base_rate, difficulty_base_bpm）
     - クエスト ON/OFF、カスタムクエスト作成
     - 実績閲覧、進捗確認
  4) **Library**（練習曲管理）（v1.1+）
     - Suno 生成曲の登録（タイトル、難易度、ジャンル、タグ）
     - 曲ごとの統計（PB、プレイ回数、初見/リピート）
     - プレイリスト作成、ランダム再生
  5) **Overlay**（テーマ/レイアウト）（v1.1+）
     - テーマ切替（ダーク/ネオン/ミニマル）
     - レイアウトカスタマイズ（要素の表示/非表示）
     - プレビュー機能（設定画面内でオーバーレイをプレビュー）
- **プロファイル切替**: `default`, `metal`, `acoustic` など
  - プロファイルごとに設定を保存、切り替え
  - エクスポート/インポート機能（YAML）

---

## 5. 非機能要件（拡張版）

### パフォーマンス
- **CPU 使用率**: Companion+Overlay 合計 < 3%（i7-8700K 目安）
  - Companion App: < 2%
  - Overlay: < 1%（アニメーション時 < 1.5%）
- **メモリ**: 合計 < 200MB
  - Companion App: < 150MB
  - Overlay: < 50MB
- **レイテンシ**:
  - オーバーレイ更新: WebSocket プッシュで < 100ms（目標）、< 300ms（許容）
  - MIDI/ホットキー応答: < 50ms
  - OBS WebSocket イベント応答: < 200ms

### 互換性
- **OS**: Windows 10/11（優先）、macOS 13+（ベストエフォート）
- **OBS**: 29+ / obs-websocket v5.x
- **ブラウザ**: Chromium Embedded Framework (OBS Browser Source)
- **Node.js**: 18.x LTS+（Electron バンドル）

### データ保全
- **SQLite**:
  - WAL モード有効
  - 自動バックアップ: 日次（過去7日分保持）、週次（過去4週分保持）
  - バックアップ場所: `backups/YYYY-MM-DD_HHmmss.db.gz`
- **異常終了時リカバリ**:
  - セッション再開時に未完了セッションを検出、継続/破棄を選択
  - WAL ログから最終状態を復元

### セキュリティ
- **ネットワーク**: 127.0.0.1 バインド、外部公開なし
- **トークン管理**: OS キーストア（Windows: Credential Manager, macOS: Keychain）
- **OAuth**: PKCE フロー使用（Twitch/YouTube 認証）
- **ログ**: 機密情報（パスワード/トークン）はマスク

### 国際化（i18n）
- **言語**: 日本語（デフォルト）、英語
- **タイムゾーン**: ユーザー設定可能（デフォルト: システムのタイムゾーン）
- **日付形式**: ロケール準拠

### アクセシビリティ（将来検討）
- キーボードナビゲーション対応
- スクリーンリーダー対応（設定UI）

---

## 6. データモデル（拡張版）

### `sessions`
|列|型|説明|
|--|--|--|
|id|uuid|セッションID（主キー）|
|start|datetime|開始UTC|
|end|datetime|終了UTC（null=進行中）|
|platforms|text|"twitch", "youtube", "none" など（カンマ区切りも可）|
|total_focus_ms|int|フォーカス合計（ミリ秒）|
|tags|text|セッションのタグ（カンマ区切り: "alternate-picking,sweep"）|
|song_id|uuid|練習曲ID（外部キー、null可）（v1.1+）|
|notes|text|自由記述|

### `events`
|列|型|説明|
|--|--|--|
|id|uuid|イベントID（主キー）|
|session_id|uuid|外部キー → sessions.id|
|ts|datetime|UTC タイムスタンプ|
|type|text|miss/pb/bpm_up/bpm_down/marker|
|bpm_value|int|BPM 値（null可）|
|tag|text|イベントのタグ（null可）|
|notes|text|追加メモ（null可）|

**変更点**: `payload` JSON を専用カラム（`bpm_value`, `tag`, `notes`）に分割し、集計クエリを高速化

### `daily_summary`
|列|型|説明|
|--|--|--|
|day|date|ローカル日付（ユーザーのタイムゾーン）|
|timezone|text|タイムゾーン（"Asia/Tokyo" など）|
|focus_minutes|int|日次フォーカス（分）|
|xp|int|日次XP|
|streak|int|連続日数|
|pb_bpm|int|当日PB|
|quests_completed|text|達成クエストID（カンマ区切り）|

**変更点**: `day` のタイムゾーンを明示、`quests_completed` を JSON から text に変更

### `songs`（v1.1+）
|列|型|説明|
|--|--|--|
|id|uuid|曲ID（主キー）|
|title|text|曲名|
|artist|text|アーティスト（Suno生成曲の場合は "Suno AI"）|
|difficulty|int|難易度（1-10）|
|genre|text|ジャンル（"metal", "jazz" など）|
|tags|text|タグ（カンマ区切り）|
|bpm|int|曲の BPM|
|duration_sec|int|曲の長さ（秒）|
|file_path|text|音源ファイルパス（null可）|
|created_at|datetime|登録日時|

### `song_stats`（v1.1+）
|列|型|説明|
|--|--|--|
|song_id|uuid|外部キー → songs.id|
|day|date|ローカル日付|
|play_count|int|プレイ回数|
|first_play_count|int|初見プレイ回数|
|pb_bpm|int|曲ごとの PB|
|total_focus_ms|int|この曲での合計フォーカス時間|

**主キー**: (song_id, day)

### `settings`
|列|型|説明|
|--|--|--|
|key|text|設定キー（主キー）|
|value|text|設定値（JSON文字列）|
|profile_name|text|プロファイル名（"default" など）|

**例**:
- key: "obs_endpoint", value: "ws://127.0.0.1:4455", profile_name: "default"
- key: "xp_params", value: "{\"base_rate\":10,...}", profile_name: "default"

---

## 7. 設定ファイル（YAML 例）
```yaml
profile: default
obs:
  url: ws://127.0.0.1:4455
  password: "${OBS_WS_PASSWORD}"
practice:
  scene_prefix: "Practice_"
  pomodoro: { work_min: 25, break_min: 5 }
  streak_threshold_min: 30
  audio_meter:
    device: "Guitar In"
    rms_threshold: -30  # dBFS
    hold_ms: 800
bpm:
  target: 132
  step: 2
xp:
  base_rate: 10
  difficulty_base_bpm: 80
  focus_multiplier_on: 1.0
  focus_multiplier_off: 0.5
hotkeys:
  miss: "Ctrl+Alt+M"
  pb: "Ctrl+Alt+P"
  bpm_up: "Ctrl+Alt+Up"
  bpm_down: "Ctrl+Alt+Down"
midi:
  enabled: true
  mappings:
    - action: miss
      type: cc
      channel: 1
      number: 64
    - action: pb
      type: note
      channel: 1
      number: 60
export:
  dir: ./exports
chat:
  provider: twitch  # or youtube
  command_prefix: "!"
```

---

## 8. API 仕様（ローカル REST + WebSocket）

### REST API（`http://127.0.0.1:3030`）

#### `GET /api/overlay-data`
**説明**: オーバーレイ用の現在の状態を取得（WebSocket の初期データ取得用）
**レスポンス**:
```json
{
  "focus_min": 62,
  "xp": 620,
  "streak": 12,
  "bpm_target": 132,
  "bpm_current": 128,
  "pb_bpm": 140,
  "pomodoro": { "state": "work", "remaining_sec": 1200 },
  "tags": ["alternate-picking", "sweep"],
  "theme": "dark"
}
```

#### `POST /api/marker`
**説明**: マーカーイベントを記録
**リクエスト**:
```json
{ "type": "miss|pb|bpm_up|bpm_down|marker", "tag": "sweep", "notes": "..." }
```
**レスポンス**: `{ "success": true, "event_id": "uuid" }`

#### `GET /api/export/daily?day=YYYY-MM-DD&format=json|csv`
**説明**: 日次データをエクスポート
**レスポンス**: JSON/CSV ダウンロード

#### `GET /api/export/weekly?week=YYYY-Www&format=json|csv|html`（v1.1+）
**説明**: 週次レポートをエクスポート
**レスポンス**: JSON/CSV/HTML ダウンロード

#### `GET /api/songs`（v1.1+）
**説明**: 登録済み曲一覧を取得
**レスポンス**:
```json
[
  { "id": "uuid", "title": "Song A", "difficulty": 7, "genre": "metal", "bpm": 140 }
]
```

#### `POST /api/songs`（v1.1+）
**説明**: 新しい曲を登録
**リクエスト**:
```json
{ "title": "Song A", "difficulty": 7, "genre": "metal", "tags": "sweep,fast", "bpm": 140 }
```

#### `GET /api/stats/tags?tag=<tag_name>&period=day|week|month`（v1.1+）
**説明**: タグ別の統計を取得
**レスポンス**:
```json
{
  "tag": "alternate-picking",
  "focus_minutes": 120,
  "xp": 1200,
  "pb_bpm": 140,
  "sessions_count": 5
}
```

### WebSocket API（`ws://127.0.0.1:3030`）

#### クライアント → サーバー
- `{ "type": "subscribe", "channel": "overlay" }` - オーバーレイデータの購読開始

#### サーバー → クライアント
- **更新イベント**（1秒ごと）:
```json
{
  "type": "update",
  "data": {
    "focus_min": 63,
    "xp": 630,
    "pomodoro": { "state": "work", "remaining_sec": 1140 }
  }
}
```

- **PB更新イベント**:
```json
{ "type": "pb_update", "data": { "pb_bpm": 144 } }
```

- **クエスト達成イベント**:
```json
{ "type": "quest_complete", "data": { "quest_id": "daily_focus_60", "title": "フォーカス60分" } }
```

---

## 9. UI ワイヤー（テキスト）
- **Overlay**（横 960px / クリック不可）
  - 左: Day/Season / Streak
  - 中央大: 今日のフォーカス分数（巨大数字）+ 進捗バー
  - 右上: BPM (target/now) と PB
  - 右下: XP 合計、ポモドーロ残り時間
- **設定画面**（3タブ）
  1) Connection: OBS URL/Pass、Chat Token、接続テスト
  2) Practice Logic: scene_prefix、ポモ、オーディオ閾値、BPM
  3) Gamification: XP 係数、クエストON/OFF、実績閲覧

---

## 10. 受け入れ基準（拡張版）

### MVP（v1.0）
- **AC1**: `Practice_*` シーン中のみ 1 秒単位でフォーカス加算、秒→分への換算が正確
- **AC2**: ポモドーロ ON 時は休憩中カウント停止、練習モードに自動復帰
- **AC3**: ホットキーで miss/pb/bpm± を記録し、`events` テーブルに保存、レイテンシ < 50ms
- **AC4**: WebSocket で 1 秒ごとにオーバーレイデータをプッシュ、レイテンシ < 100ms
- **AC5**: セッション終了時に日次 JSON/CSV が自動出力、データ整合性を確認
- **AC6**: チャット `!status` が今日の進捗（フォーカス/XP/Streak/PB）を返答、レート制限あり
- **AC7**: 異常終了でもセッション整合性維持（WAL/再開時補完）、復旧率 >95%
- **AC8**: MIDI Learn 機能で GUI 上でペダルを踏んで自動マッピング、3デバイスまで対応
- **AC9**: オーバーレイのテーマ切替（ダーク/ネオン/ミニマル）がリアルタイムで反映
- **AC10**: セッションにタグを付けて保存、タグ表示がオーバーレイに反映

### v1.1-1.2
- **AC11**: メトロノーム音から BPM を自動検出、精度 ±2 BPM、3秒で確定
- **AC12**: Suno 生成曲を Library に登録、曲ごとの統計（PB/プレイ回数）を記録
- **AC13**: チャットコマンド `!pb`, `!quest`, `!streak`, `!tag <tag>` が正常動作
- **AC14**: 音声解析の高度化（周波数フィルタ + STFT）で誤検知率 < 5%
- **AC15**: SQLite 自動バックアップが日次/週次で実行、圧縮率 >70%
- **AC16**: 週次レポート（JSON/CSV/HTML）が出力、グラフ表示が正常
- **AC17**: タグ別統計 API が正確な集計結果を返却

---

## 11. リスク & 対策（拡張版）

### 技術リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| **OBS イベント取りこぼし** | 高 | - 冪等再計算・再接続リトライ（指数バックオフ）<br>- イベントキューで一時保存<br>- 定期的な状態同期（5秒ごと） |
| **音入力の誤検知** | 中 | - **MVP**: デバイス別ゲイン/ノイズゲート/ホールド時間<br>- **v1.1+**: 周波数帯域フィルタ（80-5kHz）+ STFT<br>- ユーザーによる閾値調整UI |
| **CPU 負荷** | 中 | - 1秒更新、Canvas軽量化<br>- 計算は Node 側集約、Overlay は描画のみ<br>- WebSocket でデータプッシュ（ポーリング回避）<br>- アニメーションの最適化（requestAnimationFrame） |
| **二重起動** | 低 | - PID ファイル/ソケットロック<br>- 起動時に既存プロセスを検出、確認ダイアログ表示 |
| **WebSocket 切断** | 中 | - 自動再接続（最大5回リトライ）<br>- 切断検知（pingInterval: 10s, pongTimeout: 5s）<br>- Overlay にステータス表示（"接続中...", "切断"） |
| **SQLite ロック** | 低 | - WAL モード有効化<br>- トランザクションの短縮化<br>- busy_timeout 設定（5秒） |
| **BPM 自動検出の精度** | 中 | - FFT ウィンドウサイズの最適化<br>- 複数サンプルの平均値を使用<br>- 手動上書き機能の提供 |

### 運用リスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| **ユーザーの設定ミス** | 中 | - 設定UIでバリデーション実装<br>- 接続テスト機能の提供<br>- デフォルト値の適切な設定 |
| **データ破損** | 高 | - SQLite WAL モード + 自動バックアップ<br>- 異常終了時のリカバリ機能<br>- エクスポート機能で定期的な手動バックアップ推奨 |
| **ライセンス違反** | 低 | - 依存ライブラリのライセンス確認<br>- AGPL-3.0/MPL-2.0 の適切な適用<br>- LICENSE ファイルの整備 |

### パフォーマンスリスク
| リスク | 影響度 | 対策 |
|--------|--------|------|
| **Overlay の描画負荷** | 中 | - React.memo/useMemo での再描画抑制<br>- 仮想DOM の最適化<br>- アニメーションの CPU 負荷テスト |
| **FFT 処理の負荷** | 低 | - Web Audio API の AnalyserNode 使用<br>- バッファサイズの最適化（2048サンプル）<br>- Worker スレッドでの処理検討 |

---

## 12. ライセンス / 配布
- 候補: AGPL-3.0（改変公開担保） or MPL-2.0（ゆるめ）
- GitHub Releases に Windows バイナリ、英日 README

---

## 13. スプリント計画（拡張版）

### MVP（v1.0）: 4 スプリント × 2週間 = 8週間

**Sprint 1: 基盤構築**（Week 1-2）
- Electron プロジェクトセットアップ（TypeScript, Vite, React）
- OBS WebSocket v5 接続実装
- セッション管理（開始/終了/状態保存）
- SQLite セットアップ（WAL モード、マイグレーション）
- フォーカス時間計測（シーン判定）
- Overlay 最小実装（React SPA、WebSocket 接続）

**Sprint 2: 入力系統**（Week 3-4）
- ホットキー実装（miss/pb/bpm±）
- MIDI 入力実装（CC/Note 対応）
- **MIDI Learn 機能**（GUI上で自動マッピング）
- イベント保存（`events` テーブル）
- ポモドーロタイマー実装
- オーバーレイのリアルタイム更新（WebSocket プッシュ）

**Sprint 3: ゲーミフィケーション**（Week 5-6）
- XP 計算ロジック実装
- クエストシステム（デイリー/ウィークリー）
- 実績システム（バッジ）
- 設定UI（3タブ: Connection, Practice Logic, Gamification）
- チャット統合（Twitch IRC / YouTube Live Chat API）
- `!status` コマンド実装

**Sprint 4: 仕上げ & テスト**（Week 7-8）
- JSON/CSV エクスポート機能
- オーバーレイテーマ切替（ダーク/ネオン/ミニマル）
- セッションタグ付け機能
- 音入力検知（RMS/ピーク閾値）
- 異常終了時リカバリ機能
- CPU/メモリ最適化
- E2E テスト（Playwright）
- ドキュメント整備（README, セットアップガイド）

### v1.1-1.2: 2 スプリント × 2週間 = 4週間

**Sprint 5: 高度な音声解析 & Library**（Week 9-10）
- BPM 自動検出（FFT 解析）
- 音声解析の高度化（周波数フィルタ + STFT）
- 練習曲 Library 実装（`songs`, `song_stats` テーブル）
- 曲登録 UI（タイトル/難易度/ジャンル/タグ）
- タグ別統計 API 実装

**Sprint 6: レポート & UI強化**（Week 11-12）
- 週次レポート（JSON/CSV/HTML）
- HTML レポートのグラフ表示（Chart.js）
- チャットコマンド拡張（`!pb`, `!quest`, `!streak`, `!tag`）
- SQLite 自動バックアップ（日次/週次）
- 設定UI拡張（Library, Overlay タブ追加）
- オーバーレイアニメーション強化（Framer Motion）
- 最終テスト & バグ修正

---

## 14. OBS セットアップ手順（チェックリスト）
- [ ] OBS 29+ / obs-websocket v5.x を有効化（ポート/パス設定）
- [ ] シーンを `Practice_AltPicking` などの命名で作成
- [ ] Browser Source に `http://127.0.0.1:5173/overlay` を追加（透過ON）
- [ ] オーディオデバイスをメーター用に分離（Loopback or Aux In）
- [ ] ホットキー／MIDI の割当テスト（マーカー反映確認）

---

## 15. 将来拡張メモ（v2.0 以降）

### コミュニティ機能
- **匿名ランキング**（オプトイン）
  - 週次/月次でフォーカス時間、XP、PB の上位ランキング表示
  - プライバシー保護（ユーザー名のハッシュ化、統計データのみ送信）
- **週次チャレンジ**
  - コミュニティ全体で達成する目標（例: "合計10,000分フォーカス"）
  - 参加者全員に特別バッジ付与

### AI 分析
- **ミスパターン分析**
  - "16分音符の3-4番目で頻発" などのパターン検出
  - 機械学習モデル（TensorFlow.js）でパターン分類
  - 改善提案の自動生成
- **練習推奨システム**
  - 過去データから弱点を分析、次に練習すべき曲/技術を提案

### Twitch 拡張機能
- **パネル統合**
  - Twitch チャンネルページにパネル表示（進捗/実績）
  - 視聴者が配信者の進捗を確認可能
- **視聴者投票機能**
  - "次に練習する曲を投票" などのインタラクティブ機能

### その他機能
- **Notion/GitHub Pages へ自動レポート**
  - API 連携で週次レポートを自動投稿
- **週次サムネ画像の自動生成**
  - 実績バッジを含むサムネイル画像を Canvas API で生成
  - YouTube/Twitch のサムネイルに使用可能
- **C++ ネイティブ OBS プラグイン化**
  - Electron の代わりに OBS プラグインとして統合
  - CPU/メモリ使用率のさらなる削減
- **ベース/ドラム等の他楽器プリセット**
  - 楽器ごとの周波数帯域、難易度係数、クエストをプリセット化
- **DAW 連携**
  - Ableton/FL Studio などから MIDI/OSC で情報取得
  - テンポ/小節/演奏情報の自動同期
- **譜面解析**
  - MusicXML/MIDI ファイルから譜面を解析、難易度を自動判定
- **音程認識**
  - ピッチ検出アルゴリズムで音程の正確性を評価
- **自動採譜**
  - 演奏音声から MIDI データを生成（Aubio, Essentia など）

