/**
 * 世界ランキングコンポーネント
 * Supabase統合
 */

import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../../lib/supabase';
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSupabaseEnabled()) {
      fetchLeaderboard();
    } else {
      setError('Supabaseが設定されていません。.envファイルを確認してください。');
      setLoading(false);
    }
  }, [filter]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('leaderboard')
        .select('*')
        .order('total_xp', { ascending: false })
        .limit(100);

      if (filter === 'country') {
        // 将来の国別ランキング用
        // const userCountry = localStorage.getItem('riffquest_country');
        // if (userCountry) {
        //   query = query.eq('country', userCountry);
        // }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setTopPlayers(data || []);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError('ランキングの取得に失敗しました: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (!isSupabaseEnabled()) {
    return (
      <div className="leaderboard">
        <h2>🏆 世界ランキング</h2>
        <div className="leaderboard-disabled">
          <p>⚠️ ランキング機能は現在無効です</p>
          <p>
            Supabaseを設定するには{' '}
            <a
              href="https://github.com/NEXT-STANDARD/RiffQuest/blob/main/docs/SUPABASE_SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              セットアップガイド
            </a>
            を参照してください。
          </p>
        </div>
      </div>
    );
  }

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
          disabled
          title="近日公開"
        >
          🗾 国内（近日公開）
        </button>
      </div>

      {error && (
        <div className="leaderboard-error">
          <p>{error}</p>
          <button onClick={fetchLeaderboard}>再試行</button>
        </div>
      )}

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : topPlayers.length === 0 ? (
        <div className="leaderboard-empty">
          <p>まだランキングにデータがありません</p>
          <p>ダッシュボードからスコアを送信してください！</p>
        </div>
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

      <button onClick={fetchLeaderboard} className="refresh-button">
        🔄 更新
      </button>
    </div>
  );
}
