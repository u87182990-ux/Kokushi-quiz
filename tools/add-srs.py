#!/usr/bin/env python3
"""苦手リストを間隔反復（shared/srs.js）にする（2026-11-24）。何回実行してもOK。
対象：kakomon / prep / chiryo / chiryo-quiz の index.html
mksite.py で作り直したときは addbm → fix-counts → fix-weak → add-study → …（ほかの add-*.py）のあとに実行し、
最後に tools/offline-list.py。

・まちがえた問題は苦手リストへ（ステージ1＝あした）。ステージは「復習日以降の正解」でだけ進む。3ステージ目で正解したら卒業
・今日の復習は1日30問まで（記録 <LS>-rv、クラウドは data.rv）
・並びは みんなの正答率が高いのにまちがえた問題から（kakomon は rates.json、chiryo は q.from で kakomon の正答率）
・前の記録（ステージなし）は、開いたときにステージ1・復習日あした に直す（卒業ずみはそのまま）
"""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
V = "1796100000"
MARK = "/*srs*/"
# ページごと：正答率の読みこみ先と、問題 → 正答率のキー
CONF = {
    "kakomon": ('"rates.json"', "q.id"),
    "chiryo": ('"../kakomon/rates.json"', "q.from"),
    "prep": ("null", "null"),
    "chiryo-quiz": ("null", "null"),
}

CSS = (".srs-row{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}.srs-due{font-size:11.5px;color:var(--sub);white-space:nowrap}.srs-due.now{color:var(--ng);font-weight:700}"
       ".chip.srs-mt{color:var(--ng);background:var(--ng-soft);font-weight:700}"
       ".srs-sum{font-size:13.5px;margin:0 0 8px}.srs-sum b{font-size:16px}.srs-legend{margin:0 0 8px;font-size:12px;color:var(--sub)}")


