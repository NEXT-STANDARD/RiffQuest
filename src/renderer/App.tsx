import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { OBSConnection } from './components/OBSConnection-WebApp';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { Achievements } from './components/Achievements';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { BPMDetector } from './components/BPMDetector';
import { CameraView } from './components/CameraView';
import { GuitarTuner } from './components/GuitarTuner';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <aside className="app-sidebar">
          <div className="sidebar-header">
            <h1>🎸 RiffQuest</h1>
            <p className="version">v0.1.0</p>
          </div>

          <nav className="sidebar-nav">
            <Link to="/" className="nav-item">
              <span className="nav-icon">📊</span>
              <span className="nav-label">ダッシュボード</span>
            </Link>
            <Link to="/tuner" className="nav-item">
              <span className="nav-icon">🎸</span>
              <span className="nav-label">チューナー</span>
            </Link>
            <Link to="/bpm" className="nav-item">
              <span className="nav-icon">🎵</span>
              <span className="nav-label">BPM検出</span>
            </Link>
            <Link to="/camera" className="nav-item">
              <span className="nav-icon">📹</span>
              <span className="nav-label">カメラ</span>
            </Link>
            <Link to="/achievements" className="nav-item">
              <span className="nav-icon">🏆</span>
              <span className="nav-label">実績</span>
            </Link>
            <Link to="/leaderboard" className="nav-item">
              <span className="nav-icon">🌍</span>
              <span className="nav-label">ランキング</span>
            </Link>
            <Link to="/history" className="nav-item">
              <span className="nav-icon">📜</span>
              <span className="nav-label">練習履歴</span>
            </Link>
            <Link to="/obs" className="nav-item">
              <span className="nav-icon">🎥</span>
              <span className="nav-label">OBS接続</span>
            </Link>
            <Link to="/settings" className="nav-item">
              <span className="nav-icon">⚙️</span>
              <span className="nav-label">設定</span>
            </Link>
          </nav>

          <div className="sidebar-footer">
            <p>ギター練習を可視化・計測・ゲーム化</p>
          </div>
        </aside>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/tuner" element={<GuitarTuner />} />
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
