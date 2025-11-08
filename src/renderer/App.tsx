import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { OBSConnection } from './components/OBSConnection-WebApp';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { Achievements } from './components/Achievements';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { BPMDetector } from './components/BPMDetector';
import { CameraView } from './components/CameraView';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>🎸 RiffQuest</h1>
          <p>ギター練習を可視化・計測・ゲーム化する OBS 連携ツール</p>
          <p className="version">Version: 0.1.0 (Web App)</p>

          <nav className="app-nav">
            <Link to="/">ダッシュボード</Link>
            <Link to="/achievements">🏆 実績</Link>
            <Link to="/leaderboard">🌍 ランキング</Link>
            <Link to="/bpm">🎵 BPM検出</Link>
            <Link to="/camera">📹 カメラ</Link>
            <Link to="/obs">OBS接続</Link>
            <Link to="/history">練習履歴</Link>
            <Link to="/settings">⚙️ 設定</Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/bpm" element={<BPMDetector />} />
            <Route path="/camera" element={<CameraView />} />
            <Route path="/obs" element={<OBSConnection />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
