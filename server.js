// server.js
// Mulmocast Web APIサーバー

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const MulmocastAutomation = require('./mulmocast-automation');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/output', express.static('output'));

// ジョブ管理（実際の実装ではRedisやデータベースを使用）
const jobs = new Map();

// Mulmocast自動化インスタンス
const automation = new MulmocastAutomation();

// ジョブステータス
const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// ルートページ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// APIエンドポイント: コンテンツ生成開始
app.post('/api/generate', async (req, res) => {
  const { url, style = 'ghibli', subtitles = false } = req.body;

  // URLバリデーション
  if (!url || !url.match(/^https?:\/\/.+/)) {
    return res.status(400).json({ 
      error: '有効なURLを指定してください' 
    });
  }

  // ジョブIDを生成
  const jobId = uuidv4();
  
  // ジョブを登録
  jobs.set(jobId, {
    id: jobId,
    url,
    style,
    subtitles,
    status: JobStatus.PENDING,
    progress: 0,
    message: '処理を開始しています',
    createdAt: new Date(),
    result: null
  });

  // 非同期でコンテンツ生成を開始
  processJob(jobId, url, { style, subtitles });

  // ジョブIDを返す
  res.json({ 
    jobId,
    message: 'ジョブを開始しました',
    statusUrl: `/api/status/${jobId}`
  });
});

// APIエンドポイント: ジョブステータス確認
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ 
      error: 'ジョブが見つかりません' 
    });
  }

  res.json(job);
});

// APIエンドポイント: 生成されたファイルのリスト取得
app.get('/api/files/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job || job.status !== JobStatus.COMPLETED) {
    return res.status(404).json({ 
      error: 'ファイルが見つかりません' 
    });
  }

  const { timestamp } = job.result;
  const files = {
    script: `/output/script_${timestamp}.json`,
    studio: `/output/script_${timestamp}_studio.json`,
    audio: `/output/script_${timestamp}.mp3`,
    video: `/output/script_${timestamp}.mp4`,
    images: `/output/images/script_${timestamp}/`,
    audioFiles: `/output/audio/script_${timestamp}/`
  };

  res.json(files);
});

// APIエンドポイント: Server-Sent Events でリアルタイム進捗
app.get('/api/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendProgress = () => {
    const job = jobs.get(jobId);
    if (job) {
      res.write(`data: ${JSON.stringify(job)}\n\n`);
      
      if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
        clearInterval(progressInterval);
        res.end();
      }
    }
  };

  const progressInterval = setInterval(sendProgress, 1000);

  req.on('close', () => {
    clearInterval(progressInterval);
  });
});

// 非同期ジョブ処理
async function processJob(jobId, url, options) {
  const job = jobs.get(jobId);
  
  try {
    console.log(`ジョブ ${jobId} を開始: URL=${url}`);
    
    // ステータス更新: 処理中
    updateJob(jobId, {
      status: JobStatus.PROCESSING,
      progress: 10,
      message: 'URLからコンテンツを取得中...'
    });

    // 各ステップにフックを追加して進捗を更新
    const progressHooks = {
      onFetchStart: () => updateJob(jobId, { progress: 10, message: 'URLからコンテンツを取得中...' }),
      onFetchComplete: () => updateJob(jobId, { progress: 20, message: 'コンテンツの解析中...' }),
      onScriptGenerateStart: () => updateJob(jobId, { progress: 30, message: 'MulmoScriptを生成中...' }),
      onScriptGenerateComplete: () => updateJob(jobId, { progress: 40, message: 'MulmoScriptの保存中...' }),
      onAudioStart: () => updateJob(jobId, { progress: 50, message: '音声を生成中...' }),
      onAudioComplete: () => updateJob(jobId, { progress: 60, message: '音声生成完了' }),
      onImageStart: () => updateJob(jobId, { progress: 70, message: '画像を生成中...' }),
      onImageComplete: () => updateJob(jobId, { progress: 80, message: '画像生成完了' }),
      onVideoStart: () => updateJob(jobId, { progress: 90, message: '動画を生成中...' }),
      onVideoComplete: () => updateJob(jobId, { progress: 95, message: '動画生成完了' })
    };

    // カスタマイズされた自動化インスタンス（実際の実装では progressHooks を使用）
    const result = await automation.generateContentFromURL(url, options);

    // ステータス更新: 完了
    updateJob(jobId, {
      status: JobStatus.COMPLETED,
      progress: 100,
      message: 'コンテンツ生成が完了しました',
      result
    });

  } catch (error) {
    console.error(`ジョブ ${jobId} でエラー発生:`, error);
    console.error('エラースタック:', error.stack);
    
    // ステータス更新: エラー
    updateJob(jobId, {
      status: JobStatus.FAILED,
      progress: 0,
      message: `エラー: ${error.message}`,
      error: error.message
    });
  }
}

// ジョブ情報を更新
function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (job) {
    jobs.set(jobId, { ...job, ...updates, updatedAt: new Date() });
  }
}

// 定期的に古いジョブをクリーンアップ（24時間以上経過）
setInterval(() => {
  const now = new Date();
  for (const [jobId, job] of jobs.entries()) {
    const age = now - job.createdAt;
    if (age > 24 * 60 * 60 * 1000) {
      jobs.delete(jobId);
    }
  }
}, 60 * 60 * 1000); // 1時間ごと

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'サーバーエラーが発生しました' 
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Mulmocast APIサーバーが起動しました`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\n使用方法:`);
  console.log(`1. ブラウザで http://localhost:${PORT} を開く`);
  console.log(`2. URLを入力してコンテンツを生成`);
  console.log(`\nAPI エンドポイント:`);
  console.log(`POST /api/generate - コンテンツ生成開始`);
  console.log(`GET  /api/status/:jobId - ジョブステータス確認`);
  console.log(`GET  /api/files/:jobId - 生成ファイル一覧`);
  console.log(`GET  /api/progress/:jobId - リアルタイム進捗（SSE）`);
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('\n👋 サーバーを停止します');
  process.exit(0);
});