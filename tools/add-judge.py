#!/usr/bin/env python3
"""過去問の判定画面（答え合わせのあと）を、コクシルの判定画面の並びにする（何回実行してもOK）。
並び：出典・分野 → 進捗バー → 問題文 → 選択肢 → 正答率 → 解説
選択肢の色：正解＝薄い赤＋○、自分のまちがい＝濃い青＋×、ほか＝薄い色＋×
解く操作と記録はそのまま。mksite.py などで作り直したら、ほかの add-*.py のあとに実行 → offline-list.py。
"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
p = ROOT / "kakomon" / "index.html"
s = p.read_text(encoding="utf-8")
MARK = "/*judge*/"


def rep(a, b):
    global s
    assert s.count(a) == 1, a[:80]
    s = s.replace(a, b, 1)


if MARK not in s:
    # 選択肢：答え合わせのあとは j-ok / j-ng / j-other と ○× の印
    rep('''    const cls = done ? (isAns ? "correct" : picked ? "wrongpick" : "") : "";
    return `<li><button class="choice ${cls}" data-n="${n}" aria-pressed="${picked}" ${done ? "disabled" : ""}>
      <span class="bubble">${n}</span><span>${esc(c)}</span></button></li>`;''',
        '''    ''' + MARK + '''const cls = done ? (isAns && q.answer.length ? "j-ok" : picked ? "j-ng" : "j-other") : "";
    const mk = done ? `<span class="jm" aria-hidden="true">${isAns && q.answer.length ? "○" : "×"}</span>` : "";
    return `<li><button class="choice ${cls}" data-n="${n}" aria-pressed="${picked}" ${done ? "disabled" : ""}>
      ${mk}<span class="bubble">${n}</span><span class="jt">${esc(c)}</span></button></li>`;''')
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
        '''    ${done ? `<div class="jres ${ok ? "ok" : "ng"}">
        <span class="jsel">選択：<b class="num">${[...quiz.picked].sort((a, b) => a - b).join("・") || "–"}</b></span>
        <span class="big">${ok ? "○ 正解！" : "✕ まちがい"}</span>''')
    rep('''        ${weakNote(quiz.wk[quiz.i], ok)}
        ${crowdHtml(q, ok, need)}
      </div>${expHtml(q)}` : ""}''',
        '''        ${weakNote(quiz.wk[quiz.i], ok)}
      </div>${crowdHtml(q, ok, need) ? `<div class="jcrowd">${crowdHtml(q, ok, need)}</div>` : ""}${expHtml(q)}` : ""}''')
    css = '''
/* 判定画面（tools/add-judge.py）：コクシルの判定画面の並び */
.jhead{display:flex;align-items:flex-start;gap:8px}
.jsrc{flex:1;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;min-width:0}
.jsrc .qno{font-size:15px}
.jsrc>span:not(.chip){width:100%;font-size:13px;color:var(--sub)}
.jprog{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:var(--sub)}
.jprog+.prog{margin-top:4px}
.choice .jm{flex:none;width:16px;text-align:center;font-weight:700;margin-top:1px}
.choice.j-ok{background:var(--ng-soft);border-color:transparent}
.choice.j-ok .jm{color:var(--ng)}
.choice.j-ok .bubble{border-color:var(--ng);color:var(--ng);background:transparent}
.choice.j-ng{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.choice.j-ng .bubble{border-color:var(--accent-ink);color:var(--accent-ink);background:transparent}
.choice.j-other{background:var(--accent-soft);border-color:transparent;color:var(--sub)}
.choice.j-other .bubble{border-color:var(--line2);color:var(--sub);background:transparent}
.choice.j-ok::after{content:"正解";margin-left:auto;flex:none;padding-left:8px;font-size:12px;font-weight:700;color:var(--ng)}
.choice.j-ng::after{content:"あなたの答え";margin-left:auto;flex:none;padding-left:8px;font-size:12px;font-weight:700}
.choice.j-ok:disabled,.choice.j-ng:disabled,.choice.j-other:disabled{opacity:1}
.jres{margin-top:16px;display:grid;gap:4px}
.jres .jsel{font-size:14px}
.jres .big{font-family:var(--f-disp);font-weight:900;font-size:20px}
.jres.ok .big{color:var(--ok)} .jres.ng .big{color:var(--ng)}
.jcrowd{margin-top:16px;padding-top:10px;border-top:1px solid var(--line)}
.jcrowd .crowd{margin:0;padding:0;border:0}
'''
    rep('.verdict{margin-top:18px;', css.strip() + '\n.verdict{margin-top:18px;')
p.write_text(s, encoding="utf-8")
print("ok kakomon")
