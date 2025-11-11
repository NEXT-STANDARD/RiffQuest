/**
 * ギターチューナーコンポーネント
 * リアルタイムで音程を検出してチューニングをサポート
 */

import { useState, useEffect, useRef } from 'react';
import { PitchDetector, PitchResult } from '../../utils/pitchDetector';
import './GuitarTuner.css';

export function GuitarTuner() {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [currentPitch, setCurrentPitch] = useState<PitchResult | null>(null);
  const [selectedTuning, setSelectedTuning] = useState<string>('standard');
  const detectorRef = useRef<PitchDetector | null>(null);

  // 選択されたチューニングプリセットを取得
  const currentTuning = PitchDetector.TUNING_PRESETS.find(
    (preset) => preset.id === selectedTuning
  );
  const guitarNotes = currentTuning?.strings || [];

  useEffect(() => {
    loadAudioDevices();

    return () => {
      stopTuner();
    };
  }, []);

  const loadAudioDevices = async () => {
    try {
      const audioDevices = await PitchDetector.getAudioDevices();
      setDevices(audioDevices);
      if (audioDevices.length > 0) {
        setSelectedDevice(audioDevices[0].deviceId);
      }
    } catch (err: any) {
      console.error('[Tuner] デバイス取得エラー:', err);
      setError('オーディオデバイスの取得に失敗しました');
    }
  };

  const startTuner = async () => {
    try {
      setError(null);
      console.log('[Tuner] チューナー起動中...', selectedDevice);

      const detector = new PitchDetector();
      detectorRef.current = detector;

      await detector.start((result: PitchResult | null) => {
        setCurrentPitch(result);
      }, selectedDevice || undefined);

      setIsActive(true);
      console.log('[Tuner] チューナー起動成功');
    } catch (err: any) {
      setError('チューナーの起動に失敗しました: ' + err.message);
      console.error('[Tuner] エラー:', err);
    }
  };

  const stopTuner = () => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      detectorRef.current = null;
    }
    setIsActive(false);
    setCurrentPitch(null);
    console.log('[Tuner] チューナー停止');
  };

  const getTuningStatus = (): 'perfect' | 'close' | 'far' | 'none' => {
    if (!currentPitch) return 'none';
    const cents = Math.abs(currentPitch.cents);
    if (cents <= 5) return 'perfect';
    if (cents <= 15) return 'close';
    return 'far';
  };

  const getTuningDirection = (): 'low' | 'high' | 'perfect' => {
    if (!currentPitch) return 'perfect';
    if (currentPitch.cents < -5) return 'low';
    if (currentPitch.cents > 5) return 'high';
    return 'perfect';
  };

  return (
    <div className="guitar-tuner">
      <div className="tuner-header">
        <h2>🎸 ギターチューナー</h2>
        <p>ギターの音を聞いて自動的にチューニングをサポートします</p>
      </div>

      <div className="tuner-display">
        <div className={`pitch-indicator ${getTuningStatus()}`}>
          {currentPitch ? (
            <>
              <div className="note-display">
                {currentPitch.note}
                <span className="octave">{currentPitch.octave}</span>
              </div>
              <div className="frequency">
                {currentPitch.frequency.toFixed(1)} Hz
              </div>
            </>
          ) : (
            <div className="waiting">
              {isActive ? '弦を弾いてください' : '---'}
            </div>
          )}
        </div>

        {currentPitch && (
          <div className="tuning-meter">
            <div className="meter-labels">
              <span>♭</span>
              <span>♮</span>
              <span>♯</span>
            </div>
            <div className="meter-bar">
              <div
                className={`meter-indicator ${getTuningStatus()}`}
                style={{
                  left: `${50 + currentPitch.cents}%`,
                }}
              />
              <div className="meter-center" />
            </div>
            <div className="cents-display">
              {currentPitch.cents > 0 ? '+' : ''}
              {currentPitch.cents} cents
            </div>
            <div className={`tuning-message ${getTuningDirection()}`}>
              {getTuningDirection() === 'low' && '⬆ もっと高く (締める)'}
              {getTuningDirection() === 'high' && '⬇ もっと低く (緩める)'}
              {getTuningDirection() === 'perfect' && '✓ 完璧にチューニングされています！'}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="tuner-error">
          ⚠️ {error}
        </div>
      )}

      {!isActive && (
        <>
          <div className="device-selector">
            <label htmlFor="tuning-preset">チューニング:</label>
            <select
              id="tuning-preset"
              value={selectedTuning}
              onChange={(e) => setSelectedTuning(e.target.value)}
            >
              {PitchDetector.TUNING_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {devices.length > 0 && (
            <div className="device-selector">
              <label htmlFor="tuner-device">オーディオ入力デバイス:</label>
              <select
                id="tuner-device"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `デバイス ${device.deviceId.substring(0, 8)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      <div className="tuner-controls">
        {!isActive ? (
          <button onClick={startTuner} className="btn-start">
            🎸 チューナー起動
          </button>
        ) : (
          <button onClick={stopTuner} className="btn-stop">
            ⏹️ 停止
          </button>
        )}
      </div>

      <div className="guitar-reference">
        <h3>{currentTuning?.name || 'チューニング'}</h3>
        <div className="strings-grid">
          {guitarNotes.map((item) => (
            <div key={item.string} className="string-card">
              <div className="string-number">{item.string}弦</div>
              <div className="string-note">
                {item.note}
                <span className="string-octave">{item.octave}</span>
              </div>
              <div className="string-freq">{item.frequency.toFixed(2)} Hz</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tuner-info">
        <h3>💡 使い方</h3>
        <ol>
          <li>使用するチューニングを選択</li>
          <li>使用するオーディオデバイス（AG03など）を選択</li>
          <li>「チューナー起動」ボタンをクリック</li>
          <li>ギターの弦を1本ずつ弾く</li>
          <li>メーターを見ながらペグを回して調整</li>
          <li>中央(♮)に合えばOK！</li>
        </ol>
      </div>

      <div className="tuning-guide">
        <h3>🎵 チューニングガイド</h3>
        <div className="tuning-list">
          <div className="tuning-item">
            <div className="tuning-name">標準 (E-A-D-G-B-E)</div>
            <div className="tuning-desc">
              最も一般的なチューニング。ほとんどの楽曲で使用されます。
            </div>
          </div>

          <div className="tuning-item">
            <div className="tuning-name">ドロップD (D-A-D-G-B-E)</div>
            <div className="tuning-desc">
              6弦のみ1音下げ。パワーコードが押さえやすく、ロック/メタルで人気。
              代表曲: Foo Fighters「Everlong」、Nirvana「Heart-Shaped Box」
            </div>
          </div>

          <div className="tuning-item">
            <div className="tuning-name">ドロップC (C-G-C-F-A-D)</div>
            <div className="tuning-desc">
              より低音のヘビーサウンド。メタルコアやモダンメタルで定番。
              代表曲: Bullet For My Valentine「Tears Don't Fall」
            </div>
          </div>

          <div className="tuning-item">
            <div className="tuning-name">半音下げ (Eb-Ab-Db-Gb-Bb-Eb)</div>
            <div className="tuning-desc">
              全弦を半音下げ。ヴォーカルやソロに優しく、温かみのある音色。
              代表曲: Jimi Hendrix「Purple Haze」、Guns N' Roses「Sweet Child O' Mine」
            </div>
          </div>

          <div className="tuning-item">
            <div className="tuning-name">全音下げ (D-G-C-F-A-D)</div>
            <div className="tuning-desc">
              全弦を1音下げ。ダークで重厚なトーン。ハードロックで人気。
              代表曲: Alice In Chains「Man in the Box」
            </div>
          </div>

          <div className="tuning-item">
            <div className="tuning-name">オープンD (D-A-D-F#-A-D)</div>
            <div className="tuning-desc">
              開放弦でDメジャーコード。スライドギターに最適。
              代表曲: Joni Mitchell「Big Yellow Taxi」
            </div>
          </div>

          <div className="tuning-item">
            <div className="tuning-name">オープンG (D-G-D-G-B-D)</div>
            <div className="tuning-desc">
              開放弦でGメジャーコード。ブルース/ロックの定番。
              代表曲: The Rolling Stones「Start Me Up」、Led Zeppelin「Dancing Days」
            </div>
          </div>

          <div className="tuning-item">
            <div className="tuning-name">オープンA (E-A-E-A-C#-E)</div>
            <div className="tuning-desc">
              開放弦でAメジャーコード。スライドギター向け。
              代表曲: Derek and the Dominos「Layla」
            </div>
          </div>

          <div className="tuning-item">
            <div className="tuning-name">DADGAD (D-A-D-G-A-D)</div>
            <div className="tuning-desc">
              ケルト音楽やフォークで人気。響きの美しいオープンチューニング。
              代表曲: Led Zeppelin「Kashmir」、Jimmy Page多数
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
