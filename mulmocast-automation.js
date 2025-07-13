// mulmocast-automation.js
// HPのURLからMulmoScriptを生成し、自動でコンテンツを作成するスクリプト

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const OpenAI = require('openai');

// OpenAI APIの設定
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class MulmocastAutomation {
  constructor(config = {}) {
    this.outputDir = config.outputDir || './output';
    this.bgmPath = config.bgmPath || process.env.PATH_BGM || './assets/music/default_bgm.mp3';
  }

  // URLからコンテンツを取得
  async fetchWebContent(url) {
    try {
      console.log(`URLからコンテンツを取得中: ${url}`);
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`URLの取得に失敗しました: ${error.message}`);
    }
  }

  // HTMLからテキストコンテンツを抽出（簡易版）
  extractTextFromHTML(html) {
    // HTMLタグを除去して主要なテキストを抽出
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.substring(0, 3000); // 最初の3000文字を使用
  }

  // MulmoScriptを生成するプロンプト
  createMulmoScriptPrompt(content, style = 'ghibli') {
    const basePrompt = `
あなたはMulmoScriptを生成する専門家です。以下のコンテンツを基に、MulmoScript形式のJSONを生成してください。

【重要】以下の形式に厳密に従ってください。フィールドの追加や変更は行わないでください。

【コンテンツ】
${content.substring(0, 2000)}

【要求事項】
1. 必ず以下の構造に従うこと
2. beatsは3-5個程度にする
3. 各beatのtextは50-100文字程度
4. imagePromptは具体的で視覚的な描写にする

必ず以下の形式で生成してください（この形式以外は受け付けられません）：

{
  "$mulmocast": {
    "version": "1.0"
  },
  "title": "ここにタイトル",
  "lang": "ja",
  "beats": [
    {
      "text": "ここにナレーションテキスト",
      "imagePrompt": "ここに画像生成用のプロンプト（${style === 'ghibli' ? 'ジブリ風アニメーション' : 'ビジネスプレゼンテーション'}スタイルで）"
    }
  ]
}

JSONのみを返してください。説明文や追加のテキストは不要です。
`;
    return basePrompt;
  }

  // OpenAI APIを使用してMulmoScriptを生成
  async generateMulmoScript(content, style = 'ghibli') {
    try {
      console.log('MulmoScriptを生成中...');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",  // より安価で高速なモデル
        messages: [
          {
            role: "system",
            content: "あなたはMulmoScriptを生成する専門家です。必ず有効なJSON形式のみで回答し、余計な説明は含めないでください。"
          },
          {
            role: "user",
            content: this.createMulmoScriptPrompt(content, style)
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }  // JSON形式を強制
      });

      const mulmoScript = JSON.parse(completion.choices[0].message.content);
      
      // 検証：必須フィールドの確認
      if (!mulmoScript.$mulmocast || !mulmoScript.beats || !Array.isArray(mulmoScript.beats)) {
        throw new Error('生成されたMulmoScriptの形式が正しくありません');
      }
      
      console.log('生成されたMulmoScript:', JSON.stringify(mulmoScript, null, 2));
      return mulmoScript;
    } catch (error) {
      throw new Error(`MulmoScript生成エラー: ${error.message}`);
    }
  }

  // MulmoScriptをファイルに保存
  async saveMulmoScript(script, filename) {
    const filepath = path.join(this.outputDir, filename);
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(script, null, 2));
    console.log(`MulmoScriptを保存しました: ${filepath}`);
    return filepath;
  }

  // mulmo コマンドを実行
  async executeMulmoCommand(command) {
    try {
      console.log(`実行中: ${command}`);
      const { stdout, stderr } = await execPromise(command, {
        env: { ...process.env },
        cwd: process.cwd(),
        shell: true  // Windowsでの互換性のため追加
      });
      
      if (stderr && !stderr.includes('Warning')) {
        console.warn('警告:', stderr);
      }
      
      console.log('stdout:', stdout);
      return stdout;
    } catch (error) {
      console.error('コマンド実行エラーの詳細:', error);
      throw new Error(`コマンド実行エラー: ${error.message}\nstderr: ${error.stderr}\nstdout: ${error.stdout}`);
    }
  }

  // 音声を生成
  async generateAudio(scriptPath) {
    console.log('音声を生成中...');
    const command = `mulmo audio ${scriptPath}`;
    await this.executeMulmoCommand(command);
  }

  // 画像を生成
  async generateImages(scriptPath) {
    console.log('画像を生成中...');
    const command = `mulmo images ${scriptPath}`;  // image → images に修正
    await this.executeMulmoCommand(command);
  }

  // 動画を生成
  async generateVideo(scriptPath, options = {}) {
    console.log('動画を生成中...');
    let command = `mulmo movie ${scriptPath}`;
    
    if (options.subtitles === 'ja') {
      command += ' -c ja';
    }
    
    await this.executeMulmoCommand(command);
  }

  // メイン処理：URLからコンテンツを自動生成
  async generateContentFromURL(url, options = {}) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const scriptFilename = `script_${timestamp}.json`;

      // 1. URLからコンテンツを取得
      const htmlContent = await this.fetchWebContent(url);
      const textContent = this.extractTextFromHTML(htmlContent);
      
      // 2. MulmoScriptを生成
      const mulmoScript = await this.generateMulmoScript(textContent, options.style || 'ghibli');
      
      // 3. MulmoScriptを保存
      const scriptPath = await this.saveMulmoScript(mulmoScript, scriptFilename);
      
      // 4. 音声を生成
      await this.generateAudio(scriptPath);
      
      // 5. 画像を生成
      await this.generateImages(scriptPath);
      
      // 6. 動画を生成
      await this.generateVideo(scriptPath, options);
      
      console.log('✅ コンテンツ生成が完了しました！');
      console.log(`出力ディレクトリ: ${this.outputDir}`);
      
      return {
        scriptPath,
        outputDir: this.outputDir,
        timestamp
      };
    } catch (error) {
      console.error('❌ エラーが発生しました:', error.message);
      throw error;
    }
  }
}

// CLIとして実行する場合
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('使用方法: node mulmocast-automation.js <URL> [options]');
    console.log('オプション:');
    console.log('  --style <style>  : スタイル (ghibli または business)');
    console.log('  --subtitles      : 字幕を追加');
    process.exit(1);
  }

  const url = args[0];
  const options = {
    style: 'ghibli',
    subtitles: false
  };

  // オプションをパース
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--style' && args[i + 1]) {
      options.style = args[i + 1];
      i++;
    } else if (args[i] === '--subtitles') {
      options.subtitles = 'ja';
    }
  }

  // 自動化処理を実行
  const automation = new MulmocastAutomation();
  automation.generateContentFromURL(url, options)
    .then(() => {
      console.log('処理が完了しました！');
    })
    .catch((error) => {
      console.error('エラー:', error);
      process.exit(1);
    });
}

module.exports = MulmocastAutomation;