/**
 * PoC 1: OBS WebSocket v5 接続テスト
 *
 * 目的:
 * - OBS WebSocket v5 への接続確認
 * - 現在のシーン名を取得
 * - シーン変更イベントの監視
 * - Practice_* シーンの検出
 *
 * 実行前の準備:
 * 1. OBS を起動
 * 2. ツール → WebSocket サーバー設定 → サーバーを有効化
 * 3. ポート 4455（デフォルト）を確認
 * 4. パスワードを設定（または無効化）
 *
 * 実行方法: node obs-test.js
 */

const OBSWebSocket = require('obs-websocket-js').default;

// 設定
const OBS_CONFIG = {
  url: 'ws://127.0.0.1:4455',
  password: '', // パスワードを設定している場合はここに入力
};

const obs = new OBSWebSocket();

async function main() {
  console.log('🚀 OBS WebSocket v5 接続テスト開始');
  console.log(`接続先: ${OBS_CONFIG.url}`);
  console.log('---');

  try {
    // 1. OBS への接続
    console.log('1️⃣  OBS へ接続中...');
    await obs.connect(OBS_CONFIG.url, OBS_CONFIG.password);
    console.log('✅ OBS に接続しました');

    // 2. OBS バージョン情報の取得
    const version = await obs.call('GetVersion');
    console.log('\n2️⃣  OBS バージョン情報:');
    console.log(`   OBS Studio: ${version.obsVersion}`);
    console.log(`   WebSocket: ${version.obsWebSocketVersion}`);

    // 3. 現在のシーン名を取得
    console.log('\n3️⃣  現在のシーン名を取得:');
    const currentScene = await obs.call('GetCurrentProgramScene');
    console.log(`   現在のシーン: "${currentScene.currentProgramSceneName}"`);

    // 4. Practice_* シーンかどうかを判定
    const isPracticeScene = currentScene.currentProgramSceneName.startsWith('Practice_');
    console.log(`   Practice シーン: ${isPracticeScene ? '✅ はい' : '❌ いいえ'}`);

    // 5. 全シーン一覧を取得
    console.log('\n4️⃣  全シーン一覧:');
    const scenes = await obs.call('GetSceneList');
    scenes.scenes.forEach((scene, index) => {
      const isPractice = scene.sceneName.startsWith('Practice_');
      const marker = isPractice ? '🎸' : '  ';
      console.log(`   ${marker} ${index + 1}. ${scene.sceneName}`);
    });

    // 6. シーン変更イベントの監視
    console.log('\n5️⃣  シーン変更イベントの監視を開始...');
    console.log('   (シーンを切り替えて動作を確認してください)');
    console.log('   (Ctrl+C で終了)');
    console.log('---');

    obs.on('CurrentProgramSceneChanged', (event) => {
      const sceneName = event.sceneName;
      const isPractice = sceneName.startsWith('Practice_');
      const timestamp = new Date().toLocaleTimeString('ja-JP');

      if (isPractice) {
        console.log(`🎸 [${timestamp}] Practice シーンに切り替わりました: "${sceneName}"`);
        console.log('   → フォーカス時間のカウント開始');
      } else {
        console.log(`   [${timestamp}] シーンが切り替わりました: "${sceneName}"`);
        console.log('   → フォーカス時間のカウント停止');
      }
    });

    // 7. 音声メーター情報の取得（v1.1+ で使用予定）
    console.log('\n6️⃣  音声入力ソース一覧:');
    const inputs = await obs.call('GetInputList');
    const audioInputs = inputs.inputs.filter(input =>
      input.inputKind.includes('audio') ||
      input.inputKind.includes('wasapi') ||
      input.inputKind === 'coreaudio_input_capture'
    );

    if (audioInputs.length > 0) {
      audioInputs.forEach((input, index) => {
        console.log(`   ${index + 1}. ${input.inputName} (${input.inputKind})`);
      });
    } else {
      console.log('   (音声入力ソースが見つかりませんでした)');
    }

    // プロセスを維持
    process.on('SIGINT', async () => {
      console.log('\n\n⏹️  接続を切断します...');
      await obs.disconnect();
      console.log('✅ 切断完了');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 ヒント:');
      console.error('   1. OBS が起動しているか確認してください');
      console.error('   2. OBS の WebSocket サーバーが有効か確認してください');
      console.error('      (ツール → WebSocket サーバー設定)');
    } else if (error.code === 4009) {
      console.error('\n💡 ヒント:');
      console.error('   WebSocket のパスワードが正しくありません');
      console.error('   OBS_CONFIG.password を確認してください');
    }

    process.exit(1);
  }
}

main();
