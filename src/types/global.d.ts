/**
 * グローバル型定義
 */

import type { RiffQuestAPI } from '../preload/preload';

declare global {
  interface Window {
    riffquest: RiffQuestAPI;
  }
}

export {};
