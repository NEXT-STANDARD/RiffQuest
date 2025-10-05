/**
 * SQLite Database Manager
 * 練習セッションとユーザーデータを管理
 */

import Database from 'better-sqlite3';
import path from 'path';

// データベースファイルのパス
const DB_PATH = path.join(process.cwd(), 'data', 'riffquest.db');

export interface Session {
  id?: number;
  scene_name: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  xp_earned: number;
  created_at?: string;
}

export interface DailyStats {
  date: string;
  total_seconds: number;
  session_count: number;
  total_xp: number;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    // データディレクトリを作成
    const fs = require('fs');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // データベース接続
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging有効化

    console.log('[Database] 接続成功:', DB_PATH);

    this.initTables();
  }

  /**
   * テーブル初期化
   */
  private initTables() {
    // セッションテーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scene_name TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_seconds INTEGER DEFAULT 0,
        xp_earned INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ユーザープロフィールテーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 初期ユーザープロフィール作成
    const userExists = this.db.prepare('SELECT id FROM user_profile WHERE id = 1').get();
    if (!userExists) {
      this.db.prepare(`
        INSERT INTO user_profile (id, total_xp, level, current_streak, best_streak)
        VALUES (1, 0, 1, 0, 0)
      `).run();
      console.log('[Database] 初期ユーザープロフィール作成');
    }

    console.log('[Database] テーブル初期化完了');
  }

  /**
   * 新しいセッションを開始
   */
  startSession(sceneName: string): number {
    const now = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT INTO sessions (scene_name, start_time, duration_seconds, xp_earned)
      VALUES (?, ?, 0, 0)
    `).run(sceneName, now);

    console.log('[Database] セッション開始:', result.lastInsertRowid);
    return result.lastInsertRowid as number;
  }

  /**
   * セッションを終了
   */
  endSession(sessionId: number, durationSeconds: number): void {
    const now = new Date().toISOString();
    const xpEarned = this.calculateXP(durationSeconds);

    this.db.prepare(`
      UPDATE sessions
      SET end_time = ?, duration_seconds = ?, xp_earned = ?
      WHERE id = ?
    `).run(now, durationSeconds, xpEarned, sessionId);

    // ユーザーXPを更新
    this.addXP(xpEarned);

    console.log('[Database] セッション終了:', sessionId, '時間:', durationSeconds, 'XP:', xpEarned);
  }

  /**
   * XP計算（1分 = 10 XP）
   */
  private calculateXP(durationSeconds: number): number {
    const minutes = Math.floor(durationSeconds / 60);
    return minutes * 10;
  }

  /**
   * ユーザーにXPを追加
   */
  private addXP(xp: number): void {
    const profile = this.getUserProfile() as any;
    const newTotalXP = profile.total_xp + xp;
    const newLevel = this.calculateLevel(newTotalXP);

    this.db.prepare(`
      UPDATE user_profile
      SET total_xp = ?,
          level = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(newTotalXP, newLevel);
  }

  /**
   * 総XPからレベルを計算（RPG風の累積式）
   * レベル1→2: 100 XP
   * レベル2→3: 200 XP
   * レベル3→4: 300 XP
   * レベルN→N+1: N × 100 XP
   */
  private calculateLevel(totalXP: number): number {
    let level = 1;
    let xpRequired = 0;

    while (xpRequired <= totalXP) {
      xpRequired += level * 100;
      if (xpRequired <= totalXP) {
        level++;
      }
    }

    return level;
  }

  /**
   * 次のレベルまでに必要なXPを計算
   */
  getXPForNextLevel(currentLevel: number): number {
    return currentLevel * 100;
  }

  /**
   * 現在のレベルの累積XPを計算
   */
  getTotalXPForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += i * 100;
    }
    return total;
  }

  /**
   * 今日の統計を取得
   */
  getTodayStats(): DailyStats {
    const today = new Date().toISOString().split('T')[0];

    const stats = this.db.prepare(`
      SELECT
        ? as date,
        COALESCE(SUM(duration_seconds), 0) as total_seconds,
        COUNT(*) as session_count,
        COALESCE(SUM(xp_earned), 0) as total_xp
      FROM sessions
      WHERE DATE(start_time) = ?
    `).get(today, today) as DailyStats;

    return stats;
  }

  /**
   * ユーザープロフィールを取得
   */
  getUserProfile() {
    return this.db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  }

  /**
   * 過去7日間の統計
   */
  getWeeklyStats(): DailyStats[] {
    const stats = this.db.prepare(`
      SELECT
        DATE(start_time) as date,
        SUM(duration_seconds) as total_seconds,
        COUNT(*) as session_count,
        SUM(xp_earned) as total_xp
      FROM sessions
      WHERE start_time >= DATE('now', '-7 days')
      GROUP BY DATE(start_time)
      ORDER BY date DESC
    `).all() as DailyStats[];

    return stats;
  }

  /**
   * 全ての練習セッション履歴を取得
   */
  getAllSessions(limit: number = 50): Session[] {
    const sessions = this.db.prepare(`
      SELECT * FROM sessions
      WHERE end_time IS NOT NULL
      ORDER BY start_time DESC
      LIMIT ?
    `).all(limit) as Session[];

    return sessions;
  }

  /**
   * 連続練習日数を計算
   */
  updateStreak(): void {
    // 過去の練習日を取得
    const practiceDays = this.db.prepare(`
      SELECT DISTINCT DATE(start_time) as date
      FROM sessions
      WHERE end_time IS NOT NULL
      ORDER BY date DESC
      LIMIT 365
    `).all() as { date: string }[];

    if (practiceDays.length === 0) {
      this.db.prepare('UPDATE user_profile SET current_streak = 0 WHERE id = 1').run();
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    let currentStreak = 0;
    let bestStreak = 0;
    let checkDate = new Date();

    // 今日または昨日練習していない場合はストリーク途切れ
    const latestPractice = practiceDays[0].date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (latestPractice !== today && latestPractice !== yesterdayStr) {
      // ストリーク途切れ
      this.db.prepare('UPDATE user_profile SET current_streak = 0 WHERE id = 1').run();
      return;
    }

    // 連続日数をカウント
    for (let i = 0; i < practiceDays.length; i++) {
      const practiceDate = new Date(practiceDays[i].date);
      const expectedDate = new Date(checkDate);
      expectedDate.setHours(0, 0, 0, 0);
      practiceDate.setHours(0, 0, 0, 0);

      if (practiceDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // ベストストリークを更新
    const profile = this.getUserProfile() as any;
    bestStreak = Math.max(currentStreak, profile.best_streak);

    this.db.prepare(`
      UPDATE user_profile
      SET current_streak = ?, best_streak = ?
      WHERE id = 1
    `).run(currentStreak, bestStreak);
  }

  /**
   * デイリー目標の達成状況を取得
   */
  getDailyGoals() {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.getTodayStats();

    const goals = [
      {
        id: 'first_session',
        title: '今日の最初の練習',
        description: '1セッション完了',
        target: 1,
        current: stats.session_count,
        completed: stats.session_count >= 1,
        xp: 50,
        icon: '🎯',
      },
      {
        id: 'practice_15min',
        title: '15分練習',
        description: '15分以上練習',
        target: 15 * 60,
        current: stats.total_seconds,
        completed: stats.total_seconds >= 15 * 60,
        xp: 100,
        icon: '⏱️',
      },
      {
        id: 'practice_30min',
        title: '30分練習',
        description: '30分以上練習',
        target: 30 * 60,
        current: stats.total_seconds,
        completed: stats.total_seconds >= 30 * 60,
        xp: 200,
        icon: '🔥',
      },
      {
        id: 'practice_60min',
        title: '1時間練習',
        description: '1時間以上練習',
        target: 60 * 60,
        current: stats.total_seconds,
        completed: stats.total_seconds >= 60 * 60,
        xp: 500,
        icon: '⭐',
      },
      {
        id: 'three_sessions',
        title: '3セッション',
        description: '3回以上練習',
        target: 3,
        current: stats.session_count,
        completed: stats.session_count >= 3,
        xp: 150,
        icon: '🎸',
      },
    ];

    return goals;
  }

  /**
   * 実績データを取得
   */
  getAchievements() {
    const profile = this.getUserProfile() as any;
    const allSessions = this.getAllSessions(1000);
    const totalSessions = allSessions.length;
    const totalMinutes = Math.floor(allSessions.reduce((sum, s) => sum + s.duration_seconds, 0) / 60);

    const achievements = [
      {
        id: 'beginner',
        title: 'ビギナー',
        description: 'レベル5到達',
        completed: profile.level >= 5,
        icon: '🎵',
        rarity: 'common',
      },
      {
        id: 'intermediate',
        title: '中級者',
        description: 'レベル10到達',
        completed: profile.level >= 10,
        icon: '🎸',
        rarity: 'uncommon',
      },
      {
        id: 'advanced',
        title: '上級者',
        description: 'レベル20到達',
        completed: profile.level >= 20,
        icon: '🎼',
        rarity: 'rare',
      },
      {
        id: 'master',
        title: 'マスター',
        description: 'レベル50到達',
        completed: profile.level >= 50,
        icon: '👑',
        rarity: 'epic',
      },
      {
        id: 'first_hour',
        title: '初めての1時間',
        description: '累計1時間練習',
        completed: totalMinutes >= 60,
        icon: '⏰',
        rarity: 'common',
      },
      {
        id: 'ten_hours',
        title: '10時間の鍛錬',
        description: '累計10時間練習',
        completed: totalMinutes >= 600,
        icon: '🔥',
        rarity: 'uncommon',
      },
      {
        id: 'hundred_hours',
        title: '100時間の修行',
        description: '累計100時間練習',
        completed: totalMinutes >= 6000,
        icon: '💪',
        rarity: 'rare',
      },
      {
        id: 'streak_3',
        title: '3日連続',
        description: '3日連続で練習',
        completed: profile.current_streak >= 3,
        icon: '🔥',
        rarity: 'common',
      },
      {
        id: 'streak_7',
        title: '1週間継続',
        description: '7日連続で練習',
        completed: profile.current_streak >= 7,
        icon: '⚡',
        rarity: 'uncommon',
      },
      {
        id: 'streak_30',
        title: '1ヶ月継続',
        description: '30日連続で練習',
        completed: profile.current_streak >= 30,
        icon: '🌟',
        rarity: 'epic',
      },
      {
        id: 'sessions_10',
        title: '10回の練習',
        description: '10セッション完了',
        completed: totalSessions >= 10,
        icon: '📝',
        rarity: 'common',
      },
      {
        id: 'sessions_50',
        title: '50回の練習',
        description: '50セッション完了',
        completed: totalSessions >= 50,
        icon: '📚',
        rarity: 'uncommon',
      },
      {
        id: 'sessions_100',
        title: '100回の練習',
        description: '100セッション完了',
        completed: totalSessions >= 100,
        icon: '🏆',
        rarity: 'rare',
      },
    ];

    return achievements;
  }

  /**
   * データベース接続を閉じる
   */
  close() {
    this.db.close();
    console.log('[Database] 接続を閉じました');
  }
}
