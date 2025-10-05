/**
 * ユーザー名設定モーダル
 */

import { useState } from 'react';
import './UsernameModal.css';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string) => void;
}

export function UsernameModal({ isOpen, onClose, onSave }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3) {
      setError('ユーザー名は3文字以上で入力してください');
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('ユーザー名は20文字以内で入力してください');
      return;
    }

    // 特殊文字チェック（アルファベット、数字、日本語、アンダースコア、ハイフンのみ）
    const validPattern = /^[a-zA-Z0-9ぁ-んァ-ヶー一-龯_-]+$/;
    if (!validPattern.test(trimmedUsername)) {
      setError('使用できない文字が含まれています');
      return;
    }

    localStorage.setItem('riffquest_username', trimmedUsername);
    onSave(trimmedUsername);
    setUsername('');
    setError('');
  };

  const handleCancel = () => {
    setUsername('');
    setError('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎸 ユーザー名を設定</h2>
          <button className="modal-close" onClick={handleCancel}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            世界ランキングに参加するためのユーザー名を入力してください
          </p>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="例: GuitarHero, ギタリスト123"
            maxLength={20}
            autoFocus
            className={error ? 'error' : ''}
          />

          {error && <p className="error-message">{error}</p>}

          <div className="username-rules">
            <p className="rules-title">ルール:</p>
            <ul>
              <li>3〜20文字</li>
              <li>日本語、英数字、アンダースコア、ハイフン使用可能</li>
              <li>後から変更可能</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={handleCancel} className="btn-cancel">
            キャンセル
          </button>
          <button onClick={handleSave} className="btn-save">
            保存して参加
          </button>
        </div>
      </div>
    </div>
  );
}
