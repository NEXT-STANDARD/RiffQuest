/**
 * OBS接続コンポーネント (Web版)
 * REST API + Socket.io通信
 */

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './OBSConnection.css';

const API_URL = 'http://localhost:3030';

export function OBSConnection() {
  const [url, setUrl] = useState('ws://127.0.0.1:4455');
  const [password, setPassword] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [currentScene, setCurrentScene] = useState('');
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Socket.io接続
    const newSocket = io(API_URL);

    newSocket.on('connect', () => {
      console.log('[Socket.io] サーバーに接続しました');
    });

    newSocket.on('obs:status', (data) => {
      console.log('[Socket.io] OBS状態:', data);
      setConnected(data.connected);
    });

    newSocket.on('obs:connected', (data) => {
      console.log('[Socket.io] OBS接続成功:', data);
      setConnected(true);
      setConnecting(false);
      setError('');
    });

    newSocket.on('obs:disconnected', () => {
      console.log('[Socket.io] OBS切断');
      setConnected(false);
      setCurrentScene('');
    });

    newSocket.on('obs:error', (err) => {
      console.error('[Socket.io] OBSエラー:', err);
      setError(err.message);
      setConnecting(false);
    });

    newSocket.on('obs:scene-changed', (sceneName) => {
      console.log('[Socket.io] シーン変更:', sceneName);
      setCurrentScene(sceneName);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/obs/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, password: password || undefined }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || '接続に失敗しました');
        setConnecting(false);
        return;
      }

      // 現在のシーンを取得
      const sceneResponse = await fetch(`${API_URL}/api/obs/current-scene`);
      const sceneResult = await sceneResponse.json();

      if (sceneResult.success) {
        setCurrentScene(sceneResult.sceneName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '接続エラー');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${API_URL}/api/obs/disconnect`, {
        method: 'POST',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '切断エラー');
    }
  };

  return (
    <div className="obs-connection">
      <h2>OBS Studio 接続</h2>

      {!connected ? (
        <div className="connection-form">
          <div className="form-group">
            <label htmlFor="obs-url">WebSocket URL</label>
            <input
              id="obs-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="ws://127.0.0.1:4455"
              disabled={connecting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="obs-password">パスワード (オプション)</label>
            <input
              id="obs-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              disabled={connecting}
            />
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting || !url}
            className="connect-button"
          >
            {connecting ? '接続中...' : '接続'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="connection-status">
          <div className="status-indicator connected">
            <span className="status-dot"></span>
            接続済み
          </div>

          <div className="scene-info">
            <strong>現在のシーン:</strong>
            <span className="scene-name">{currentScene || '取得中...'}</span>
          </div>

          <button onClick={handleDisconnect} className="disconnect-button">
            切断
          </button>
        </div>
      )}
    </div>
  );
}
