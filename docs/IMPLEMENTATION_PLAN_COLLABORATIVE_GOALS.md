# 共同目標達成システム 実装計画

## 📋 概要

配信者と視聴者が一緒に練習目標を達成するシステム。
作業配信・勉強配信との相性が良く、コミュニティの一体感を醸成する。

## 🎯 目標

- 配信者と視聴者が共同で練習時間の目標を設定・達成
- リアルタイムで進捗をOBSオーバーレイに表示
- 達成時に全参加者に報酬（バッジ、XPボーナスなど）

## 📐 アーキテクチャ

### システム構成図

```
┌─────────────────┐
│  配信者Client   │ ← RiffQuest Desktop/Web App
└────────┬────────┘
         │
         ↓
┌─────────────────┐     ┌──────────────────┐
│  WebSocket      │────→│ OBSブラウザソース │
│  Server         │     │ (オーバーレイ)    │
└────────┬────────┘     └──────────────────┘
         │
         ↓
┌─────────────────┐
│  Supabase       │
│  - goals table  │
│  - participants │
│  - progress     │
└────────┬────────┘
         │
         ↑
┌─────────────────┐
│ 視聴者Client    │ ← Web Dashboard
└─────────────────┘
```

## 🗄️ データベース設計

### テーブル構成

#### 1. `collaborative_goals` テーブル
```sql
CREATE TABLE collaborative_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  target_hours DECIMAL NOT NULL,
  current_hours DECIMAL DEFAULT 0,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed', 'failed')) DEFAULT 'active',
  reward_badge TEXT,
  reward_xp INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_goals_creator ON collaborative_goals(creator_id);
CREATE INDEX idx_goals_status ON collaborative_goals(status);
CREATE INDEX idx_goals_end_date ON collaborative_goals(end_date);
```

#### 2. `goal_participants` テーブル
```sql
CREATE TABLE goal_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES collaborative_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  username TEXT NOT NULL,
  contributed_hours DECIMAL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(goal_id, user_id)
);

-- インデックス
CREATE INDEX idx_participants_goal ON goal_participants(goal_id);
CREATE INDEX idx_participants_user ON goal_participants(user_id);
```

#### 3. `goal_progress_logs` テーブル
```sql
CREATE TABLE goal_progress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES collaborative_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  hours DECIMAL NOT NULL,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_logs_goal ON goal_progress_logs(goal_id);
CREATE INDEX idx_logs_user ON goal_progress_logs(user_id);
```

## 🔧 API設計

### REST API Endpoints

#### 目標管理

**POST /api/goals/collaborative**
- 新しい共同目標を作成
```json
{
  "title": "今週の共同目標",
  "description": "みんなで50時間練習しよう！",
  "target_hours": 50,
  "end_date": "2025-10-12T23:59:59Z",
  "reward_badge": "collaborative_achiever_week_41",
  "reward_xp": 1000
}
```

**GET /api/goals/collaborative/active**
- アクティブな共同目標を取得

**GET /api/goals/collaborative/:id**
- 特定の目標の詳細と参加者リストを取得

**POST /api/goals/collaborative/:id/join**
- 目標に参加

**POST /api/goals/collaborative/:id/progress**
- 練習時間を記録
```json
{
  "hours": 2.5
}
```

**GET /api/goals/collaborative/:id/leaderboard**
- 目標の貢献度ランキング

#### WebSocket Events

**接続**
```javascript
socket.emit('join_goal', { goal_id: 'xxx' });
```

**進捗更新（ブロードキャスト）**
```javascript
socket.on('goal_progress_update', {
  goal_id: 'xxx',
  current_hours: 35.5,
  target_hours: 50,
  percentage: 71,
  top_contributors: [
    { username: 'streamer', hours: 20, percentage: 56 },
    { username: 'viewer1', hours: 10, percentage: 28 },
    { username: 'viewer2', hours: 5.5, percentage: 16 }
  ]
});
```

**目標達成（ブロードキャスト）**
```javascript
socket.on('goal_achieved', {
  goal_id: 'xxx',
  total_participants: 15,
  total_hours: 50,
  reward_badge: 'collaborative_achiever_week_41',
  reward_xp: 1000
});
```

