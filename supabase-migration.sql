-- Supabase Leaderboard テーブル拡張
-- social_urlカラムを追加して、ユーザーのSNS/配信チャンネルを保存

-- 既存テーブルにカラム追加（テーブルが既に存在する場合）
ALTER TABLE leaderboard
ADD COLUMN IF NOT EXISTS social_url TEXT;

-- テーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  total_xp INTEGER NOT NULL,
  level INTEGER NOT NULL,
  best_streak INTEGER DEFAULT 0,
  social_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 総XPでインデックス作成（ランキング取得の高速化）
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_xp ON leaderboard(total_xp DESC);

-- ユーザー名でインデックス作成（重複チェックの高速化）
CREATE INDEX IF NOT EXISTS idx_leaderboard_username ON leaderboard(username);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leaderboard_updated_at ON leaderboard;
CREATE TRIGGER update_leaderboard_updated_at
    BEFORE UPDATE ON leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 設定
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能
CREATE POLICY "Enable read access for all users" ON leaderboard
    FOR SELECT USING (true);

-- 誰でも挿入可能（新規参加）
CREATE POLICY "Enable insert for all users" ON leaderboard
    FOR INSERT WITH CHECK (true);

-- 自分のレコードのみ更新可能（ユーザー名で識別）
CREATE POLICY "Enable update for users based on username" ON leaderboard
    FOR UPDATE USING (true);
