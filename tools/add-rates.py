# 過去問（kakomon）に「みんなの正答率」を出す（2026-11-24）
#   1. tools/rates/kokushiru-2026-11-24.json（コクシルの利用者選択割合、問題ID→{rate:[正解の選択肢ごとの%], correct:[...]}）から
#      kakomon/rates.json（問題ID→代表の%）を作る
#   2. kakomon/index.html に表示のコードを入れる（入っていれば何もしない）
# 代表の%の決め方
#   ・ふつうの1つ選ぶ問題 … その%
#   ・2つ選ぶ問題 … 正解の選択肢2つのうち小さい方（2つとも選べた人は、その%より多くはならないため）
#   ・厚労省が「どれを選んでも正解」とした1つ選ぶ問題 … 正解とされた選択肢の%の合計（1人1つしか選ばないので足せる）
#   ・「3つのうちどの2つでも正解」の問題 … 正解とされた選択肢の%の合計÷2（1人2つ選ぶので）
#   ・正解のない問題（採点除外・全員正解）とデータのない問題 … 出さない
# 使い方: python3 tools/add-rates.py   （questions.json を変えたら、あとで tools/offline-list.py も）
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools/rates/kokushiru-2026-11-24.json")
Q = json.load(open(os.path.join(ROOT, "kakomon/questions.json"), encoding="utf-8"))["questions"]
raw = json.load(open(SRC, encoding="utf-8"))

out, skip = {}, []
for q in Q:
    v = raw.get(q["id"])
    if not v or not q["answer"]:
        if v: skip.append(q["id"])
        continue
    rt = v["rate"]
    need = len(q["answer"])
    if q.get("alt") and need == 1:
        x = sum(rt)
    elif q.get("alt"):
        x = sum(rt) / 2
    elif len(rt) >= 2:
        x = min(rt)
    else:
        x = rt[0]
    out[q["id"]] = round(min(x, 100))
json.dump({"src": "コクシルの利用者データ（2026年11月取得）", "at": "2026-11-24", "r": out},
          open(os.path.join(ROOT, "kakomon/rates.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("rates.json:", len(out), "問", "（正解のない問題でとばした:", skip, "）")

# ---- ページに表示のコードを入れる ----
P = os.path.join(ROOT, "kakomon/index.html")
s = open(P, encoding="utf-8").read()
if "/* みんなの正答率 */" in s:
    print("index.html: もう入っています"); raise SystemExit


def rep(s, a, b):
    assert s.count(a) == 1, (a[:80], s.count(a))
    return s.replace(a, b)


CSS = """/* みんなの正答率 */
.crowd{display:grid;gap:4px;margin-top:4px;padding-top:8px;border-top:1px solid var(--line)}
.crowd-row{display:flex;align-items:center;gap:8px}
.crowd-l{font-size:13px;font-weight:700;color:var(--sub)}
.crowd-n{font-family:var(--f-num);font-weight:600;font-size:20px;line-height:1;font-variant-numeric:tabular-nums;color:var(--ink)}
.crowd-bar{flex:1;max-width:160px;height:4px;border-radius:2px;background:var(--line);overflow:hidden}
.crowd-bar i{display:block;height:100%;background:var(--sub)}
.crowd-msg{font-size:13.5px}
.crowd-src{font-size:11px;color:var(--sub)}
"""
s = rep(s, "/* 解説 */\n.exp{", CSS + "/* 解説 */\n.exp{")

JS = r"""/* みんなの正答率（kakomon/rates.json、tools/add-rates.py で作る） */
let RATES = null;
fetch("rates.json").then(r => r.ok ? r.json() : null).then(d => { if (d && d.r) { RATES = d; if (view === "quiz" && quiz && quiz.done) renderQuiz(); } }).catch(() => {});
function crowdHtml(q, ok, need){
  const p = RATES && q.answer.length ? RATES.r[q.id] : undefined;
  if (p == null) return "";
  const msg = ok ? (p < 40 ? "みんなの正答率が低い難しい問題。正解できたのは大きな強みです"
                   : p < 60 ? "半分近くの人が落とした問題。よく取れました" : "")
                 : (p >= 70 ? "多くの人が正解している問題。本番で落とすと差がつくので、ここは取りたい"
                   : p < 40 ? "みんなも苦戦した問題。解説で押さえれば一歩リードできます" : "");
  return `<div class="crowd"><div class="crowd-row"><span class="crowd-l">みんなの正答率</span><b class="crowd-n">${p}%</b><span class="crowd-bar" aria-hidden="true"><i style="width:${p}%"></i></span></div>
    ${msg ? `<span class="crowd-msg">${msg}</span>` : ""}
    <span class="crowd-src">出典：${esc(RATES.src)}${need > 1 ? "。2つ選ぶ問題は、正解の選択肢を選んだ人の割合の小さい方" : ""}</span></div>`;
}
function weakNote(w, ok){"""
s = rep(s, "function weakNote(w, ok){", JS)
s = rep(s, "        ${weakNote(quiz.wk[quiz.i], ok)}\n      </div>${expHtml(q)}",
        "        ${weakNote(quiz.wk[quiz.i], ok)}\n        ${crowdHtml(q, ok, need)}\n      </div>${expHtml(q)}")
open(P, "w", encoding="utf-8").write(s)
print("index.html: 入れました")
