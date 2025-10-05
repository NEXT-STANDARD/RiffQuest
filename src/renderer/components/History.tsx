/**
 * 練習履歴表示コンポーネント
 */

import { useState, useEffect } from 'react';
import './History.css';

const API_URL = 'http://localhost:3030';

interface Session {
  id: number;
  scene_name: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  xp_earned: number;
  created_at: string;
}

export function History() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions/history`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('履歴取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}時間${minutes}分${secs}秒`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  const getTotalStats = () => {
    const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
    const totalXP = sessions.reduce((sum, s) => sum + s.xp_earned, 0);
    return { totalSeconds, totalXP, count: sessions.length };
  };

  const stats = getTotalStats();

  if (loading) {
    return <div className="history-container">読み込み中...</div>;
  }

  return (
    <div className="history-container">
      <h1>🎸 練習履歴</h1>

      <div className="history-summary">
        <div className="summary-card">
          <div className="summary-label">総セッション数</div>
          <div className="summary-value">{stats.count}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">総練習時間</div>
          <div className="summary-value">{formatDuration(stats.totalSeconds)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">総XP</div>
          <div className="summary-value">{stats.totalXP}</div>
        </div>
      </div>

      <div className="history-list">
        {sessions.length === 0 ? (
          <p>まだ練習履歴がありません</p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>シーン</th>
                <th>練習時間</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>{formatDate(session.start_time)}</td>
                  <td>{session.scene_name}</td>
                  <td>{formatDuration(session.duration_seconds)}</td>
                  <td>{session.xp_earned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={fetchHistory} className="refresh-button">
        🔄 更新
      </button>
    </div>
  );
}
