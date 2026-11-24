#!/usr/bin/env python3
"""過去問の判定画面（答え合わせのあと）を、コクシルの判定画面の並びにする（何回実行してもOK）。
並び：出典・分野 → 進捗バー → 問題文 → 選択肢 → 正答率 → 解説
選択肢の色は今までどおり（正解＝緑＋「正解」、自分のまちがい＝赤＋「あなたの回答」、ほかは無地）
解く操作と記録はそのまま。mksite.py などで作り直したら、ほかの add-*.py のあとに実行 → offline-list.py。
"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
p = ROOT / "kakomon" / "index.html"
s = p.read_text(encoding="utf-8")
MARK = "<!--judge-->"


def rep(a, b):
    global s
    assert s.count(a) == 1, a[:80]
    s = s.replace(a, b, 1)


if MARK not in s:
    # 選択肢の色は今までどおり（正解＝緑＋「正解」、自分のまちがい＝赤＋「あなたの回答」、ほかは無地）。2026-11-24 りょうさんの指定
    # 上：出典・分野（左）とブックマーク（右）→ 進捗の行 → バー
    rep('''    <div class="qhead">
      <span class="qno">第${q.kai}回 ${esc(q.session || "")} ${q.session ? "" : "問"}${q.no}</span>
      <span class="chip">${esc(q.field)}</span>${todayTag(q.id)}
      <span class="num" style="color:var(--sub);font-size:13px">${esc(quiz.title)}　${quiz.i + 1} / ${quiz.ids.length}</span>
      <button class="bmk" id="q-bm" data-id="${esc(q.id)}" aria-pressed="${isBm(q.id)}" aria-label="ブックマーク">${isBm(q.id) ? "★ 保存ずみ" : "☆ 保存"}</button>
    </div>
    <div class="prog"><i style="width:${(quiz.i + (done ? 1 : 0)) / quiz.ids.length * 100}%"></i></div>''',
        '''    <div class="jhead">
      <div class="jsrc"><b class="qno">第${q.kai}回 ${esc(q.session || "")} ${q.session ? "" : "問"}${q.no}</b><span>${esc(q.field)}</span>${todayTag(q.id)}</div>
      <button class="bmk" id="q-bm" data-id="${esc(q.id)}" aria-pressed="${isBm(q.id)}" aria-label="ブックマーク">${isBm(q.id) ? "★ 保存ずみ" : "☆ 保存"}</button>
    </div>
    <div class="jprog num"><span>${esc(quiz.title)}　${quiz.i + 1} / ${quiz.ids.length}問</span><span>${Math.round((quiz.i + (done ? 1 : 0)) / quiz.ids.length * 100)}%</span></div>
    <div class="prog"><i style="width:${(quiz.i + (done ? 1 : 0)) / quiz.ids.length * 100}%"></i></div>''')
    # 選択肢のあと：選択と判定 → 正答率 → 解説
    rep('''    ${done ? `<div class="verdict ${ok ? "ok" : "ng"}">
        <span class="big">${ok ? "○ 正解！" : "✕ まちがい"}</span>''',
        '''    ${done ? `<!--judge--><div class="jres ${ok ? "ok" : "ng"}">
        <span class="jsel">選択：<b class="num">${[...quiz.picked].sort((a, b) => a - b).join("・") || "–"}</b></span>
        <span class="big">${ok ? "○ 正解！" : "✕ まちがい"}</span>''')
    rep('''        ${weakNote(quiz.wk[quiz.i], ok)}
        ${crowdHtml(q, ok, need)}
      </div>${expHtml(q)}` : ""}''',
        '''        ${weakNote(quiz.wk[quiz.i], ok)}
      </div>${crowdHtml(q, ok, need) ? `<div class="jcrowd">${crowdHtml(q, ok, need)}</div>` : ""}${expHtml(q)}` : ""}''')
    # ブックマークの見出し（出典・分野）を新しい上の段から読む
    rep('''const h = b.closest(".qhead"), lab = h ? [...h.querySelectorAll(".qno,.chip")]''',
        '''const h = b.closest(".qhead,.jhead"), lab = h ? [...h.querySelectorAll(".qno,.chip,.jsrc>span")]''')
    css = '''
/* 判定画面（tools/add-judge.py）：コクシルの判定画面の並び */
.jhead{display:flex;align-items:flex-start;gap:8px}
.jsrc{flex:1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;min-width:0}
.jsrc .qno{font-size:15px}
.jsrc>span:not(.chip){width:100%;font-size:13px;color:var(--sub)}
.jprog{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:var(--sub)}
.jprog+.prog{margin-top:4px}
.jres{margin-top:16px;display:grid;gap:4px}
.jres .jsel{font-size:14px}
.jres .big{font-family:var(--f-disp);font-weight:900;font-size:20px}
.jres.ok .big{color:var(--ok)} .jres.ng .big{color:var(--ng)}
.jcrowd{margin-top:16px;padding-top:10px;border-top:1px solid var(--line)}
.jcrowd .crowd{margin:0;padding:0;border:0}
'''
    rep('.verdict{margin-top:18px;', css.strip() + '\n.verdict{margin-top:18px;')
if 'b.closest(".qhead"), lab' in s:
    s = s.replace('const h = b.closest(".qhead"), lab = h ? [...h.querySelectorAll(".qno,.chip")]', 'const h = b.closest(".qhead,.jhead"), lab = h ? [...h.querySelectorAll(".qno,.chip,.jsrc>span")]', 1)
p.write_text(s, encoding="utf-8")
print("ok kakomon")
