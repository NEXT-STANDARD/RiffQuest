/**
 * OBS接続コンポーネント
 */

import { useState, useEffect } from 'react';
import './OBSConnection.css';

export function OBSConnection() {
  const [url, setUrl] = useState('ws://127.0.0.1:4455');
  const [password, setPassword] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [currentScene, setCurrentScene] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // OBSイベントリスナーをセットアップ
    window.riffquest.obs.onConnected((data) => {
      console.log('OBS接続成功:', data);
      setConnected(true);
      setConnecting(false);
      setError('');
    });

    window.riffquest.obs.onDisconnected(() => {
      console.log('OBS切断');
      setConnected(false);
      setCurrentScene('');
    });

    window.riffquest.obs.onError((err) => {
      console.error('OBSエラー:', err);
      setError(err.message);
      setConnecting(false);
    });

    window.riffquest.obs.onSceneChanged((sceneName) => {
      console.log('シーン変更:', sceneName);
      setCurrentScene(sceneName);
    });
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    try {
      const result = await window.riffquest.obs.connect(url, password || undefined);

      if (!result.success) {
        setError(result.error || '接続に失敗しました');
        setConnecting(false);
        return;
      }

      // 現在のシーンを取得
      const sceneResult = await window.riffquest.obs.getCurrentScene();
      if (sceneResult.success && sceneResult.sceneName) {
        setCurrentScene(sceneResult.sceneName);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '接続エラー');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.riffquest.obs.disconnect();
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
