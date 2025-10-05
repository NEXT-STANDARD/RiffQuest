# 🏆 世界ランキング機能

RiffQuestは現在ローカルDBですが、世界ランキングを実現する方法があります！

## 📊 レベル計算式（RPG風）

### 新しい計算式
- **Lv1→Lv2**: 100 XP（10分練習）
- **Lv2→Lv3**: 200 XP（20分練習）
- **Lv3→Lv4**: 300 XP（30分練習）
- **Lv10→Lv11**: 1,000 XP（100分練習）
- **Lv50→Lv51**: 5,000 XP（500分練習）
- **Lv100→Lv101**: 10,000 XP（1,000分練習）

レベルが上がるほど次のレベルまでの道のりが遠くなります！

### 必要XP早見表
| レベル | 累積XP | 次のレベルまで |
|--------|--------|----------------|
| 1 | 0 | 100 XP |
| 2 | 100 | 200 XP |
| 3 | 300 | 300 XP |
| 5 | 1,000 | 500 XP |
| 10 | 4,500 | 1,000 XP |
| 20 | 19,000 | 2,000 XP |
| 50 | 122,500 | 5,000 XP |
| 100 | 495,000 | 10,000 XP |

## 🌍 世界ランキング実装方法

### 方法1: GitHub Issuesを使った手動ランキング
**最も簡単でサーバー不要**

1. ユーザーが自分の統計をスクリーンショット
2. GitHub Issuesに投稿（テンプレート提供）
3. コミュニティが確認・承認
4. README.mdのランキング表を更新

**メリット**:
- ✅ 完全無料
- ✅ サーバー不要
- ✅ 透明性が高い
- ✅ コミュニティ主導

### 方法2: Supabase（無料枠）でリアルタイムランキング
**無料でリアルタイムランキング可能**

```bash
# 1. Supabaseプロジェクト作成（無料）
# 2. テーブル作成
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  total_xp INTEGER NOT NULL,
  level INTEGER NOT NULL,
  best_streak INTEGER,
  created_at TIMESTAMP
);

# 3. RiffQuestから統計を送信
# POST https://your-project.supabase.co/rest/v1/leaderboard
```

**メリット**:
- ✅ リアルタイム更新
- ✅ 無料枠で十分（50,000リクエスト/月）
- ✅ 認証機能付き
- ✅ REST API自動生成

### 方法3: Firebase Realtime Database（無料枠）
**Googleの無料サービス**

```javascript
// Firebase設定
const leaderboardRef = firebase.database().ref('leaderboard');

// スコア送信
leaderboardRef.push({
  username: 'your_name',
  totalXP: 12345,
  level: 15,
  timestamp: Date.now()
});

// トップ10取得
leaderboardRef
  .orderByChild('totalXP')
  .limitToLast(10)
  .on('value', snapshot => {
    // ランキング表示
  });
```

**メリット**:
- ✅ リアルタイム同期
- ✅ 無料枠（1GB/月）
- ✅ Google認証対応
- ✅ オフライン対応

### 方法4: Discord Bot連携
**Discordコミュニティでランキング**

1. Discord RiffQuestサーバー作成
2. Botでスコア収集
3. `/rank`コマンドでランキング表示
4. 毎日/週間ランキング発表

**メリット**:
- ✅ コミュニティ形成
- ✅ チャット機能
- ✅ 通知機能
- ✅ 無料

### 方法5: Googleスプレッドシート
**超シンプル**

1. Googleフォーム作成
2. ユーザーが統計を入力
3. スプレッドシートに自動集計
4. 公開して誰でも閲覧可能

**メリット**:
- ✅ 完全無料
- ✅ セットアップ5分
- ✅ グラフ自動生成
- ✅ 誰でも閲覧可能

## 🚀 おすすめの実装順序

### Phase 1: 手動ランキング（今すぐ可能）
1. `LEADERBOARD.md`にテンプレート作成
2. GitHub Issuesで受付
3. 月間トップ10を更新

### Phase 2: Supabase統合（1週間で実装可能）
1. Supabaseプロジェクト作成
2. APIエンドポイント追加
3. ダッシュボードにランキング表示

### Phase 3: コミュニティ機能（将来）
1. Discord Bot開発
2. 毎週チャレンジ
3. チーム対戦機能

## 🎯 実装例（Supabase）

### バックエンド（追加コード）
```typescript
// server/leaderboard.ts
export async function submitScore(username: string, stats: any) {
  const { data, error } = await supabase
    .from('leaderboard')
    .insert({
      username,
      total_xp: stats.total_xp,
      level: stats.level,
      best_streak: stats.best_streak
    });

  return { data, error };
}

export async function getTopPlayers(limit = 100) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('total_xp', { ascending: false })
    .limit(limit);

  return { data, error };
}
```

### フロントエンド（ダッシュボード追加）
```tsx
// src/renderer/components/Leaderboard.tsx
export function Leaderboard() {
  const [topPlayers, setTopPlayers] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard">
      <h2>🏆 世界ランキング</h2>
      {topPlayers.map((player, index) => (
        <div key={player.id} className="rank-item">
          <span className="rank">#{index + 1}</span>
          <span className="username">{player.username}</span>
          <span className="level">Lv.{player.level}</span>
          <span className="xp">{player.total_xp.toLocaleString()} XP</span>
        </div>
      ))}
    </div>
  );
}
```

## 📝 まとめ

**DBがローカルでも世界ランキングは可能！**

最も簡単な方法:
1. **今すぐ**: GitHub Issuesで手動ランキング
2. **1週間後**: Supabase無料枠でリアルタイムランキング
3. **1ヶ月後**: Discord Botでコミュニティ機能

どの方法も**完全無料**で実装できます！🎸🔥
