# 問題ページ（kakomon / prep / chiryo / chiryo-quiz）に
#   ・ブックマーク（☆）ボタン
#   ・成績の記録（shared/stats.js の KQStats.hit）
#   ・トップから直接はじめるリンク（?start=bm|weak|random, ?q=問題id, ?field=分野）
#   ・選択肢に「✓ 正解」「× あなたの回答」の札
# をつける。何回実行しても同じ（すでについていれば何もしない）。
# 使い方: python3 tools/addbm.py   （リポジトリのいちばん上で）
import re

V = "1796000000"
CSS = (".bmk{margin-left:auto;flex:none;border:1px solid var(--line);background:var(--sheet);color:var(--sub);border-radius:999px;"
       "padding:3px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;line-height:1.6}"
       ".bmk[aria-pressed=\"true\"]{color:#d99a00;border-color:#e8b730;background:rgba(232,183,48,.12)}"
       ".choice.correct::after,.choice.wrongpick::after{margin-left:auto;flex:none;padding-left:8px;font-size:12.5px;font-weight:700;white-space:nowrap}"
       ".choice.correct::after{content:\"✓ 正解\";color:var(--ok)}"
       ".choice.wrongpick::after{content:\"× あなたの回答\";color:var(--ng)}")

def sub1(s, a, b):
    assert s.count(a) == 1, (a[:70], s.count(a))
    return s.replace(a, b, 1)

for d in ["kakomon", "prep", "chiryo", "chiryo-quiz"]:
    p = f"{d}/index.html"
    s = open(p, encoding="utf-8").read()
    if "KQStats" in s:
        print(p, "済み"); continue
    # 1) 共通部品を読む
    s = re.sub(r'(<script src="\.\./shared/account\.js[^"]*"></script>)',
               r'\1<script src="../shared/stats.js?v=' + V + '"></script>', s, count=1)
    # 2) 見た目
    s = sub1(s, "[hidden]{display:none!important}</style>", "[hidden]{display:none!important}" + CSS + "</style>")
    # 3) 答え合わせのたびに日ごとの記録をつける
    s = sub1(s, "rec[id] = r; saveLocal();", "rec[id] = r; if (window.KQStats) KQStats.hit(ok); saveLocal();")
    # 4) 問題の見出しに ☆ ボタン
    s = sub1(s, '</span>\n    </div>\n    <div class="prog">',
             '</span>\n      <button class="bmk" id="q-bm" data-id="${esc(q.id)}" aria-pressed="${isBm(q.id)}" aria-label="ブックマーク">${isBm(q.id) ? "★ 保存ずみ" : "☆ 保存"}</button>\n'
             '    </div>\n    <div class="prog">')
    s = sub1(s, "function renderQuiz(){",
             "const isBm = id => !!(window.KQStats && KQStats.bm.has(APP, id));\n"
             "function toggleBm(b){\n"
             "  if (!window.KQStats) return;\n"
             "  const q = byId[b.dataset.id]; if (!q) return;\n"
             "  const h = b.closest(\".qhead\"), lab = h ? [...h.querySelectorAll(\".qno,.chip\")].map(x => x.textContent.trim()).filter(Boolean).join(\" · \") : String(q.id);\n"
             "  const on = KQStats.bm.toggle(APP, q.id, { l: lab, s: String(q.question || \"\").replace(/\\*\\*/g, \"\").slice(0, 70) });\n"
             "  b.setAttribute(\"aria-pressed\", on); b.textContent = on ? \"★ 保存ずみ\" : \"☆ 保存\";\n"
             "  dirty.add(\"bm\"); flush();\n"
             "}\n"
             "function renderQuiz(){")
    s = sub1(s, '  const t = e.target.closest("button"); if (!t) return;\n',
             '  const t = e.target.closest("button"); if (!t) return;\n  if (t.id === "q-bm") return toggleBm(t);\n')
    # 5) トップのリンクから直接はじめる
    s = sub1(s, '  show("home");\n}\nfetch("questions.json")',
             '  show("home");\n  startFromUrl();\n}\n'
             'function startFromUrl(){\n'
             '  let P; try { P = new URLSearchParams(location.search); } catch { return; }\n'
             '  const st = P.get("start"), one = P.get("q"), f = P.get("field");\n'
             '  if (!st && !one && !f) return;\n'
             '  try { history.replaceState(null, "", location.pathname + location.hash); } catch {}\n'
             '  const cat = q => q.field ?? q.topic;\n'
             '  if (one && byId[one]) return startQuiz("ブックマーク", [one]);\n'
             '  if (st === "bm") return startQuiz("ブックマーク", Q.filter(q => isBm(q.id)).map(q => q.id));\n'
             '  if (st === "weak") return startQuiz("苦手な問題", Q.filter(q => isWeak(q.id)).map(q => q.id), { shuffle: true, weak: true });\n'
             '  if (st === "random") return startQuiz("ランダム10問", shuffle(Q.map(q => q.id)).slice(0, 10));\n'
             '  if (st === "unsolved") return startQuiz("まだ解いていない問題", shuffle(Q.filter(q => !rec[q.id]).map(q => q.id)).slice(0, 20));\n'
             '  if (f) return startQuiz(f, Q.filter(q => cat(q) === f).map(q => q.id));\n'
             '}\n'
             'fetch("questions.json")')
    open(p, "w", encoding="utf-8").write(s)
    print(p, "OK")

# 端末だけに記録するドリル（日ごとの記録だけつける）
for p, a, b in [
    ("ikougaku/index.html", "function answer(q,i){\n", "function answer(q,i){\n  if(window.KQStats) KQStats.hit(i===q.a);\n"),
    ("sugiura/index.html", "function answer(q,p){\n", "function answer(q,p){\n  if(window.KQStats) KQStats.hit(same(p,q.a));\n"),
    ("kisoi/index.html", "function grade(g) {\n", "function grade(g) {\n  if (window.KQStats) KQStats.hit(g > 0);\n"),
]:
    s = open(p, encoding="utf-8").read()
    if "KQStats" in s:
        print(p, "済み"); continue
    s = re.sub(r'(<script src="\.\./shared/account\.js[^"]*"></script>)',
               r'\1\n<script src="../shared/stats.js?v=' + V + '"></script>', s, count=1)
    s = sub1(s, a, b)
    open(p, "w", encoding="utf-8").write(s)
    print(p, "OK")
