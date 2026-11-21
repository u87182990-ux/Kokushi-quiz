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
- ホーム画面のアイコンは4種類（`icons/a`〜`icons/d`、はじめは c）。トップの「ホーム画面のアイコン」で選ぶと、`shared/update.js` がそのページの apple-touch-icon と manifest（`manifest-<a|b|d>.webmanifest`）を差しかえる。選んだものは端末の localStorage `kq-icon` に保存。

## アプリ風の画面（下のタブ）
- トップ `index.html` は下のタブで「ホーム／成績／ブックマーク／マイページ」を切りかえる（`#stats` `#bm` `#me`）。
- `shared/stats.js` … 日ごとの解答数（成績・連続日数・学習カレンダー用）とブックマークを記録。`account.js` がクラウド保存の時にいっしょに送る。
- 問題ページの「☆ 保存」ボタン・`?start=bm|weak|random|unsolved`・`?q=問題id`・`?field=分野` は `tools/addbm.py` でつけている。`tools/mksite.py` で作り直した時は、そのあとに `python3 tools/addbm.py` を実行する。
- 新しいドリルを足す時は、`index.html` の `DRILLS`（成績用）と `EXTRA`（メニュー用）に1行ずつ足す。

## お試し版（ログインなし）
- `demo/` … `https://u87182990-ux.github.io/Kokushi-quiz/demo/` を開くと、そのタブの間はログインなしのお試し版になる（`?demo=1` でも同じ、`?demo=0` で元にもどる）。
- しくみは `shared/account.js` の DEMO。ログイン画面・引っ越し・右上の「ログインして保存」をかくし、記録は端末だけに保存して Supabase には一切送らない。ほかの機能（成績・カレンダー・ブックマーク・メモ・案内キャラなど）はそのまま。
- タブ（sessionStorage）だけの切りかえなので、ふつうのサイトやホーム画面のアプリには影響しない。
- お試し版の記録は localStorage のキーに `kq-demo:` をつけて保存するので、同じブラウザでも本番の記録とまざらない。

## 数字のことば（どの画面も同じ）
- **解いた問題**＝ちがう問題の数。**回答（のべ）**＝同じ問題を2回解いたら2回。**正答率**＝正解した回数÷のべ回答。
- **苦手リスト**＝まちがえた問題。苦手モードで2回続けて正解すると卒業して減る。**前回まちがえた問題**は別のリスト（1回正解で消える）。
- 問題ページの数字・ラベルは `tools/fix-counts.py` で直している（mksite.py で作り直したあとに addbm.py → fix-counts.py の順で実行）。
- 成績のテーマ別：対策問題集・治療ドリルは問題の topic、過去問は `kakomon/themes.json`（`tools/themes.py` がキーワードで自動で分けた目安）。
- 試験日と1日の目標は案内キャラの設定（`KQ.avatar` の exam / goal）に入れて、クラウドにもいっしょに保存。
