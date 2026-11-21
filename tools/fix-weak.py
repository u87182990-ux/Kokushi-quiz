# 問題ページ（kakomon / prep / chiryo / chiryo-quiz）の苦手リストまわり（2026-11-21 チノの再確認）
#   ・苦手リストの卒業：どこで解いても（1問だけ開いても）2回続けて正解なら卒業
#   ・解説の下と結果画面に、卒業までの残りを出す
#   ・「前回まちがえた問題を解き直す」「全部解き直す」に、いつも（○問）を出す
# fix-counts.py のあとに実行。何回実行しても同じ。使い方: python3 tools/fix-weak.py
def rep(s, a, b, n=1):
    if b in s: return s
    assert s.count(a) == n, (a[:70], s.count(a))
    return s.replace(a, b)

for d in ["kakomon", "prep", "chiryo", "chiryo-quiz"]:
    p = f"{d}/index.html"; s = open(p, encoding="utf-8").read()
    s = rep(s, "苦手モードで2回続けて正解すると外れる", "どこで解いても2回続けて正解すると外れる")
    s = rep(s, '''function weakRecord(id, ok, mode){
  const now = Date.now();
  if (!ok) weak[id] = { s: 0, t: now };
  else if (mode && isWeak(id)) {''', '''function weakRecord(id, ok, mode){
  const now = Date.now(), was = isWeak(id);
  if (!ok) weak[id] = { s: 0, t: now };
  else if (was) {''')
    s = rep(s, "  saveWeak(); weakDirty = true; flush();\n  return { ...weak[id] };", "  saveWeak(); weakDirty = true; flush();\n  return { ...weak[id], was };")
    s = rep(s, "${quiz.weak ? weakNote(quiz.wk[quiz.i], ok) : \"\"}", "${weakNote(quiz.wk[quiz.i], ok)}")
    s = rep(s, '''  if (!ok) return `<span class="wk-note">連続正解は0回にもどりました。苦手リストに残ります</span>`;''',
            '''  if (!ok) return `<span class="wk-note">${w.was ? "連続正解は0回にもどりました。苦手リストに残ります" : "苦手リストに入りました。" + WEAK_N + "回続けて正解すると卒業です"}</span>`;''')
    s = rep(s, '''    ${quiz.weak ? `<p class="wk-note" style="margin:0 0 12px">苦手リストから外れた問題：<span class="num">${quiz.wk.filter(w => w?.out).length}</span>問　／　のこりの苦手：<span class="num">${Q.filter(q => isWeak(q.id)).length}</span>問</p>` : ""}''',
            '''    ${quiz.weak || quiz.wk.some(Boolean) ? `<p class="wk-note" style="margin:0 0 12px">苦手リストから外れた問題：<span class="num">${quiz.wk.filter(w => w?.out).length}</span>問　／　のこりの苦手：<span class="num">${Q.filter(q => isWeak(q.id)).length}</span>問${(n1 => n1 ? `（うち卒業まであと1回：<span class="num">${n1}</span>問）` : "")(Q.filter(q => isWeak(q.id) && (weak[q.id].s || 0) === WEAK_N - 1).length)}<br>苦手リストの問題は、どこで解いても（1問だけ開いても）${WEAK_N}回続けて正解すると卒業します</p>` : ""}''')
    s = rep(s, "ここから解いて<b>2回続けて正解</b>するとリストから外れ", "ここからでも1問ずつ開いてでも、<b>2回続けて正解</b>するとリストから外れ")
    s = rep(s, "苦手リストは、苦手モードで2回続けて正解すると卒業して減ります。", "苦手リストは、どこで解いても2回続けて正解すると卒業して減ります。")
    s = rep(s, '  $("#go-review").disabled = !ngIds.length;\n',
            '  $("#go-review").disabled = !ngIds.length; $("#go-review").textContent = `前回まちがえた問題を解き直す（${ngIds.length}問）`;\n')
    s = rep(s, '  $("#review-start").disabled = !list.length;\n',
            '  $("#review-start").disabled = !list.length; $("#review-start").textContent = `全部解き直す（${list.length}問）`;\n')
    open(p, "w", encoding="utf-8").write(s); print(p, "ok")
