# 視聴者の祝福システム 実装計画

## 📋 概要

視聴者の存在が配信者の成長を加速させるシステム。
視聴者数、応援チャット、ギフトなどに応じてXPブーストを提供し、視聴者にも「貢献した」という達成感を与える。

## 🎯 目標

- 視聴者数に応じた動的XPブースト
- チャット応援でボーナスXP
- ギフト/投げ銭で特別ブースト
- OBSに視覚的なエフェクト表示
- 視聴者にも貢献バッジを授与

## 📐 アーキテクチャ

### システム構成図

```
┌──────────────────┐
│ Twitch/YouTube   │
│ Chat API         │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐     ┌──────────────────┐
│ Chat Monitor     │────→│ Blessing Engine  │
│ Service          │     │ (XP Calculator)  │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ↓
                         ┌──────────────────┐
                         │ WebSocket Server │
                         └────────┬─────────┘
                                  │
         ┌────────────────────────┼────────────────────┐
         ↓                        ↓                    ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ OBSオーバーレイ  │  │ RiffQuest Client │  │ Supabase         │
│ (エフェクト表示) │  │ (XP受信)         │  │ (ログ保存)       │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## 🗄️ データベース設計

### テーブル構成

#### 1. `blessing_sessions` テーブル
```sql
CREATE TABLE blessing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  streamer_id UUID NOT NULL REFERENCES users(id),
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  peak_viewers INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  total_gifts INTEGER DEFAULT 0,
  total_xp_boost DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_sessions_streamer ON blessing_sessions(streamer_id);
CREATE INDEX idx_sessions_start ON blessing_sessions(session_start);
```

#### 2. `blessing_contributions` テーブル
```sql
CREATE TABLE blessing_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES blessing_sessions(id) ON DELETE CASCADE,
  viewer_username TEXT NOT NULL,
  viewer_platform TEXT NOT NULL, -- 'twitch', 'youtube', 'unknown'
  contribution_type TEXT CHECK (contribution_type IN ('presence', 'chat', 'gift')) NOT NULL,
  contribution_value DECIMAL NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_contributions_session ON blessing_contributions(session_id);
CREATE INDEX idx_contributions_viewer ON blessing_contributions(viewer_username);
```

#### 3. `viewer_stats` テーブル
```sql
CREATE TABLE viewer_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_username TEXT NOT NULL,
  streamer_id UUID NOT NULL REFERENCES users(id),
  total_watch_time_hours DECIMAL DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  total_gifts INTEGER DEFAULT 0,
  total_blessing_contribution DECIMAL DEFAULT 0,
  badges TEXT[], -- 獲得したバッジの配列
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),

  UNIQUE(viewer_username, streamer_id)
);

-- インデックス
CREATE INDEX idx_viewer_stats_username ON viewer_stats(viewer_username);
CREATE INDEX idx_viewer_stats_streamer ON viewer_stats(streamer_id);
```

## 🔧 祝福計算ロジック

### XPブースト計算式

```javascript
// 基本ブースト計算
function calculateBlessingBoost(viewerCount, chatMessages, gifts) {
  // 1. 視聴者数によるブースト
  const viewerBoost = getViewerTierBoost(viewerCount);

  // 2. チャット応援ブースト (直近5分間)
  const chatBoost = Math.min(chatMessages * 5, 100); // 最大100 XP

  // 3. ギフトブースト
  const giftBoost = gifts * 50;

  // 合計ブースト
  const totalBoost = {
    viewerPercentage: viewerBoost.percentage,
    chatXP: chatBoost,
    giftXP: giftBoost,
    totalPercentage: viewerBoost.percentage,
    totalXP: chatBoost + giftBoost
  };

  return totalBoost;
}

// 視聴者数に応じたティア
function getViewerTierBoost(count) {
  if (count >= 51) return { tier: 5, percentage: 50, name: '👑 レジェンド' };
  if (count >= 21) return { tier: 4, percentage: 25, name: '🌈 エピック' };
  if (count >= 11) return { tier: 3, percentage: 15, name: '💫 レア' };
  if (count >= 6)  return { tier: 2, percentage: 10, name: '✨ アンコモン' };
  if (count >= 1)  return { tier: 1, percentage: 5, name: '🌟 コモン' };
  return { tier: 0, percentage: 0, name: '無し' };
}

