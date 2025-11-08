/**
 * カメラ映像表示コンポーネント
 * 練習中の自分の映像をリアルタイムで表示
 */

import { useState, useEffect, useRef } from 'react';
import './CameraView.css';

export function CameraView() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadCameraDevices();

    return () => {
      stopCamera();
    };
  }, []);

  const loadCameraDevices = async () => {
    try {
      // カメラ権限を取得
      await navigator.mediaDevices.getUserMedia({ video: true });

      // デバイス一覧を取得
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(device => device.kind === 'videoinput');

      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }

      console.log('[Camera] カメラデバイス:', videoDevices);
    } catch (err: any) {
      console.error('[Camera] デバイス取得エラー:', err);
      setError('カメラへのアクセスが拒否されました');
    }
  };

  const startCamera = async () => {
    try {
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: selectedDevice
          ? {
              deviceId: { exact: selectedDevice },
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }
      };

      console.log('[Camera] カメラ起動中...', selectedDevice);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        console.log('[Camera] カメラ起動成功');
      }
    } catch (err: any) {
      console.error('[Camera] 起動エラー:', err);
      setError('カメラの起動に失敗しました: ' + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    console.log('[Camera] カメラ停止');
  };

  return (
    <div className="camera-view">
      <div className="camera-header">
        <h2>📹 カメラ映像</h2>
        <p>練習中の自分の姿を確認できます</p>
      </div>

      <div className="camera-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`camera-video ${isActive ? 'active' : ''}`}
        />
        {!isActive && (
          <div className="camera-placeholder">
            <div className="placeholder-icon">📹</div>
            <p>カメラをオンにして映像を表示</p>
          </div>
        )}
      </div>

      {error && (
        <div className="camera-error">
          ⚠️ {error}
        </div>
      )}

      {!isActive && devices.length > 0 && (
        <div className="camera-device-selector">
          <label htmlFor="camera-device">カメラデバイス:</label>
          <select
            id="camera-device"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `カメラ ${device.deviceId.substring(0, 8)}...`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="camera-controls">
        {!isActive ? (
          <button onClick={startCamera} className="btn-start">
            📹 カメラをオン
          </button>
        ) : (
          <button onClick={stopCamera} className="btn-stop">
            ⏹️ カメラをオフ
          </button>
        )}
      </div>

      <div className="camera-info">
        <h3>💡 使い方</h3>
        <ul>
          <li>使用するカメラを選択してください</li>
          <li>「カメラをオン」ボタンをクリック</li>
          <li>カメラへのアクセスを許可</li>
          <li>練習中の姿勢やフォームを確認できます</li>
        </ul>
      </div>
    </div>
  );
}