def run(d):
    p = ROOT / d / "index.html"
    s = p.read_text(encoding="utf-8")
    if MARK in s:
        print(p, "もう入っています"); return
    src, key = CONF[d]

    def rep(a, b, rx=False):
        nonlocal s
        if rx:
            m = re.findall(a, s, flags=re.S)
            assert len(m) == 1, (d, a[:80], len(m))
            s = re.sub(a, lambda _: b, s, count=1, flags=re.S)
        else:
            assert s.count(a) == 1, (d, a[:80], s.count(a))
            s = s.replace(a, b, 1)

    rep('<script src="../shared/plan.js?v=1795500000"></script>',
        f'<script src="../shared/srs.js?v={V}"></script><script src="../shared/plan.js?v={V}"></script>')
    rep(".wk-note{font-size:13.5px;font-weight:700}", ".wk-note{font-size:13.5px;font-weight:700}" + CSS)

    # 苦手リストの説明とボタン
    rep(r'      <p style="margin:0 0 10px;color:var\(--sub\);font-size:13.5px">まちがえた問題はここにも入ります。.*?</p>\n      <div class="row" style="margin-bottom:8px">\n        <button class="btn primary" id="weak-start">苦手な問題を解く</button>',
        '''      <p style="margin:0 0 10px;color:var(--sub);font-size:13.5px">まちがえた問題はここに入ります。復習は3ステージで、<b>あした → 3日後 → 7日後</b>が復習日です。<b>復習日が来てから正解</b>すると次のステージに進み、ステージ3で正解すると卒業です。復習日より前に正解してもステージは進みません（解説を読んだ直後の正解は数えないため）。まちがえたら、いつでもステージ1（あした）にもどります。試験が近づくと間隔は短くなります。（下の「前回まちがえた問題」とは別です。こちらは1回正解すると消えます）</p>
      <p class="srs-sum" id="weak-sum"></p>
      <div class="row" style="margin-bottom:8px"><button class="btn primary" id="weak-today">今日の復習を解く</button></div>''' +
        ('\n      <p class="srs-legend">並びは「みんなの正答率が高いのにまちがえた問題」が先です。<span class="chip srs-mt">もったいない</span>＝正答率70%以上なのにまちがえた問題。</p>' if src != "null" else "") +
        '''
      <div class="row" style="margin-bottom:8px">
        <button class="btn" id="weak-start">苦手リストを全部解く</button>''', rx=True)
    rep("一度まちがえて、2回続けて正解した問題です。", "一度まちがえて、復習日の正解でステージを最後まで進めた問題です。")

    # 記録
    rep("/* 苦手リスト：まちがえると入る。どこで解いても2回続けて正解すると外れる（out=1）。記録 rec とは別に保存 */",
        "/* 苦手リスト：まちがえると入る。間隔反復（shared/srs.js）：復習日以降に正解するとステージが進み、最後のステージで正解すると卒業（out=1）。記録 rec とは別に保存 */")
    rep("function saveWeak(){ try { localStorage.setItem(WLS, JSON.stringify(weak)); } catch {} }\nsaveWeak();\n",
        "function saveWeak(){ try { localStorage.setItem(WLS, JSON.stringify(weak)); } catch {} }\n"
        + MARK + "if (KQSrs.fixAll(weak)) weakDirty = true;   // 前の記録（ステージなし）→ ステージ1・復習日あした\nsaveWeak();\n"
        + MARK + 'const RVLS = LS + "-rv"; let rv = null; try { rv = JSON.parse(localStorage.getItem(RVLS) || "null"); } catch {}\n'
        + "function saveRv(){ try { localStorage.setItem(RVLS, JSON.stringify(rv)); } catch {} }\n")
    rep(r"function weakRecord\(id, ok, mode\)\{\n.*?\n\}\n",
        f'''function weakRecord(id, ok, mode){{
  const res = KQSrs.answer(weak[id], ok);
  if (!res) return null;
  weak[id] = res.w;
  saveWeak(); weakDirty = true; flush();
  return {{ ...res.w, was: res.was, res }};
}}
{MARK}// 優先度に使う みんなの正答率（%）。データがない問題は null（＝中間の優先度）
let SRS_R = null; const SRS_SRC = {src};
const SRS_P = (SRS_SRC ? fetch(SRS_SRC).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null)).then(d => {{ SRS_R = (d && d.r) || {{}}; if (typeof view !== "undefined" && (view === "review" || view === "home")) render(); }});
const crowdOf = id => {{ const q = byId[id], k = q ? {key} : null; return k != null && SRS_R && SRS_R[k] != null ? SRS_R[k] : null; }};
// 今日の復習（1日30問まで）。save=true で今日の30問を決めて保存（正答率を読みこんだあとだけ）
function todayRv(save){{
  const t = KQSrs.todays(Q.map(q => q.id), weak, crowdOf, rv);
  if (t.made && save && SRS_R) {{ rv = t.rv; saveRv(); weakDirty = true; flush(); }}
  return t;
}}
async function startReview(){{
  await SRS_P;
  const t = todayRv(true);
  if (!t.ids.length) {{ const n = KQSrs.nextDue(weak); show("review"); setSync("今日の苦手の復習はおわりです。" + (n ? `次は${{KQSrs.dayLabel(n.d)}}に${{n.n}}問` : "")); return; }}
  startQuiz("今日の苦手の復習", t.ids, {{ weak: true }});
}}
''', rx=True)
    rep("KQ.save(APP, { v: 1, at: Date.now(), rec, weak", "KQ.save(APP, { v: 1, at: Date.now(), rec, weak, " + MARK + "rv: rv || undefined")
    rep("  return changed;\n}\nfunction record(", "  " + MARK + "if (KQSrs.fixAll(weak)) changed = true;\n  return changed;\n}\nfunction record(")
    rep("  if (mergeIn(d.rec, d.weak)", "  " + MARK + "{ const r2 = KQSrs.mergeRv(rv, d.rv); if (r2 !== rv) { rv = r2; saveRv(); } }\n  if (mergeIn(d.rec, d.weak)")
    rep("weak[id] = { s: +w.s || 0, t: +w.t || 0, ...(w.out ? { out: 1 } : {}) }; weakDirty = true; }",
        "weak[id] = { s: 0, t: +w.t || 0, ...(w.out ? { out: 1 } : {}), ...(w.st ? { st: +w.st, due: String(w.due || \"\"), iv: Array.isArray(w.iv) ? w.iv.map(Number) : [], lr: w.lr ? 1 : 0 } : {}) }; KQSrs.fix(weak[id]); weakDirty = true; }")

    # ホームの数字
    rep("wk1 = wkIds.filter(id => (weak[id].s || 0) === WEAK_N - 1).length;", "wk1 = todayRv(false).ids.length;")
    rep('${wk1 ? "卒業まであと1回：" + wk1 + "問" : "2回続けて正解で卒業"}', '${"今日の復習：" + wk1 + "問"}')
    rep("苦手リストは、どこで解いても2回続けて正解すると卒業して減ります。", "苦手リストは、復習日（あした→3日後→7日後）に正解するとステージが進み、3つ進むと卒業して減ります。")
    rep('$("#go-weak").disabled = !wn; $("#go-weak").textContent = `苦手な問題だけ解く（${wn}問）`;',
        '{ const rn = todayRv(false).ids.length; $("#go-weak").disabled = !rn; $("#go-weak").textContent = rn ? `今日の苦手の復習（${rn}問）` : `今日の苦手の復習はおわり（苦手リスト${wn}問）`; }')

    # 苦手リストの表示：ステージ・次回の復習日・もったいない
    rep(r"function streakHTML\(id\)\{\n.*?\n\}\n",
        "function streakHTML(id){\n  return `<div class=\"srs-row\">${KQSrs.mtag(crowdOf(id))}${KQSrs.badge(weak[id])}</div>`;\n}\n", rx=True)
    rep("list.map(q => itemHTML(q).replace('<div style=\"text-align:right\">', `<div style=\"text-align:right\">${streakHTML(q.id)}<br>`)).join(\"\")",
        "list.map(q => itemHTML(q).replace(/<\\/button>$/, `${streakHTML(q.id)}</button>`)).join(\"\")")
    rep("  const list = Q.filter(q => isWeak(q.id) && (!f || q.field === f));\n  $(\"#weak-start\").disabled = !list.length;\n",
        "  const list = KQSrs.order(Q.filter(q => isWeak(q.id) && (!f || q.field === f)).map(q => q.id), weak, crowdOf).map(id => byId[id]);\n"
        "  $(\"#weak-start\").disabled = !list.length; $(\"#weak-start\").textContent = `苦手リストを全部解く（${list.length}問）`;\n"
        "  " + MARK + "{ const tv = todayRv(false), nx = KQSrs.nextDue(weak), all = Q.filter(q => isWeak(q.id)).length;\n"
        "    $(\"#weak-today\").disabled = !tv.ids.length; $(\"#weak-today\").textContent = tv.ids.length ? `今日の復習を解く（${tv.ids.length}問）` : \"今日の復習はおわり\";\n"
        "    $(\"#weak-sum\").innerHTML = `今日の復習 <b class=\"num\">${tv.ids.length}</b>問<small style=\"color:var(--sub)\">（1日${KQSrs.CAP}問まで・苦手リスト${all}問）</small>${nx ? `<br><small style=\"color:var(--sub)\">次の復習日：${KQSrs.dayLabel(nx.d)} ${nx.n}問</small>` : \"\"}`; }\n")

    # 答えたあと・結果画面
    rep(r"function weakNote\(w, ok\)\{\n.*?\n\}\n",
        "function weakNote(w, ok){\n  return w && w.res ? `<span class=\"wk-note\">${KQSrs.note(w.res)}</span>` : \"\";\n}\n", rx=True)
    rep(r'    \$\{`<p class="wk-note" style="margin:0 0 12px">苦手リストから外れた問題：.*?</p>`\}\n',
        '    ${`<p class="wk-note" style="margin:0 0 12px">苦手リストから卒業：<span class="num">${quiz.wk.filter(w => w?.out).length}</span>問　／　ステージが進んだ：<span class="num">${quiz.wk.filter(w => w?.res?.adv && !w.out).length}</span>問　／　のこりの苦手：<span class="num">${Q.filter(q => isWeak(q.id)).length}</span>問（今日の復習のこり：<span class="num">${todayRv(false).ids.length}</span>問）<br>${KQSrs.RULE}</p>`}\n', rx=True)

    # 出題
    rep(r'    case "go-weak": case "weak-start": \{\n.*?\n    \}\n',
        '''    case "go-weak": case "weak-today": return startReview();
    case "weak-start": {
      const f = $("#weak-field").value;
      return startQuiz("苦手リスト", KQSrs.order(Q.filter(q => isWeak(q.id) && (!f || q.field === f)).map(q => q.id), weak, crowdOf), { weak: true });
    }
''', rx=True)
    rep(r'  if \(st === "weak"\) return startQuiz\("苦手な問題".*?\n', '  if (st === "weak") return startReview();\n', rx=True)

    if d == "kakomon":
        rep("const p = KQPlan.today(planItems(), rec, weak, { total: n + c, cardsDue: c }), tag = {};",
            "const p = KQPlan.today(planItems(), rec, weak, { total: n + c, cardsDue: c, " + MARK + "dueIds: todayRv(true).ids }), tag = {};")
        rep('  if (st === "today") return startToday(', '  if (st === "today") return SRS_P.then(() => startToday(')
        rep("startToday(Math.max(0, +P.get(\"n\") || 0), Math.max(0, +P.get(\"c\") || 0));", "startToday(Math.max(0, +P.get(\"n\") || 0), Math.max(0, +P.get(\"c\") || 0)));")
        rep("（まちがえた問題は苦手リストへ。2回続けて正解で卒業）", "（まちがえた問題は苦手リストへ。あしたから、復習日に正解するとステージが進みます）")
        rep("`🔁 苦手の復習${d ? `（${d.getMonth() + 1}/${d.getDate()}にまちがえた問題）` : \"\"}`",
            "`🔁 苦手の復習${weak[id]?.st ? `（ステージ${weak[id].st}/${(weak[id].iv || []).length}）` : \"\"}`")
    p.write_text(s, encoding="utf-8")
    print(p, "ok")


for d in CONF:
    run(d)