// XP適用
function applyBlessingToXP(baseXP, blessing) {
  const boostedXP = baseXP * (1 + blessing.totalPercentage / 100);
  const bonusXP = blessing.totalXP;
  return Math.floor(boostedXP + bonusXP);
}
```

### 視聴者貢献度計算

```javascript
function calculateViewerContribution(viewer) {
  const presencePoints = viewer.watchTimeMinutes * 1;
  const chatPoints = viewer.chatMessages * 5;
  const giftPoints = viewer.gifts * 50;

  return {
    totalPoints: presencePoints + chatPoints + giftPoints,
    breakdown: {
      presence: presencePoints,
      chat: chatPoints,
      gifts: giftPoints
    }
  };
}
```

## 🎨 UI/UX設計

### OBSオーバーレイ - 祝福ステータス表示

#### レイアウト案1: シンプル
```
┌─────────────────────────────────┐
│ 🌟 視聴者の祝福                 │
│                                 │
│ 👥 7人視聴中                    │
│ ✨ レベル2: +10% XP             │
│                                 │
│ 💬 応援 +25 XP                  │
│ 💝 ギフト +50 XP                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 合計ブースト: +10% + 75 XP      │
└─────────────────────────────────┘
```

#### レイアウト案2: ビジュアル重視
```
┌─────────────────────────────────┐
│        👑 視聴者の祝福          │
│                                 │
│   ✨✨✨✨✨✨✨              │
│      (祝福レベル: 2)            │
│                                 │
│  👥 7人 → +10% XP               │
│  💬 5件 → +25 XP                │
│  💝 1件 → +50 XP                │
│                                 │
│  【総合ブースト】               │
│  ████████░░ +85 XP             │
└─────────────────────────────────┘
```

### パーティクルエフェクト

#### 祝福レベルに応じたエフェクト
```javascript
const blessingEffects = {
  tier1: {
    particles: 'sparkles',
    color: '#FFD700',
    intensity: 'low',
    sound: 'chime_soft.mp3'
  },
  tier2: {
    particles: 'stars',
    color: '#87CEEB',
    intensity: 'medium',
    sound: 'chime_medium.mp3'
  },
  tier3: {
    particles: 'stars + sparkles',
    color: '#FF69B4',
    intensity: 'high',
    sound: 'chime_high.mp3'
  },
  tier4: {
    particles: 'rainbow stars',
    color: 'rainbow',
    intensity: 'very_high',
    sound: 'epic_chime.mp3'
  },
  tier5: {
    particles: 'aurora + stars',
    color: 'golden_rainbow',
    intensity: 'legendary',
    sound: 'legendary_chime.mp3'
  }
};
```

### 視聴者用ダッシュボード

#### 貢献度ページ
```
あなたの貢献
━━━━━━━━━━━━━━━━
総視聴時間: 45.5時間
応援チャット: 234件
ギフト: 12件

貢献ポイント: 1,825 pt
ランク: 🥈 シルバーサポーター

獲得バッジ:
🌟 初回視聴者
💬 チャットマスター (100件達成)
💝 ジェネラスギフター (10件達成)
⏰ ロングウォッチャー (累計24時間)
```

## 🔌 Chat API連携

### Twitch連携

```javascript
// Twitch Chat Monitor
const tmi = require('tmi.js');

const client = new tmi.Client({
  channels: ['your_channel']
});

client.connect();

// 視聴者数取得
client.on('roomstate', (channel, state) => {
  const viewerCount = parseInt(state['room-state'].viewers);
  updateBlessingBoost(viewerCount);
});

// チャットメッセージ
client.on('message', (channel, tags, message, self) => {
  if (self) return;

  const username = tags['display-name'];
  recordChatContribution(username, message);
});

// ギフト/ビッツ
client.on('cheer', (channel, userstate, message) => {
  const username = userstate['display-name'];
  const bits = userstate.bits;
  recordGiftContribution(username, bits);
});
```

### YouTube連携

```javascript
// YouTube Live Chat API
const { google } = require('googleapis');
const youtube = google.youtube('v3');

async function monitorYouTubeLiveChat(liveChatId) {
  const response = await youtube.liveChatMessages.list({
    liveChatId: liveChatId,
    part: 'snippet,authorDetails'
  });

  response.data.items.forEach(item => {
    const username = item.authorDetails.displayName;
    const message = item.snippet.displayMessage;

    recordChatContribution(username, message);
  });
}

