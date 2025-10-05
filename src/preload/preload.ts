/**
 * Electron Preload Script
 * レンダラープロセスとメインプロセスの橋渡し
 * セキュアな IPC 通信を提供
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * レンダラープロセスに公開する API
 */
const api = {
  // アプリケーション情報
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),

  // OBS 関連
  obs: {
    connect: (url, password) =>
      ipcRenderer.invoke('obs:connect', url, password),
    disconnect: () => ipcRenderer.invoke('obs:disconnect'),
    getCurrentScene: () => ipcRenderer.invoke('obs:get-current-scene'),
    onSceneChanged: (callback) => {
      ipcRenderer.on('obs:scene-changed', (_, sceneName) => callback(sceneName));
    },
    onConnected: (callback) => {
      ipcRenderer.on('obs:connected', (_, data) => callback(data));
    },
    onDisconnected: (callback) => {
      ipcRenderer.on('obs:disconnected', () => callback());
    },
    onError: (callback) => {
      ipcRenderer.on('obs:error', (_, error) => callback(error));
    },
  },

  // セッション管理
  session: {
    start: () => ipcRenderer.invoke('session:start'),
    stop: () => ipcRenderer.invoke('session:stop'),
    getCurrent: () => ipcRenderer.invoke('session:get-current'),
  },

  // データエクスポート
  export: {
    dailyData: (day, format) =>
      ipcRenderer.invoke('export:daily', day, format),
  },

  // 設定
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) =>
      ipcRenderer.invoke('settings:set', key, value),
  },
};

// window.riffquest として API を公開
contextBridge.exposeInMainWorld('riffquest', api);
