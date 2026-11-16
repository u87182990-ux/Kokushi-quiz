# クイズ（Claudeのページ版）から、自分のサイト版を作る
# 使い方: python3 mksite.py <quiz-app フォルダ> <site フォルダ>
import sys, re, os
src, out = sys.argv[1], sys.argv[2]
HEAD = ('<!doctype html><html lang="ja"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0;padding:0}img{max-width:100%}[hidden]{display:none!important}</style>'
        '<script src="../shared/config.js"></script><script src="../shared/account.js"></script></head><body>\n')
def sub1(s, a, b):
    assert s.count(a) == 1, a[:60]
    return s.replace(a, b, 1)
for app, path, ls in [("kakomon", "index.html", "kokushi-rec-v1"), ("prep", "prep/index.html", "kokushi-prep-rec-v1")]:
    s = open(os.path.join(src, path), encoding="utf-8").read()
    s = re.sub(r'  <div class="notice" id="move-notice">.*?</div>\n', '', s, count=1, flags=re.S)
    s = sub1(s, "</style>", ".acct{color:var(--box-ink);font-size:12.5px;font-weight:700;text-decoration:none;border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:5px 12px;white-space:nowrap}\n.acct:hover{background:rgba(255,255,255,.1)}\n</style>")
    s = sub1(s, '    <nav class="tabs"', '    <a class="acct" id="acct" href="../">ログインして保存</a>\n    <nav class="tabs"')
    s = sub1(s, f'const LS = "{ls}";', f'const KQS = window.KQ && KQ.session();\nconst LS = "{ls}" + (KQS ? "@" + KQS.nick.toLowerCase() : "");')
    # 保存先をニックネームのクラウドに差しかえ
    a = s.index("async function flush(){"); b = s.index("function record(id, ok){")
    s = s[:a] + r'''const APP = "%APP%";
let saveTimer = null;
function flush(){
  if (!cloud || (!dirty.size && !weakDirty)) return;
  clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 1200);
}
async function doSave(){
  if (flushing) { saveTimer = setTimeout(doSave, 1000); return; }
  flushing = true; dirty.clear(); weakDirty = false;
  const r = await KQ.save(APP, { v: 1, at: Date.now(), rec, weak });
  flushing = false;
  if (r.ok) setSync(`☁ ${KQS.nick} さんの記録として保存しました（どの端末でも続きから）`);
  else { setSync("クラウド保存に失敗しました（この端末には保存されています）" + (r.msg ? "：" + r.msg : "")); weakDirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(doSave, 15000); }
}
function mergeIn(r2, w2){
  let changed = false;
  for (const [id, r] of Object.entries(r2 || {})) if (r && (!rec[id] || (r.t || 0) > (rec[id].t || 0))) { rec[id] = r; changed = true; }
  for (const [id, w] of Object.entries(w2 || {})) if (w && (!weak[id] || (w.t || 0) > (weak[id].t || 0))) { weak[id] = w; changed = true; }
  return changed;
}
'''.replace("%APP%", app) + s[b:]
    a = s.index("async function connectCloud(){"); b = s.index("/* ---------- 記録のバックアップ")
    s = s[:a] + r'''function showAcct(n){ const a = $("#acct"); a.textContent = n ? "👤 " + n : "ログインして保存"; a.title = n ? "ログイン中（タップで切りかえ）" : "ニックネームで記録を保存"; }
async function connectCloud(){
  if (!KQS || !window.KQ?.ready()) { showAcct(null); return; }
  showAcct(KQS.nick); setSync("記録を読みこみ中…");
  const r = await KQ.load(APP);
  if (!r.ok) {
    if (r.status === "wrong" || r.status === "none") { showAcct(null); setSync("ログインが切れました。右上からもう一度ログインしてください"); }
    else setSync("クラウドにつながりませんでした（この端末の記録で続けます）" + (r.msg ? "：" + r.msg : ""));
    return;
  }
  const d = r.data || {};
  if (mergeIn(d.rec, d.weak)) { saveLocal(); saveWeak(); render(); }
  cloud = true;
  setSync(`☁ ${KQS.nick} さんの記録（どの端末でも続きから）`);
  dirty.add("all"); flush();
}

''' + s[b:]
    s = sub1(s, "記録はこのブラウザだけに保存しています。消えないように、ときどき「記録のバックアップ」をしてください", "ログインしていないので、記録はこのブラウザだけに保存しています。右上の「ログインして保存」から、ニックネームで保存できます")
    s = re.sub(r'<p class="bk-note">記録はこのブラウザに保存されます。.*?</p>',
               '<p class="bk-note">ニックネームでログインしていれば、記録は自動でクラウドに保存されます。ここでは、記録を文字やファイルにして、手元にとっておくこともできます。</p>', s, count=1, flags=re.S)
    assert "connectCloud();" in s and "claude.use(\"db\")" not in s
    open(os.path.join(out, app, "index.html"), "w", encoding="utf-8").write(HEAD + s + "\n</body></html>\n")
    print("ok", app)
