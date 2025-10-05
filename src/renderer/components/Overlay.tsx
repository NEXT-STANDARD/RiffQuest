/**
 * OBS オーバーレイコンポーネント
 * 透過背景で練習情報を表示
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
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log('[Overlay] 初期化開始');
    
    // Socket.io接続
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

      // Practiceシーンの場合はセッション開始
      if (sceneName.toLowerCase().includes('practice')) {
        setIsActive(true);
        console.log('[Overlay] セッション開始');
      } else {
        setIsActive(false);
        console.log('[Overlay] セッション停止');
      }
    });

    newSocket.on('obs:connected', () => {
      console.log('[Overlay] OBS接続');
    });

    newSocket.on('obs:status', (data) => {
      console.log('[Overlay] OBS状態:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // タイマー
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

  // 時間フォーマット
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // デバッグ: 常に表示（Practiceシーンでなくても）
  return (
    <div className="overlay">
      <div className="overlay-header">
        <div className="scene-badge" style={{ 
          background: isActive 
            ? 'linear-gradient(135deg, #646cff 0%, #747bff 100%)' 
            : 'linear-gradient(135deg, #666 0%, #888 100%)'
        }}>
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
            {connected ? '✅' : '❌'}
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
