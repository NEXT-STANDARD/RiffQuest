# RiffQuest 要件定義（SRS）v0.1

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
- XP 計算・クエスト・実績（初期セット）
- オーバーレイ表示（Browser Source）
- JSON/CSV エクスポート（日次/週次）
- チャット `!status`（どちらか一方: Twitch または YouTube）

### 非スコープ（将来）
- DAW 連携、譜面解析、音程認識、自動採譜
- マルチ楽器高度解析（MVPはギター想定）

---

## 2. アーキテクチャ
```
OBS ←→ obs-websocket(v5) ←→ Companion App(Node/TS)
                                     ↓
                                SQLite(JSON Export)
                                     ↓
                           Overlay UI(React/BrowserSource)
                                     ↓
                       Hotkey / MIDI / Chat(Twitch|YT)
```

- Companion App: 計測・XP/クエスト・永続化・API 提供（localhost のみ）
- Overlay: `/overlay`（SPA）を OBS Browser Source に表示

---

## 3. ユースケース（抜粋）
- U1: `Practice_*` シーン滞在中のみフォーカス時間を自動加算したい
- U2: ポモドーロの練/休憩をオーバーレイに反映し、自動停止したい
- U3: MIDI ペダルで PB/ミス/BPM±を記録したい
- U4: ターゲット BPM 到達で XP/実績を付与したい
- U5: 配信終了時に日次 JSON/CSV を自動出力したい
- U6: 視聴者が `!status` で進捗を確認できるようにしたい

---

## 4. 機能要件
### 4.1 計測
- シーン判定: 現在プログラムシーン名が `Practice_` で始まる間だけ `focus_seconds++`
- 音入力検知（設定で ON/OFF）: 指定デバイスの RMS/ピーク>閾値 で「演奏中」。閾値・ホールド時間を設定可能
- ポモドーロ: 練習 N 分 / 休憩 M 分（デフォルト 25/5）。休憩中はカウント停止
- Streak: 1 日 X 分（既定 30 分）以上達成で +1

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

### 4.3 入出力
- **ホットキー**: `Ctrl+Alt+M`=miss, `Ctrl+Alt+P`=pb, `Ctrl+Alt+↑/↓`=BPM±
- **MIDI**: CC/Note を Learn で割当（長押し/ダブルタップの判定は v0.2 で検討）
- **チャット**: `!status`→「今日: 62 分 / PB 132 BPM / XP 620 / Streak 12」
- **エクスポート**: `exports/YYYY-MM-DD.(json|csv)`

### 4.4 オーバーレイ（表示要素）
- 上段: Day/Season, BPM(target/now), XP, Streak
- 中央: 進捗バー（今日の目標分数 / クエスト進捗）
- 下段: ミス Top3 タグ（任意）
- 状態色: 練習=通常 / 休憩=グレー / PB=1 秒フラッシュ
- 更新間隔: 1 秒

### 4.5 設定/管理
- ローカル Web GUI: 3 タブ
  1) Connection（OBS/Chat）
  2) Practice Logic（シーン/ポモ/閾値/BPM）
  3) Gamification（XP/クエスト/実績）
- プロファイル切替: `default`, `metal`, `acoustic` など

---

## 5. 非機能要件
- OS: Windows10/11 優先、macOS 13+（ベストエフォート）
- OBS: 29+ / obs-websocket v5.x
- CPU: Companion+Overlay 合計 < 3%（i7 目安）
- レイテンシ: オーバーレイ更新 ≤ 300ms
- データ保全: SQLite(WAL)、異常終了時リカバリ
- i18n: 日本語/英語
- セキュリティ: 127.0.0.1 バインド、トークンは OS キーストア

---

## 6. データモデル（初版）
### `sessions`
|列|型|説明|
|--|--|--|
|id|uuid|セッションID|
|start|datetime|開始UTC|
|end|datetime|終了UTC（null=進行中）|
|platforms|json|["twitch","youtube"] 等|
|total_focus_ms|int|フォーカス合計|
|notes|text|自由記述|

### `events`
|列|型|説明|
|--|--|--|
|id|uuid|イベントID|
|session_id|uuid|外部キー|
|ts|datetime|UTC タイムスタンプ|
|type|text|miss/pb/bpm_up/bpm_down/marker|
|payload|json|bpm 値など|

### `daily_summary`
|列|型|説明|
|--|--|--|
|day|date|ローカル日付(JST)|
|focus_minutes|int|日次フォーカス|
|xp|int|日次XP|
|streak|int|連続日数|
|pb_bpm|int|当日PB|
|quests_completed|json|達成クエスト一覧|

### `settings`
- `profile_name`, `obs_endpoint`, `scene_prefix`, `audio_device`, `rms_threshold`, `pomodoro`, `daily_goal_min`, `xp_params(json)`

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

## 8. API 仕様（ローカル）
- `GET /overlay-data` → `{ focus_min, xp, streak, bpm_target, pomodoro: {state, remaining_sec}, pb_bpm }`
- `POST /marker` → body `{ type: "miss|pb|bpm_up|bpm_down|marker", payload? }`
- `GET /export/daily?day=YYYY-MM-DD` → JSON/CSV ダウンロード

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

## 10. 受け入れ基準（MVP）
- AC1: `Practice_*` シーン中のみ 1 分単位でフォーカス加算
- AC2: ポモ ON 時は休憩中カウント停止
- AC3: ホットキーで miss/pb/bpm± を記録し、`events` に保存
- AC4: `/overlay-data` が 1 秒以内で最新値を返却
- AC5: 配信終了時に日次 JSON/CSV が出力
- AC6: `!status` が今日の進捗を返答
- AC7: 異常終了でもセッション整合性維持（WAL/再開時補完）

---

## 11. リスク & 対策
- OBS イベント取りこぼし → 冪等再計算・再接続リトライ
- 音入力の誤検知 → デバイス別ゲイン/ノイズゲート/ホールド時間
- CPU 負荷 → 1秒更新・Canvas軽量・計算は Node 側集約
- 二重起動 → PID/ソケットロック

---

## 12. ライセンス / 配布
- 候補: AGPL-3.0（改変公開担保） or MPL-2.0（ゆるめ）
- GitHub Releases に Windows バイナリ、英日 README

---

## 13. スプリント計画（2 週間 × 2）
**Sprint 1:**
- OBS接続/セッション管理/フォーカス計測/Overlay最小

**Sprint 2:**
- Hotkey/MIDI/イベント保存/エクスポート

**Sprint 3:**
- XP/クエスト/実績/設定UI/チャット `!status`

**Hardening:**
- 音入力検知/CPU最適化/異常復帰テスト

---

## 14. OBS セットアップ手順（チェックリスト）
- [ ] OBS 29+ / obs-websocket v5.x を有効化（ポート/パス設定）
- [ ] シーンを `Practice_AltPicking` などの命名で作成
- [ ] Browser Source に `http://127.0.0.1:5173/overlay` を追加（透過ON）
- [ ] オーディオデバイスをメーター用に分離（Loopback or Aux In）
- [ ] ホットキー／MIDI の割当テスト（マーカー反映確認）

---

## 15. 将来拡張メモ
- Notion/GitHub Pages へ自動レポート
- 週次サムネ画像の自動生成（実績バッジ）
- C++ ネイティブ OBS プラグイン化
- ベース/ドラム等の他楽器プリセット