## 🎨 UI/UX設計

### OBSオーバーレイ

#### レイアウト案
```
┌─────────────────────────────────────────┐
│  🎯 今週の共同目標: 50時間練習          │
│                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  進捗: 35.5 / 50 時間 (71%)             │
│  ████████████████░░░░░░░░              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                         │
│  👑 配信者: 20.0h (56%) ████████        │
│  🥈 viewer1: 10.0h (28%) ████           │
│  🥉 viewer2: 5.5h (16%) ███             │
│                                         │
│  残り: 2日 14時間                       │
└─────────────────────────────────────────┘
```

### 視聴者用Webダッシュボード

#### 機能
- 参加中の目標一覧
- 自分の貢献時間
- リアルタイム進捗グラフ
- 貢献度ランキング
- 練習時間の記録フォーム

#### ページ構成
```
/collaborative-goals
  - アクティブな目標一覧
  - 参加ボタン

/collaborative-goals/:id
  - 目標詳細
  - リアルタイム進捗
  - 参加者リスト
  - 練習時間記録フォーム

/collaborative-goals/history
  - 過去の目標と達成状況
  - 獲得したバッジコレクション
```

## 💻 実装ステップ

### Phase 1: バックエンド基盤（1週間）
- [ ] Supabaseにテーブル作成
- [ ] REST API実装
- [ ] WebSocketサーバーセットアップ
- [ ] 進捗計算ロジック実装

### Phase 2: OBSオーバーレイ（3日）
- [ ] Reactコンポーネント作成
- [ ] WebSocket接続
- [ ] リアルタイム更新ロジック
- [ ] アニメーション実装
- [ ] スタイリング（ダークテーマ）

### Phase 3: 視聴者用Webダッシュボード（1週間）
- [ ] 目標一覧ページ
- [ ] 目標詳細ページ
- [ ] 練習時間記録フォーム
- [ ] ランキング表示
- [ ] ログイン/認証

### Phase 4: RiffQuest統合（3日）
- [ ] Dashboard画面に共同目標セクション追加
- [ ] 練習時間の自動記録
- [ ] 目標作成UI
- [ ] 達成時の通知

### Phase 5: テスト・デバッグ（3日）
- [ ] ユニットテスト
- [ ] 結合テスト
- [ ] 負荷テスト
- [ ] バグ修正

### Phase 6: ドキュメント・リリース（2日）
- [ ] ユーザーガイド作成
- [ ] API ドキュメント
- [ ] セットアップガイド
- [ ] リリースノート

**総開発期間**: 約3週間

## 🔐 セキュリティ考慮事項

- ユーザー認証（Supabase Auth）
- 練習時間の改ざん防止（サーバー側検証）
- レート制限（API呼び出し制限）
- 不正な目標作成の防止

## 📊 メトリクス・分析

### 追跡する指標
- 目標の作成数
- 参加者数の平均
- 達成率
- 平均貢献時間
- アクティブユーザー数

### 成功指標
- 目標達成率 > 60%
- 平均参加者数 > 3人
- 週間アクティブユーザー増加率 > 10%

## 🚀 将来の拡張

- [ ] チーム対抗戦
- [ ] 複数配信者間の共同目標
- [ ] Discord連携（通知・進捗共有）
- [ ] 自動目標生成（AIによる推奨）
- [ ] 目標テンプレート
- [ ] マイルストーン報酬（50%, 75%, 100%達成時）
- [ ] ストーリー共有（SNS投稿機能）

## 🐛 既知の課題・検討事項

1. **タイムゾーン対応**: 世界中のユーザーに対応
2. **オフライン練習の記録**: 後から手動記録を許可するか
3. **不正対策**: 異常な時間記録の検出
4. **パフォーマンス**: 大人数参加時のWebSocket負荷

## 📚 参考リソース

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [OBS Browser Source](https://obsproject.com/wiki/Sources-Guide#browsersource)

---

**作成日**: 2025-10-05
**更新日**: 2025-10-05
**担当者募集中**: このドキュメントを基に実装したい方、ぜひPRをお送りください！
