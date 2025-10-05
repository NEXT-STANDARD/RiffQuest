/**
 * OBS オーバーレイコンポーネント（統計機能付き）
 * SQLiteデータベースからリアルタイム統計を表示
 */

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './Overlay.css';

const API_URL = 'http://localhost:3030';

interface DailyStats {
  date: string;
  total_seconds: number;
  session_count: number;
  total_xp: number;
}

interface UserProfile {
  id: number;
  total_xp: number;
  level: number;
  current_streak: number;
  best_streak: number;
}

export function Overlay() {
  const [currentScene, setCurrentScene] = useState('待機中...');
  const [sessionTime, setSessionTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [connected, setConnected] = useState(false);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    console.log('[Overlay] 初期化開始');

    const newSocket = io(API_URL);

    newSocket.on('connect', () => {
      console.log('[Overlay] Socket.io接続成功');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('[Overlay] Socket.io切断');
      setConnected(false);
    });

    newSocket.on('obs:scene-changed', (sceneName: string) => {
      console.log('[Overlay] シーン変更:', sceneName);
      setCurrentScene(sceneName);

      if (sceneName.toLowerCase().includes('practice')) {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    });

    newSocket.on('stats:updated', (data: { today: DailyStats; profile: UserProfile }) => {
      console.log('[Overlay] 統計更新:', data);
      setTodayStats(data.today);
      setProfile(data.profile);
    });

    // 初期統計を取得
    fetch(`${API_URL}/api/stats/today`)
      .then(res => res.json())
      .then(setTodayStats)
      .catch(console.error);

    fetch(`${API_URL}/api/user/profile`)
      .then(res => res.json())
      .then(setProfile)
      .catch(console.error);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      setSessionTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="overlay">
      <div className="overlay-header">
        <div className="scene-badge">
          {isActive ? '🎸' : '⏸️'} {currentScene}
        </div>
      </div>

      <div className="overlay-stats">
        <div className="stat-card">
          <div className="stat-label">現在</div>
          <div className="stat-value">{formatTime(sessionTime)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">今日</div>
          <div className="stat-value" style={{ fontSize: '16px' }}>
            {todayStats ? formatTotalTime(todayStats.total_seconds) : '0m'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">レベル</div>
          <div className="stat-value">{profile ? profile.level : 1}</div>
        </div>
      </div>

      <div className="overlay-stats" style={{ marginTop: '8px' }}>
        <div className="stat-card">
          <div className="stat-label">XP</div>
          <div className="stat-value" style={{ fontSize: '16px' }}>
            {profile ? profile.total_xp : 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">セッション</div>
          <div className="stat-value" style={{ fontSize: '16px' }}>
            {todayStats ? todayStats.session_count : 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">ストリーク</div>
          <div className="stat-value" style={{ fontSize: '16px' }}>
            {profile ? profile.current_streak : 0}🔥
          </div>
        </div>
      </div>

      <div className="overlay-footer">
        <div className="status-dot" style={{
          background: connected ? '#22c55e' : '#ef4444'
        }}></div>
        <span>RiffQuest {connected ? 'Active' : 'Disconnected'}</span>
      </div>
    </div>
  );
}
