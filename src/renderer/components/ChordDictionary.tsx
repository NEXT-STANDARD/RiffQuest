/**
 * コード辞典コンポーネント
 * ギターコードのフィンガリング図と押さえ方を表示
 */

import { useState } from 'react';
import './ChordDictionary.css';

interface ChordFingering {
  frets: (number | 'x' | 0)[]; // 各弦のフレット番号、x=ミュート、0=開放弦
  fingers: (number | null)[]; // 使用する指 (1=人差し指, 2=中指, 3=薬指, 4=小指)
  baseFret: number; // 基準フレット
}

interface Chord {
  id: string;
  name: string;
  displayName: string;
  category: string;
  positions: ChordFingering[];
  description: string;
  tips: string[];
}

export function ChordDictionary() {
  const [selectedCategory, setSelectedCategory] = useState('major');
  const [selectedChord, setSelectedChord] = useState('C');
  const [selectedPosition, setSelectedPosition] = useState(0);

  // コードデータベース
  const chords: Chord[] = [
    // メジャーコード
    {
      id: 'C',
      name: 'C',
      displayName: 'C (Cメジャー)',
      category: 'major',
      positions: [
        { frets: ['x', 3, 2, 0, 1, 0], fingers: [null, 3, 2, null, 1, null], baseFret: 1 },
        { frets: ['x', 3, 5, 5, 5, 3], fingers: [null, 1, 2, 3, 4, 1], baseFret: 3 },
      ],
      description: '最も基本的なコード。明るく開放的な響き。',
      tips: ['薬指と中指を立てて、1弦と6弦に触れないように', '開放弦がきれいに鳴るように意識'],
    },
    {
      id: 'D',
      name: 'D',
      displayName: 'D (Dメジャー)',
      category: 'major',
      positions: [
        { frets: ['x', 'x', 0, 2, 3, 2], fingers: [null, null, null, 1, 3, 2], baseFret: 1 },
        { frets: ['x', 5, 7, 7, 7, 5], fingers: [null, 1, 2, 3, 4, 1], baseFret: 5 },
      ],
      description: '開放弦を使った明るいコード。',
      tips: ['5弦と6弦はミュート（弾かない）', '指を立てて4弦の開放弦に触れないように'],
    },
    {
      id: 'E',
      name: 'E',
      displayName: 'E (Eメジャー)',
      category: 'major',
      positions: [
        { frets: [0, 2, 2, 1, 0, 0], fingers: [null, 2, 3, 1, null, null], baseFret: 1 },
        { frets: ['x', 7, 9, 9, 9, 7], fingers: [null, 1, 2, 3, 4, 1], baseFret: 7 },
      ],
      description: '6弦全てを鳴らす力強いコード。',
      tips: ['全ての弦を鳴らすので、しっかり押さえる', '中指と薬指を並べて押さえる'],
    },
    {
      id: 'G',
      name: 'G',
      displayName: 'G (Gメジャー)',
      category: 'major',
      positions: [
        { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, null, null, null, 4], baseFret: 1 },
        { frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, null, null, 3, 4], baseFret: 1 },
      ],
      description: '開放弦が多く、豊かな響きのコード。',
      tips: ['1弦と6弦の3フレットを小指と薬指で押さえる', '慣れてきたら1弦も押さえるフォームに挑戦'],
    },
    {
      id: 'A',
      name: 'A',
      displayName: 'A (Aメジャー)',
      category: 'major',
      positions: [
        { frets: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 2, 3, null], baseFret: 1 },
        { frets: ['x', 0, 2, 2, 2, 0], fingers: [null, null, 1, 1, 1, null], baseFret: 1 },
      ],
      description: '人差し指1本でも押さえられる便利なコード。',
      tips: ['6弦はミュート', '指3本で押さえるフォームとバレーコードの2通りある'],
    },
    // マイナーコード
    {
      id: 'Am',
      name: 'Am',
      displayName: 'Am (Aマイナー)',
      category: 'minor',
      positions: [
        { frets: ['x', 0, 2, 2, 1, 0], fingers: [null, null, 2, 3, 1, null], baseFret: 1 },
        { frets: ['x', 0, 7, 7, 5, 5], fingers: [null, null, 3, 4, 1, 2], baseFret: 5 },
      ],
      description: '哀愁のある美しいコード。Cメジャーキーで頻出。',
      tips: ['Eコードと似た形', '指を立てて開放弦に触れないように'],
    },
    {
      id: 'Dm',
      name: 'Dm',
      displayName: 'Dm (Dマイナー)',
      category: 'minor',
      positions: [
        { frets: ['x', 'x', 0, 2, 3, 1], fingers: [null, null, null, 2, 3, 1], baseFret: 1 },
        { frets: ['x', 5, 7, 7, 6, 5], fingers: [null, 1, 3, 4, 2, 1], baseFret: 5 },
      ],
      description: '切ないサウンド。Cメジャーキーで重要。',
      tips: ['5弦と6弦はミュート', '指を縦に並べるイメージ'],
    },
    {
      id: 'Em',
      name: 'Em',
      displayName: 'Em (Eマイナー)',
      category: 'minor',
      positions: [
        { frets: [0, 2, 2, 0, 0, 0], fingers: [null, 2, 3, null, null, null], baseFret: 1 },
        { frets: ['x', 7, 9, 9, 8, 7], fingers: [null, 1, 3, 4, 2, 1], baseFret: 7 },
      ],
      description: '最も簡単なマイナーコード。全弦を鳴らせる。',
      tips: ['指2本だけで押さえられる', '初心者に最適なコード'],
    },
    // セブンスコード
    {
      id: 'G7',
      name: 'G7',
      displayName: 'G7 (Gセブンス)',
      category: 'seventh',
      positions: [
        { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, null, null, null, 1], baseFret: 1 },
        { frets: [3, 2, 3, 0, 0, 1], fingers: [3, 2, 4, null, null, 1], baseFret: 1 },
      ],
      description: 'ブルースやジャズで頻出。Cに解決したくなる響き。',
      tips: ['Gコードから1弦を1フレットに変更', '不安定な響きが特徴'],
    },
    {
      id: 'C7',
      name: 'C7',
      displayName: 'C7 (Cセブンス)',
      category: 'seventh',
      positions: [
        { frets: ['x', 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, null], baseFret: 1 },
        { frets: ['x', 3, 5, 3, 5, 3], fingers: [null, 1, 3, 1, 4, 1], baseFret: 3 },
      ],
      description: 'ブルージーな響き。Fコードへの進行が定番。',
      tips: ['Cコードから2弦を3フレットに変更', '小指でしっかり押さえる'],
    },
    // パワーコード
    {
      id: 'E5',
      name: 'E5',
      displayName: 'E5 (Eパワーコード)',
      category: 'power',
      positions: [
        { frets: [0, 2, 2, 'x', 'x', 'x'], fingers: [null, 1, 2, null, null, null], baseFret: 1 },
        { frets: ['x', 7, 9, 9, 'x', 'x'], fingers: [null, 1, 3, 4, null, null], baseFret: 7 },
      ],
      description: 'ロック・メタルで必須。根音と5度のみのシンプルな構成。',
      tips: ['高音弦はミュート', 'ディストーションで力強く響く'],
    },
    {
      id: 'A5',
      name: 'A5',
      displayName: 'A5 (Aパワーコード)',
      category: 'power',
      positions: [
        { frets: ['x', 0, 2, 2, 'x', 'x'], fingers: [null, null, 1, 2, null, null], baseFret: 1 },
        { frets: ['x', 12, 14, 14, 'x', 'x'], fingers: [null, 1, 3, 4, null, null], baseFret: 12 },
      ],
      description: '移動可能な便利なフォーム。',
      tips: ['人差し指で5弦、薬指と小指で4弦と3弦', '形を覚えればフレット移動で他のコードに'],
    },
  ];

  const categories = [
    { id: 'major', name: 'メジャー', icon: '😊' },
    { id: 'minor', name: 'マイナー', icon: '😢' },
    { id: 'seventh', name: 'セブンス', icon: '🎵' },
    { id: 'power', name: 'パワーコード', icon: '⚡' },
  ];

  const filteredChords = chords.filter((chord) => chord.category === selectedCategory);
  const currentChord = chords.find((chord) => chord.id === selectedChord);
  const currentPosition = currentChord?.positions[selectedPosition];

  // コード図を描画
  const renderChordDiagram = (fingering: ChordFingering) => {
    const strings = ['E', 'B', 'G', 'D', 'A', 'E'];
    const fretCount = 5;

    return (
      <div className="chord-diagram">
        <div className="diagram-header">
          {fingering.baseFret > 1 && <div className="base-fret">{fingering.baseFret}fr</div>}
        </div>
        <div className="diagram-strings">
          {fingering.frets.map((fret, stringIndex) => (
            <div key={stringIndex} className="string-column">
              <div className="string-label">{strings[stringIndex]}</div>
              <div className={`string-status ${fret === 'x' ? 'muted' : fret === 0 ? 'open' : ''}`}>
                {fret === 'x' ? '✕' : fret === 0 ? '○' : ''}
              </div>
              <div className="fret-positions">
                {Array.from({ length: fretCount }, (_, fretIndex) => (
                  <div key={fretIndex} className="fret-position">
                    {typeof fret === 'number' && fret > 0 && fret === fingering.baseFret + fretIndex && (
                      <div className="finger-dot">
                        {fingering.fingers[stringIndex] || ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="fret-numbers">
          {Array.from({ length: fretCount }, (_, i) => (
            <div key={i} className="fret-number">
              {fingering.baseFret + i}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="chord-dictionary">
      <div className="dictionary-header">
        <h2>📖 コード辞典</h2>
        <p>ギターコードの押さえ方とフィンガリング図</p>
      </div>

      <div className="category-selector">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              const firstChord = chords.find((c) => c.category === category.id);
              if (firstChord) setSelectedChord(firstChord.id);
              setSelectedPosition(0);
            }}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>

      <div className="chord-selector">
        <label>コード選択:</label>
        <div className="chord-buttons">
          {filteredChords.map((chord) => (
            <button
              key={chord.id}
              onClick={() => {
                setSelectedChord(chord.id);
                setSelectedPosition(0);
              }}
              className={`chord-btn ${selectedChord === chord.id ? 'active' : ''}`}
            >
              {chord.name}
            </button>
          ))}
        </div>
      </div>

      {currentChord && currentPosition && (
        <div className="chord-detail">
          <div className="chord-info">
            <h3>{currentChord.displayName}</h3>
            <p className="chord-description">{currentChord.description}</p>
          </div>

          {currentChord.positions.length > 1 && (
            <div className="position-selector">
              <label>ポジション:</label>
              <div className="position-buttons">
                {currentChord.positions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPosition(index)}
                    className={`position-btn ${selectedPosition === index ? 'active' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="diagram-container">{renderChordDiagram(currentPosition)}</div>

          <div className="finger-guide">
            <h4>指の使い方</h4>
            <div className="finger-legend">
              <div className="finger-item">
                <span className="finger-num">1</span>
                <span>人差し指</span>
              </div>
              <div className="finger-item">
                <span className="finger-num">2</span>
                <span>中指</span>
              </div>
              <div className="finger-item">
                <span className="finger-num">3</span>
                <span>薬指</span>
              </div>
              <div className="finger-item">
                <span className="finger-num">4</span>
                <span>小指</span>
              </div>
            </div>
          </div>

          <div className="chord-tips">
            <h4>💡 押さえ方のコツ</h4>
            <ul>
              {currentChord.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="common-progressions">
        <h3>🎼 定番コード進行</h3>
        <div className="progression-list">
          <div className="progression-card">
            <h4>C - G - Am - F (王道進行)</h4>
            <p>ポップス・J-POPで最も使われる進行。明るく爽やか。</p>
            <div className="progression-chords">C → G → Am → F</div>
          </div>
          <div className="progression-card">
            <h4>Em - C - G - D (カノン進行)</h4>
            <p>クラシックの名曲から。感動的な響き。</p>
            <div className="progression-chords">Em → C → G → D</div>
          </div>
          <div className="progression-card">
            <h4>C - Am - Dm - G (循環コード)</h4>
            <p>ジャズ・ボサノバで定番。スムーズな流れ。</p>
            <div className="progression-chords">C → Am → Dm → G</div>
          </div>
          <div className="progression-card">
            <h4>E - A - E - A (パワーコード)</h4>
            <p>ロック・パンクで頻出。シンプルで力強い。</p>
            <div className="progression-chords">E5 → A5 → E5 → A5</div>
          </div>
        </div>
      </div>

      <div className="practice-guide">
        <h3>🎯 練習のポイント</h3>
        <div className="guide-grid">
          <div className="guide-card">
            <h4>1. コードチェンジ</h4>
            <p>ゆっくり確実に。徐々にスピードアップ。</p>
          </div>
          <div className="guide-card">
            <h4>2. 指の形を記憶</h4>
            <p>見ないでも押さえられるまで繰り返す。</p>
          </div>
          <div className="guide-card">
            <h4>3. 全ての弦を鳴らす</h4>
            <p>1弦ずつ弾いて音が出るか確認。</p>
          </div>
          <div className="guide-card">
            <h4>4. メトロノームを使う</h4>
            <p>リズムに合わせてコードチェンジ練習。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
