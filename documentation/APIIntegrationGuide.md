# MulmocastAutomation API統合ガイド

## 概要

`MulmocastAutomation`は、単なるCLIツールではなく、**再利用可能なNode.jsモジュール**として設計されています。これにより、他のアプリケーションに組み込んで使用できます。

## なぜAPIとして使うのか？

### 1. **既存アプリへの統合**
```javascript
// 例：ブログシステムに組み込む
const BlogSystem = require('./blog-system');
const MulmocastAutomation = require('./mulmocast-automation');

const automation = new MulmocastAutomation();

// ブログ記事を投稿したら自動で動画も生成
BlogSystem.on('articlePublished', async (article) => {
  const result = await automation.generateContentFromURL(
    article.url,
    { style: 'news' }
  );
  // 生成された動画をブログに埋め込む
  await BlogSystem.attachVideo(article.id, result.videoPath);
});
```

### 2. **スケジュール実行**
```javascript
// 例：毎朝ニュースサイトから動画を生成
const cron = require('node-cron');
const MulmocastAutomation = require('./mulmocast-automation');

const automation = new MulmocastAutomation();

// 毎朝9時に実行
cron.schedule('0 9 * * *', async () => {
  const newsUrls = await fetchTodaysNewsUrls();
  
  for (const url of newsUrls) {
    await automation.generateContentFromURL(url, {
      style: 'news'
    });
  }
});
```

### 3. **Webhook連携**
```javascript
// 例：GitHubのWebhookと連携
app.post('/webhook/github', async (req, res) => {
  const { repository, action } = req.body;
  
  if (action === 'release') {
    // リリースノートから動画を生成
    const releaseUrl = `${repository.html_url}/releases/latest`;
    await automation.generateContentFromURL(releaseUrl, {
      style: 'business'
    });
  }
  
  res.json({ status: 'ok' });
});
```

## 主要メソッドの詳細

### コンストラクタ
```javascript
new MulmocastAutomation(config)
```

**パラメータ：**
- `config.outputDir` (string) - 出力ディレクトリ（デフォルト: './output'）
- `config.bgmPath` (string) - BGMファイルパス（デフォルト: 環境変数から）

### generateContentFromURL
```javascript
await automation.generateContentFromURL(url, options)
```

**パラメータ：**
- `url` (string) - 処理するWebページのURL
- `options.style` (string) - スタイル ('ghibli', 'business', 'education', 'news')
- `options.subtitles` (boolean/string) - 字幕オプション

**戻り値：**
```javascript
{
  scriptPath: string,  // 生成されたMulmoScriptのパス
  outputDir: string,   // 出力ディレクトリ
  timestamp: string    // タイムスタンプ
}
```

## 実践的な使用例

### 1. Slackボット統合
```javascript
const { App } = require('@slack/bolt');
const MulmocastAutomation = require('./mulmocast-automation');

const slackApp = new App({ /* config */ });
const automation = new MulmocastAutomation();

// スラッシュコマンド: /create-video https://example.com
slackApp.command('/create-video', async ({ command, ack, say }) => {
  await ack();
  
  const url = command.text;
  say(`動画を生成中... :movie_camera:`);
  
  try {
    const result = await automation.generateContentFromURL(url);
    say(`動画が完成しました！ :tada:\nファイル: ${result.scriptPath.replace('.json', '.mp4')}`);
  } catch (error) {
    say(`エラーが発生しました: ${error.message}`);
  }
});
```

### 2. REST API化
```javascript
// api-server.js
const express = require('express');
const MulmocastAutomation = require('./mulmocast-automation');

const app = express();
const automation = new MulmocastAutomation();

// POST /api/v1/generate
app.post('/api/v1/generate', async (req, res) => {
  const { url, style = 'ghibli', webhook } = req.body;
  
  // 非同期処理
  res.json({ 
    message: 'Processing started',
    jobId: generateJobId() 
  });
  
  // バックグラウンドで処理
  automation.generateContentFromURL(url, { style })
    .then(result => {
      // Webhookで完了通知
      if (webhook) {
        axios.post(webhook, { 
          status: 'completed',
          result 
        });
      }
    })
    .catch(error => {
      if (webhook) {
        axios.post(webhook, { 
          status: 'failed',
          error: error.message 
        });
      }
    });
});
```

### 3. CLIラッパー
```javascript
#!/usr/bin/env node
// my-video-generator.js

const program = require('commander');
const MulmocastAutomation = require('./mulmocast-automation');

const automation = new MulmocastAutomation();

program
  .version('1.0.0')
  .command('generate <url>')
  .option('-s, --style <style>', 'style', 'ghibli')
  .option('--no-subtitles', 'disable subtitles')
  .action(async (url, options) => {
    try {
      console.log('🎬 動画生成を開始します...');
      const result = await automation.generateContentFromURL(url, {
        style: options.style,
        subtitles: options.subtitles
      });
      console.log('✅ 完了:', result);
    } catch (error) {
      console.error('❌ エラー:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
```

## エラーハンドリング

```javascript
try {
  await automation.generateContentFromURL(url);
} catch (error) {
  if (error.message.includes('OPENAI_API_KEY')) {
    // APIキー関連のエラー
  } else if (error.message.includes('URL取得')) {
    // ネットワークエラー
  } else if (error.message.includes('MulmoScript')) {
    // スクリプト生成エラー
  } else if (error.message.includes('mulmo')) {
    // mulmocast CLIエラー
  }
}
```

## パフォーマンス考慮事項

### 並列処理
```javascript
// ❌ 順次処理（遅い）
for (const url of urls) {
  await automation.generateContentFromURL(url);
}

// ✅ 並列処理（速いが、API制限に注意）
const promises = urls.map(url => 
  automation.generateContentFromURL(url)
);
await Promise.all(promises);

// ✅ 制限付き並列処理（推奨）
const pLimit = require('p-limit');
const limit = pLimit(2); // 同時に2つまで

const promises = urls.map(url => 
  limit(() => automation.generateContentFromURL(url))
);
await Promise.all(promises);
```

## まとめ

`MulmocastAutomation`をAPIとして使うことで：

1. **自動化** - 他のシステムと連携して自動実行
2. **統合** - 既存のワークフローに組み込み
3. **拡張** - カスタム機能の追加
4. **スケーラビリティ** - 複数のインスタンスで並列処理

が可能になります。単なるCLIツールを超えて、動画生成を自動化するための強力なビルディングブロックとして活用できます。