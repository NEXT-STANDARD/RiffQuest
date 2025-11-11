import { useState, useEffect } from 'react';
import './Settings.css';

interface Backup {
  filename: string;
  size: number;
  created: string;
}

export function Settings() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await fetch('http://localhost:3030/api/backup/list');
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('バックアップ一覧取得エラー:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3030/api/backup/create', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: `バックアップを作成しました: ${result.filename}` });
        loadBackups();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `エラー: ${error.message}` });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleResetDatabase = async () => {
    setIsResetting(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3030/api/database/reset', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `データベースをリセットしました。バックアップ: ${result.backupFilename}`,
        });
        setShowResetConfirm(false);
        loadBackups();
        // ページをリロードして最新の状態を反映
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `エラー: ${error.message}` });
    } finally {
      setIsResetting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP');
  };

  return (
    <div className="settings-container">
      <h2>⚙️ 設定</h2>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* バックアップセクション */}
      <section className="settings-section">
        <h3>💾 バックアップ管理</h3>
        <p className="section-description">
          データベースのバックアップを作成・管理します。バックアップは自動的に毎日作成されますが、手動でも作成できます。
        </p>

        <button
          className="btn-primary"
          onClick={handleCreateBackup}
          disabled={isCreatingBackup}
        >
          {isCreatingBackup ? '作成中...' : '今すぐバックアップを作成'}
        </button>

        <div className="backup-list">
          <h4>バックアップ一覧（最新30件）</h4>
          {backups.length === 0 ? (
            <p className="no-data">バックアップがありません</p>
          ) : (
            <table className="backup-table">
              <thead>
                <tr>
                  <th>ファイル名</th>
                  <th>サイズ</th>
                  <th>作成日時</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, index) => (
                  <tr key={index}>
                    <td>{backup.filename}</td>
                    <td>{formatFileSize(backup.size)}</td>
                    <td>{formatDate(backup.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* データベースリセットセクション */}
      <section className="settings-section danger-section">
        <h3>🗑️ データベースリセット</h3>
        <p className="section-description danger-text">
          ⚠️ 警告: この操作は全ての練習データ、実績、レベル、ストリークをリセットします。
          リセット前に自動的にバックアップが作成されます。
        </p>

        {!showResetConfirm ? (
          <button
            className="btn-danger"
            onClick={() => setShowResetConfirm(true)}
          >
            データベースをリセット
          </button>
        ) : (
          <div className="confirm-box">
            <p className="confirm-message">
              本当にデータベースをリセットしますか？<br />
              この操作は取り消せません。
            </p>
            <div className="confirm-buttons">
              <button
                className="btn-danger"
                onClick={handleResetDatabase}
                disabled={isResetting}
              >
                {isResetting ? 'リセット中...' : 'はい、リセットします'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </section>

      {/* その他の情報 */}
      <section className="settings-section">
        <h3>📌 情報</h3>
        <ul className="info-list">
          <li>バージョン: 0.1.0</li>
          <li>データベースパス: data/riffquest.db</li>
          <li>バックアップ保存先: data/backups/</li>
          <li>自動バックアップ: 毎日0時 + 起動時</li>
        </ul>
      </section>
    </div>
  );
}
