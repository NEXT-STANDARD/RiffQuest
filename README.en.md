# 🎸 RiffQuest

Visualize, Track, and Gamify Your Guitar Practice with OBS Integration

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

[日本語版 README](README.md)

## ✨ Features

- 🎯 **Daily Tasks**: Set and achieve daily practice goals
- 🏆 **Achievement System**: Unlock 13 different achievements
- 🔥 **Streak Tracking**: Build consecutive practice days
- 📊 **Practice History**: Visualize all your past practice sessions
- ⚡ **Level System**: Level up as you practice (1 min = 10 XP)
- 🎥 **OBS Integration**: Display stats overlay during streaming

## 🚀 Setup

### Requirements

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [OBS Studio](https://obsproject.com/) (v28 or higher)
- OBS WebSocket Plugin (built-in for OBS 28+)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/NEXT-STANDARD/RiffQuest.git
cd RiffQuest
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the server**
```bash
npx tsc -p tsconfig.server.json
```

4. **Start the server and client**
```bash
# Terminal 1: Start server
node dist-server/index.js

# Terminal 2: Start client
npm run dev:client
```

5. **Access in browser**
```
http://localhost:5173
```

## 📖 How to Use

### 1. Configure OBS Studio

1. Launch OBS Studio
2. Go to `Tools` → `WebSocket Server Settings`
3. Verify the following settings:
   - Enable WebSocket server: ✅
   - Server Port: `4455`
   - Enable Authentication: Set password (optional)

### 2. Connect RiffQuest to OBS

1. Go to http://localhost:5173/obs
2. Enter connection details:
   - WebSocket URL: `ws://127.0.0.1:4455`
   - Password: (if authentication is enabled)
3. Click "Connect" button

### 3. Configure OBS Scenes

Include the word `practice` in scene names you want to track.

Examples:
- `Practice_AltPicking` ✅ Tracked
- `Practice_EconomyPicking` ✅ Tracked
- `Waiting` ❌ Not tracked

### 4. Add OBS Overlay

1. In OBS, add a new `Browser` source
2. Configure with these settings:
   - URL: `http://localhost:5173/overlay.html`
   - Width: `800`
   - Height: `600`
   - Custom CSS (optional):
   ```css
   body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
   ```

### 5. Start Practicing!

1. Switch to a Practice scene in OBS
2. Start practicing with metronome
3. Switch to another scene to automatically end the session
4. Check your progress on the dashboard at http://localhost:5173

## 🎮 Gamification Elements

### Daily Tasks
- 🎯 First Practice of the Day (+50 XP)
- ⏱️ Practice 15 Minutes (+100 XP)
- 🔥 Practice 30 Minutes (+200 XP)
- ⭐ Practice 1 Hour (+500 XP)
- 🎸 Complete 3 Sessions (+150 XP)

### Achievements
- **Level-based**: Beginner, Intermediate, Advanced, Master
- **Time-based**: 1 hour, 10 hours, 100 hours total
- **Streak-based**: 3 days, 7 days, 30 days consecutive
- **Session-based**: 10, 50, 100 sessions completed

### Level System
- 1 minute practice = 10 XP
- Level = Total XP ÷ 100 + 1
- Example: 30 min practice = 300 XP

## 📁 Project Structure

```
RiffQuest/
├── server/               # Backend
│   ├── index.ts         # Express + Socket.io + OBS WebSocket
│   └── database.ts      # SQLite database manager
├── src/renderer/        # Frontend (React)
│   ├── components/
│   │   ├── Dashboard.tsx        # Gamification dashboard
│   │   ├── History.tsx          # Practice history
│   │   ├── Overlay-WithStats.tsx # OBS overlay
│   │   └── OBSConnection-WebApp.tsx # OBS connection
│   └── App.tsx
├── data/                # SQLite database (auto-generated)
│   └── riffquest.db
└── package.json
```

## 🛠️ Development

### Scripts

```bash
# Start server only
node dist-server/index.js

# Start client only
npm run dev:client

# Rebuild server
npx tsc -p tsconfig.server.json
```

### Database

Uses SQLite (WAL mode) with the following tables:
- `sessions`: Practice session records
- `user_profile`: User profile (XP, level, streak)

Database file: `data/riffquest.db`

## 🤝 Contributing

Pull requests are welcome! Please follow these steps:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [OBS Studio](https://obsproject.com/)
- [obs-websocket-js](https://github.com/obs-websocket-community-projects/obs-websocket-js)
- [React](https://react.dev/)
- [Express](https://expressjs.com/)
- [Socket.io](https://socket.io/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

## 📧 Support

For issues or questions, please create an [Issue](https://github.com/NEXT-STANDARD/RiffQuest/issues).

---

**Happy Practicing! 🎸🔥**
