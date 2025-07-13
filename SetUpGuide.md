# Mulmocast自動化システム セットアップガイド

このガイドでは、HPのURLを入力するだけで自動的にMulmoScriptを生成し、動画コンテンツを作成するシステムの構築方法を説明します。

## 必要な環境

- Node.js (v18以上推奨)
- Git
- ffmpeg
- OpenAI APIキー

## セットアップ手順

### 1. 必要なツールのインストール

#### ffmpegのインストール
```bash
# macOS (Homebrew)
brew install ffmpeg

# Windows
# https://ffmpeg.org/download.html からダウンロードしてインストール

# Linux
sudo apt update
sudo apt install ffmpeg
```

#### Node.jsのインストール
```bash
# 公式サイトからインストール
# https://nodejs.org/
```

### 2. Mulmocast-cliのインストール

```bash
# GitHubからクローン
git clone https://github.com/receptron/mulmocast-cli.git
cd mulmocast-cli

# 依存関係のインストール
npm install

# グローバルにインストール
npm install -g .
```

### 3. 自動化スクリプトのセットアップ

```bash
# プロジェクトディレクトリを作成
mkdir mulmocast-automation
cd mulmocast-automation

# package.jsonを初期化
npm init -y

# 必要なパッケージをインストール
npm install openai axios
```

### 4. 環境変数の設定

`.env`ファイルを作成し、以下の内容を記入：

```env
# OpenAI API設定
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_ORG_ID=your-organization-id-here

# BGMファイルのパス（オプション）
PATH_BGM=./assets/music/bgm.mp3
```

### 5. 自動化スクリプトの配置

プロジェクトディレクトリに以下のファイルを配置します：
- `mulmocast-automation.js` - メインの自動化スクリプト
- `server.js` - Web APIサーバー
- `package.json` - 依存関係定義
- `test-automation.js` - テストスクリプト

### 6. publicディレクトリの作成とWebインターフェース

```bash
# publicディレクトリを作成
mkdir public

# index.htmlをpublicディレクトリに配置
# （上記で作成したHTMLファイルをpublic/index.htmlとして保存）
```

### 7. 依存関係のインストール

```bash
# package.jsonの内容で依存関係をインストール
npm install

# 初期セットアップ（.envファイルの作成）
npm run setup
```

## 使い方

### 方法1: コマンドライン（CLI）から使用

```bash
# URLを指定してコンテンツを生成
node mulmocast-automation.js https://example.com
```

### 方法2: Web インターフェースから使用

```bash
# APIサーバーを起動
npm start

# ブラウザで以下のURLを開く
http://localhost:3000
```

Webインターフェースでは：
1. URLを入力
2. スタイルを選択（ジブリ風、ビジネス、教育、ニュース）
3. 必要に応じて字幕オプションを選択
4. 「コンテンツを生成」ボタンをクリック
5. リアルタイムで進捗を確認

### 方法3: APIとして使用

```bash
# APIサーバーを起動
npm start

# 別のアプリケーションからAPIを呼び出し
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "style": "ghibli", "subtitles": true}'
```

### オプション付きの使用方法

```bash
# ジブリスタイルで字幕付き動画を生成
node mulmocast-automation.js https://example.com --style ghibli --subtitles

# ビジネススタイルで生成
node mulmocast-automation.js https://example.com --style business
```

### プログラムから使用する場合

```javascript
const MulmocastAutomation = require('./mulmocast-automation');

async function main() {
  const automation = new MulmocastAutomation({
    outputDir: './my-output',
    bgmPath: './my-bgm.mp3'
  });

  const result = await automation.generateContentFromURL(
    'https://example.com',
    {
      style: 'ghibli',
      subtitles: 'ja'
    }
  );

  console.log('生成完了:', result);
}

main();
```

## 高度な使い方

### カスタムスタイルの追加

`mulmocast-automation.js`の`createMulmoScriptPrompt`メソッドを編集して、独自のスタイルを追加できます：

```javascript
// 例：教育コンテンツスタイル
case 'education':
  return '教育的なアニメーション、分かりやすい図解、明るい色彩';
```

### バッチ処理

複数のURLを一度に処理する場合：

```javascript
const urls = [
  'https://example1.com',
  'https://example2.com',
  'https://example3.com'
];

for (const url of urls) {
  await automation.generateContentFromURL(url);
  console.log(`${url} の処理が完了`);
}
```

## トラブルシューティング

### よくある問題と解決方法

1. **ffmpegが見つからない**
   - PATHにffmpegが追加されているか確認
   - `ffmpeg -version`でインストールを確認

2. **OpenAI APIエラー**
   - APIキーが正しく設定されているか確認
   - APIの利用制限に達していないか確認

3. **動画生成が失敗する**
   - 音声ファイルと画像ファイルが正しく生成されているか確認
   - outputディレクトリの権限を確認

4. **メモリ不足エラー**
   - Node.jsのメモリ制限を増やす：
   ```bash
   node --max-old-space-size=4096 mulmocast-automation.js <URL>
   ```

## 追加の最適化案

### 1. Webスクレイピングの改善

より正確なコンテンツ抽出のために、以下のライブラリを使用できます：

```bash
npm install cheerio puppeteer
```

### 2. キャッシュ機能の実装

同じURLの再処理を避けるために、生成されたMulmoScriptをキャッシュする機能を追加できます。

### 3. Webhook統合

生成完了時にSlackやDiscordに通知を送る機能を追加できます。

### 4. Web UI の拡張

提供されているWeb UIをさらに拡張できます：

- **認証機能**: ユーザーログインとAPIキー管理
- **バッチ処理UI**: 複数URLの一括処理
- **プレビュー機能**: 生成された動画の即時プレビュー
- **テンプレート管理**: カスタムMulmoScriptテンプレートの保存・再利用
- **統計ダッシュボード**: 生成履歴と使用統計の表示

### 5. Dockerイメージの作成

環境構築を簡単にするDockerfile：

```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg git
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 注意事項

- OpenAI APIの利用には料金が発生します
- 画像生成・音声生成にも追加のAPI料金がかかる場合があります
- 著作権に注意して、適切な権限のあるコンテンツのみを処理してください
- 大量のリクエストを送る場合は、レート制限に注意してください

## 関連リンク

- [Mulmocast-cli GitHub](https://github.com/receptron/mulmocast-cli)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [MulmoScript仕様](https://github.com/receptron/mulmocast-cli/tree/main/scripts)