# 問題ページ（kakomon / prep / chiryo / chiryo-quiz）の数字の意味をそろえる（2026-11-21 チノのフィードバック）
#   ・「解いた問題」＝ちがう問題の数、「正答率」＝のべ回答（正解した回数÷答えた回数）と明記
#   ・「要復習」は苦手リスト（2回続けて正解で卒業）の数にして、卒業まであと1回の数も出す
#   ・回／分野のタイルの「正解」は「前回正解」
#   ・「間違えた問題」は「前回まちがえた問題」に名前を変えて、苦手リストと区別
#   ・計算メモは、はじめはしまっておく（開いたら次からも開いたまま）
# 何回実行しても同じ。使い方: python3 tools/fix-counts.py
NAMES = {"kakomon": "過去問", "prep": "対策問題集", "chiryo": "このドリル", "chiryo-quiz": "このドリル"}

def rep(s, a, b, n=1):
    if b in s: return s  # もう直してある
    assert s.count(a) == n, (a[:70], s.count(a))
    return s.replace(a, b)

for d, nm in NAMES.items():
    p = f"{d}/index.html"; s = open(p, encoding="utf-8").read()
    s = rep(s, '''    <div class="stat"><b>${s.n}</b><span>問題数</span></div>
    <div class="stat"><b>${s.done}</b><span>解いた問題</span></div>
    <div class="stat"><b>${tc + tw ? Math.round(tc / (tc + tw) * 100) : 0}<small>%</small></b><span>正答率（全回答）</span></div>
    <div class="stat warn"><b>${ngIds.length}</b><span>要復習</span></div>`;''',
    f'''    <div class="stat"><b>${{s.n}}</b><span>{nm}の問題数</span></div>
    <div class="stat"><b>${{s.done}}</b><span>解いた問題<br><small>ちがう問題の数</small></span></div>
    <div class="stat"><b>${{tc + tw ? Math.round(tc / (tc + tw) * 100) : "–"}}<small>${{tc + tw ? "%" : ""}}</small></b><span>正答率<br><small>のべ${{tc + tw}}回答で計算</small></span></div>
    <div class="stat warn"><b>${{wkN}}</b><span>苦手リスト<br><small>${{wk1 ? "卒業まであと1回：" + wk1 + "問" : "2回続けて正解で卒業"}}</small></span></div>`;
  $("#stats-note").textContent = "正答率は、答えた回数ぜんぶ（のべ）で計算しています。同じ問題を2回解いたら2回と数えます。苦手リストは、苦手モードで2回続けて正解すると卒業して減ります。";''')
    s = rep(s, '''  const tc = att.reduce((a, [, r]) => a + r.c, 0), tw = att.reduce((a, [, r]) => a + r.w, 0);
''', '''  const tc = att.reduce((a, [, r]) => a + r.c, 0), tw = att.reduce((a, [, r]) => a + r.w, 0);
  const wkIds = Q.filter(q => isWeak(q.id)).map(q => q.id), wkN = wkIds.length, wk1 = wkIds.filter(id => (weak[id].s || 0) === WEAK_N - 1).length;
''')
    s = rep(s, '''      <div class="stats" id="stats"></div>
''', '''      <div class="stats" id="stats"></div>
      <p class="stats-note" id="stats-note" style="margin:10px 0 0;color:var(--sub);font-size:12.5px;line-height:1.6"></p>
''')
    s = rep(s, "　正解${s.ok}</span>", "　前回正解${s.ok}</span>", 2)
    s = rep(s, "<h2>間違えた問題</h2>", "<h2>前回まちがえた問題</h2>")
    s = rep(s, '>間違えた問題を解き直す</button>', '>前回まちがえた問題を解き直す</button>')
    s = rep(s, "（下の「間違えた問題」の記録とは別です）", "（下の「前回まちがえた問題」とは別です。こちらは1回正解すると消えます）")
    s = rep(s, "b.hidden = !ngIds.length; b.textContent = ngIds.length;",
            "const wkB = Q.filter(q => isWeak(q.id)).length; b.hidden = !wkB; b.textContent = wkB;")
    s = rep(s, "open = pref.open !== false;", "open = pref.open === true;")
    open(p, "w", encoding="utf-8").write(s); print(p, "ok")
