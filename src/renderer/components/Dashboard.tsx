/**
 * ゲーミフィケーションダッシュボード
 * デイリータスク、実績、連続日数などを表示
 */

import { useState, useEffect } from 'react';
import './Dashboard.css';

const API_URL = 'http://localhost:3030';

interface UserProfile {
  id: number;
  total_xp: number;
  level: number;
  current_streak: number;
  best_streak: number;
}

interface DailyGoal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  xp: number;
  icon: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: string;
  rarity: string;
}

interface DailyStats {
  date: string;
  total_seconds: number;
  session_count: number;
  total_xp: number;
}

export function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, goalsRes, achievementsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/user/profile`),
        fetch(`${API_URL}/api/goals/daily`),
        fetch(`${API_URL}/api/achievements`),
        fetch(`${API_URL}/api/stats/today`),
      ]);

      setProfile(await profileRes.json());
      setGoals(await goalsRes.json());
      setAchievements(await achievementsRes.json());
      setTodayStats(await statsRes.json());
    } catch (error) {
      console.error('データ取得エラー:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getLevelProgress = () => {
    if (!profile) return 0;
    const currentLevelXP = (profile.level - 1) * 100;
    const nextLevelXP = profile.level * 100;
    const progressInLevel = profile.total_xp - currentLevelXP;
    return (progressInLevel / 100) * 100;
  };

  const completedGoalsCount = goals.filter(g => g.completed).length;
  const completedAchievements = achievements.filter(a => a.completed);
  const unlockedAchievements = achievements.filter(a => a.completed).length;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#95a5a6';
      case 'uncommon': return '#3498db';
      case 'rare': return '#9b59b6';
      case 'epic': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="dashboard">
      {/* プロフィールカード */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">🎸</div>
          <div className="profile-info">
            <h2>レベル {profile?.level || 1}</h2>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${getLevelProgress()}%` }}></div>
            </div>
            <p className="xp-text">{profile?.total_xp || 0} XP</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-box">
            <div className="stat-icon">🔥</div>
            <div className="stat-info">
              <div className="stat-value">{profile?.current_streak || 0}日</div>
              <div className="stat-label">連続練習</div>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">⚡</div>
            <div className="stat-info">
              <div className="stat-value">{profile?.best_streak || 0}日</div>
              <div className="stat-label">最長記録</div>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <div className="stat-value">{todayStats ? formatTime(todayStats.total_seconds) : '0分'}</div>
              <div className="stat-label">今日の練習</div>
            </div>
          </div>
        </div>
      </div>

      {/* デイリータスク */}
      <div className="daily-goals-section">
        <h3>📋 今日の目標 ({completedGoalsCount}/{goals.length})</h3>
        <div className="goals-grid">
          {goals.map((goal) => (
            <div key={goal.id} className={`goal-card ${goal.completed ? 'completed' : ''}`}>
              <div className="goal-icon">{goal.icon}</div>
              <div className="goal-content">
                <h4>{goal.title}</h4>
                <p>{goal.description}</p>
                <div className="goal-progress">
                  <div
                    className="goal-progress-bar"
                    style={{ width: `${getProgressPercentage(goal.current, goal.target)}%` }}
                  ></div>
                </div>
                <div className="goal-footer">
                  {goal.completed ? (
                    <span className="goal-status">✅ 達成</span>
                  ) : (
                    <span className="goal-xp">+{goal.xp} XP</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 実績 */}
      <div className="achievements-section">
        <h3>🏆 実績 ({unlockedAchievements}/{achievements.length})</h3>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`achievement-card ${achievement.completed ? 'unlocked' : 'locked'}`}
              style={{ borderColor: achievement.completed ? getRarityColor(achievement.rarity) : '#444' }}
            >
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-content">
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
                {achievement.completed && (
                  <span className="achievement-badge" style={{ background: getRarityColor(achievement.rarity) }}>
                    {achievement.rarity.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
