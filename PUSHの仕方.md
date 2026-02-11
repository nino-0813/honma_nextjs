# なぜプッシュできないか

---

## 今すぐやること（これだけやればOK）

**ターミナルを開いて、下のコマンドを「1つずつ」貼り付けて Enter で実行してください。2つを同時に貼るとエラーになります。**

**① まずこれだけ（Enter で実行）**
```bash
cd /Users/yusukeninomiya/Downloads
```

**② 次にこれだけ**
```bash
git clone https://github.com/nino-0813/honma_ec.git honma_ec_work
```

**③ 次にこれだけ**
```bash
cd /Users/yusukeninomiya/Downloads/honma_ec_work
```

**④ 次にこれだけ**
```bash
rsync -a --exclude='.git' ../honma_ec-main/ .
```

**⑤ 次にこれだけ**
```bash
git add -A && git status
```

**⑥ 最後にこれだけ**
```bash
git commit -m "fix: SSG ビルド時の localStorage 未定義エラーを修正 (useAdmin)" && git push origin main
```

- 初回の `git push` で GitHub の **ユーザー名** と **パスワード** を聞かれたら、パスワードの代わりに **Personal Access Token** を入力する。
- 終わったら、**Cursor で `honma_ec_work` フォルダを開き直す**。今後はここで編集して `git add` → `commit` → `push` すればプッシュできます。

---

## 原因

**いま開いているフォルダ `honma_ec-main` に `.git` がありません。**

- このフォルダは **ZIP でダウンロード** したり **「Code → Download ZIP」** で取得した場合、Git の履歴（`.git`）が含まれません。
- 以前「クローンした .git をコピーした」場合でも、別のワークスペースや別のマシンだと、いまのフォルダには `.git` が残っていないことがあります。
- `.git` がないと `git push` は使えず、`git status` で「fatal: not a git repository」になります。

---

## 対処法（2パターン）

### 方法A: いまのフォルダを「リポジトリ化」してプッシュする（おすすめ）

ターミナルで以下を**順番に**実行してください。

```bash
cd /Users/yusukeninomiya/Downloads/honma_ec-main

# 1. リポジトリをクローン（別名のフォルダに）
git clone https://github.com/nino-0813/honma_ec.git ../honma_ec_repo
cd ../honma_ec_repo

# 2. いまのフォルダの内容で上書き（.git 以外）
rsync -a --exclude='.git' ../honma_ec-main/ .

# 3. 変更をコミットしてプッシュ
git add -A
git status
git commit -m "fix: SSG ビルド時の localStorage 未定義エラーを修正 (useAdmin)"
git push origin main
```

これで `nino-0813/honma_ec` の `main` にプッシュできます。  
今後は **`honma_ec_repo` フォルダ** を Cursor で開いて編集・プッシュするとスムーズです。

---

### 方法B: 最初から「クローンしたフォルダ」で作業する

1. **GitHub の「Code」→「HTTPS」の URL をコピー**
   - 例: `https://github.com/nino-0813/honma_ec.git`

2. **クローンする**
   ```bash
   cd /Users/yusukeninomiya/Downloads
   git clone https://github.com/nino-0813/honma_ec.git honma_ec_work
   cd honma_ec_work
   ```

3. **いまの honma_ec-main の変更（useAdmin の修正など）をコピー**
   - `honma_ec-main/hooks/useAdmin.ts` を `honma_ec_work/hooks/useAdmin.ts` に上書きコピーする

4. **プッシュ**
   ```bash
   git add -A
   git commit -m "fix: SSG ビルド時の localStorage 未定義エラーを修正"
   git push origin main
   ```

---

## プッシュ時に「Permission denied」や「Authentication failed」が出る場合

- **HTTPS** で push する場合: GitHub の **Personal Access Token (PAT)** が求められます。パスワードでは push できません。  
  GitHub → Settings → Developer settings → Personal access tokens でトークンを作成し、パスワードの代わりにそのトークンを入力してください。
- **SSH** で push する場合: `git@github.com:nino-0813/honma_ec.git` を remote に設定し、SSH 鍵を GitHub に登録している必要があります。

---

## まとめ

| 状況 | 理由 |
|------|------|
| `fatal: not a git repository` | このフォルダに `.git` がない（ZIP/ダウンロード由来など） |
| `Permission denied` / `Authentication failed` | GitHub の認証（PAT または SSH）が必要 |
| `Updates were rejected` | リモートより手元が古い。`git pull --rebase origin main` してから再度 `git push` |

**今のフォルダでプッシュしたい場合は、まず「方法A」でクローンしたフォルダに内容を合わせて、そこで push してください。**
