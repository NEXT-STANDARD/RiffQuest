/**
 * BPM検出コンポーネント
 * メトロノーム音を聴き取ってBPMを自動検出
 */

import { useState, useEffect, useRef } from 'react';
import { BPMDetector as BPMDetectorClass } from '../../utils/bpmDetector';
import { io, Socket } from 'socket.io-client';
import './BPMDetector.css';

const API_URL = 'http://localhost:3030';

export function BPMDetector() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [currentBPM, setCurrentBPM] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const detectorRef = useRef<BPMDetectorClass | null>(null);

  useEffect(() => {
    // Socket.io接続
    const newSocket = io(API_URL);
    setSocket(newSocket);

    return () => {
      newSocket.close();
      if (detectorRef.current) {
        detectorRef.current.stop();
      }
    };
  }, []);

  const startDetection = async () => {
    try {
      setError(null);
      const detector = new BPMDetectorClass();
      detectorRef.current = detector;

      await detector.start((bpm: number) => {
        setCurrentBPM(bpm);

        // サーバーにBPMを送信
        if (socket) {
          socket.emit('bpm:detected', { bpm });
        }
      });

      setIsDetecting(true);
    } catch (err: any) {
      setError(err.message || 'BPM検出の開始に失敗しました');
      console.error('[BPM Detector] エラー:', err);
    }
  };

  const stopDetection = () => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      detectorRef.current = null;
    }
    setIsDetecting(false);
    setCurrentBPM(null);
  };

  const resetDetection = () => {
    if (detectorRef.current) {
      detectorRef.current.reset();
      setCurrentBPM(null);
    }
  };

  return (
    <div className="bpm-detector">
      <div className="bpm-detector-header">
        <h2>🎵 BPM検出器</h2>
        <p>メトロノーム音を再生してBPMを自動検出します</p>
      </div>

      <div className="bpm-display">
        <div className="bpm-value" style={{
          color: currentBPM ? '#fbbf24' : '#94a3b8',
          animation: isDetecting ? 'pulse 1.5s ease-in-out infinite' : 'none'
        }}>
          {currentBPM || '---'}
        </div>
        <div className="bpm-label">BPM</div>
      </div>

      {error && (
        <div className="bpm-error">
          ⚠️ {error}
        </div>
      )}

      <div className="bpm-instructions">
        {!isDetecting ? (
          <>
            <p>✓ マイクへのアクセスを許可してください</p>
            <p>✓ メトロノームを再生してください</p>
            <p>✓ 安定したBPMが検出されるまで数秒かかります</p>
          </>
        ) : (
          <>
            <p className="detecting-status">
              <span className="status-dot"></span>
              検出中... メトロノームが聴こえています
            </p>
            <p>検出範囲: 40-300 BPM</p>
          </>
        )}
      </div>

      <div className="bpm-controls">
        {!isDetecting ? (
          <button onClick={startDetection} className="btn-start">
            🎤 検出開始
          </button>
        ) : (
          <>
            <button onClick={resetDetection} className="btn-reset">
              🔄 リセット
            </button>
            <button onClick={stopDetection} className="btn-stop">
              ⏹️ 停止
            </button>
          </>
        )}
      </div>

      <div className="bpm-info">
        <h3>💡 使い方</h3>
        <ol>
          <li>「検出開始」ボタンをクリック</li>
          <li>マイクへのアクセスを許可</li>
          <li>別タブでメトロノームを再生（例: <a href="https://www.google.com/search?q=metronome" target="_blank" rel="noopener noreferrer">Google メトロノーム</a>）</li>
          <li>検出されたBPMがオーバーレイに自動表示されます</li>
        </ol>
      </div>
    </div>
  );
}
