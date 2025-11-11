/**
 * メトロノームコンポーネント
 * BPM設定、拍子設定、アクセント音、タップテンポ機能
 */

import { useState, useEffect, useRef } from 'react';
import './Metronome.css';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [volume, setVolume] = useState(0.5);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const schedulerIdRef = useRef<number | null>(null);
  const beatCounterRef = useRef(0);

  // 拍子の設定を取得
  const getBeatsPerMeasure = (): number => {
    const [beats] = timeSignature.split('/');
    return parseInt(beats);
  };

  // メトロノーム音を生成
  const playClick = (time: number, isAccent: boolean) => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // アクセント音は高く、通常の音は低く
    oscillator.frequency.value = isAccent ? 1000 : 800;
    gainNode.gain.value = volume * (isAccent ? 1.0 : 0.6);

    oscillator.start(time);
    oscillator.stop(time + 0.05);
  };

  // スケジューラー: 次の音をスケジュール
  const scheduler = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const scheduleAheadTime = 0.1; // 100ms先までスケジュール

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const beatsPerMeasure = getBeatsPerMeasure();
      const isAccent = beatCounterRef.current % beatsPerMeasure === 0;

      playClick(nextNoteTimeRef.current, isAccent);

      // UIの更新をメインスレッドで実行
      const currentBeatForUI = (beatCounterRef.current % beatsPerMeasure) + 1;
      setTimeout(() => setCurrentBeat(currentBeatForUI), (nextNoteTimeRef.current - ctx.currentTime) * 1000);

      // 次の音のタイミングを計算
      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;
      beatCounterRef.current++;
    }
  };

  // メトロノーム開始
  const startMetronome = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    beatCounterRef.current = 0;
    nextNoteTimeRef.current = audioContextRef.current.currentTime;
    setIsPlaying(true);

    // スケジューラーを定期実行
    const scheduleInterval = setInterval(scheduler, 25); // 25msごとにチェック
    schedulerIdRef.current = scheduleInterval as unknown as number;
  };

  // メトロノーム停止
  const stopMetronome = () => {
    setIsPlaying(false);
    setCurrentBeat(0);

    if (schedulerIdRef.current !== null) {
      clearInterval(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }
  };

  // タップテンポ機能
  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4); // 最新4回分を保持
    setTapTimes(newTapTimes);

    if (newTapTimes.length >= 2) {
      // 平均間隔を計算
      const intervals: number[] = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);

      // 妥当な範囲（40-240 BPM）でBPMを設定
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
      }
    }
  };

  // タップテンポのリセット（3秒間タップがなければリセット）
  useEffect(() => {
    if (tapTimes.length === 0) return;

    const timeout = setTimeout(() => {
      setTapTimes([]);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [tapTimes]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (schedulerIdRef.current !== null) {
        clearInterval(schedulerIdRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const beatsPerMeasure = getBeatsPerMeasure();

  return (
    <div className="metronome">
      <div className="metronome-header">
        <h2>🎵 メトロノーム</h2>
        <p>リズム感を鍛えるための必須ツール</p>
      </div>

      <div className="metronome-main">
        <div className="bpm-display">
          <div className="bpm-value">{bpm}</div>
          <div className="bpm-label">BPM</div>
        </div>

        <div className="beat-indicator">
          <div className="beats-container">
            {Array.from({ length: beatsPerMeasure }, (_, i) => (
              <div
                key={i}
                className={`beat-dot ${currentBeat === i + 1 ? 'active' : ''} ${i === 0 ? 'accent' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <div className="beat-label">
            {currentBeat > 0 ? `${currentBeat} / ${beatsPerMeasure}` : '---'}
          </div>
        </div>

        <div className="bpm-controls">
          <button
            className="bpm-btn decrease"
            onClick={() => setBpm(Math.max(40, bpm - 1))}
          >
            -1
          </button>
          <button
            className="bpm-btn decrease-large"
            onClick={() => setBpm(Math.max(40, bpm - 10))}
          >
            -10
          </button>
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="bpm-slider"
          />
          <button
            className="bpm-btn increase-large"
            onClick={() => setBpm(Math.min(240, bpm + 10))}
          >
            +10
          </button>
          <button
            className="bpm-btn increase"
            onClick={() => setBpm(Math.min(240, bpm + 1))}
          >
            +1
          </button>
        </div>

        <div className="control-buttons">
          {!isPlaying ? (
            <button onClick={startMetronome} className="btn-play">
              ▶️ 再生
            </button>
          ) : (
            <button onClick={stopMetronome} className="btn-stop">
              ⏸️ 停止
            </button>
          )}
          <button onClick={handleTapTempo} className="btn-tap">
            👆 タップテンポ
          </button>
        </div>
      </div>

      <div className="metronome-settings">
        <div className="setting-group">
          <label htmlFor="time-signature">拍子:</label>
          <select
            id="time-signature"
            value={timeSignature}
            onChange={(e) => {
              setTimeSignature(e.target.value);
              setCurrentBeat(0);
            }}
            disabled={isPlaying}
          >
            <option value="2/4">2/4 (2拍子)</option>
            <option value="3/4">3/4 (3拍子 - ワルツ)</option>
            <option value="4/4">4/4 (4拍子 - 標準)</option>
            <option value="5/4">5/4 (5拍子)</option>
            <option value="6/8">6/8 (6拍子)</option>
            <option value="7/8">7/8 (7拍子)</option>
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="volume">音量:</label>
          <input
            type="range"
            id="volume"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>
      </div>

      <div className="metronome-presets">
        <h3>BPMプリセット</h3>
        <div className="preset-buttons">
          <button onClick={() => setBpm(60)} className="preset-btn">
            60 - 超ゆっくり
          </button>
          <button onClick={() => setBpm(80)} className="preset-btn">
            80 - ゆっくり
          </button>
          <button onClick={() => setBpm(100)} className="preset-btn">
            100 - 練習用
          </button>
          <button onClick={() => setBpm(120)} className="preset-btn">
            120 - 標準
          </button>
          <button onClick={() => setBpm(140)} className="preset-btn">
            140 - やや速い
          </button>
          <button onClick={() => setBpm(160)} className="preset-btn">
            160 - 速い
          </button>
          <button onClick={() => setBpm(180)} className="preset-btn">
            180 - 非常に速い
          </button>
        </div>
      </div>

      <div className="metronome-info">
        <h3>💡 使い方</h3>
        <ul>
          <li>スライダーまたは±ボタンでBPMを調整</li>
          <li>「タップテンポ」ボタンを連続でタップしてBPMを設定</li>
          <li>拍子を選択（再生中は変更不可）</li>
          <li>1拍目はアクセント音（高い音）で鳴ります</li>
          <li>ゆっくりから始めて徐々にBPMを上げましょう</li>
        </ul>
      </div>

      <div className="practice-tips">
        <h3>🎯 練習のコツ</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>ステップ1: ゆっくりから</h4>
            <p>目標テンポの50-60%から始めましょう。正確さが最優先です。</p>
          </div>
          <div className="tip-card">
            <h4>ステップ2: 段階的に上げる</h4>
            <p>完璧に弾けたら5-10 BPM上げます。焦らず確実に。</p>
          </div>
          <div className="tip-card">
            <h4>ステップ3: 裏拍を意識</h4>
            <p>クリック音の間（裏拍）を意識して弾くとリズム感が向上します。</p>
          </div>
          <div className="tip-card">
            <h4>ステップ4: 目を閉じて</h4>
            <p>慣れてきたら目を閉じて弾く練習。リズムを体で覚えましょう。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
