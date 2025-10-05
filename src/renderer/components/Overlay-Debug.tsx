/**
 * OBS オーバーレイコンポーネント（デバッグモード）
 * 常に表示、接続状態を確認可能
 */

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './Overlay.css';

const API_URL = 'http://localhost:3030';

export function Overlay() {
  const [currentScene, setCurrentScene] = useState('待機中...');
  const [sessionTime, setSessionTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [connected, setConnected] = useState(false);

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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <div className="stat-label">練習時間</div>
          <div className="stat-value">{formatTime(sessionTime)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Socket.io</div>
          <div className="stat-value" style={{ fontSize: '14px' }}>
            {connected ? '✅ 接続' : '❌ 切断'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">状態</div>
          <div className="stat-value" style={{ fontSize: '14px' }}>
            {isActive ? '録音中' : '待機'}
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
