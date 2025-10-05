# 🏆 Supabase世界ランキング実装ガイド

RiffQuestに世界ランキング機能を追加する完全ガイド

## 📋 必要なもの

- ✅ Supabaseアカウント（無料）
- ✅ RiffQuestプロジェクト
- ✅ 30分の作業時間

## ステップ1: Supabaseプロジェクト作成

1. https://supabase.com にログイン
2. 「New Project」をクリック
3. プロジェクト情報を入力:
   - **Name**: `riffquest-leaderboard`
   - **Database Password**: 強力なパスワードを設定
   - **Region**: `Northeast Asia (Tokyo)` または最寄りのリージョン
4. 「Create new project」をクリック

## ステップ2: データベーステーブル作成

### SQL Editorで実行

Supabaseダッシュボードで `SQL Editor` → `New query` を開き、以下を実行:

```sql
-- リーダーボードテーブル
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  best_streak INTEGER DEFAULT 0,
  total_practice_time INTEGER DEFAULT 0,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（高速化）
CREATE INDEX idx_leaderboard_total_xp ON leaderboard(total_xp DESC);
CREATE INDEX idx_leaderboard_level ON leaderboard(level DESC);
CREATE INDEX idx_leaderboard_country ON leaderboard(country);

-- 更新日時の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leaderboard_updated_at BEFORE UPDATE
  ON leaderboard FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 有効化
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能
CREATE POLICY "Enable read access for all users" ON leaderboard
  FOR SELECT USING (true);

-- 自分のレコードのみ更新可能
CREATE POLICY "Enable insert for authenticated users only" ON leaderboard
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for users based on user_id" ON leaderboard
  FOR UPDATE USING (auth.uid()::text = user_id);
```

## ステップ3: Supabase認証情報を取得

1. Supabaseダッシュボードで `Settings` → `API`
2. 以下をコピー:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ステップ4: RiffQuestに統合

### 4.1 環境変数設定

`.env`ファイルを作成:

```bash
# Supabase設定
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 Supabaseクライアントインストール

```bash
npm install @supabase/supabase-js
```

### 4.3 Supabaseクライアント作成

`src/lib/supabase.ts` を作成:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 4.4 リーダーボードコンポーネント作成

`src/renderer/components/Leaderboard.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './Leaderboard.css';

interface LeaderboardEntry {
  id: string;
  username: string;
  total_xp: number;
  level: number;
  best_streak: number;
  country?: string;
}

