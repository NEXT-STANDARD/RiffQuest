/**
 * RiffQuest Server with Database
 * Express + Socket.io + OBS WebSocket + SQLite統合
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import OBSWebSocket from 'obs-websocket-js';
import { DatabaseManager } from './database';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5174',
    methods: ['GET', 'POST'],
  },
});

const obs = new OBSWebSocket();
const db = new DatabaseManager();

let obsConnected = false;
let currentSession: number | null = null;
let sessionStartTime: number | null = null;
let currentBPM: number | null = null;

// ミドルウェア
app.use(cors());
app.use(express.json());

// OBS WebSocketイベントリスナー
obs.on('CurrentProgramSceneChanged', (data) => {
  console.log('[OBS] シーン変更:', data.sceneName);

  const sceneName = data.sceneName;
  const isPracticeScene = sceneName.toLowerCase().includes('practice');

  // Practiceシーンに切り替わったらセッション開始
  if (isPracticeScene && !currentSession) {
    currentSession = db.startSession(sceneName);
    sessionStartTime = Date.now();
    console.log('[Session] 開始:', currentSession);
  }
  // Practiceシーン以外に切り替わったらセッション終了
  else if (!isPracticeScene && currentSession && sessionStartTime) {
    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    db.endSession(currentSession, durationSeconds);
    db.updateStreak(); // ストリーク更新
    console.log('[Session] 終了:', currentSession, '時間:', durationSeconds);
    currentSession = null;
    sessionStartTime = null;

    // 統計を更新してクライアントに送信
    const stats = db.getTodayStats();
    const profile = db.getUserProfile();
    io.emit('stats:updated', { today: stats, profile });
  }

  io.emit('obs:scene-changed', sceneName);
});

obs.on('ConnectionClosed', () => {
  console.log('[OBS] 接続が閉じられました');
  obsConnected = false;

  // アクティブなセッションを終了
  if (currentSession && sessionStartTime) {
    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    db.endSession(currentSession, durationSeconds);
    currentSession = null;
    sessionStartTime = null;
  }

  io.emit('obs:disconnected');
});

obs.on('ConnectionError', (error) => {
  console.error('[OBS] 接続エラー:', error);
  obsConnected = false;
  io.emit('obs:error', { message: error.message });
});

// REST API
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    obs: obsConnected ? 'connected' : 'disconnected',
  });
});

app.post('/api/obs/connect', async (_req, res) => {
  const { url, password } = _req.body;

  try {
    await obs.connect(url, password);
    obsConnected = true;
    console.log('[OBS] 接続成功:', url);

    io.emit('obs:connected', { url });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[OBS] 接続失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/obs/disconnect', async (_req, res) => {
  try {
    await obs.disconnect();
    obsConnected = false;
    console.log('[OBS] 切断しました');

    io.emit('obs:disconnected');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/obs/current-scene', async (_req, res) => {
  try {
    if (!obsConnected) {
      throw new Error('OBSに接続していません');
    }

    const response = await obs.call('GetCurrentProgramScene');
    res.json({
      success: true,
      sceneName: response.currentProgramSceneName || '',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 統計API
app.get('/api/stats/today', (_req, res) => {
  try {
    const stats = db.getTodayStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats/weekly', (_req, res) => {
  try {
    const stats = db.getWeeklyStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/profile', (_req, res) => {
  try {
    const profile = db.getUserProfile();
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 練習履歴API
app.get('/api/sessions/history', (_req, res) => {
  try {
    const limit = parseInt(_req.query.limit as string) || 50;
    const sessions = db.getAllSessions(limit);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// デイリー目標API
app.get('/api/goals/daily', (_req, res) => {
  try {
    const goals = db.getDailyGoals();
    res.json(goals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 実績API
app.get('/api/achievements', (_req, res) => {
  try {
    const achievements = db.getAchievements();
    res.json(achievements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// スタミナAPI
app.get('/api/stamina', (_req, res) => {
  try {
    const profile = db.getUserProfile();
    res.json({
      stamina: profile.stamina,
      max_stamina: profile.max_stamina,
      minutes_until_next_recovery: profile.minutes_until_next_stamina,
      stamina_full: profile.stamina_full
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ブーストAPI
app.post('/api/boost/activate', (_req, res) => {
  try {
    const { type } = _req.body;

    if (type !== 'small' && type !== 'large') {
      return res.status(400).json({
        success: false,
        error: 'Invalid boost type. Use "small" or "large".'
      });
    }

    const result = db.activateBoost(type);

    if (result.success) {
      // 統計を更新してクライアントに送信
      const profile = db.getUserProfile();
      io.emit('boost:activated', { boost: result.boost, profile });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/boost/active', (_req, res) => {
  try {
    const boost = db.getActiveBoost();
    res.json({ boost });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// バックアップAPI
app.post('/api/backup/create', (_req, res) => {
  try {
    const result = db.createBackup();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/backup/list', (_req, res) => {
  try {
    const backups = db.listBackups();
    res.json({ backups });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// データベースリセットAPI
app.post('/api/database/reset', (_req, res) => {
  try {
    const result = db.resetDatabase();

    if (result.success) {
      // リセット後の統計をすべてのクライアントに送信
      const stats = db.getTodayStats();
      const profile = db.getUserProfile();
      io.emit('stats:updated', { today: stats, profile });
      io.emit('database:reset');
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Socket.io接続処理
io.on('connection', (socket) => {
  console.log('[Socket.io] クライアント接続:', socket.id);

  // OBS接続状態を送信
  socket.emit('obs:status', { connected: obsConnected });

  // 現在の統計を送信
  const stats = db.getTodayStats();
  const profile = db.getUserProfile();
  socket.emit('stats:updated', { today: stats, profile });

  // 現在のBPMを送信
  if (currentBPM) {
    socket.emit('bpm:updated', { bpm: currentBPM });
  }

  // BPM更新イベントを受信
  socket.on('bpm:detected', (data: { bpm: number }) => {
    currentBPM = data.bpm;
    console.log('[BPM] 検出:', currentBPM);
    // 他のクライアントにブロードキャスト
    io.emit('bpm:updated', { bpm: currentBPM });
  });

  socket.on('disconnect', () => {
    console.log('[Socket.io] クライアント切断:', socket.id);
  });
});

// サーバー起動
const PORT = process.env.PORT || 3030;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 RiffQuest Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🎸 Ready to connect to OBS Studio`);
  console.log(`💾 Database: ${db.getUserProfile()}\n`);
});

// 終了処理
process.on('SIGINT', () => {
  console.log('\n[Server] シャットダウン中...');

  if (currentSession && sessionStartTime) {
    const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
    db.endSession(currentSession, durationSeconds);
  }

  db.close();
  process.exit(0);
});
