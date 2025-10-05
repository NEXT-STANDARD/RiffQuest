# 🎸 RiffQuest

ギター練習を可視化・計測・ゲーム化する OBS 連携ツール

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

[English README](README.en.md)

## ✨ 特徴

- 🎯 **デイリータスク**: 毎日の練習目標を設定して達成感を味わう
- 🏆 **実績システム**: 13種類の実績をアンロック
- 🔥 **連続日数**: 毎日練習すると連続記録が伸びる
- 📊 **練習履歴**: 過去の全練習セッションを可視化
- ⚡ **レベルシステム**: 練習するほどレベルアップ（1分=10XP）
- 🎥 **OBS連携**: OBSオーバーレイで配信中も統計表示

## 🚀 セットアップ

### 必要なもの

- [Node.js](https://nodejs.org/) (v18以上推奨)
- [OBS Studio](https://obsproject.com/) (v28以上)
- OBS WebSocket Plugin (OBS 28+は標準搭載)

### インストール手順

1. **リポジトリをクローン**
```bash
git clone https://github.com/あなたのユーザー名/RiffQuest.git
cd RiffQuest
```

2. **依存関係をインストール**
```bash
npm install
```

3. **サーバーをビルド**
```bash
npx tsc -p tsconfig.server.json
```

4. **サーバーとクライアントを起動**
```bash
# ターミナル1: サーバー起動
node dist-server/index.js

# ターミナル2: クライアント起動
npm run dev:client
```

5. **ブラウザでアクセス**
```
http://localhost:5173
```

## 📖 使い方

### 1. OBS Studioの設定

1. OBS Studio を起動
2. `ツール` → `WebSocket サーバー設定`
3. 以下の設定を確認:
   - サーバーを有効にする: ✅
   - サーバーポート: `4455`
   - 認証を有効にする: パスワードを設定（任意）

### 2. RiffQuestとOBSを接続

1. http://localhost:5173/obs にアクセス
2. 接続情報を入力:
   - WebSocket URL: `ws://127.0.0.1:4455`
   - パスワード: （設定した場合のみ）
3. 「接続」ボタンをクリック

### 3. OBSシーンの設定

練習を記録したいシーン名に `practice` を含めます。

例:
- `Practice_AltPicking` ✅ 記録される
- `Practice_EconomyPicking` ✅ 記録される
- `Waiting` ❌ 記録されない

### 4. OBSオーバーレイの追加

1. OBSで「ソース」→「ブラウザ」を追加
2. 以下の設定:
   - URL: `http://localhost:5173/overlay.html`
   - 幅: `800`
   - 高さ: `600`
   - カスタムCSS (任意):
   ```css
   body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
   ```

### 5. 練習開始！

1. OBSでPracticeシーンに切り替える
2. メトロノームなどで練習開始
3. 別のシーンに切り替えると自動的にセッション終了
4. http://localhost:5173 のダッシュボードで進捗確認

## 🎮 ゲーミフィケーション要素

### デイリータスク
- 🎯 今日の最初の練習 (+50 XP)
- ⏱️ 15分練習 (+100 XP)
- 🔥 30分練習 (+200 XP)
- ⭐ 1時間練習 (+500 XP)
- 🎸 3セッション (+150 XP)

### 実績
- レベル系: ビギナー、中級者、上級者、マスター
- 累計時間系: 1時間、10時間、100時間
- 連続日数系: 3日、7日、30日連続
- セッション数系: 10回、50回、100回

### レベルシステム
- 1分練習 = 10 XP
- レベル = 総XP ÷ 100 + 1
- 例: 30分練習 = 300 XP

## 📁 プロジェクト構成

```
RiffQuest/
├── server/               # バックエンド
│   ├── index.ts         # Express + Socket.io + OBS WebSocket
│   └── database.ts      # SQLite データベース管理
├── src/renderer/        # フロントエンド (React)
│   ├── components/
│   │   ├── Dashboard.tsx        # ゲーミフィケーションダッシュボード
│   │   ├── History.tsx          # 練習履歴
│   │   ├── Overlay-WithStats.tsx # OBSオーバーレイ
│   │   └── OBSConnection-WebApp.tsx # OBS接続
│   └── App.tsx
├── data/                # SQLiteデータベース (自動生成)
│   └── riffquest.db
└── package.json
```

## 🛠️ 開発

### スクリプト

```bash
# サーバーのみ起動
node dist-server/index.js

# クライアントのみ起動
npm run dev:client

# サーバー再ビルド
npx tsc -p tsconfig.server.json
```

### データベース

SQLite (WALモード) を使用。以下のテーブル:
- `sessions`: 練習セッション記録
- `user_profile`: ユーザープロフィール（XP、レベル、ストリーク）

データベースファイル: `data/riffquest.db`

## 🤝 コントリビューション

プルリクエスト歓迎！以下の流れで:

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンスと免責事項

このプロジェクトは **MIT License** の下で公開されています。

### 使用許諾
- ✅ 商用利用可能
- ✅ 改変可能
- ✅ 配布可能
- ✅ 私的利用可能
- ✅ クレジット表記不要（推奨はします）

### 免責事項
**本ソフトウェアは「現状のまま」で提供され、明示的または黙示的を問わず、いかなる保証もありません。著作者または著作権者は、本ソフトウェアの使用またはその他の扱いに起因または関連して生じる、いかなる請求、損害、その他の責任についても一切責任を負いません。**

詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [OBS Studio](https://obsproject.com/)
- [obs-websocket-js](https://github.com/obs-websocket-community-projects/obs-websocket-js)
- [React](https://react.dev/)
- [Express](https://expressjs.com/)
- [Socket.io](https://socket.io/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

## 📧 サポート

問題や質問がある場合は [Issues](https://github.com/あなたのユーザー名/RiffQuest/issues) を作成してください。

---

**Happy Practicing! 🎸🔥**
