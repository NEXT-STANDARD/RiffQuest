/**
 * OBS オーバーレイ専用アプリ
 */

import { useEffect } from 'react';
import { Overlay } from './components/Overlay-WithStats';
import './components/Overlay.css';

function OverlayApp() {
  useEffect(() => {
    // OBS用の透過背景を適用
    document.body.classList.add('obs-overlay');

    return () => {
      document.body.classList.remove('obs-overlay');
    };
  }, []);

  return <Overlay />;
}

export default OverlayApp;
