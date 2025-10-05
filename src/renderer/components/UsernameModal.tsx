/**
 * ユーザー名設定モーダル
 */

import { useState } from 'react';
import './UsernameModal.css';

interface UsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (username: string, socialUrl?: string) => void;
}

export function UsernameModal({ isOpen, onClose, onSave }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmedUsername = username.trim();
    const trimmedSocialUrl = socialUrl.trim();

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

    // URLバリデーション（入力がある場合のみ）
    if (trimmedSocialUrl) {
      try {
        new URL(trimmedSocialUrl);
      } catch {
        setError('正しいURL形式で入力してください（例: https://twitter.com/username）');
        return;
      }
    }

    localStorage.setItem('riffquest_username', trimmedUsername);
    if (trimmedSocialUrl) {
      localStorage.setItem('riffquest_social_url', trimmedSocialUrl);
    }
    onSave(trimmedUsername, trimmedSocialUrl || undefined);
    setUsername('');
    setSocialUrl('');
    setError('');
  };

  const handleCancel = () => {
    setUsername('');
    setSocialUrl('');
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

          <div className="input-group">
            <label htmlFor="username">ユーザー名 <span className="required">*</span></label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="例: GuitarHero, ギタリスト123"
              maxLength={20}
              autoFocus
              className={error ? 'error' : ''}
            />
          </div>

          <div className="input-group">
            <label htmlFor="socialUrl">
              SNS / 配信チャンネルURL <span className="optional">（任意）</span>
            </label>
            <input
              id="socialUrl"
              type="url"
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="例: https://twitter.com/yourname, https://youtube.com/@channel"
              className={error ? 'error' : ''}
            />
            <p className="input-hint">
              Twitter, YouTube, Twitchなどのプロフィールや配信チャンネルのURLを入力すると、ランキングからリンクされます
            </p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="username-rules">
            <p className="rules-title">ルール:</p>
            <ul>
              <li>ユーザー名: 3〜20文字（日本語、英数字、アンダースコア、ハイフン）</li>
              <li>URL: 完全なURL形式で入力（http://またはhttps://で始まる）</li>
              <li>どちらも後から変更可能</li>
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
