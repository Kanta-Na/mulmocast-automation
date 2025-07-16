// example-api-usage.js
// MulmocastAutomationをAPIとして使用する例

// 1. 基本的な使い方
const basicExample = async () => {
    // dotenvで環境変数を読み込む
    require('dotenv').config();
    
    // MulmocastAutomationクラスをインポート
    const MulmocastAutomation = require('../mulmocast-automation');
    
    // インスタンスを作成
    const automation = new MulmocastAutomation();
    
    try {
      // URLからコンテンツを生成
      const result = await automation.generateContentFromURL(
        'https://example.com',
        {
          style: 'ghibli',      // スタイル指定
          subtitles: true       // 字幕オプション
        }
      );
      
      console.log('生成完了:', result);
      // result = {
      //   scriptPath: './output/script_2025-07-13T14-30-00-000Z.json',
      //   outputDir: './output',
      //   timestamp: '2025-07-13T14-30-00-000Z'
      // }
    } catch (error) {
      console.error('エラー:', error);
    }
  };
  
  // 2. カスタム設定での使い方
  const customConfigExample = async () => {
    require('dotenv').config();
    const MulmocastAutomation = require('../mulmocast-automation');
    
    // カスタム設定でインスタンスを作成
    const automation = new MulmocastAutomation({
      outputDir: './my-custom-output',  // 出力ディレクトリを変更
      bgmPath: './my-music/bgm.mp3'     // カスタムBGM
    });
    
    const result = await automation.generateContentFromURL(
      'https://example.com',
      {
        style: 'business',  // ビジネススタイル
        subtitles: false    // 字幕なし
      }
    );
  };
  
  // 3. バッチ処理の例
  const batchProcessExample = async () => {
    require('dotenv').config();
    const MulmocastAutomation = require('../mulmocast-automation');
    
    const automation = new MulmocastAutomation();
    const urls = [
      { url: 'https://example1.com', style: 'ghibli' },
      { url: 'https://example2.com', style: 'business' },
      { url: 'https://example3.com', style: 'education' }
    ];
    
    const results = [];
    
    for (const item of urls) {
      try {
        console.log(`処理中: ${item.url}`);
        const result = await automation.generateContentFromURL(
          item.url,
          { style: item.style }
        );
        results.push({ url: item.url, ...result });
        
        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`エラー (${item.url}):`, error.message);
        results.push({ url: item.url, error: error.message });
      }
    }
    
    console.log('バッチ処理完了:', results);
  };
  
  // 4. 個別メソッドの使用例
  const individualMethodsExample = async () => {
    require('dotenv').config();
    const MulmocastAutomation = require('../mulmocast-automation');
    
    const automation = new MulmocastAutomation();
    
    // Step 1: URLからコンテンツを取得
    const htmlContent = await automation.fetchWebContent('https://example.com');
    console.log('HTML取得完了');
    
    // Step 2: HTMLからテキストを抽出
    const textContent = automation.extractTextFromHTML(htmlContent);
    console.log('テキスト抽出完了:', textContent.substring(0, 100) + '...');
    
    // Step 3: MulmoScriptを生成
    const mulmoScript = await automation.generateMulmoScript(textContent, 'ghibli');
    console.log('MulmoScript生成完了');
    
    // Step 4: ファイルに保存
    const scriptPath = await automation.saveMulmoScript(
      mulmoScript, 
      'custom-script.json'
    );
    
    // Step 5: 個別にメディアを生成
    await automation.generateAudio(scriptPath);
    await automation.generateImages(scriptPath);
    await automation.generateVideo(scriptPath);
  };
  
  // 5. エラーハンドリングの詳細例
  const errorHandlingExample = async () => {
    require('dotenv').config();
    const MulmocastAutomation = require('../mulmocast-automation');
    
    const automation = new MulmocastAutomation();
    
    try {
      const result = await automation.generateContentFromURL(
        'https://invalid-url-example.com'
      );
    } catch (error) {
      // エラーの種類に応じた処理
      if (error.message.includes('URL取得失敗')) {
        console.error('URLにアクセスできません');
      } else if (error.message.includes('OpenAI API')) {
        console.error('APIキーを確認してください');
      } else if (error.message.includes('mulmo')) {
        console.error('mulmocastのインストールを確認してください');
      } else {
        console.error('予期しないエラー:', error);
      }
    }
  };
  
  // 6. プログレス監視付きの例
  const progressMonitoringExample = async () => {
    require('dotenv').config();
    const MulmocastAutomation = require('../mulmocast-automation');
    const EventEmitter = require('events');
    
    // プログレス監視用のカスタムクラス
    class MulmocastWithProgress extends MulmocastAutomation {
      constructor(config) {
        super(config);
        this.events = new EventEmitter();
      }
      
      async generateContentFromURL(url, options) {
        this.events.emit('start', { url });
        
        try {
          // 各ステップでイベントを発火
          this.events.emit('progress', { step: 'fetch', percent: 10 });
          const htmlContent = await this.fetchWebContent(url);
          
          this.events.emit('progress', { step: 'extract', percent: 20 });
          const textContent = this.extractTextFromHTML(htmlContent);
          
          this.events.emit('progress', { step: 'generate', percent: 30 });
          const mulmoScript = await this.generateMulmoScript(textContent, options.style);
          
          // ... 続く
          
          this.events.emit('complete', { url });
          return result;
        } catch (error) {
          this.events.emit('error', { url, error });
          throw error;
        }
      }
    }
    
    // 使用例
    const automation = new MulmocastWithProgress();
    
    // イベントリスナーを設定
    automation.events.on('progress', (data) => {
      console.log(`進捗: ${data.step} - ${data.percent}%`);
    });
    
    automation.events.on('complete', (data) => {
      console.log('完了:', data.url);
    });
    
    await automation.generateContentFromURL('https://example.com', {
      style: 'ghibli'
    });
  };
  
  // 7. Express.jsアプリに組み込む例
  const expressIntegrationExample = () => {
    const express = require('express');
    const MulmocastAutomation = require('../mulmocast-automation');
    
    const app = express();
    const automation = new MulmocastAutomation();
    
    app.use(express.json());
    
    // シンプルなエンドポイント
    app.post('/generate', async (req, res) => {
      const { url, style = 'ghibli' } = req.body;
      
      try {
        const result = await automation.generateContentFromURL(url, { style });
        res.json({ success: true, ...result });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    app.listen(3001, () => {
      console.log('Server running on port 3001');
    });
  };
  
  // 実行する場合
  if (require.main === module) {
    // 使いたい例を選んで実行
    basicExample();
    // batchProcessExample();
    // individualMethodsExample();
    // など
  }