/**
 * BPM検出ユーティリティ
 * WebAudio APIを使用してメトロノーム音からBPMを自動検出
 */

export class BPMDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private detectionInterval: number | null = null;
  private onBPMDetected: ((bpm: number) => void) | null = null;

  // ビート検出用
  private lastBeatTime: number = 0;
  private beatIntervals: number[] = [];
  private readonly maxIntervals = 8; // 平均化するビート間隔数
  private readonly minBPM = 40;
  private readonly maxBPM = 300;
  private readonly beatThreshold = 100; // 音量しきい値（0-255）
  private readonly minBeatInterval = 200; // 最小ビート間隔（ミリ秒）- 重複検出を防ぐ
  private lastVolume: number = 0;

  /**
   * マイク入力を開始してBPM検出を開始
   */
  async start(callback: (bpm: number) => void): Promise<void> {
    this.onBPMDetected = callback;

    try {
      // オーディオコンテキストを作成
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // マイク入力を取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });

      // アナライザーノードを作成
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.3; // より敏感に

      // マイク入力をアナライザーに接続
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // データ配列を初期化
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // ビート検出を開始
      this.detectBeats();

      console.log('[BPM Detector] 検出開始');
    } catch (error) {
      console.error('[BPM Detector] マイクアクセスエラー:', error);
      throw new Error('マイクへのアクセスが拒否されました');
    }
  }

  /**
   * BPM検出を停止
   */
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
    this.beatIntervals = [];
    this.lastBeatTime = 0;
    this.lastVolume = 0;

    console.log('[BPM Detector] 検出停止');
  }

  /**
   * ビート検出ループ
   */
  private detectBeats(): void {
    if (!this.analyser || !this.dataArray) return;

    // 周波数データを取得
    this.analyser.getByteFrequencyData(this.dataArray);

    // 全周波数帯域の平均音量を計算（メトロノームは広範囲の周波数を持つ）
    let totalVolume = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      totalVolume += this.dataArray[i];
    }
    const volume = totalVolume / this.dataArray.length;

    // デバッグ: 音量をログ出力（最初の5秒間のみ）
    if (Date.now() - this.lastBeatTime < 5000 || this.beatIntervals.length === 0) {
      if (Math.random() < 0.01) { // 1%の確率でログ出力
        console.log('[BPM Detector] 音量:', Math.round(volume), '/ しきい値:', this.beatThreshold);
      }
    }

    const now = Date.now();

    // ビート検出: 音量が上がった瞬間（エッジ検出）
    const isOnset = volume > this.beatThreshold && this.lastVolume <= this.beatThreshold;

    if (isOnset) {
      const timeSinceLastBeat = now - this.lastBeatTime;

      // 最小間隔チェック（重複検出を防ぐ）
      if (timeSinceLastBeat >= this.minBeatInterval) {
        console.log('[BPM Detector] ビート検出！ 間隔:', timeSinceLastBeat, 'ms');

        // 有効なBPM範囲内のビート間隔のみ記録
        const bpm = 60000 / timeSinceLastBeat;
        if (bpm >= this.minBPM && bpm <= this.maxBPM) {
          this.beatIntervals.push(timeSinceLastBeat);

          // 古い間隔を削除
          if (this.beatIntervals.length > this.maxIntervals) {
            this.beatIntervals.shift();
          }

          // BPMを計算して通知
          if (this.beatIntervals.length >= 3) { // 3ビートから計算開始
            const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
            const detectedBPM = Math.round(60000 / avgInterval);

            console.log('[BPM Detector] BPM計算:', detectedBPM, '（', this.beatIntervals.length, 'ビートから）');

            if (this.onBPMDetected) {
              this.onBPMDetected(detectedBPM);
            }
          }
        } else {
          console.log('[BPM Detector] 範囲外BPM:', Math.round(bpm));
        }

        this.lastBeatTime = now;
      }
    }

    this.lastVolume = volume;

    // 次のフレームで再度検出
    this.detectionInterval = requestAnimationFrame(() => this.detectBeats());
  }

  /**
   * 現在のBPMを取得（平均値）
   */
  getCurrentBPM(): number | null {
    if (this.beatIntervals.length < 4) return null;

    const avgInterval = this.beatIntervals.reduce((a, b) => a + b, 0) / this.beatIntervals.length;
    return Math.round(60000 / avgInterval);
  }

  /**
   * 検出状態をリセット
   */
  reset(): void {
    this.beatIntervals = [];
    this.lastBeatTime = 0;
    this.lastVolume = 0;
    console.log('[BPM Detector] リセット');
  }
}
