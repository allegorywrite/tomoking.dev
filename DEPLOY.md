# tomoking.devへのデプロイ手順

このドキュメントでは、tomoking.devドメインにHugoサイトをデプロイする手順を説明します。

## 1. GitHubリポジトリの作成

1. [GitHub](https://github.com/) にログイン
2. 右上の「+」ボタンをクリックし、「New repository」を選択
3. リポジトリ名を入力（例: `tomoking.dev`）
4. 説明を入力（任意）
5. リポジトリの可視性を選択（Public または Private）
6. 「Create repository」をクリック

## 2. ローカルリポジトリの初期化とプッシュ

```bash
# 現在のディレクトリでGitリポジトリを初期化
git init

# すべてのファイルをステージング
git add .

# 最初のコミットを作成
git commit -m "Initial commit"

# リモートリポジトリを追加（URLは作成したGitHubリポジトリのものに置き換えてください）
git remote add origin https://github.com/allegorywrite/tomoking.dev.git

# メインブランチをプッシュ
git push -u origin main
```

注意: GitHubのデフォルトブランチが `main` ではなく `master` の場合は、最後のコマンドを `git push -u origin master` に変更してください。

## 3. Netlifyでのデプロイ

1. [Netlify](https://app.netlify.com/) にログイン
2. 「New site from Git」をクリック
3. 「GitHub」を選択
4. 作成したリポジトリを選択
5. ビルド設定を構成:
   - ビルドコマンド: `hugo --gc --minify`
   - 公開ディレクトリ: `public`
6. 「Deploy site」をクリック

## 4. カスタムドメイン(tomoking.dev)の設定

### 4.1. Netlifyでカスタムドメインを追加

1. Netlifyのサイト設定で「Domain settings」を選択
2. 「Add custom domain」をクリック
3. `tomoking.dev` を入力して追加
4. 「Verify」をクリック

### 4.2. DNSレコードの設定

#### オプション1: Netlifyのネームサーバーを使用する（推奨）

1. Netlifyの「Domain settings」で「Set up Netlify DNS」をクリック
2. 画面の指示に従って設定を完了
3. Netlifyが提供するネームサーバーをメモ
4. ドメインレジストラ（お使いのドメイン管理サービス）の管理画面にログイン
5. ネームサーバーの設定を変更し、Netlifyのネームサーバーを設定

#### オプション2: 既存のDNSプロバイダーを使用する

1. ドメインのDNS管理画面にアクセス
2. 以下のDNSレコードを追加:
   - タイプ: CNAME
   - 名前: www（またはサブドメインなし）
   - 値: `[your-netlify-site-name].netlify.app`（Netlifyで割り当てられたサブドメイン）
   - TTL: 3600（または推奨値）

### 4.3. HTTPSの設定

1. Netlifyの「Domain settings」で「HTTPS」タブを選択
2. 「Verify DNS configuration」をクリック
3. DNS設定が正しければ、「Provision certificate」をクリック
4. Let's Encryptの証明書が自動的に発行されます

## 5. デプロイの確認

1. ブラウザで `https://tomoking.dev` にアクセス
2. サイトが正しく表示されることを確認

## トラブルシューティング

### DNSの伝播待ち

DNSの変更が反映されるまでに最大48時間かかることがあります。しばらく待ってからアクセスしてみてください。

### Netlifyのビルドエラー

Netlifyのデプロイログを確認して、エラーの原因を特定してください。一般的な問題:

- Hugoのバージョンの不一致
- 依存関係の問題
- ビルドコマンドの誤り

### HTTPS証明書の問題

DNSの設定が正しく行われていないと、HTTPS証明書の発行に失敗することがあります。DNSの設定を確認してください。
