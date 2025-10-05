/**
 * PoC 2: WebSocket サーバーのプロトタイプ
 *
 * 目的:
 * - WebSocket サーバーの動作確認
 * - クライアント（Overlay）へのリアルタイムデータプッシュ
 * - 1秒ごとの更新イベント送信
 *
 * 実行方法:
 * 1. node websocket-server-test.js
 * 2. ブラウザで http://127.0.0.1:3030 を開く
 * 3. リアルタイム更新を確認
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 設定
const PORT = 3030;

// サーバーの作成
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    // テスト用の HTML ページを返す
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RiffQuest WebSocket Test</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #1a1a1a;
      color: #fff;
    }
    h1 {
      color: #ff6b6b;
      border-bottom: 2px solid #ff6b6b;
      padding-bottom: 10px;
    }
    .status {
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-weight: bold;
    }
    .connected {
      background: #51cf66;
      color: #000;
    }
    .disconnected {
      background: #ff6b6b;
      color: #fff;
    }
    .data {
      background: #2c2c2c;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .data-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #444;
    }
    .data-item:last-child {
      border-bottom: none;
    }
    .label {
      color: #aaa;
    }
    .value {
      color: #51cf66;
      font-weight: bold;
      font-size: 1.2em;
    }
    .log {
      background: #000;
      color: #0f0;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      max-height: 300px;
      overflow-y: auto;
    }
    .log-entry {
      margin: 5px 0;
    }
    .pb-flash {
      animation: flash 1s;
    }
    @keyframes flash {
      0%, 100% { background: #2c2c2c; }
      50% { background: #ffd700; }
    }
  </style>
</head>
<body>
  <h1>🎸 RiffQuest WebSocket Test</h1>

  <div id="status" class="status disconnected">
    ⏳ 接続中...
  </div>

  <div class="data">
    <h2>Overlay データ</h2>
    <div class="data-item">
      <span class="label">フォーカス時間:</span>
      <span class="value" id="focus">0</span>
    </div>
    <div class="data-item">
      <span class="label">XP:</span>
      <span class="value" id="xp">0</span>
    </div>
    <div class="data-item">
      <span class="label">Streak:</span>
      <span class="value" id="streak">0</span>
    </div>
    <div class="data-item">
      <span class="label">Target BPM:</span>
      <span class="value" id="bpm_target">120</span>
    </div>
    <div class="data-item">
      <span class="label">PB BPM:</span>
      <span class="value" id="pb_bpm">0</span>
    </div>
    <div class="data-item">
      <span class="label">ポモドーロ:</span>
      <span class="value" id="pomodoro">停止中</span>
    </div>
  </div>

  <div>
    <h2>イベントログ</h2>
    <div id="log" class="log"></div>
  </div>

  <script>
    const ws = new WebSocket('ws://127.0.0.1:3030');
    const statusEl = document.getElementById('status');
    const logEl = document.getElementById('log');

    function addLog(message, color = '#0f0') {
      const time = new Date().toLocaleTimeString('ja-JP');
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.style.color = color;
      entry.textContent = \`[\${time}] \${message}\`;
      logEl.insertBefore(entry, logEl.firstChild);

      // 最大100件まで保持
      if (logEl.children.length > 100) {
        logEl.removeChild(logEl.lastChild);
      }
    }

    ws.onopen = () => {
      statusEl.textContent = '✅ 接続成功';
      statusEl.className = 'status connected';
      addLog('WebSocket 接続成功', '#51cf66');

      // オーバーレイデータを購読
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'overlay' }));
      addLog('overlay チャンネルを購読', '#51cf66');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'update') {
        // 通常の更新
        document.getElementById('focus').textContent = data.data.focus_min + ' 分';
        document.getElementById('xp').textContent = data.data.xp;
        document.getElementById('streak').textContent = data.data.streak + ' 日';
        document.getElementById('bpm_target').textContent = data.data.bpm_target;
        document.getElementById('pb_bpm').textContent = data.data.pb_bpm || '未設定';

        const pomodoroState = data.data.pomodoro.state === 'work' ? '練習中' : '休憩中';
        const remainingMin = Math.floor(data.data.pomodoro.remaining_sec / 60);
        const remainingSec = data.data.pomodoro.remaining_sec % 60;
        document.getElementById('pomodoro').textContent =
          \`\${pomodoroState} (\${remainingMin}:\${remainingSec.toString().padStart(2, '0')})\`;

        addLog(\`データ更新: フォーカス \${data.data.focus_min}分, XP \${data.data.xp}\`, '#aaa');

      } else if (data.type === 'pb_update') {
        // PB 更新イベント
        document.getElementById('pb_bpm').textContent = data.data.pb_bpm;
        document.querySelector('.data').classList.add('pb-flash');
        setTimeout(() => {
          document.querySelector('.data').classList.remove('pb-flash');
        }, 1000);
        addLog(\`🎉 PB 更新! \${data.data.pb_bpm} BPM\`, '#ffd700');

      } else if (data.type === 'quest_complete') {
        // クエスト達成イベント
        addLog(\`🏆 クエスト達成: \${data.data.title}\`, '#ff6b6b');
      }
    };

    ws.onerror = (error) => {
      addLog('エラー: ' + error.message, '#ff6b6b');
    };

    ws.onclose = () => {
      statusEl.textContent = '❌ 切断されました';
      statusEl.className = 'status disconnected';
      addLog('WebSocket 切断', '#ff6b6b');
    };
  </script>
</body>
</html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// WebSocket サーバーの作成
const wss = new WebSocket.Server({ server });

// 接続中のクライアント
const clients = new Set();

// 疑似データ（実際のアプリでは SQLite から取得）
let mockData = {
  focus_min: 0,
  xp: 0,
  streak: 5,
  bpm_target: 120,
  pb_bpm: 132,
  pomodoro: {
    state: 'work', // 'work' or 'break'
    remaining_sec: 1500, // 25分
  },
};

wss.on('connection', (ws) => {
  console.log('✅ クライアントが接続しました');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📩 受信:', data);

      if (data.type === 'subscribe' && data.channel === 'overlay') {
        console.log('   → overlay チャンネルを購読開始');
        // 初回データを送信
        ws.send(JSON.stringify({
          type: 'update',
          data: mockData,
        }));
      }
    } catch (error) {
      console.error('❌ メッセージ解析エラー:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('❌ クライアントが切断しました');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket エラー:', error.message);
  });
});

// 1秒ごとに更新イベントを送信（疑似データ）
setInterval(() => {
  // フォーカス時間とXPを増加
  mockData.focus_min += 1;
  mockData.xp += 10;

  // ポモドーロの残り時間を減少
  if (mockData.pomodoro.remaining_sec > 0) {
    mockData.pomodoro.remaining_sec -= 1;
  } else {
    // タイマー終了時に状態を切り替え
    if (mockData.pomodoro.state === 'work') {
      mockData.pomodoro.state = 'break';
      mockData.pomodoro.remaining_sec = 300; // 5分
      console.log('⏸️  休憩モードに切り替え');
    } else {
      mockData.pomodoro.state = 'work';
      mockData.pomodoro.remaining_sec = 1500; // 25分
      console.log('▶️  練習モードに切り替え');
    }
  }

  // 全クライアントに更新を送信
  const updateMessage = JSON.stringify({
    type: 'update',
    data: mockData,
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(updateMessage);
    }
  });

}, 1000);

// 10秒ごとに PB 更新イベントを送信（デモ用）
setInterval(() => {
  mockData.pb_bpm += 2;

  const pbMessage = JSON.stringify({
    type: 'pb_update',
    data: { pb_bpm: mockData.pb_bpm },
  });

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(pbMessage);
    }
  });

  console.log(`🎉 PB 更新イベント送信: ${mockData.pb_bpm} BPM`);
}, 10000);

// サーバー起動
server.listen(PORT, '127.0.0.1', () => {
  console.log('🚀 WebSocket サーバー起動');
  console.log(`📍 http://127.0.0.1:${PORT}`);
  console.log('---');
  console.log('ブラウザで http://127.0.0.1:3030 を開いてください');
  console.log('Ctrl+C で終了');
});
