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
