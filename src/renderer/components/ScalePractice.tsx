/**
 * スケール練習コンポーネント
 * ペンタトニックスケールやその他のスケールパターンを表示
 */

import { useState } from 'react';
import './ScalePractice.css';

interface FretNote {
  fret: number;
  isRoot: boolean;
}

interface StringPattern {
  string: string;
  frets: Array<FretNote | null>;
}

interface Scale {
  id: string;
  name: string;
  category: string;
  description: string;
  positions: Array<{
    position: number;
    name: string;
    pattern: StringPattern[];
  }>;
  licks: Array<{
    name: string;
    description: string;
    tab: string[];
    bpm: number;
  }>;
}

export function ScalePractice() {
  const [selectedScale, setSelectedScale] = useState<string>('pentatonic-minor');
  const [selectedPosition, setSelectedPosition] = useState<number>(0);

  const scales: Scale[] = [
    {
      id: 'pentatonic-minor',
      name: 'マイナーペンタトニックスケール',
      category: 'ペンタトニック',
      description: 'ロック・ブルース・ヘビーメタルで最も使われる5音スケール。攻撃的で力強いサウンド。',
      positions: [
        {
          position: 1,
          name: 'ポジション1 (ルートフォーム)',
          pattern: [
            { string: 'E', frets: [null, null, null, { fret: 5, isRoot: true }, null, null, { fret: 8, isRoot: false }] },
            { string: 'B', frets: [null, null, null, { fret: 5, isRoot: false }, null, null, { fret: 8, isRoot: false }] },
            { string: 'G', frets: [null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }, null] },
            { string: 'D', frets: [null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }, null] },
            { string: 'A', frets: [null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }, null] },
            { string: 'E', frets: [null, null, null, { fret: 5, isRoot: true }, null, null, { fret: 8, isRoot: false }] },
          ],
        },
        {
          position: 2,
          name: 'ポジション2',
          pattern: [
            { string: 'E', frets: [null, null, null, null, null, { fret: 8, isRoot: false }, null, { fret: 10, isRoot: false }] },
            { string: 'B', frets: [null, null, null, null, null, { fret: 8, isRoot: false }, null, { fret: 10, isRoot: false }] },
            { string: 'G', frets: [null, null, null, null, null, { fret: 7, isRoot: false }, null, { fret: 9, isRoot: false }] },
            { string: 'D', frets: [null, null, null, null, null, { fret: 7, isRoot: false }, null, null, { fret: 10, isRoot: true }] },
            { string: 'A', frets: [null, null, null, null, null, { fret: 7, isRoot: false }, null, null, { fret: 10, isRoot: false }] },
            { string: 'E', frets: [null, null, null, null, null, { fret: 8, isRoot: false }, null, { fret: 10, isRoot: false }] },
          ],
        },
        {
          position: 3,
          name: 'ポジション3',
          pattern: [
            { string: 'E', frets: [null, null, null, null, null, null, null, null, null, null, { fret: 12, isRoot: false }, null, null, { fret: 15, isRoot: true }] },
            { string: 'B', frets: [null, null, null, null, null, null, null, null, null, null, null, { fret: 13, isRoot: false }, null, { fret: 15, isRoot: false }] },
            { string: 'G', frets: [null, null, null, null, null, null, null, null, null, null, { fret: 12, isRoot: false }, null, { fret: 14, isRoot: false }] },
            { string: 'D', frets: [null, null, null, null, null, null, null, null, null, null, { fret: 12, isRoot: true }, null, { fret: 14, isRoot: false }] },
            { string: 'A', frets: [null, null, null, null, null, null, null, null, null, null, { fret: 12, isRoot: false }, null, { fret: 14, isRoot: false }] },
            { string: 'E', frets: [null, null, null, null, null, null, null, null, null, null, { fret: 12, isRoot: false }, null, null, { fret: 15, isRoot: true }] },
          ],
        },
      ],
      licks: [
        {
          name: 'クラシックロックリック',
          description: 'Led ZeppelinやDeep Purple風のフレーズ',
          tab: [
            'E|----------------------------------------8-5--------|',
            'B|------------------------------------8-------8-5----|',
            'G|--------------------------------7-5-------------7-5-|',
            'D|----------------------------7-5---------------------|',
            'A|------------------------7-5-------------------------|',
            'E|--------------------5-8-----------------------------|',
          ],
          bpm: 120,
        },
        {
          name: 'ブルースリック',
          description: 'チョーキングを使った定番フレーズ',
          tab: [
            'E|---------------------------------------------|',
            'B|--------------------8b10r8-5-----------------|',
            'G|----------------7-----------7-5--------------|',
            'D|------------7-5-----------------7-5----------|',
            'A|--------7-5-------------------------7-5------|',
            'E|----5-8---------------------------------8-5--|',
          ],
          bpm: 90,
        },
        {
          name: 'スピードリック',
          description: 'オルタネイトピッキング練習用',
          tab: [
            'E|---------------------------------------------|',
            'B|---------------------------------------------|',
            'G|-----------------5-7-5-----------------------|',
            'D|-------------7-5-------7-5-------------------|',
            'A|---------7-5---------------7-5---------------|',
            'E|-----5-8-----------------------8-5-----------|',
          ],
          bpm: 140,
        },
      ],
    },
    {
      id: 'pentatonic-major',
      name: 'メジャーペンタトニックスケール',
      category: 'ペンタトニック',
      description: 'カントリー・ポップ・ロックで使われる明るい5音スケール。',
      positions: [
        {
          position: 1,
          name: 'ポジション1 (ルートフォーム)',
          pattern: [
            { string: 'E', frets: [null, null, null, null, { fret: 5, isRoot: true }, null, { fret: 7, isRoot: false }] },
            { string: 'B', frets: [null, null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }] },
            { string: 'G', frets: [null, null, null, { fret: 4, isRoot: false }, null, null, { fret: 7, isRoot: false }] },
            { string: 'D', frets: [null, null, null, { fret: 4, isRoot: false }, null, null, { fret: 7, isRoot: false }] },
            { string: 'A', frets: [null, null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }] },
            { string: 'E', frets: [null, null, null, null, { fret: 5, isRoot: true }, null, { fret: 7, isRoot: false }] },
          ],
        },
      ],
      licks: [
        {
          name: 'カントリーリック',
          description: 'チキンピッキング風フレーズ',
          tab: [
            'E|-----------------------------------------7-5-|',
            'B|-------------------------------------7-5-----|',
            'G|---------------------------------7-4---------|',
            'D|-----------------------------7-4-------------|',
            'A|-------------------------7-5-----------------|',
            'E|---------------------5-7---------------------|',
          ],
          bpm: 130,
        },
      ],
    },
    {
      id: 'blues-scale',
      name: 'ブルーススケール',
      category: 'ブルース',
      description: 'マイナーペンタトニックに♭5を加えた6音スケール。よりブルージーなサウンド。',
      positions: [
        {
          position: 1,
          name: 'ポジション1',
          pattern: [
            { string: 'E', frets: [null, null, null, null, { fret: 5, isRoot: true }, { fret: 6, isRoot: false }, { fret: 7, isRoot: false }, { fret: 8, isRoot: false }] },
            { string: 'B', frets: [null, null, null, null, { fret: 5, isRoot: false }, { fret: 6, isRoot: false }, { fret: 7, isRoot: false }, { fret: 8, isRoot: false }] },
            { string: 'G', frets: [null, null, null, null, { fret: 5, isRoot: false }, { fret: 6, isRoot: false }, { fret: 7, isRoot: false }] },
            { string: 'D', frets: [null, null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }] },
            { string: 'A', frets: [null, null, null, null, { fret: 5, isRoot: false }, { fret: 6, isRoot: false }, { fret: 7, isRoot: false }] },
            { string: 'E', frets: [null, null, null, null, { fret: 5, isRoot: true }, { fret: 6, isRoot: false }, { fret: 7, isRoot: false }, { fret: 8, isRoot: false }] },
          ],
        },
      ],
      licks: [
        {
          name: 'ブルースターンアラウンド',
          description: 'ブルース定番のターンアラウンドフレーズ',
          tab: [
            'E|-------------------------------------5-6-8-|',
            'B|-----------------------------5-6-8---------|',
            'G|---------------------5-6-7-----------------|',
            'D|-------------5---7-------------------------|',
            'A|-----5-7-8---------------------------------|',
            'E|-5-8---------------------------------------|',
          ],
          bpm: 80,
        },
      ],
    },
    {
      id: 'natural-minor',
      name: 'ナチュラルマイナースケール',
      category: 'メジャー・マイナー',
      description: '7音の基本的なマイナースケール。メロディックで表現豊か。',
      positions: [
        {
          position: 1,
          name: 'ポジション1 (3フレットスタート)',
          pattern: [
            { string: 'E', frets: [null, null, null, null, { fret: 5, isRoot: true }, null, { fret: 7, isRoot: false }, { fret: 8, isRoot: false }] },
            { string: 'B', frets: [null, null, null, null, { fret: 5, isRoot: false }, { fret: 6, isRoot: false }, null, { fret: 8, isRoot: false }] },
            { string: 'G', frets: [null, null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }] },
            { string: 'D', frets: [null, null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }] },
            { string: 'A', frets: [null, null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }, { fret: 8, isRoot: false }] },
            { string: 'E', frets: [null, null, null, null, { fret: 5, isRoot: true }, null, { fret: 7, isRoot: false }, { fret: 8, isRoot: false }] },
          ],
        },
      ],
      licks: [
        {
          name: 'クラシカルリック',
          description: 'Yngwie Malmsteen風ネオクラシカルフレーズ',
          tab: [
            'E|-----------------------------------------8-5-|',
            'B|-------------------------------------8-6-----|',
            'G|---------------------------------7-5---------|',
            'D|-----------------------------7-5-------------|',
            'A|-------------------------8-7-5---------------|',
            'E|---------------------8-7-5-------------------|',
          ],
          bpm: 160,
        },
      ],
    },
    {
      id: 'whole-tone',
      name: 'ホールトーンスケール',
      category: '挑戦的',
      description: '全音のみで構成される6音スケール。浮遊感のある不思議なサウンド。ジャズ・フュージョン・プログレで使用。',
      positions: [
        {
          position: 1,
          name: 'ポジション1 (Cホールトーン)',
          pattern: [
            { string: 'E', frets: [null, null, null, null, null, null, null, { fret: 8, isRoot: true }, null, { fret: 10, isRoot: false }, null, { fret: 12, isRoot: false }] },
            { string: 'B', frets: [null, null, null, null, null, { fret: 6, isRoot: false }, null, { fret: 8, isRoot: false }, null, { fret: 10, isRoot: false }, null, { fret: 12, isRoot: false }] },
            { string: 'G', frets: [null, null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }, null, { fret: 9, isRoot: false }, null, null, { fret: 12, isRoot: false }] },
            { string: 'D', frets: [null, null, null, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }, null, { fret: 9, isRoot: false }, null, null, { fret: 12, isRoot: false }] },
            { string: 'A', frets: [null, null, { fret: 3, isRoot: true }, null, { fret: 5, isRoot: false }, null, { fret: 7, isRoot: false }, null, { fret: 9, isRoot: false }, null, null, null] },
            { string: 'E', frets: [null, null, null, null, null, null, null, { fret: 8, isRoot: true }, null, { fret: 10, isRoot: false }, null, { fret: 12, isRoot: false }] },
          ],
        },
      ],
      licks: [
        {
          name: 'ホールトーンアルペジオ',
          description: 'Steve Vai / Allan Holdsworth風の浮遊感フレーズ',
          tab: [
            'E|-----------------------------------------12-10-8-|',
            'B|-------------------------------------12-10-8-----|',
            'G|---------------------------------12-9-7-5--------|',
            'D|-----------------------------12-9-7-5------------|',
            'A|-------------------------9-7-5-3-----------------|',
            'E|---------------------8-----------------------------|',
          ],
          bpm: 120,
        },
        {
          name: 'ホールトーンスウィープ',
          description: 'プログレッシブメタル風の挑戦的フレーズ',
          tab: [
            'E|-------------8-10-12-|',
            'B|---------8-10-12-----|',
            'G|-----7-9-12----------|',
            'D|-7-9-12--------------|',
            'A|-7-9-----------------|',
            'E|-8-------------------|',
          ],
          bpm: 100,
        },
      ],
    },
  ];

  const currentScale = scales.find((s) => s.id === selectedScale);
  const currentPosition = currentScale?.positions[selectedPosition];

  return (
    <div className="scale-practice">
      <div className="scale-header">
        <h2>🎸 スケール練習</h2>
        <p>ギターソロやアドリブに使える定番スケールとフレーズ集</p>
      </div>

      <div className="scale-selector">
        <label htmlFor="scale-select">スケール選択:</label>
        <select
          id="scale-select"
          value={selectedScale}
          onChange={(e) => {
            setSelectedScale(e.target.value);
            setSelectedPosition(0);
          }}
        >
          {scales.map((scale) => (
            <option key={scale.id} value={scale.id}>
              {scale.name} ({scale.category})
            </option>
          ))}
        </select>
      </div>

      {currentScale && (
        <>
          <div className="scale-info">
            <h3>{currentScale.name}</h3>
            <p className="scale-description">{currentScale.description}</p>
          </div>

          <div className="position-selector">
            <label>ポジション選択:</label>
            <div className="position-buttons">
              {currentScale.positions.map((pos, idx) => (
                <button
                  key={idx}
                  className={`position-btn ${selectedPosition === idx ? 'active' : ''}`}
                  onClick={() => setSelectedPosition(idx)}
                >
                  {pos.position}
                </button>
              ))}
            </div>
          </div>

          {currentPosition && (
            <div className="fretboard-container">
              <h4>{currentPosition.name}</h4>
              <div className="fretboard">
                <div className="fret-markers">
                  <span className="marker-label">フレット</span>
                  {Array.from({ length: 16 }, (_, i) => i).map((fret) => (
                    <div key={fret} className={`fret-marker ${fret === 3 || fret === 5 || fret === 7 || fret === 9 || fret === 12 || fret === 15 ? 'dot' : ''}`}>
                      {fret > 0 && (fret === 3 || fret === 5 || fret === 7 || fret === 9 || fret === 12 || fret === 15) && (
                        <span className="fret-number">{fret}</span>
                      )}
                    </div>
                  ))}
                </div>
                {currentPosition.pattern.map((stringPattern, idx) => (
                  <div key={idx} className="fretboard-string">
                    <span className="string-label">{stringPattern.string}</span>
                    <div className="fret-cells">
                      {stringPattern.frets.map((note, fretIdx) => (
                        <div key={fretIdx} className="fret-cell">
                          {note && (
                            <div className={`note-dot ${note.isRoot ? 'root' : 'scale'}`}>
                              <span className="fret-num">{note.fret}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="fretboard-legend">
                <div className="legend-item">
                  <div className="legend-dot root"></div>
                  <span>ルート音（R）</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot scale"></div>
                  <span>スケール音</span>
                </div>
              </div>
            </div>
          )}

          <div className="licks-section">
            <h3>🎼 参考フレーズ</h3>
            {currentScale.licks.map((lick, idx) => (
              <div key={idx} className="lick-card">
                <div className="lick-header">
                  <h4>{lick.name}</h4>
                  <span className="lick-bpm">♩ = {lick.bpm} BPM</span>
                </div>
                <p className="lick-description">{lick.description}</p>
                <div className="tab-display">
                  <div className="tab-header">
                    <span className="tab-instruction">
                      ↓ 上から1弦(高音E)、下が6弦(低音E) | 数字はフレット番号
                    </span>
                  </div>
                  {lick.tab.map((line, lineIdx) => {
                    const [string, notes] = line.split('|');
                    return (
                      <div key={lineIdx} className="tab-line-container">
                        <span className="tab-string-label">{string}</span>
                        <span className="tab-separator">|</span>
                        <pre className="tab-notes">{notes}</pre>
                      </div>
                    );
                  })}
                </div>
                <div className="lick-tips">
                  <strong>練習のヒント:</strong>
                  <ul>
                    <li>まずはゆっくり（半分のテンポ）から始める</li>
                    <li>メトロノームに合わせて正確に弾く</li>
                    <li>指板を見ないで弾けるまで繰り返す</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="practice-tips">
            <h3>💡 練習のポイント</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <h4>1. ポジションを覚える</h4>
                <p>各ポジションのパターンを指板上で視覚化できるまで繰り返し練習</p>
              </div>
              <div className="tip-card">
                <h4>2. 音を確認</h4>
                <p>一つ一つの音を確実に鳴らし、スケールの響きを耳で覚える</p>
              </div>
              <div className="tip-card">
                <h4>3. リズムを変える</h4>
                <p>8分音符、16分音符、3連符など様々なリズムで練習</p>
              </div>
              <div className="tip-card">
                <h4>4. 上下行の練習</h4>
                <p>上昇・下降だけでなく、スキップやパターンを組み合わせる</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
