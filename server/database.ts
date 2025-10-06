/**
 * SQLite Database Manager
 * 練習セッションとユーザーデータを管理
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// データベースファイルのパス
const DB_PATH = path.join(process.cwd(), 'data', 'riffquest.db');
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

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

export interface XPBoost {
  id?: number;
  boost_type: 'small' | 'large'; // 40pt or 60pt
  multiplier: number; // 1.5x or 2.0x
  duration_minutes: number; // 15min or 30min
  activated_at: string;
  expires_at: string;
  active: boolean;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    // データディレクトリを作成
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // バックアップディレクトリを作成
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // データベース接続
    this.db = new Database(DB_PATH);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging有効化

    console.log('[Database] 接続成功:', DB_PATH);

    this.initTables();

    // 起動時に自動バックアップ
    this.autoBackup();

    // 毎日0時に自動バックアップ
    this.scheduleDailyBackup();
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
        boost_multiplier REAL DEFAULT 1.0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // XPブーストテーブル
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS xp_boosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        boost_type TEXT NOT NULL,
        multiplier REAL NOT NULL,
        duration_minutes INTEGER NOT NULL,
        activated_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        active INTEGER DEFAULT 1,
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
        stamina INTEGER DEFAULT 240,
        max_stamina INTEGER DEFAULT 240,
        last_stamina_update TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 初期ユーザープロフィール作成
    const userExists = this.db.prepare('SELECT id FROM user_profile WHERE id = 1').get();
    if (!userExists) {
      this.db.prepare(`
        INSERT INTO user_profile (id, total_xp, level, current_streak, best_streak, stamina, max_stamina, last_stamina_update)
        VALUES (1, 0, 1, 0, 0, 240, 240, CURRENT_TIMESTAMP)
      `).run();
      console.log('[Database] 初期ユーザープロフィール作成');
    }

    // スタミナカラムのマイグレーション（既存DBへの対応）
    this.migrateStaminaColumns();
    this.migrateBoostColumns();

    console.log('[Database] テーブル初期化完了');
  }

  /**
   * スタミナカラムのマイグレーション
   */
  private migrateStaminaColumns() {
    try {
      const columns = this.db.pragma('table_info(user_profile)') as any[];
      const hasStamina = columns.some(col => col.name === 'stamina');

      if (!hasStamina) {
        console.log('[Database] スタミナカラムを追加中...');
        const now = new Date().toISOString();

        this.db.exec(`
          ALTER TABLE user_profile ADD COLUMN stamina INTEGER DEFAULT 240;
          ALTER TABLE user_profile ADD COLUMN max_stamina INTEGER DEFAULT 240;
          ALTER TABLE user_profile ADD COLUMN last_stamina_update TEXT;
        `);

        // 既存のユーザーに対して初期値を設定
        this.db.prepare(`
          UPDATE user_profile
          SET last_stamina_update = ?
          WHERE id = 1 AND last_stamina_update IS NULL
        `).run(now);

        console.log('[Database] スタミナカラム追加完了');
      }
    } catch (error) {
      console.error('[Database] マイグレーションエラー:', error);
    }
  }

  /**
   * ブーストカラムのマイグレーション
   */
  private migrateBoostColumns() {
    try {
      const columns = this.db.pragma('table_info(sessions)') as any[];
      const hasBoostMultiplier = columns.some(col => col.name === 'boost_multiplier');

      if (!hasBoostMultiplier) {
        console.log('[Database] boost_multiplierカラムを追加中...');
        this.db.exec(`
          ALTER TABLE sessions ADD COLUMN boost_multiplier REAL DEFAULT 1.0;
        `);
        console.log('[Database] boost_multiplierカラム追加完了');
      }
    } catch (error) {
      console.error('[Database] boost_multiplierマイグレーションエラー:', error);
    }
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
    const xpResult = this.calculateXP(durationSeconds);

    this.db.prepare(`
      UPDATE sessions
      SET end_time = ?, duration_seconds = ?, xp_earned = ?, boost_multiplier = ?
      WHERE id = ?
    `).run(now, durationSeconds, xpResult.totalXP, xpResult.multiplier, sessionId);

    // ユーザーXPを更新
    this.addXP(xpResult.totalXP);

    const boostInfo = xpResult.multiplier > 1 ? ` (Base: ${xpResult.baseXP} × ${xpResult.multiplier})` : '';
    console.log('[Database] セッション終了:', sessionId, '時間:', durationSeconds, 'XP:', xpResult.totalXP + boostInfo);
  }

  /**
   * XP計算（1分 = 10 XP）+ ブースト倍率適用
   */
  private calculateXP(durationSeconds: number): { baseXP: number; multiplier: number; totalXP: number } {
    const minutes = Math.floor(durationSeconds / 60);
    const baseXP = minutes * 10;
    const multiplier = this.getActiveBoostMultiplier();
    const totalXP = Math.floor(baseXP * multiplier);

    return { baseXP, multiplier, totalXP };
  }

  /**
   * アクティブなブーストの倍率を取得
   */
  getActiveBoostMultiplier(): number {
    this.updateBoostStatus();

    const boost = this.db.prepare(`
      SELECT multiplier FROM xp_boosts
      WHERE active = 1 AND datetime(expires_at) > datetime('now')
      ORDER BY multiplier DESC
      LIMIT 1
    `).get() as any;

    return boost ? boost.multiplier : 1.0;
  }

  /**
   * アクティブなブースト情報を取得
   */
  getActiveBoost(): XPBoost | null {
    this.updateBoostStatus();

    const boost = this.db.prepare(`
      SELECT * FROM xp_boosts
      WHERE active = 1 AND datetime(expires_at) > datetime('now')
      ORDER BY multiplier DESC
      LIMIT 1
    `).get() as XPBoost | undefined;

    return boost || null;
  }

  /**
   * ブーストの有効期限をチェックして更新
   */
  private updateBoostStatus() {
    this.db.prepare(`
      UPDATE xp_boosts
      SET active = 0
      WHERE active = 1 AND datetime(expires_at) <= datetime('now')
    `).run();
  }

  /**
   * XPブーストを有効化
   */
  activateBoost(boostType: 'small' | 'large'): { success: boolean; message: string; boost?: XPBoost } {
    const cost = boostType === 'small' ? 40 : 60;
    const multiplier = boostType === 'small' ? 1.5 : 2.0;
    const duration = boostType === 'small' ? 15 : 30;

    // スタミナ消費チェック
    if (!this.consumeStamina(cost)) {
      return {
        success: false,
        message: `スタミナが不足しています（必要: ${cost}pt）`
      };
    }

    // 既存のアクティブなブーストをチェック
    const existingBoost = this.getActiveBoost();
    if (existingBoost) {
      // スタミナを返却
      this.db.prepare('UPDATE user_profile SET stamina = stamina + ? WHERE id = 1').run(cost);
      return {
        success: false,
        message: '既にブーストがアクティブです'
      };
    }

    // ブーストを作成
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000);

    const result = this.db.prepare(`
      INSERT INTO xp_boosts (boost_type, multiplier, duration_minutes, activated_at, expires_at, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(boostType, multiplier, duration, now.toISOString(), expiresAt.toISOString());

    const boost = this.db.prepare('SELECT * FROM xp_boosts WHERE id = ?').get(result.lastInsertRowid) as XPBoost;

    console.log(`[Boost] ${boostType}ブースト発動: ${multiplier}x (${duration}分間)`);

    return {
      success: true,
      message: `${multiplier}x XPブーストを${duration}分間発動しました！`,
      boost
    };
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
   * スタミナ回復処理（8分に1pt）
   */
  private updateStamina() {
    const profile = this.db.prepare('SELECT stamina, max_stamina, last_stamina_update FROM user_profile WHERE id = 1').get() as any;

    if (!profile) return;

    const now = new Date();
    const lastUpdate = new Date(profile.last_stamina_update);
    const minutesPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    const staminaToRecover = Math.floor(minutesPassed / 8);

    if (staminaToRecover > 0 && profile.stamina < profile.max_stamina) {
      const newStamina = Math.min(profile.stamina + staminaToRecover, profile.max_stamina);
      const updateTime = new Date(lastUpdate.getTime() + staminaToRecover * 8 * 60 * 1000).toISOString();

      this.db.prepare(`
        UPDATE user_profile
        SET stamina = ?,
            last_stamina_update = ?
        WHERE id = 1
      `).run(newStamina, updateTime);

      console.log(`[Stamina] 回復: ${profile.stamina} → ${newStamina} (+${staminaToRecover}pt)`);
    }
  }

  /**
   * スタミナを消費
   */
  consumeStamina(amount: number): boolean {
    this.updateStamina();

    const profile = this.db.prepare('SELECT stamina FROM user_profile WHERE id = 1').get() as any;

    if (!profile || profile.stamina < amount) {
      return false;
    }

    // スタミナ消費と同時にlast_stamina_updateを現在時刻に更新
    const now = new Date().toISOString();
    this.db.prepare(`
      UPDATE user_profile
      SET stamina = stamina - ?,
          last_stamina_update = ?
      WHERE id = 1
    `).run(amount, now);

    console.log(`[Stamina] 消費: ${amount}pt (残り: ${profile.stamina - amount}pt)`);
    return true;
  }

  /**
   * ユーザープロフィールを取得
   */
  getUserProfile() {
    this.updateStamina();

    const profile = this.db.prepare('SELECT * FROM user_profile WHERE id = 1').get() as any;

    if (profile) {
      const currentLevel = Math.floor(profile.level);
      const currentLevelTotalXP = this.getTotalXPForLevel(currentLevel);
      const nextLevelTotalXP = this.getTotalXPForLevel(currentLevel + 1);
      const xpForNextLevel = this.getXPForNextLevel(currentLevel);
      const currentLevelProgress = profile.total_xp - currentLevelTotalXP;
      const progressPercentage = (currentLevelProgress / xpForNextLevel) * 100;

      // 次回スタミナ回復までの時間を計算
      const lastUpdate = new Date(profile.last_stamina_update);
      const now = new Date();
      const minutesSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
      const minutesUntilNextRecovery = profile.stamina < profile.max_stamina
        ? 8 - (minutesSinceUpdate % 8)
        : 0;

      // アクティブなブースト情報
      const activeBoost = this.getActiveBoost();

      return {
        ...profile,
        current_level_xp: currentLevelProgress,
        xp_for_next_level: xpForNextLevel,
        progress_percentage: Math.min(progressPercentage, 100),
        minutes_until_next_stamina: minutesUntilNextRecovery,
        stamina_full: profile.stamina >= profile.max_stamina,
        active_boost: activeBoost
      };
    }

    return profile;
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
      // === 基本 - 初回系 ===
      {
        id: 'first_session',
        title: 'First Session',
        description: '初めての練習セッション',
        completed: totalSessions >= 1,
        icon: '🎵',
        rarity: 'common',
      },
      {
        id: 'first_xp',
        title: 'XP初獲得',
        description: '初めてXPを獲得',
        completed: profile.total_xp > 0,
        icon: '✨',
        rarity: 'common',
      },

      // === レベル系 ===
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
        id: 'level_25',
        title: 'クォーター',
        description: 'レベル25到達',
        completed: profile.level >= 25,
        icon: '💎',
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
        id: 'level_100',
        title: 'センチュリオン',
        description: 'レベル100到達',
        completed: profile.level >= 100,
        icon: '⚡',
        rarity: 'legendary',
      },

      // === 練習時間系 ===
      {
        id: 'minutes_30',
        title: '30分練習家',
        description: '累計30分練習',
        completed: totalMinutes >= 30,
        icon: '⏰',
        rarity: 'common',
      },
      {
        id: 'first_hour',
        title: '1時間ギタリスト',
        description: '累計1時間練習',
        completed: totalMinutes >= 60,
        icon: '🎯',
        rarity: 'common',
      },
      {
        id: 'ten_hours',
        title: '10時間の壁',
        description: '累計10時間練習',
        completed: totalMinutes >= 600,
        icon: '📈',
        rarity: 'uncommon',
      },
      {
        id: 'fifty_hours',
        title: '50時間マスター',
        description: '累計50時間練習',
        completed: totalMinutes >= 3000,
        icon: '🔥',
        rarity: 'rare',
      },
      {
        id: 'hundred_hours',
        title: '100時間レジェンド',
        description: '累計100時間練習',
        completed: totalMinutes >= 6000,
        icon: '💪',
        rarity: 'rare',
      },
      {
        id: 'thousand_hours',
        title: '1000時間の達人',
        description: '累計1000時間練習',
        completed: totalMinutes >= 60000,
        icon: '👑',
        rarity: 'legendary',
      },
      {
        id: 'twenty_thousand_hours',
        title: 'マスター・オブ・ギター',
        description: '累計20,000時間練習 - 真の達人の証',
        completed: totalMinutes >= 1200000,
        icon: '🌟',
        rarity: 'mythic',
      },

      // === セッション数系 ===
      {
        id: 'sessions_10',
        title: '10セッション達成',
        description: '10回の練習を完了',
        completed: totalSessions >= 10,
        icon: '🎪',
        rarity: 'common',
      },
      {
        id: 'sessions_50',
        title: '50セッション達成',
        description: '50回の練習を完了',
        completed: totalSessions >= 50,
        icon: '🌟',
        rarity: 'uncommon',
      },
      {
        id: 'sessions_100',
        title: '100セッション達成',
        description: '100回の練習を完了',
        completed: totalSessions >= 100,
        icon: '💫',
        rarity: 'rare',
      },
      {
        id: 'sessions_500',
        title: '500セッション達成',
        description: '500回の練習を完了',
        completed: totalSessions >= 500,
        icon: '🌈',
        rarity: 'epic',
      },

      // === 連続練習系 ===
      {
        id: 'streak_3',
        title: '継続は力なり',
        description: '3日連続で練習',
        completed: profile.current_streak >= 3,
        icon: '🌱',
        rarity: 'common',
      },
      {
        id: 'streak_7',
        title: 'ウィークリーファイター',
        description: '7日連続で練習',
        completed: profile.current_streak >= 7,
        icon: '🔥',
        rarity: 'uncommon',
      },
      {
        id: 'streak_14',
        title: '2週間ストリーク',
        description: '14日連続で練習',
        completed: profile.current_streak >= 14,
        icon: '⚡',
        rarity: 'rare',
      },
      {
        id: 'streak_30',
        title: '1ヶ月チャレンジャー',
        description: '30日連続で練習',
        completed: profile.current_streak >= 30,
        icon: '💪',
        rarity: 'epic',
      },
      {
        id: 'streak_100',
        title: 'アイアンウィル',
        description: '100日連続で練習',
        completed: profile.current_streak >= 100,
        icon: '👑',
        rarity: 'legendary',
      },
      {
        id: 'streak_365',
        title: 'レジェンダリーストリーク',
        description: '365日連続で練習',
        completed: profile.current_streak >= 365,
        icon: '🏆',
        rarity: 'mythic',
      },

      // === XP系 ===
      {
        id: 'xp_100',
        title: '100 XP達成',
        description: '累計100 XP獲得',
        completed: profile.total_xp >= 100,
        icon: '🎖️',
        rarity: 'common',
      },
      {
        id: 'xp_1000',
        title: '1,000 XP達成',
        description: '累計1,000 XP獲得',
        completed: profile.total_xp >= 1000,
        icon: '💫',
        rarity: 'uncommon',
      },
      {
        id: 'xp_10000',
        title: '10,000 XP達成',
        description: '累計10,000 XP獲得',
        completed: profile.total_xp >= 10000,
        icon: '🌟',
        rarity: 'rare',
      },
      {
        id: 'xp_100000',
        title: '100,000 XP達成',
        description: '累計100,000 XP獲得',
        completed: profile.total_xp >= 100000,
        icon: '👑',
        rarity: 'legendary',
      },

      // === 時間帯系 ===
      {
        id: 'early_bird',
        title: '早朝の練習者',
        description: '朝5時〜7時に練習',
        completed: allSessions.some(s => {
          const hour = new Date(s.start_time).getHours();
          return hour >= 5 && hour < 7;
        }),
        icon: '🌅',
        rarity: 'uncommon',
      },
      {
        id: 'morning_practice',
        title: '朝型ギタリスト',
        description: '朝7時〜9時に練習',
        completed: allSessions.some(s => {
          const hour = new Date(s.start_time).getHours();
          return hour >= 7 && hour < 9;
        }),
        icon: '☀️',
        rarity: 'common',
      },
      {
        id: 'noon_practice',
        title: 'お昼の休憩練習',
        description: '12時〜14時に練習',
        completed: allSessions.some(s => {
          const hour = new Date(s.start_time).getHours();
          return hour >= 12 && hour < 14;
        }),
        icon: '🌤️',
        rarity: 'common',
      },
      {
        id: 'evening_practice',
        title: '夕方の練習者',
        description: '17時〜19時に練習',
        completed: allSessions.some(s => {
          const hour = new Date(s.start_time).getHours();
          return hour >= 17 && hour < 19;
        }),
        icon: '🌆',
        rarity: 'common',
      },
      {
        id: 'night_owl',
        title: '夜型ギタリスト',
        description: '22時〜24時に練習',
        completed: allSessions.some(s => {
          const hour = new Date(s.start_time).getHours();
          return hour >= 22 && hour < 24;
        }),
        icon: '🌙',
        rarity: 'uncommon',
      },
      {
        id: 'midnight_practice',
        title: '深夜の練習者',
        description: '0時〜3時に練習',
        completed: allSessions.some(s => {
          const hour = new Date(s.start_time).getHours();
          return hour >= 0 && hour < 3;
        }),
        icon: '🌃',
        rarity: 'rare',
      },

      // === 曜日系 ===
      {
        id: 'monday_warrior',
        title: '月曜の戦士',
        description: '月曜日に練習',
        completed: allSessions.some(s => new Date(s.start_time).getDay() === 1),
        icon: '💼',
        rarity: 'common',
      },
      {
        id: 'tuesday_player',
        title: '火曜のプレイヤー',
        description: '火曜日に練習',
        completed: allSessions.some(s => new Date(s.start_time).getDay() === 2),
        icon: '🔥',
        rarity: 'common',
      },
      {
        id: 'wednesday_musician',
        title: '水曜のミュージシャン',
        description: '水曜日に練習',
        completed: allSessions.some(s => new Date(s.start_time).getDay() === 3),
        icon: '💧',
        rarity: 'common',
      },
      {
        id: 'thursday_guitarist',
        title: '木曜のギタリスト',
        description: '木曜日に練習',
        completed: allSessions.some(s => new Date(s.start_time).getDay() === 4),
        icon: '🌳',
        rarity: 'common',
      },
      {
        id: 'friday_rocker',
        title: '金曜のロッカー',
        description: '金曜日に練習',
        completed: allSessions.some(s => new Date(s.start_time).getDay() === 5),
        icon: '🎉',
        rarity: 'common',
      },
      {
        id: 'saturday_shredder',
        title: '土曜の練習魔',
        description: '土曜日に練習',
        completed: allSessions.some(s => new Date(s.start_time).getDay() === 6),
        icon: '🎸',
        rarity: 'common',
      },
      {
        id: 'sunday_player',
        title: '日曜のプレイヤー',
        description: '日曜日に練習',
        completed: allSessions.some(s => new Date(s.start_time).getDay() === 0),
        icon: '☀️',
        rarity: 'common',
      },
      {
        id: 'week_complete',
        title: 'ウィークコンプリート',
        description: '全ての曜日で練習を達成',
        completed: [0, 1, 2, 3, 4, 5, 6].every(day =>
          allSessions.some(s => new Date(s.start_time).getDay() === day)
        ),
        icon: '🌈',
        rarity: 'epic',
      },
    ];

    return achievements;
  }

  /**
   * データベースをバックアップ
   */
  createBackup(): { success: boolean; message: string; filename?: string } {
    try {
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '-');
      const filename = `riffquest-backup-${timestamp}.db`;
      const backupPath = path.join(BACKUP_DIR, filename);

      // データベースファイルをコピー
      fs.copyFileSync(DB_PATH, backupPath);

      console.log('[Backup] バックアップ作成:', filename);

      // 古いバックアップを削除（最新30個まで保持）
      this.cleanupOldBackups(30);

      return {
        success: true,
        message: 'バックアップを作成しました',
        filename
      };
    } catch (error: any) {
      console.error('[Backup] エラー:', error);
      return {
        success: false,
        message: `バックアップ失敗: ${error.message}`
      };
    }
  }

  /**
   * 古いバックアップファイルを削除
   */
  private cleanupOldBackups(keepCount: number) {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('riffquest-backup-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(BACKUP_DIR, file),
          mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // 古いファイルを削除
      const filesToDelete = files.slice(keepCount);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log('[Backup] 古いバックアップ削除:', file.name);
      });
    } catch (error) {
      console.error('[Backup] クリーンアップエラー:', error);
    }
  }

  /**
   * 自動バックアップ（起動時）
   */
  private autoBackup() {
    // データベースファイルが存在する場合のみバックアップ
    if (fs.existsSync(DB_PATH)) {
      const result = this.createBackup();
      if (result.success) {
        console.log('[Backup] 自動バックアップ完了:', result.filename);
      }
    }
  }

  /**
   * 毎日0時に自動バックアップをスケジュール
   */
  private scheduleDailyBackup() {
    const scheduleNextBackup = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const msUntilMidnight = tomorrow.getTime() - now.getTime();

      setTimeout(() => {
        this.createBackup();
        scheduleNextBackup(); // 次の日のバックアップをスケジュール
      }, msUntilMidnight);

      console.log(`[Backup] 次回自動バックアップ: ${tomorrow.toLocaleString('ja-JP')}`);
    };

    scheduleNextBackup();
  }

  /**
   * バックアップ一覧を取得
   */
  listBackups(): { filename: string; size: number; created: Date }[] {
    try {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('riffquest-backup-') && file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            created: stats.mtime
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return files;
    } catch (error) {
      console.error('[Backup] 一覧取得エラー:', error);
      return [];
    }
  }

  /**
   * データベース接続を閉じる
   */
  close() {
    this.db.close();
    console.log('[Database] 接続を閉じました');
  }
}
