import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { OBSConnection } from './components/OBSConnection-WebApp';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { History } from './components/History';
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
            <Link to="/leaderboard">🏆 ランキング</Link>
            <Link to="/obs">OBS接続</Link>
            <Link to="/history">練習履歴</Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/obs" element={<OBSConnection />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