export function Leaderboard() {
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'global' | 'country'>('global');

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  const fetchLeaderboard = async () => {
    setLoading(true);

    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('total_xp', { ascending: false })
      .limit(100);

    if (filter === 'country') {
      // 国別ランキング（将来実装）
      // query = query.eq('country', userCountry);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
    } else {
      setTopPlayers(data || []);
    }

    setLoading(false);
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="leaderboard">
      <h2>🏆 世界ランキング</h2>

      <div className="leaderboard-filters">
        <button
          className={filter === 'global' ? 'active' : ''}
          onClick={() => setFilter('global')}
        >
          🌍 グローバル
        </button>
        <button
          className={filter === 'country' ? 'active' : ''}
          onClick={() => setFilter('country')}
        >
          🗾 国内
        </button>
      </div>

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : (
        <div className="leaderboard-list">
          {topPlayers.map((player, index) => (
            <div key={player.id} className="leaderboard-item">
              <div className="rank">{getMedalIcon(index + 1)}</div>
              <div className="player-info">
                <div className="username">{player.username}</div>
                <div className="stats">
                  Lv.{player.level} • {player.total_xp.toLocaleString()} XP
                  {player.best_streak > 0 && (
                    <span className="streak"> • {player.best_streak}🔥</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4.5 スコア送信機能

`src/renderer/components/Dashboard.tsx`に追加:

```typescript
import { supabase } from '../../lib/supabase';

// ユーザーIDを生成（初回のみ）
const getUserId = () => {
  let userId = localStorage.getItem('riffquest_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('riffquest_user_id', userId);
  }
  return userId;
};

// スコアを送信
const submitScore = async () => {
  const userId = getUserId();
  const username = localStorage.getItem('riffquest_username') || 'Anonymous';

  const { error } = await supabase
    .from('leaderboard')
    .upsert({
      user_id: userId,
      username: username,
      total_xp: profile.total_xp,
      level: profile.level,
      best_streak: profile.best_streak,
    });

  if (error) {
    console.error('Error submitting score:', error);
    alert('スコア送信に失敗しました');
  } else {
    alert('スコアを送信しました！🎉');
  }
};

// UIに追加
<button onClick={submitScore} className="submit-score-btn">
  🏆 ランキングに参加
</button>
```

### 4.6 ユーザー名設定機能

`src/renderer/components/UsernamePrompt.tsx`:

```typescript
import { useState } from 'react';

export function UsernamePrompt({ onSave }: { onSave: (name: string) => void }) {
  const [username, setUsername] = useState('');

  const handleSave = () => {
    if (username.trim().length >= 3) {
      localStorage.setItem('riffquest_username', username);
      onSave(username);
    } else {
      alert('ユーザー名は3文字以上で入力してください');
    }
  };

  return (
    <div className="username-prompt">
      <h3>ユーザー名を設定</h3>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="あなたのユーザー名"
        maxLength={20}
      />
      <button onClick={handleSave}>保存</button>
    </div>
  );
}
```

### 4.7 ルーティング追加

`src/renderer/App.tsx`に追加:

```typescript
import { Leaderboard } from './components/Leaderboard';

<nav className="app-nav">
  <Link to="/">ダッシュボード</Link>
  <Link to="/leaderboard">🏆 ランキング</Link>
  <Link to="/obs">OBS接続</Link>
  <Link to="/history">練習履歴</Link>
</nav>

<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/leaderboard" element={<Leaderboard />} />
  <Route path="/obs" element={<OBSConnection />} />
  <Route path="/history" element={<History />} />
</Routes>
```

## ステップ5: スタイリング

`src/renderer/components/Leaderboard.css`:

```css
.leaderboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.leaderboard h2 {
  text-align: center;
  color: #fff;
  margin-bottom: 20px;
}

.leaderboard-filters {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.leaderboard-filters button {
  padding: 10px 20px;
  border: 2px solid #667eea;
  background: transparent;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.leaderboard-filters button.active {
  background: #667eea;
}

.leaderboard-list {
  background: #2c2c2c;
  border-radius: 12px;
  padding: 20px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #3a3a3a;
  transition: background 0.2s;
}

.leaderboard-item:hover {
  background: #3a3a3a;
}

.rank {
  font-size: 24px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.player-info {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.stats {
  font-size: 14px;
  color: #aaa;
  margin-top: 4px;
}

.streak {
  color: #ff6b6b;
}

.submit-score-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}

.submit-score-btn:hover {
  transform: translateY(-2px);
}
```

## ステップ6: テスト

1. サーバー起動: `node dist-server/index.js`
2. クライアント起動: `npm run dev:client`
3. ブラウザで http://localhost:5173 を開く
4. ダッシュボードで「🏆 ランキングに参加」をクリック
5. ランキングページで確認

## 🎉 完成！

これで世界中のRiffQuestユーザーとランキングで競えます！

### 追加機能のアイデア

- 🌍 国別ランキング
- 📅 週間/月間ランキング
- 🏆 実績バッジ表示
- 💬 コメント機能
- 🎯 フレンド機能
- 📊 統計グラフ

### 無料枠の制限

Supabase無料枠:
- ✅ データベース: 500MB
- ✅ 帯域幅: 5GB/月
- ✅ API リクエスト: 50,000/月
- ✅ リアルタイム更新: 200 同時接続

→ 数千人のアクティブユーザーまで対応可能！
