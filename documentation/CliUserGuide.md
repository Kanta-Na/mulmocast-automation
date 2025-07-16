# CLI使用時の注意点とトラブルシューティング

## URLの指定方法

### 基本的な使い方
```bash
node mulmocast-automation.js <URL> [オプション]
```

### URLに特殊文字が含まれる場合

**問題のある例：**
```bash
# ❌ エラーになる（?が含まれている）
node mulmocast-automation.js https://example.com/page?id=123

# ❌ エラーになる（&が含まれている）
node mulmocast-automation.js https://example.com/page?id=123&type=article
```

**正しい使い方：**
```bash
# ✅ シングルクォートで囲む
node mulmocast-automation.js 'https://example.com/page?id=123&type=article'

# ✅ ダブルクォートで囲む
node mulmocast-automation.js "https://example.com/page?id=123&type=article"
```

## エラーと対処法

### 1. zsh: no matches found
**原因：** URLに`?`、`&`、`*`などの特殊文字が含まれている
**解決：** URLを引用符で囲む

### 2. OpenAIError: The OPENAI_API_KEY environment variable is missing
**原因：** 環境変数が読み込まれていない
**解決：** 
- `.env`ファイルが存在することを確認
- `.env`ファイルに`OPENAI_API_KEY=sk-xxxxx`が記載されていることを確認
- mulmocast-automation.jsの先頭に`require('dotenv').config();`があることを確認

### 3. Command failed: mulmo audio
**原因：** mulmocastがインストールされていない、またはAPIキーエラー
**解決：**
```bash
# mulmocastのインストール確認
mulmo --version

# インストールされていない場合
npm install -g mulmocast
```

## 完全な実行例

```bash
# 1. プロジェクトディレクトリに移動
cd mulmocast-automation

# 2. 環境変数の確認
cat .env
# OPENAI_API_KEY=sk-xxxxx が表示されることを確認

# 3. 実行（URLは引用符で囲む）
node mulmocast-automation.js "https://www.enoteca.co.jp/article/archives/13365/?td_seg=tds990077tds773385" --style ghibli --subtitles

# 4. 進捗を確認
# コンソールに以下のようなメッセージが表示される：
# URLからコンテンツを取得中...
# MulmoScriptを生成中...
# 音声を生成中...
# 画像を生成中...
# 動画を生成中...
# ✅ コンテンツ生成が完了しました！

# 5. 結果の確認
ls output/
# script_*.json, script_*.mp3, script_*.mp4 などが生成される
```

## デバッグモード

詳細なログを見たい場合：
```bash
# verboseオプションを追加（未実装ですが、将来的に追加可能）
node mulmocast-automation.js "https://example.com" --style ghibli --verbose
```

## バッチ処理

複数のURLを処理する場合のシェルスクリプト例：

```bash
#!/bin/bash
# batch-process.sh

urls=(
  "https://example1.com/article?id=1"
  "https://example2.com/page?type=news"
  "https://example3.com/content?lang=ja"
)

for url in "${urls[@]}"; do
  echo "Processing: $url"
  node mulmocast-automation.js "$url" --style ghibli
  sleep 5  # API制限を避けるため
done
```