// スーパーチャット
youtube.liveChatMessages.on('superChat', (data) => {
  const username = data.authorDetails.displayName;
  const amount = data.snippet.amountMicros / 1000000;
  recordGiftContribution(username, amount);
});
```

## 💻 実装ステップ

### Phase 1: バックエンド基盤（1週間）
- [ ] Supabaseにテーブル作成
- [ ] 祝福計算エンジン実装
- [ ] WebSocketサーバーセットアップ
- [ ] Chat API連携（Twitch優先）

### Phase 2: Chat Monitor Service（4日）
- [ ] Twitch Chat監視
- [ ] YouTube Chat監視
- [ ] 視聴者数トラッキング
- [ ] リアルタイム集計

### Phase 3: OBSオーバーレイ（5日）
- [ ] 祝福ステータス表示コンポーネント
- [ ] パーティクルエフェクト実装
- [ ] WebSocket接続
- [ ] アニメーション

### Phase 4: RiffQuest統合（3日）
- [ ] XPブースト適用ロジック
- [ ] 祝福セッション管理
- [ ] ダッシュボードに祝福表示

### Phase 5: 視聴者ダッシュボード（1週間）
- [ ] 貢献度ページ
- [ ] バッジシステム
- [ ] ランキング表示
- [ ] 統計グラフ

### Phase 6: テスト・調整（3日）
- [ ] Chat API接続テスト
- [ ] XP計算テスト
- [ ] 負荷テスト
- [ ] バランス調整

### Phase 7: ドキュメント・リリース（2日）
- [ ] セットアップガイド
- [ ] 視聴者向けガイド
- [ ] API ドキュメント

**総開発期間**: 約4週間

## 🎮 バッジシステム

### 視聴者バッジ例

```javascript
const viewerBadges = {
  // 視聴時間系
  first_viewer: {
    name: '🌟 初回視聴者',
    requirement: '初めて配信を視聴'
  },
  regular_watcher: {
    name: '⏰ レギュラーウォッチャー',
    requirement: '累計10時間視聴'
  },
  dedicated_fan: {
    name: '💎 熱心なファン',
    requirement: '累計50時間視聴'
  },
  legendary_supporter: {
    name: '👑 伝説のサポーター',
    requirement: '累計100時間視聴'
  },

  // チャット系
  chatty: {
    name: '💬 おしゃべりさん',
    requirement: '10件のチャット'
  },
  chat_master: {
    name: '💬 チャットマスター',
    requirement: '100件のチャット'
  },

  // ギフト系
  first_gift: {
    name: '💝 初めてのギフト',
    requirement: '初めてギフトを送る'
  },
  generous_gifter: {
    name: '💝 ジェネラスギフター',
    requirement: '10件のギフト'
  },

  // 特別系
  early_adopter: {
    name: '🚀 アーリーアダプター',
    requirement: '機能リリース初日に参加'
  },
  mvp_supporter: {
    name: '🏆 MVPサポーター',
    requirement: '月間貢献度1位'
  }
};
```

## 🔐 セキュリティ・不正対策

### 不正防止策

1. **視聴時間の検証**
   - サーバー側でセッション時間を管理
   - クライアントからの報告を信用しない

2. **チャットスパム対策**
   - レート制限（1分間に5件まで）
   - 同じメッセージの連投を無効化
   - NGワードフィルター

3. **ギフト検証**
   - プラットフォームAPIで検証
   - 金額の上限設定

4. **Bot対策**
   - アカウント作成日チェック
   - 異常な行動パターン検出

## 📊 分析・メトリクス

### 追跡する指標

- 平均視聴者数
- 平均祝福レベル
- チャット参加率
- ギフト率
- 視聴者リテンション率

### ダッシュボード

```
配信統計
━━━━━━━━━━━━━━━━
今日の配信:
  平均視聴者: 8.5人
  ピーク視聴者: 15人
  平均祝福レベル: 2.3
  総XPブースト: +18,500 XP

今週の配信:
  総視聴者数: 45人
  新規視聴者: 12人
  リピーター率: 73%
  MVP視聴者: @viewer123
```

## 🚀 将来の拡張

- [ ] 複数プラットフォーム同時対応
- [ ] 視聴者同士の応援チェイン
- [ ] 特定時間帯の「ゴールデンタイムボーナス」
- [ ] 視聴者ランクシステム（ブロンズ→シルバー→ゴールド）
- [ ] 視聴者専用ミッション
- [ ] 配信者への投票機能連携
- [ ] NFTバッジ（検討中）

## 🐛 既知の課題・検討事項

1. **プラットフォーム依存**: Twitch/YouTube API変更のリスク
2. **視聴者数の取得精度**: 正確な同時視聴者数の取得
3. **レイテンシー**: リアルタイム性とサーバー負荷のバランス
4. **プライバシー**: 視聴者データの取り扱い

## 📚 参考リソース

- [Twitch API Documentation](https://dev.twitch.tv/docs/api/)
- [YouTube Live Streaming API](https://developers.google.com/youtube/v3/live/docs)
- [TMI.js (Twitch Chat Library)](https://github.com/tmijs/tmi.js)
- [Canvas Confetti (パーティクルエフェクト)](https://github.com/catdad/canvas-confetti)

---

**作成日**: 2025-10-05
**更新日**: 2025-10-05
**担当者募集中**: Chat API連携やエフェクト実装が得意な方、ぜひご協力ください！
