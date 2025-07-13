// test-automation.js
// Mulmocast自動化システムのテストスクリプト

require('dotenv').config();
const MulmocastAutomation = require('./mulmocast-automation');

async function testBasicFunctionality() {
  console.log('🧪 Mulmocast自動化システムのテストを開始します\n');

  const automation = new MulmocastAutomation();

  // テスト1: 環境変数チェック
  console.log('✅ テスト1: 環境変数の確認');
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY が設定されていません');
    process.exit(1);
  }
  console.log('  OpenAI APIキー: 設定済み');

  // テスト2: URLからコンテンツ取得テスト
  console.log('\n✅ テスト2: URLからのコンテンツ取得');
  try {
    const testUrl = 'https://www.example.com';
    const content = await automation.fetchWebContent(testUrl);
    console.log('  コンテンツ取得: 成功');
    console.log(`  取得サイズ: ${content.length} 文字`);
  } catch (error) {
    console.error('  ❌ エラー:', error.message);
  }

  // テスト3: テキスト抽出テスト
  console.log('\n✅ テスト3: HTMLからのテキスト抽出');
  const sampleHTML = `
    <html>
      <head><title>テストページ</title></head>
      <body>
        <h1>見出し</h1>
        <p>これはテストコンテンツです。</p>
        <script>console.log('スクリプト');</script>
      </body>
    </html>
  `;
  const extractedText = automation.extractTextFromHTML(sampleHTML);
  console.log('  抽出テキスト:', extractedText);

  // テスト4: MulmoScriptプロンプト生成テスト
  console.log('\n✅ テスト4: MulmoScriptプロンプトの生成');
  const prompt = automation.createMulmoScriptPrompt('テストコンテンツ', 'ghibli');
  console.log('  プロンプト生成: 成功');
  console.log('  プロンプト長:', prompt.length, '文字');

  // テスト5: 小規模なMulmoScript生成テスト（APIを使用）
  console.log('\n✅ テスト5: MulmoScript生成（APIテスト）');
  console.log('  ⚠️  このテストはOpenAI APIを使用します（料金が発生する可能性があります）');
  console.log('  実行しますか？ (y/n)');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      try {
        const testContent = 'これはMulmocastのテストコンテンツです。AIによる動画生成システムのテスト。';
        const script = await automation.generateMulmoScript(testContent, 'ghibli');
        console.log('  MulmoScript生成: 成功');
        console.log('  タイトル:', script.title);
        console.log('  beats数:', script.beats ? script.beats.length : 0);
        
        // テスト用JSONを保存
        await automation.saveMulmoScript(script, 'test_script.json');
        console.log('  テストファイル保存: ./output/test_script.json');
      } catch (error) {
        console.error('  ❌ エラー:', error.message);
      }
    }

    console.log('\n🎉 テスト完了！');
    rl.close();
  });
}

// 使用方法を表示
function showUsage() {
  console.log(`
📚 Mulmocast自動化システム - 使い方

1. 基本的な使用:
   node mulmocast-automation.js <URL>

2. オプション付き:
   node mulmocast-automation.js <URL> --style business --subtitles

3. APIサーバー起動:
   npm start

4. 開発モード（自動リロード）:
   npm run dev

使用可能なスタイル:
  - ghibli    : ジブリ風アニメーション
  - business  : ビジネスプレゼンテーション
  - education : 教育コンテンツ
  - news      : ニュース形式

環境変数（.envファイル）:
  - OPENAI_API_KEY : OpenAI APIキー（必須）
  - OPENAI_ORG_ID  : 組織ID（オプション）
  - PATH_BGM       : BGMファイルパス（オプション）
  `);
}

// メイン処理
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
  } else {
    testBasicFunctionality();
  }
}