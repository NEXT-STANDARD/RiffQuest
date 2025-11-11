import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { OBSConnection } from './components/OBSConnection-WebApp';
import { Dashboard } from './components/Dashboard';
import { Leaderboard } from './components/Leaderboard';
import { Achievements } from './components/Achievements';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { BPMDetector } from './components/BPMDetector';
import { CameraView } from './components/CameraView';
import { GuitarTuner } from './components/GuitarTuner';
import { ScalePractice } from './components/ScalePractice';
import { Metronome } from './components/Metronome';
import { ChordDictionary } from './components/ChordDictionary';
import './App.css';

interface SubMenuItem {
  path: string;
  icon: string;
  label: string;
}

interface MenuItem {
  path?: string;
  icon: string;
  label: string;
  subItems?: SubMenuItem[];
}

function Sidebar() {
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>('practice');

  const menuItems: MenuItem[] = [
    { path: '/', icon: '📊', label: 'ダッシュボード' },
    {
      icon: '🎸',
      label: '練習ツール',
      subItems: [
        { path: '/tuner', icon: '🎚️', label: 'チューナー' },
        { path: '/metronome', icon: '⏱️', label: 'メトロノーム' },
        { path: '/bpm', icon: '🎵', label: 'BPM検出' },
        { path: '/scales', icon: '🎼', label: 'スケール練習' },
        { path: '/chords', icon: '🎹', label: 'コード辞典' },
      ],
    },
    {
      icon: '🎥',
      label: '配信・録画',
      subItems: [
        { path: '/camera', icon: '📹', label: 'カメラ' },
        { path: '/obs', icon: '🎬', label: 'OBS接続' },
      ],
    },
    {
      icon: '📈',
      label: '進捗・データ',
      subItems: [
        { path: '/achievements', icon: '🏆', label: '実績' },
        { path: '/leaderboard', icon: '🌍', label: 'ランキング' },
        { path: '/history', icon: '📜', label: '練習履歴' },
      ],
    },
    { path: '/settings', icon: '⚙️', label: '設定' },
  ];

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="flex items-center justify-center mb-2">
          <span className="text-5xl">🎸</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">RiffQuest</h1>
        <p className="text-sm text-blue-200 opacity-80">v0.1.0</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              // サブメニューあり
              <div className="menu-group">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="menu-group-btn"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className={`transition-transform duration-200 ${expandedMenu === item.label ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedMenu === item.label && (
                  <div className="submenu">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className={`submenu-item ${isActive(subItem.path) ? 'active' : ''}`}
                      >
                        <span className="text-lg">{subItem.icon}</span>
                        <span>{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // サブメニューなし
              <Link
                to={item.path!}
                className={`nav-item ${isActive(item.path!) ? 'active' : ''}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="text-xs text-blue-200 opacity-75 leading-relaxed">
          ギター練習を可視化・計測・ゲーム化
        </p>
      </div>
    </aside>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/tuner" element={<GuitarTuner />} />
            <Route path="/metronome" element={<Metronome />} />
            <Route path="/bpm" element={<BPMDetector />} />
            <Route path="/camera" element={<CameraView />} />
            <Route path="/scales" element={<ScalePractice />} />
            <Route path="/chords" element={<ChordDictionary />} />
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
