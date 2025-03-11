# tomoking.dev

有田朋樹のポートフォリオサイト（https://tomoking.dev/）

## 概要

このリポジトリは、Hugoを使用して構築された有田朋樹のポートフォリオサイトのソースコードを含んでいます。

## 技術スタック

- [Hugo](https://gohugo.io/) - 静的サイトジェネレーター
- [LoveIt](https://github.com/dillonzq/LoveIt) - Hugoテーマ
- [Netlify](https://www.netlify.com/) - ホスティングプラットフォーム

## ローカル開発

### 前提条件

- [Hugo](https://gohugo.io/getting-started/installing/) (v0.145.0以上)
- [Git](https://git-scm.com/)

### セットアップ

1. リポジトリをクローン

```bash
git clone https://github.com/allegorywrite/tomoking.dev.git
cd tomoking.dev
```

2. ローカルサーバーを起動

```bash
hugo server -D
```

3. ブラウザで http://localhost:1313 にアクセス

### ビルド

```bash
hugo --gc --minify
```

ビルドされたサイトは `public` ディレクトリに生成されます。

## デプロイ

このサイトは [Netlify](https://www.netlify.com/) を使用してデプロイされています。

### Netlifyでのデプロイ手順

1. [Netlify](https://app.netlify.com/) にログイン
2. 「New site from Git」をクリック
3. GitHubを選択し、リポジトリを選択
4. ビルド設定:
   - ビルドコマンド: `hugo --gc --minify`
   - 公開ディレクトリ: `public`
5. 「Deploy site」をクリック

### カスタムドメインの設定

1. Netlifyのサイト設定で「Domain settings」を選択
2. 「Add custom domain」をクリック
3. `tomoking.dev` を入力して追加
4. DNSレコードを設定:
   - Netlifyのネームサーバーを使用する場合:
     - ドメインレジストラの管理画面でネームサーバーをNetlifyのものに変更
   - 既存のDNSプロバイダーを使用する場合:
     - CNAMEレコードを追加: `tomoking.dev` → `[your-netlify-site-name].netlify.app`
5. HTTPSを有効化（Netlifyが自動的に証明書を発行）

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下でライセンスされています。
