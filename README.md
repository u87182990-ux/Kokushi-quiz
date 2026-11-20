# 国試ドリル

診療放射線技師国家試験の過去問クイズ（第67〜78回 全2,400問・解説つき）と、対策問題集（オリジナル270問）。
ニックネーム＋4ケタの数字でログインすると、記録がクラウド（Supabase）に保存され、どの端末からでも続きから使えます。

- `index.html` … トップ（ログイン画面）
- `kakomon/` … 過去問クイズ
- `prep/` … 対策問題集
- `ikougaku/`・`kisoi/`・`sugiura/` … 追加ドリル（トップの「追加ドリル」→「えらぶ」で、使う人だけ自分のメニューに出す。一覧は index.html の EXTRA）
- `shared/config.js` … Supabase の URL と anon キー
- `shared/account.js` … ニックネームで保存するしくみ
- `supabase.sql` … Supabase の SQL Editor で1回だけ実行するもの
- `tools/mksite.py` … Claude のページ版からサイト版を作り直すスクリプト

## いつも最新版が出るしくみ（ホーム画面に追加して使う人むけ）

- `sw.js` … サービスワーカー。ページ・問題データ・JS は毎回ネットから最新を取り、つながらない時だけ控えを使う（画像は控え優先）。Supabase の通信にはさわらない。
- `shared/update.js` … 全ページで読みこむ。ホーム画面のアプリにもどった時にサイトが変わっていないか確かめ、5分以上はなれていたら自動で読みこみ直し、短い時は「新しい版があります」を出す。
- `manifest.webmanifest`・`icons/` … ホーム画面に追加した時の名前とアイコン（全画面のアプリ表示）。
- 新しいページを足す時は、`<head>` にほかのページと同じ manifest／apple-touch-icon／`shared/update.js` の行を入れる。
