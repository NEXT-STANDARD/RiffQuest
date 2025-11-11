/**
 * 音程検出ユーティリティ
 * 自己相関法(Autocorrelation)を使用してギターの音程を検出
 */

export interface PitchResult {
  frequency: number;
  note: string;
  octave: number;
  cents: number; // -50 ~ +50 (0が完全に合っている)
}

export interface TuningPreset {
  id: string;
  name: string;
  strings: Array<{ string: number; note: string; octave: number; frequency: number }>;
}

export class PitchDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Float32Array | null = null;
  private detectionInterval: number | null = null;
  private onPitchDetected: ((result: PitchResult | null) => void) | null = null;

  // チューニングプリセット
  public static readonly TUNING_PRESETS: TuningPreset[] = [
    {
      id: 'standard',
      name: '標準 (E-A-D-G-B-E)',
      strings: [
        { string: 6, note: 'E', octave: 2, frequency: 82.41 },
        { string: 5, note: 'A', octave: 2, frequency: 110.00 },
        { string: 4, note: 'D', octave: 3, frequency: 146.83 },
        { string: 3, note: 'G', octave: 3, frequency: 196.00 },
        { string: 2, note: 'B', octave: 3, frequency: 246.94 },
        { string: 1, note: 'E', octave: 4, frequency: 329.63 },
      ],
    },
    {
      id: 'drop-d',
      name: 'ドロップD (D-A-D-G-B-E)',
      strings: [
        { string: 6, note: 'D', octave: 2, frequency: 73.42 },
        { string: 5, note: 'A', octave: 2, frequency: 110.00 },
        { string: 4, note: 'D', octave: 3, frequency: 146.83 },
        { string: 3, note: 'G', octave: 3, frequency: 196.00 },
        { string: 2, note: 'B', octave: 3, frequency: 246.94 },
        { string: 1, note: 'E', octave: 4, frequency: 329.63 },
      ],
    },
    {
      id: 'drop-c',
      name: 'ドロップC (C-G-C-F-A-D)',
      strings: [
        { string: 6, note: 'C', octave: 2, frequency: 65.41 },
        { string: 5, note: 'G', octave: 2, frequency: 98.00 },
        { string: 4, note: 'C', octave: 3, frequency: 130.81 },
        { string: 3, note: 'F', octave: 3, frequency: 174.61 },
        { string: 2, note: 'A', octave: 3, frequency: 220.00 },
        { string: 1, note: 'D', octave: 4, frequency: 293.66 },
      ],
    },
    {
      id: 'half-step-down',
      name: '半音下げ (Eb-Ab-Db-Gb-Bb-Eb)',
      strings: [
        { string: 6, note: 'D#', octave: 2, frequency: 77.78 },
        { string: 5, note: 'G#', octave: 2, frequency: 103.83 },
        { string: 4, note: 'C#', octave: 3, frequency: 138.59 },
        { string: 3, note: 'F#', octave: 3, frequency: 185.00 },
        { string: 2, note: 'A#', octave: 3, frequency: 233.08 },
        { string: 1, note: 'D#', octave: 4, frequency: 311.13 },
      ],
    },
    {
      id: 'whole-step-down',
      name: '全音下げ (D-G-C-F-A-D)',
      strings: [
        { string: 6, note: 'D', octave: 2, frequency: 73.42 },
        { string: 5, note: 'G', octave: 2, frequency: 98.00 },
        { string: 4, note: 'C', octave: 3, frequency: 130.81 },
        { string: 3, note: 'F', octave: 3, frequency: 174.61 },
        { string: 2, note: 'A', octave: 3, frequency: 220.00 },
        { string: 1, note: 'D', octave: 4, frequency: 293.66 },
      ],
    },
    {
      id: 'open-d',
      name: 'オープンD (D-A-D-F#-A-D)',
      strings: [
        { string: 6, note: 'D', octave: 2, frequency: 73.42 },
        { string: 5, note: 'A', octave: 2, frequency: 110.00 },
        { string: 4, note: 'D', octave: 3, frequency: 146.83 },
        { string: 3, note: 'F#', octave: 3, frequency: 185.00 },
        { string: 2, note: 'A', octave: 3, frequency: 220.00 },
        { string: 1, note: 'D', octave: 4, frequency: 293.66 },
      ],
    },
    {
      id: 'open-g',
      name: 'オープンG (D-G-D-G-B-D)',
      strings: [
        { string: 6, note: 'D', octave: 2, frequency: 73.42 },
        { string: 5, note: 'G', octave: 2, frequency: 98.00 },
        { string: 4, note: 'D', octave: 3, frequency: 146.83 },
        { string: 3, note: 'G', octave: 3, frequency: 196.00 },
        { string: 2, note: 'B', octave: 3, frequency: 246.94 },
        { string: 1, note: 'D', octave: 4, frequency: 293.66 },
      ],
    },
    {
      id: 'open-a',
      name: 'オープンA (E-A-E-A-C#-E)',
      strings: [
        { string: 6, note: 'E', octave: 2, frequency: 82.41 },
        { string: 5, note: 'A', octave: 2, frequency: 110.00 },
        { string: 4, note: 'E', octave: 3, frequency: 164.81 },
        { string: 3, note: 'A', octave: 3, frequency: 220.00 },
        { string: 2, note: 'C#', octave: 4, frequency: 277.18 },
        { string: 1, note: 'E', octave: 4, frequency: 329.63 },
      ],
    },
    {
      id: 'dadgad',
      name: 'DADGAD (D-A-D-G-A-D)',
      strings: [
        { string: 6, note: 'D', octave: 2, frequency: 73.42 },
        { string: 5, note: 'A', octave: 2, frequency: 110.00 },
        { string: 4, note: 'D', octave: 3, frequency: 146.83 },
        { string: 3, note: 'G', octave: 3, frequency: 196.00 },
        { string: 2, note: 'A', octave: 3, frequency: 220.00 },
        { string: 1, note: 'D', octave: 4, frequency: 293.66 },
      ],
    },
  ];

  // すべての音階 (A0 ~ C8)
  private readonly allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  async start(callback: (result: PitchResult | null) => void, deviceId?: string): Promise<void> {
    this.onPitchDetected = callback;

    try {
      // オーディオコンテキストを作成
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // マイク入力を取得
      const constraints: MediaStreamConstraints = {
        audio: deviceId
          ? {
              deviceId: { exact: deviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          : {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
      };

      console.log('[Pitch Detector] マイク取得中...', deviceId ? `デバイスID: ${deviceId}` : 'デフォルトデバイス');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // アナライザーノードを作成
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 4096; // より高い精度
      this.analyser.smoothingTimeConstant = 0.8;

      // マイク入力をアナライザーに接続
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // データ配列を初期化
      const bufferLength = this.analyser.fftSize;
      this.dataArray = new Float32Array(bufferLength);

      // 音程検出を開始
      this.detectPitch();

      console.log('[Pitch Detector] 検出開始');
    } catch (error) {
      console.error('[Pitch Detector] マイクアクセスエラー:', error);
      throw new Error('マイクへのアクセスが拒否されました');
    }
  }

  stop(): void {
    if (this.detectionInterval) {
      cancelAnimationFrame(this.detectionInterval);
      this.detectionInterval = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.dataArray = null;

    console.log('[Pitch Detector] 検出停止');
  }

  private detectPitch(): void {
    if (!this.analyser || !this.dataArray || !this.audioContext) return;

    // 時間領域データを取得
    this.analyser.getFloatTimeDomainData(this.dataArray);

    // 自己相関法で周波数を検出
    const frequency = this.autoCorrelate(this.dataArray, this.audioContext.sampleRate);

    let result: PitchResult | null = null;

    if (frequency > 0) {
      // 周波数から音名を計算
      const noteInfo = this.frequencyToNote(frequency);
      result = noteInfo;
    }

    if (this.onPitchDetected) {
      this.onPitchDetected(result);
    }

    // 次のフレームで再度検出
    this.detectionInterval = requestAnimationFrame(() => this.detectPitch());
  }

  /**
   * 自己相関法で基本周波数を検出
   */
  private autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    // RMS (Root Mean Square) を計算して音量をチェック
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);

    // 音量が小さすぎる場合は検出しない
    if (rms < 0.01) return -1;

    // 自己相関を計算
    const correlations = new Array(buffer.length);
    for (let lag = 0; lag < buffer.length; lag++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length - lag; i++) {
        correlation += buffer[i] * buffer[i + lag];
      }
      correlations[lag] = correlation;
    }

    // 最初のピークを見つける
    let minLag = Math.floor(sampleRate / 1000); // 最小周波数 1000Hz
    let maxLag = Math.floor(sampleRate / 80);   // 最大周波数 80Hz (ギターE2より低い)

    let bestCorrelation = 0;
    let bestLag = -1;

    for (let lag = minLag; lag < maxLag; lag++) {
      if (correlations[lag] > bestCorrelation) {
        bestCorrelation = correlations[lag];
        bestLag = lag;
      }
    }

    if (bestLag === -1) return -1;

    // 周波数を計算
    const frequency = sampleRate / bestLag;
    return frequency;
  }

  /**
   * 周波数から音名と音程のずれを計算
   */
  private frequencyToNote(frequency: number): PitchResult {
    // A4 (440Hz) を基準に半音単位で計算
    const A4 = 440;
    const semitones = 12 * Math.log2(frequency / A4);
    const noteNumber = Math.round(semitones) + 69; // MIDIノート番号 (A4 = 69)

    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    const note = this.allNotes[noteIndex];

    // セント (100分の1半音) で音程のずれを計算
    const targetFrequency = A4 * Math.pow(2, (noteNumber - 69) / 12);
    const cents = Math.floor(1200 * Math.log2(frequency / targetFrequency));

    return {
      frequency,
      note,
      octave,
      cents,
    };
  }

  /**
   * 利用可能なオーディオ入力デバイスを取得
   */
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((device) => device.kind === 'audioinput');
      console.log('[Pitch Detector] オーディオ入力デバイス:', audioInputs);
      return audioInputs;
    } catch (error) {
      console.error('[Pitch Detector] デバイス取得エラー:', error);
      throw new Error('オーディオデバイスの取得に失敗しました');
    }
  }

  /**
   * ギターの標準チューニングの音名を取得
   */
  getGuitarNotes() {
    return this.guitarNotes;
  }
}
