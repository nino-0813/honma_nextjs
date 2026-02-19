#!/bin/bash
# このスクリプトを実行すると、クローン → コピー → コミット → プッシュまで一気にやります。
# スクリプトがあるフォルダ（honma_ec-main）の「ひとつ上」に honma_ec_work を作ります。
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
echo "作業フォルダ: $PARENT_DIR"
cd "$PARENT_DIR"
if [ ! -d honma_ec_work ]; then
  echo "1/4 クローン中..."
  git clone https://github.com/nino-0813/honma_ec.git honma_ec_work
else
  echo "1/4 honma_ec_work は既にあります。スキップします。"
fi
echo "2/4 ファイルをコピー中..."
cd honma_ec_work
rsync -a --exclude='.git' "$SCRIPT_DIR"/ .
echo "3/4 コミット中..."
git add -A
if git diff --cached --quiet; then
  echo "変更なし。プッシュはスキップします。"
else
  git commit -m "fix: SSG ビルド時の localStorage 未定義エラーを修正 (useAdmin)"
  echo "4/4 プッシュ中..."
  git push origin main
  echo "完了しました。今後は honma_ec_work フォルダで作業してください。"
fi
