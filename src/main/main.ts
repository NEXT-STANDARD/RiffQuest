/**
 * Minimal Electron Test - No OBS
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow: any = null;

function createWindow() {
  console.log('[MAIN] Creating window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      //preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'RiffQuest - Minimal Test',
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  console.log('[MAIN] Window created');
}

console.log('[MAIN] App starting...');

app.whenReady().then(() => {
  console.log('[MAIN] App ready');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

console.log('[MAIN] Script loaded');
