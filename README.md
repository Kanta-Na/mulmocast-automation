# Mulmocast 自動化システム

HPのURLを入力するだけで、MulmoScriptを自動生成し、動画・音声・画像などのマルチモーダルコンテンツを作成するシステムです。

## UI プレビュー

![Mulmocast Web UI](./images/ui-screenshot.png)

## 機能

- 🌐 WebサイトのURLからコンテンツを自動抽出
- 🤖 OpenAI APIを使用してMulmoScriptを生成
- 🎬 動画、音声、画像を自動生成
- 💻 CLIとWeb UIの両方で使用可能
- 📊 リアルタイムの進捗表示

## 必要な環境

- Node.js (v18以上)
- ffmpeg
- OpenAI APIキー
- mulmocast (`npm install -g mulmocast`)

## セットアップ

1. リポジトリをクローン
```bash
git clone [your-repo-url]
cd mulmocast-automation
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
cp .env.example .env
# .envファイルを編集してOpenAI APIキーを設定
```

4. mulmocastをインストール（まだの場合）
```bash
npm install -g mulmocast
```

## 使い方

### CLI版
```bash
# URLにクエリパラメータ（?や&）が含まれる場合は引用符で囲む
node mulmocast-automation.js "https://example.com/page?param=value" --style ghibli --subtitles

# シンプルなURLの場合
node mulmocast-automation.js https://example.com --style ghibli --subtitles
```

### Web UI版

Web UIを使用すると、ブラウザから簡単にコンテンツを生成できます：

```bash
npm start
# ブラウザで http://localhost:3000 を開く
```

![Web UI Screenshot](./images/ui-screenshot.png)

Web UIでは以下の操作が可能です：
- URLの入力
- スタイルの選択（ドロップダウンメニュー）
- 日本語字幕の追加オプション
- 生成されたコンテンツのダウンロード

### APIとして使用
```javascript
const MulmocastAutomation = require('./mulmocast-automation');

const automation = new MulmocastAutomation();
await automation.generateContentFromURL('https://example.com', {
  style: 'ghibli',
  subtitles: true
});
```

## スタイルオプション

- `ghibli` - ジブリ風アニメーション
- `business` - ビジネスプレゼンテーション
- `education` - 教育コンテンツ
- `news` - ニュース形式

## プロジェクト構造

```
mulmocast-automation/
├── mulmocast-automation.js    # メイン自動化スクリプト
├── server.js                  # Express APIサーバー
├── package.json               # 依存関係
├── test-automation.js         # テストスクリプト
├── public/
│   └── index.html            # Web UI
├── images/                    # スクリーンショット等
│   └── ui-screenshot.png
└── output/                    # 生成されたコンテンツ
```

## トラブルシューティング

### mulmoコマンドが見つからない
```bash
npm install -g mulmocast
```

### OpenAI APIエラー
- APIキーが正しく設定されているか確認
- 利用制限に達していないか確認

### ffmpegエラー
```bash
# macOS
brew install ffmpeg

# Windows
# https://ffmpeg.org/download.html からインストール
```

## ライセンス

MIT License

## 作者

[Your Name]

## 謝辞

- [Mulmocast](https://github.com/receptron/mulmocast-cli) by 中島聡さん
- OpenAI API
- その他の依存ライブラリ