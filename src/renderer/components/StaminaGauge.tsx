/**
 * スタミナゲージコンポーネント
 * 原神スタイルのスタミナ表示とブースト機能
 */

import { useState, useEffect } from 'react';
import './StaminaGauge.css';

const API_URL = 'http://localhost:3030';

interface StaminaData {
  stamina: number;
  max_stamina: number;
  minutes_until_next_recovery: number;
  stamina_full: boolean;
}

interface XPBoost {
  id: number;
  boost_type: 'small' | 'large';
  multiplier: number;
  duration_minutes: number;
  activated_at: string;
  expires_at: string;
  active: number;
}

export function StaminaGauge() {
  const [stamina, setStamina] = useState<StaminaData>({
    stamina: 0,
    max_stamina: 240,
    minutes_until_next_recovery: 0,
    stamina_full: false
  });
  const [activeBoost, setActiveBoost] = useState<XPBoost | null>(null);
  const [showBoostMenu, setShowBoostMenu] = useState(false);

  useEffect(() => {
    fetchStamina();
    fetchActiveBoost();
    const interval = setInterval(() => {
      fetchStamina();
      fetchActiveBoost();
    }, 30000); // 30秒ごとに更新
    return () => clearInterval(interval);
  }, []);

  const fetchStamina = async () => {
    try {
      const response = await fetch(`${API_URL}/api/stamina`);
      const data = await response.json();
      setStamina(data);
    } catch (error) {
      console.error('スタミナ取得エラー:', error);
    }
  };

  const fetchActiveBoost = async () => {
    try {
      const response = await fetch(`${API_URL}/api/boost/active`);
      const data = await response.json();
      setActiveBoost(data.boost);
    } catch (error) {
      console.error('ブースト情報取得エラー:', error);
    }
  };

  const activateBoost = async (type: 'small' | 'large') => {
    try {
      const response = await fetch(`${API_URL}/api/boost/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const result = await response.json();

      if (result.success) {
        setActiveBoost(result.boost);
        fetchStamina(); // スタミナを再取得
        setShowBoostMenu(false);
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('ブースト発動エラー:', error);
      alert('ブーストの発動に失敗しました');
    }
  };

  const getTimeRemaining = () => {
    if (!activeBoost) return '';
    const now = new Date();
    const expiresAt = new Date(activeBoost.expires_at);
    const diffMs = expiresAt.getTime() - now.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const staminaPercentage = (stamina.stamina / stamina.max_stamina) * 100;

  return (
    <div className="stamina-container">
      {/* スタミナゲージ */}
      <div className="stamina-gauge">
        <div className="stamina-header">
          <span className="stamina-icon">⚡</span>
          <span className="stamina-label">スタミナ</span>
          <span className="stamina-value">{stamina.stamina} / {stamina.max_stamina}</span>
        </div>

        <div className="stamina-bar">
          <div
            className="stamina-fill"
            style={{ width: `${staminaPercentage}%` }}
          />
        </div>

        {!stamina.stamina_full && (
          <div className="stamina-recovery">
            次回回復まで {stamina.minutes_until_next_recovery} 分
          </div>
        )}
      </div>

      {/* アクティブなブースト表示 */}
      {activeBoost && (
        <div className="active-boost">
          <span className="boost-icon">🔥</span>
          <span className="boost-label">
            {activeBoost.multiplier}x XPブースト
          </span>
          <span className="boost-timer">{getTimeRemaining()}</span>
        </div>
      )}

      {/* ブーストボタン */}
      <div className="boost-controls">
        <button
          className="boost-toggle-btn"
          onClick={() => setShowBoostMenu(!showBoostMenu)}
        >
          XPブースト {showBoostMenu ? '▲' : '▼'}
        </button>

        {showBoostMenu && (
          <div className="boost-menu">
            <div className="boost-option">
              <button
                className="boost-btn boost-small"
                onClick={() => activateBoost('small')}
                disabled={stamina.stamina < 40 || !!activeBoost}
              >
                <div className="boost-type">小ブースト</div>
                <div className="boost-details">1.5x / 15分</div>
                <div className="boost-cost">⚡ 40</div>
              </button>
            </div>

            <div className="boost-option">
              <button
                className="boost-btn boost-large"
                onClick={() => activateBoost('large')}
                disabled={stamina.stamina < 60 || !!activeBoost}
              >
                <div className="boost-type">大ブースト</div>
                <div className="boost-details">2.0x / 30分</div>
                <div className="boost-cost">⚡ 60</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
