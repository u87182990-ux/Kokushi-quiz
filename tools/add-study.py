# 試験まで3か月の5つの機能（2026-11-21 チノの提案）を問題ページに入れる
#   ・全ページ（kakomon / prep / chiryo / chiryo-quiz）：画像のタップ拡大（shared/zoom.js）・分野の正答率に色（shared/plan.js）
#   ・過去問（kakomon）だけ：模試モード（200問・タイマー・中断／再開）・「今日やること」(?start=today)・おすすめ出題(?theme=)
#   ・計算ドリル（ikougaku）：画像のタップ拡大
#   ・暗記カード（kisoi）：?start=due で復習期限のカードだけ
# fix-weak.py のあとに実行。何回実行しても同じ。使い方: python3 tools/add-study.py
import re

def rep(s, a, b, n=1):
    assert s.count(a) == n, (a[:80], s.count(a))
    return s.replace(a, b)

V = "1795500000"
TAGS = f'<script src="../shared/plan.js?v={V}"></script><script src="../shared/zoom.js?v={V}" defer></script>'

# ---------------- 共通：画像の拡大・正答率の色 ----------------
for d in ["kakomon", "prep", "chiryo", "chiryo-quiz"]:
    p = f"{d}/index.html"; s = open(p, encoding="utf-8").read()
    if "shared/zoom.js" not in s:
        s = rep(s, '<script src="../shared/guide.js', TAGS + '<script src="../shared/guide.js')
        s = rep(s, '''    const ids = Q.filter(q => q.field === f).map(q => q.id), s = summary(ids);
    return `<button class="tile" data-field="${esc(f)}"><span class="t">${esc(f)}</span><span class="s num">${s.done}/${s.n}問　前回正解${s.ok}</span>${meter(s)}</button>`;''',
                '''    const ids = Q.filter(q => q.field === f).map(q => q.id), s = summary(ids);
    let c = 0, w = 0; for (const id of ids) { const r = rec[id]; if (r) { c += r.c || 0; w += r.w || 0; } }
    const pc = c + w ? c / (c + w) : null, pcA = window.KQPlan && pc !== null ? KQPlan.pcAttr(pc) : "";
    return `<button class="tile${pc !== null ? " pc-soft" : ""}" data-field="${esc(f)}" style="${pcA}"><span class="t">${esc(f)}</span><span class="s num">${pc !== null ? `正答率 <b class="pc-c" style="font-size:13px">${Math.round(pc * 100)}%</b>　` : ""}${s.done}/${s.n}問　前回正解${s.ok}</span>${meter(s)}</button>`;''')
        s = rep(s, '<h2>分野ごとに解く</h2>', '<h2>分野ごとに解く</h2><p style="margin:-6px 0 10px">${""}</p>'.replace('${""}', '<span class="pc-legend" id="pc-legend"></span>'))
        s = rep(s, '  $("#grid-field").innerHTML = FIELDS.map(f => {', '  if (window.KQPlan && $("#pc-legend")) $("#pc-legend").outerHTML = KQPlan.legend();\n  $("#grid-field").innerHTML = FIELDS.map(f => {')
        open(p, "w", encoding="utf-8").write(s); print(p, "拡大・色 ok")
    else: print(p, "拡大・色 もう入っている")

p = "ikougaku/index.html"; s = open(p, encoding="utf-8").read()
if "shared/zoom.js" not in s:
    s = rep(s, "</head>", f'<script src="../shared/zoom.js?v={V}" defer></script></head>')
    open(p, "w", encoding="utf-8").write(s); print(p, "拡大 ok")

# ---------------- 暗記カード：?start=due ----------------
p = "kisoi/index.html"; s = open(p, encoding="utf-8").read()
if "dueOnly" not in s:
    s = rep(s, 'let mode = "srs", sec = "", lvMin = 0', '''// ?start=due&n=12 … トップの「今日やること」から：復習期限が来たカードだけ（新しいカードは出さない）
const P0 = new URLSearchParams(location.search); let dueOnly = P0.get("start") === "due", dueN = +P0.get("n") || 0;
let mode = "srs", sec = "", lvMin = 0''')
    s = rep(s, "    const left = Math.max(0, newPerDay - log.newSeen);", "    const left = dueOnly ? 0 : Math.max(0, newPerDay - log.newSeen);")
    s = rep(s, "    queue = [...due, ...shuffle(fresh)];", "    queue = [...(dueOnly && dueN ? due.slice(0, dueN) : due), ...shuffle(fresh)];")
    s = rep(s, '''document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));''',
            '''document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => { dueOnly = false; setMode(b.dataset.mode); }));''')
    open(p, "w", encoding="utf-8").write(s); print(p, "due ok")

# ---------------- 過去問：模試・今日やること・おすすめ ----------------
p = "kakomon/index.html"; s = open(p, encoding="utf-8").read()
if "view-mock" in s:
    print(p, "模試 もう入っている"); raise SystemExit

CSS = r'''
/* 模試モード */
.mk-hero{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}
.mk-hero p{margin:0;flex:1 1 240px;color:var(--sub);font-size:13.5px}
.mk-form{display:grid;gap:12px;margin:6px 0 14px}
.mk-form label{display:grid;gap:4px;font-size:13px;color:var(--sub);font-weight:700}
.mk-form select{font-weight:400;font-size:15px;color:var(--ink)}
.mk-resume{border:2px solid var(--accent);border-radius:14px;padding:14px 16px;margin-bottom:14px;background:var(--accent-soft)}
.mk-resume b{font-size:15.5px}
.mk-top{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}
.mk-top .qno{margin-right:auto}
.mk-time{font-family:var(--f-mono);font-size:17px;font-weight:700;padding:3px 12px;border-radius:999px;background:var(--paper)}
.mk-time.low{color:#b26a00;background:rgba(232,183,48,.18)} .mk-time.over{color:var(--ng);background:var(--ng-soft)}
.mk-src{font-size:12px;color:var(--sub);margin:-8px 0 8px}
.mk-nav{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;margin-top:18px}
.mk-nav .btn:last-child{justify-self:end}
.mk-flag[aria-pressed="true"]{color:#b26a00;border-color:#e8b730;background:rgba(232,183,48,.14)}
.mk-pal{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin:8px 0 14px}
.mk-pal button{position:relative;aspect-ratio:1;min-width:0;border:1px solid var(--line2);background:var(--sheet);border-radius:6px;font-family:var(--f-mono);font-size:11px;padding:0;color:var(--sub)}
.mk-pal button.a{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);font-weight:700}
.mk-pal button.f::after{content:"";position:absolute;top:2px;right:2px;width:6px;height:6px;border-radius:50%;background:#e8b730}
.mk-pal button.cur{outline:2px solid var(--ink);outline-offset:1px}
.mk-pal-h{font-size:13px;font-weight:700;margin-top:6px}
.mk-banner{padding:10px 14px;border-radius:12px;background:var(--ng-soft);font-size:13.5px;font-weight:700;margin-bottom:12px}
.mk-confirm{margin-top:12px;padding:12px 14px;border-radius:12px;background:var(--paper);font-size:14px}
.mk-score{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin:10px 0 4px}
.mk-line{position:relative;height:12px;border-radius:6px;background:var(--line);margin:14px 0 6px}
.mk-line i{position:absolute;left:0;top:0;bottom:0;border-radius:6px}
.mk-line u{position:absolute;top:-5px;bottom:-5px;width:2px;background:var(--ink)}
.mk-line-lab{position:relative;height:18px;font-size:11.5px;color:var(--sub)}
.mk-line-lab span{position:absolute;transform:translateX(-50%);white-space:nowrap}
.mk-pass{font-family:var(--f-disp);font-weight:900;font-size:18px;margin:8px 0 2px}
.mk-sub{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}
.mk-sub div{padding:10px;border-radius:12px;background:var(--paper);display:grid;justify-items:center;text-align:center}
.mk-sub b{font-family:var(--f-num);font-size:22px;line-height:1.2}
.mk-sub span{font-size:11.5px;color:var(--sub)}
.mk-fields{display:grid;gap:6px;margin:8px 0 14px}
.mk-f{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:2px 10px;align-items:center;padding:8px 10px;border-radius:10px;text-align:left;border:1px solid var(--line);font-size:13.5px;background:var(--sheet)}
.mk-f .meter{grid-column:1/-1;height:5px;margin:0}
.mk-f .meter i{border-radius:3px}
.mk-f em{font-style:normal;font-size:12px;color:var(--sub)}
.mk-hist{display:grid;gap:6px}
.mk-h{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;background:var(--sheet);text-align:left;width:100%}
.mk-h small{color:var(--sub);font-size:12px}
.mk-h b{font-family:var(--f-num);font-size:18px;grid-row:1/3;grid-column:2;align-self:center}
@media (min-width:760px){
  body.memo-open #view-mock.exam{grid-template-columns:minmax(0,1fr) clamp(300px,40%,480px);align-items:start}
}
'''
s = rep(s, "</style>\n\n<div class=\"wrap\">", CSS + "</style>\n\n<div class=\"wrap\">")

s = rep(s, '''    <div class="panel">
      <h2>回ごとに解く</h2>''', '''    <div class="panel" id="mk-entry">
      <h2>模試モード</h2>
      <div class="mk-hero">
        <p id="mk-entry-note">本番と同じ200問を、タイマーつきで通して解きます。答え合わせは最後にまとめて。途中でやめても、続きから再開できます。</p>
        <button class="btn primary" id="go-mock">模試を開く</button>
      </div>
    </div>
    <div class="panel">
      <h2>回ごとに解く</h2>''')

s = rep(s, '''  <!-- 結果 -->''', '''  <!-- 模試 -->
  <section class="view" id="view-mock" hidden>
    <div id="mock-box"></div>
  </section>

  <!-- 結果 -->''')

# show() で模試の画面も切りかえ、メモを模試の画面にも出す
s = rep(s, '''  view = v; document.body.classList.toggle("in-quiz", v === "quiz");''',
        '''  if (view === "mock" && v !== "mock") mockLeave();
  view = v; document.body.classList.toggle("in-quiz", v === "quiz" || (v === "mock" && mockScreen === "exam"));
  const memoHost = v === "mock" ? $("#view-mock") : $("#view-quiz");
  if ($("#memo").parentNode !== memoHost) memoHost.appendChild($("#memo"));
  if (v !== "mock") $("#memo").hidden = false;''')
s = rep(s, '''  if (view === "quiz") renderQuiz();
}''', '''  if (view === "quiz") renderQuiz();
  if (view === "mock") renderMock();
}''')

# 今日やること：結果画面に暗記カードへの続き
s = rep(s, "  quiz = { seq: (quiz?.seq || 0) + 1, title, ids, i: 0, picked: new Set(), done: false, results: [], weak: !!opts.weak, wk: [] };",
        "  quiz = { seq: (quiz?.seq || 0) + 1, title, ids, i: 0, picked: new Set(), done: false, results: [], weak: !!opts.weak, wk: [], today: opts.today || null };")
s = rep(s, '''      <button class="btn" id="r-home">ホームへ</button>
    </div>''', '''      <button class="btn" id="r-home">ホームへ</button>
    </div>
    ${quiz.today && quiz.today.cards ? `<div class="mk-resume" style="margin:4px 0 14px"><b>つづき：暗記カードの復習 ${quiz.today.cards}枚</b><br><span style="font-size:13px;color:var(--sub)">今日やることの残りです。復習の期限が来たカードを出します。</span><div class="row" style="margin-top:8px"><a class="btn primary" href="../kisoi/?start=due&n=${quiz.today.cards}" style="text-decoration:none">暗記カードへ進む</a></div></div>` : ""}''')

JS = r'''
/* ---------- 模試モード（本番と同じ200問・タイマー・中断／再開） ---------- */
// 記録：LS-mock（いまの模試）と LS-mockh（結果の履歴）。クラウドにも rec・weak といっしょに保存
// 採点：1問1点・200点満点、合格ラインは6割（120点）。採点除外の問題（answer が空）は全員正解
// 答え合わせのときに、答えた問題は成績（rec）と苦手リストにも入る。答えなかった問題は記録しない
const MK_K = LS + "-mock", MH_K = LS + "-mockh", MK_N = 200, MK_PASS = 0.6;
let mock = null, mockH = [];
try { mock = JSON.parse(localStorage.getItem(MK_K) || "null"); } catch {}
try { mockH = JSON.parse(localStorage.getItem(MH_K) || "[]"); if (!Array.isArray(mockH)) mockH = []; } catch { mockH = []; }
let mockPauseAsk = false, mockPauseT = null, mockMsg = "";
let mockScreen = "setup", mockShow = null, mockPal = false, mockAsk = false, mockDel = false, runSince = null, mockTimer = null, mockNewAsk = false;
const mockRun = () => !!(mock && mock.status === "run" && Array.isArray(mock.ids));
function saveMock(sync = true){
  try { localStorage.setItem(MK_K, JSON.stringify(mock)); localStorage.setItem(MH_K, JSON.stringify(mockH)); } catch {}
  if (sync) { dirty.add("mock"); flush(); }
}
function mergeMock(m2, h2){
  let ch = false;
  if (m2 && typeof m2 === "object" && (!mock || (m2.at || 0) > (mock.at || 0))) { mock = m2; ch = true; }
  if (Array.isArray(h2)) for (const h of h2) if (h && h.id && !mockH.some(x => x.id === h.id)) { mockH.push(h); ch = true; }
  if (ch) { mockH.sort((a, b) => b.id - a.id); mockH = mockH.slice(0, 30); saveMock(false); }
  return ch;
}
const usedMs = () => mock ? (mock.used || 0) + (runSince ? Date.now() - runSince : 0) : 0;
function pauseTimer(){ if (runSince && mock) { mock.used = (mock.used || 0) + Date.now() - runSince; runSince = null; mock.at = Date.now(); saveMock(); } clearInterval(mockTimer); mockTimer = null; }
function resumeTimer(){
  if (!mockRun() || view !== "mock" || mockScreen !== "exam" || document.hidden) return;
  if (!runSince) runSince = Date.now();
  clearInterval(mockTimer); mockTimer = setInterval(tick, 1000); tick();
}
const hms = ms => { const t = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };
const jmin = ms => { const m = Math.round(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}時間${m % 60 ? m % 60 + "分" : ""}` : `${m}分`; };
function tick(){
  const el = $("#mk-time"); if (!el || !mock) return;
  const u = usedMs();
  if (mock.limit) {
    const left = mock.limit - u;
    el.textContent = left >= 0 ? "残り " + hms(left) : "+" + hms(-left) + " オーバー";
    el.className = "mk-time" + (left < 0 ? " over" : left < 15 * 60000 ? " low" : "");
    if (left < 0 && !mock.overShown) { mock.overShown = 1; saveMock(); renderMock(); }
  } else el.textContent = "経過 " + hms(u);
  // 15秒ごとに、使った時間を保存（電池切れ・アプリを閉じても続きから）
  if (runSince && Date.now() - runSince > 15000) { mock.used = (mock.used || 0) + Date.now() - runSince; runSince = Date.now(); mock.at = Date.now(); saveMock(false); }
}
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseTimer(); else resumeTimer(); });
window.addEventListener("pagehide", pauseTimer);
function mockLeave(){ pauseTimer(); mockScreen = mockShow ? "result" : "setup"; mockAsk = false; document.body.classList.remove("in-quiz"); }

// 問題をえらぶ
function mockBuild(kind){
  const sess = s => s === "午前" ? 0 : 1, ord = (a, b) => sess(a.session) - sess(b.session) || a.no - b.no;
  if (kind !== "mix") {
    const xs = Q.filter(q => String(q.kai) === kind).sort(ord);
    return { ids: xs.map(q => q.id), half: xs.filter(q => q.session === "午前").length, title: `第${kind}回`, kai: +kind };
  }
  // 全回ミックス：いちばん新しい回の分野ごとの数（午前・午後それぞれ）と同じ数を、全部の回から。まだ解いていない問題を先に
  const base = Q.filter(q => q.kai === KAIS[0]).sort(ord), used = new Set(), ids = [];
  const pool = {};
  for (const q of Q) (pool[q.field] = pool[q.field] || []).push(q);
  for (const f in pool) pool[f] = [...shuffle(pool[f].filter(q => !rec[q.id])), ...shuffle(pool[f].filter(q => rec[q.id]))];
  for (const b of base) {
    const q = (pool[b.field] || []).find(x => !used.has(x.id)) || shuffle(Q).find(x => !used.has(x.id));
    used.add(q.id); ids.push(q.id);
  }
  return { ids, half: base.filter(q => q.session === "午前").length, title: "全回ミックス", kai: null };
}
function mockStart(kind, limitMin){
  const b = mockBuild(kind);
  if (b.ids.length < 10) return;
  mock = { v: 1, id: Date.now(), kind, title: b.title, ids: b.ids, half: b.half, ans: {}, flag: {}, i: 0, used: 0, limit: limitMin * 60000, at: Date.now(), status: "run" };
  mockShow = null; mockScreen = "exam"; mockPal = false; mockAsk = false; mockNewAsk = false; runSince = null;
  saveMock(); renderMock(); resumeTimer(); window.scrollTo(0, 0);
}
const mockHalf = () => mock.half || Math.ceil(mock.ids.length / 2);
const mockLab = i => { const half = mockHalf(); return i < half ? `午前 ${i + 1}` : `午後 ${i - half + 1}`; };
const mockAnswered = () => mock.ids.filter((_, i) => (mock.ans[i] || []).length).length;

function renderMock(){
  const box = $("#mock-box");
  $("#view-mock").classList.toggle("exam", mockScreen === "exam" && mockRun());
  $("#memo").hidden = !(mockScreen === "exam" && mockRun());
  document.body.classList.toggle("in-quiz", mockScreen === "exam" && mockRun());
  if (mockScreen === "exam" && mockRun()) return renderMockExam(box);
  if (mockScreen === "result" && mockShow) return renderMockResult(box, mockShow);
  mockScreen = "setup"; renderMockSetup(box);
}
function renderMockSetup(box){
  const run = mockRun();
  setTimeout(() => { mockMsg = ""; }, 0);   // メッセージは1回だけ
  const kinds = `<option value="mix">全回ミックス（本番と同じ分野の数・まだ解いていない問題が先）</option>` + KAIS.map(k => `<option value="${k}">第${k}回をそのまま（午前100問＋午後100問）</option>`).join("");
  const hist = mockH.slice(0, 10).map((h, i) => `<button class="mk-h" data-mh="${i}"><span>${esc(h.title)}　<small>${new Date(h.id).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</small></span><small>${h.score >= Math.ceil(h.n * MK_PASS) ? "✓ 合格ライン超え" : `合格ラインまで あと${Math.ceil(h.n * MK_PASS) - h.score}点`}・${jmin(h.used)}</small><b class="pc-c" style="${KQPlan.pcAttr(h.score / h.n)}">${h.score}<small style="font-size:12px">/${h.n}</small></b></button>`).join("");
  box.innerHTML = `<div class="panel">
    <h2>模試モード</h2>
    <p style="margin:0 0 12px;color:var(--sub);font-size:13.5px">本番と同じ<b>200問（午前100問＋午後100問）</b>を通して解きます。途中で答えは出ません。最後に「提出して採点」すると、<b>合格ライン（6割＝120点）</b>との差と、分野ごとの点数が出ます。<br>「中断する」でいつでもやめられます。時間も答えも保存されるので、あとで続きから再開できます（ログインしていれば、ほかの端末でも）。</p>
    ${mockMsg && run ? `<p class="bk-msg ok" role="status" style="margin:0 0 10px">✓ ${esc(mockMsg)}</p>` : ""}
    ${run ? `<div class="mk-resume"><b>中断中の模試：${esc(mock.title)}</b><br><span class="num" style="font-size:13.5px">答えた問題 ${mockAnswered()} / ${mock.ids.length}問・使った時間 ${jmin(mock.used || 0)}${mock.limit ? `（のこり ${jmin(Math.max(0, mock.limit - (mock.used || 0)))}）` : ""}</span>
      <div class="row" style="margin-top:10px"><button class="btn primary" id="mk-resume">続きから解く</button><button class="btn danger" id="mk-discard">${mockDel ? "本当にやめる（答えは消えます）" : "この模試をやめる"}</button></div></div>` : ""}
    <div class="mk-form">
      <label>出す問題<select id="mk-kind">${kinds}</select></label>
      <label>時間<select id="mk-limit"><option value="300">5時間（本番の午前＋午後の目安）</option><option value="150">2時間30分（半分のペースの練習）</option><option value="0">時間を計るだけ（制限なし）</option></select></label>
    </div>
    <button class="btn ${run ? "" : "primary"}" id="mk-start">${run && mockNewAsk ? "中断中の模試を消して、新しく始める" : "模試をはじめる"}</button>
    ${run && mockNewAsk ? `<p class="bk-note" style="margin-top:6px">もう一度押すと、中断中の模試（答えた${mockAnswered()}問）は消えて、新しい模試になります。</p>` : ""}
    <p class="bk-note" style="margin:12px 0 0">本番の時間割は受験票で確かめてね。合格基準は厚生労働省の発表（1問1点・200点満点で120点以上、0点の科目が1つまで）にあわせています。</p>
  </div>
  ${hist ? `<div class="panel"><h2>これまでの模試</h2><div class="mk-hist">${hist}</div></div>` : ""}
  <div class="row"><button class="btn" data-view="home">‹ 過去問のホームへ</button></div>`;
}
function renderMockExam(box){
  const i = Math.min(mock.i || 0, mock.ids.length - 1), q = byId[mock.ids[i]];
  if (!q) { mock.status = "broken"; return renderMockSetup(box); }
  const need = needOf(q), picks = new Set(mock.ans[i] || []), n = mock.ids.length, aN = mockAnswered(), half = mockHalf();
  memo.sync("mock:" + mock.id + ":" + i);
  const imgs = (q.images || []).map(src => `<img src="${esc(src)}" alt="問題の画像" loading="lazy">`).join("");
  const pal = (from, to, lab) => `<div class="mk-pal-h">${lab}</div><div class="mk-pal">${mock.ids.slice(from, to).map((_, k) => { const j = from + k; return `<button class="${(mock.ans[j] || []).length ? "a" : ""}${mock.flag[j] ? " f" : ""}${j === i ? " cur" : ""}" data-mj="${j}" aria-label="${mockLab(j)}">${j - from + 1}</button>`; }).join("")}</div>`;
  const left = n - aN, fl = Object.keys(mock.flag).filter(k => mock.flag[k]).length;
  box.innerHTML = `<div class="sheet">
    ${mock.overShown && mock.limit ? `<div class="mk-banner">⏰ 時間になりました。本番ならここで終わりです。このまま続けてもOK（オーバーした時間も結果に出ます）。</div>` : ""}
    <div class="mk-top">
      <span class="qno">模試 ${esc(mock.title)}　${mockLab(i)}</span>
      <span class="mk-time num" id="mk-time">–</span>
      <button class="btn${mockPauseAsk ? " danger" : ""}" id="mk-pause" style="padding:5px 12px;font-size:13px">${mockPauseAsk ? "もう一度押すと中断（答えと時間は保存）" : "中断する"}</button>
    </div>
    <div class="prog"><i style="width:${aN / n * 100}%"></i></div>
    ${mock.kind === "mix" ? `<div class="mk-src">出典：第${q.kai}回 ${esc(q.session || "")}${q.no}</div>` : ""}
    <div class="qtext">${fmt(q.question)}</div>
    ${need > 1 ? `<span class="howmany">※ ${need}つ選ぶ問題です</span>` : ""}
    ${imgs ? `<div class="qimg">${imgs}</div>` : ""}
    <ol class="choices">${q.choices.map((c, k) => `<li><button class="choice" data-mn="${k + 1}" aria-pressed="${picks.has(k + 1)}"><span class="bubble">${k + 1}</span><span>${esc(c)}</span></button></li>`).join("")}</ol>
    <div class="mk-nav">
      <button class="btn" id="mk-prev" ${i ? "" : "disabled"}>‹ 前へ</button>
      <button class="btn mk-flag" id="mk-flag" aria-pressed="${!!mock.flag[i]}">${mock.flag[i] ? "🚩 見直す印あり" : "🚩 あとで見直す"}</button>
      <button class="btn ${i + 1 < n ? "primary" : ""}" id="mk-next" ${i + 1 < n ? "" : "disabled"}>次へ ›</button>
    </div>
    <div class="row" style="margin-top:14px;justify-content:space-between">
      <button class="btn" id="mk-pal">${mockPal ? "問題一覧をとじる" : "問題一覧"}（答えた ${aN} / ${n}${fl ? `・🚩${fl}` : ""}）</button>
      <button class="btn ${i + 1 === n ? "primary" : ""}" id="mk-submit">提出して採点する</button>
    </div>
    ${mockAsk ? `<div class="mk-confirm">${left ? `まだ答えていない問題が <b>${left}問</b> あります（0点になります）。` : "全部の問題に答えました。"}${fl ? `🚩見直す印の問題が${fl}問あります。` : ""}<br>提出すると答え合わせをします。提出しますか？<div class="row" style="margin-top:8px"><button class="btn primary" id="mk-submit-yes">提出する</button><button class="btn" id="mk-submit-no">まだ解く</button></div></div>` : ""}
    ${mockPal ? `<div style="margin-top:12px">${pal(0, half, "午前")}${pal(half, n, "午後")}<p class="bk-note">青＝答えた　●＝見直す印　番号をタップでその問題へ</p></div>` : ""}
  </div>`;
  tick();
}
function mockPick(k){
  const i = mock.i || 0, q = byId[mock.ids[i]], need = needOf(q), cur = new Set(mock.ans[i] || []);
  if (cur.has(k)) cur.delete(k);
  else { if (need === 1) cur.clear(); else if (cur.size >= need) return; cur.add(k); }
  mock.ans[i] = [...cur].sort((a, b) => a - b); if (!mock.ans[i].length) delete mock.ans[i];
  mock.at = Date.now(); saveMock(); renderMock();
}
function mockGo(i){ if (!mockRun()) return; mockPauseAsk = false; mock.i = Math.max(0, Math.min(mock.ids.length - 1, i)); mockAsk = false; mock.at = Date.now(); saveMock(false); renderMock(); window.scrollTo(0, 0); }
function mockSubmit(){
  pauseTimer();
  const n = mock.ids.length, half = mockHalf(), fields = {}, wrong = [];
  let score = 0, am = 0, pm = 0, unans = 0;
  mock.ids.forEach((id, i) => {
    const q = byId[id]; if (!q) return;
    const p = mock.ans[i] || [], same = a => a.length === p.length && a.every(x => p.includes(x));
    const ok = !q.answer.length || (p.length > 0 && [q.answer, ...(q.alt || [])].some(same));
    const f = fields[q.field] || (fields[q.field] = [0, 0]); f[1]++;
    if (ok) { score++; f[0]++; i < half ? am++ : pm++; } else wrong.push(id);
    if (!p.length) unans++;
    if (p.length) { record(id, ok); weakRecord(id, ok, false); }
  });
  const h = { id: mock.id, title: mock.title, kind: mock.kind, n, score, am, pm, half, used: mock.used || 0, limit: mock.limit || 0, unans, fields, wrong, at: Date.now() };
  mockH = [h, ...mockH.filter(x => x.id !== h.id)].slice(0, 30);
  mock = { status: "done", id: mock.id, at: Date.now() };
  saveMock(); mockShow = h; mockScreen = "result"; mockAsk = false;
  document.body.classList.remove("in-quiz"); render(); window.scrollTo(0, 0);
}
function renderMockResult(box, h){
  const line = Math.ceil(h.n * MK_PASS), diff = h.score - line, pct = h.score / h.n;
  const fl = Object.entries(h.fields).map(([f, [ok, n]]) => ({ f, ok, n, p: n ? ok / n : 0 })).sort((a, b) => a.p - b.p || b.n - a.n);
  const zero = fl.filter(x => x.ok === 0 && x.n >= 2);
  box.innerHTML = `<div class="panel">
    <h2>模試の結果（${esc(h.title)}）</h2>
    <div class="mk-score"><span class="result-big pc-c" style="${KQPlan.pcAttr(pct)}">${h.score}</span><span class="num">/ ${h.n}点（${Math.round(pct * 100)}%）</span></div>
    <p class="mk-pass" style="color:${diff >= 0 ? "var(--ok)" : "var(--ng)"}">${diff >= 0 ? `🎉 合格ライン（${line}点）を ${diff}点 上回りました` : `合格ライン（${line}点）まで あと ${-diff}点`}</p>
    <div class="mk-line" aria-hidden="true"><i class="pc-bg" style="width:${pct * 100}%;${KQPlan.pcAttr(pct)}"></i><u style="left:${MK_PASS * 100}%"></u></div>
    <div class="mk-line-lab"><span style="left:${MK_PASS * 100}%">合格ライン ${line}点</span></div>
    ${zero.length && h.unans < 20 ? `<p class="mk-banner" style="margin-top:8px">0点の分野：${zero.map(x => esc(x.f)).join("・")}。本番は0点の科目が2つ以上あると不合格なので、まずここを1点でも取れるように。</p>` : ""}
    <div class="mk-sub">
      <div><b class="num">${h.am}<small style="font-size:12px">/${h.half}</small></b><span>午前</span></div>
      <div><b class="num">${h.pm}<small style="font-size:12px">/${h.n - h.half}</small></b><span>午後</span></div>
      <div><b class="num" style="font-size:17px">${jmin(h.used)}</b><span>${h.limit ? (h.used > h.limit ? `${jmin(h.used - h.limit)}オーバー` : `制限 ${jmin(h.limit)}`) : "かかった時間"}</span></div>
    </div>
    ${h.unans ? `<p class="bk-note">答えなかった問題：${h.unans}問（0点で計算。成績・苦手リストには入れていません）</p>` : ""}
    <h3 style="margin:14px 0 2px">分野ごとの点数<small style="font-weight:400;font-size:12px;color:var(--sub)">　低い（苦手な）順・タップでその分野を練習</small></h3>
    <div style="margin:4px 0">${KQPlan.legend()}</div>
    <div class="mk-fields">${fl.map(x => `<button class="mk-f" data-field="${esc(x.f)}" style="${KQPlan.pcAttr(x.p)}"><span>${esc(x.f)}</span><em class="num">${x.ok}/${x.n}問</em><b class="pc-c num">${Math.round(x.p * 100)}%</b><span class="meter"><i class="pc-bg" style="width:${x.p * 100}%"></i></span></button>`).join("")}</div>
    <p class="bk-note">答えた問題は、成績と苦手リストにも入りました（まちがえた問題は苦手リストへ。2回続けて正解で卒業）。</p>
    <div class="row">
      ${h.wrong.length ? `<button class="btn primary" id="mk-wrong">まちがえた${h.wrong.length}問を解説つきで解き直す</button>` : ""}
      <button class="btn" id="mk-back">模試のページへ</button>
    </div>
  </div>
  ${h.wrong.length ? `<div class="panel"><h2>まちがえた問題</h2><div class="list">${h.wrong.slice(0, 60).map(id => byId[id] ? itemHTML(byId[id]) : "").join("")}</div>${h.wrong.length > 60 ? `<div class="empty">ほか ${h.wrong.length - 60}問（「解き直す」でぜんぶ出ます）</div>` : ""}</div>` : ""}`;
}
document.addEventListener("click", e => {
  const t = e.target.closest("button"); if (!t || view !== "mock") return;
  if (t.dataset.mn && mockRun() && mockScreen === "exam") return mockPick(+t.dataset.mn);
  if (t.dataset.mj) { mockPal = false; return mockGo(+t.dataset.mj); }
  if (t.dataset.mh) { mockShow = mockH[+t.dataset.mh]; mockScreen = "result"; renderMock(); window.scrollTo(0, 0); return; }
  switch (t.id) {
    case "mk-start": {
      if (mockRun() && !mockNewAsk) { mockNewAsk = true; return renderMock(); }
      return mockStart($("#mk-kind").value, +$("#mk-limit").value);
    }
    case "mk-resume": mockShow = null; mockScreen = "exam"; mockDel = false; show("mock"); resumeTimer(); return;
    case "mk-discard": if (!mockDel) { mockDel = true; return renderMock(); } mockDel = false; mock = { status: "done", id: mock.id, at: Date.now() }; saveMock(); return renderMock();
    case "mk-pause": {
      // まちがえて押しても大丈夫なように、2回押しで中断。中断したら保存できたことを出す
      if (!mockPauseAsk) { mockPauseAsk = true; renderMock(); clearTimeout(mockPauseT); mockPauseT = setTimeout(() => { if (mockPauseAsk) { mockPauseAsk = false; if (view === "mock" && mockScreen === "exam") renderMock(); } }, 4000); return; }
      mockPauseAsk = false; pauseTimer();
      mockMsg = `中断して保存しました（答えた ${mockAnswered()}問・使った時間 ${jmin(mock.used || 0)}${Object.keys(mock.flag).length ? "・🚩" + Object.keys(mock.flag).length + "問" : ""}）。「続きから解く」で、同じところから再開できます。`;
      mockScreen = "setup"; mockAsk = false; document.body.classList.remove("in-quiz"); renderMock(); window.scrollTo(0, 0); return;
    }
    case "mk-prev": return mockGo((mock.i || 0) - 1);
    case "mk-next": return mockGo((mock.i || 0) + 1);
    case "mk-flag": { const i = mock.i || 0; if (mock.flag[i]) delete mock.flag[i]; else mock.flag[i] = 1; saveMock(false); return renderMock(); }
    case "mk-pal": mockPal = !mockPal; return renderMock();
    case "mk-submit": mockAsk = true; renderMock(); $("#mk-submit-yes")?.scrollIntoView({ block: "center" }); return;
    case "mk-submit-no": mockAsk = false; return renderMock();
    case "mk-submit-yes": return mockSubmit();
    case "mk-wrong": return startQuiz("模試のまちがい", mockShow.wrong.filter(id => byId[id]));
    case "mk-back": mockShow = null; mockScreen = "setup"; return renderMock();
  }
});
document.addEventListener("keydown", e => {
  if (view !== "mock" || mockScreen !== "exam" || !mockRun() || e.target.matches("input,select,textarea")) return;
  const q = byId[mock.ids[mock.i || 0]];
  if (/^[1-9]$/.test(e.key) && q && +e.key <= q.choices.length) mockPick(+e.key);
  if (e.key === "ArrowRight") mockGo((mock.i || 0) + 1);
  if (e.key === "ArrowLeft") mockGo((mock.i || 0) - 1);
});
function paintMockEntry(){
  const el = $("#mk-entry-note"); if (!el) return;
  if (mockRun()) { el.innerHTML = `<b>中断中の模試があります：${esc(mock.title)}</b>（答えた ${mockAnswered()} / ${mock.ids.length}問）。「模試を開く」から続きを解けます。`; $("#go-mock").textContent = "模試の続きへ"; }
  else { el.textContent = "本番と同じ200問を、タイマーつきで通して解きます。答え合わせは最後にまとめて。途中でやめても、続きから再開できます。"; $("#go-mock").textContent = "模試を開く"; }
}

/* ---------- 今日やること・おすすめ（トップのボタンから） ---------- */
let TH = null;
const planItems = () => Q.map(q => ({ id: q.id, f: q.field, t: TH ? TH[q.id] : null }));
function startToday(n, c){
  const p = KQPlan.today(planItems(), rec, weak, { total: n + c, cardsDue: c }), tag = {};
  // 問題ごとに「なぜ今日出たか」をおぼえておく（苦手はまちがえた日も）
  for (const id of p.weak) tag[id] = ["weak", weak[id]?.t || rec[id]?.t || 0];
  for (const id of p.field) tag[id] = ["field", p.fieldName];
  for (const id of p.fresh) tag[id] = [rec[id] ? "again" : "new"];
  startQuiz("今日やること", p.ids, { today: { cards: p.cards, tag } });
}
function todayTag(id){
  const t = quiz?.today?.tag?.[id]; if (!t) return "";
  const d = t[1] ? new Date(t[1]) : null;
  const lab = t[0] === "weak" ? `🔁 苦手の復習${d ? `（${d.getMonth() + 1}/${d.getDate()}にまちがえた問題）` : ""}` : t[0] === "field" ? `🎯 弱点分野の問題` : t[0] === "again" ? "📉 正答率が低い問題" : "✨ はじめての問題";
  return `<span class="chip" style="background:var(--accent-soft);color:var(--accent);font-weight:700">${lab}</span>`;
}
async function startTheme(field, theme, n){
  if (theme && !TH) { try { TH = await (await fetch("themes.json")).json(); } catch { TH = {}; } }
  const ids = KQPlan.pickFrom(planItems(), rec, field, theme, n || 10);
  startQuiz(theme ? `おすすめ：${theme}` : `おすすめ：${field}`, shuffle(ids));
}
'''
s = rep(s, "/* ---------- 操作 ---------- */", JS + "\n/* ---------- 操作 ---------- */")
s = rep(s, '''    case "go-random": return startQuiz("ランダム10問", shuffle(Q.map(q => q.id)).slice(0, 10));''',
        '''    case "go-random": return startQuiz("ランダム10問", shuffle(Q.map(q => q.id)).slice(0, 10));
    case "go-mock": return show("mock");''')
# ホームに中断中の模試を出す
s = rep(s, '''  $("#go-review").disabled = !ngIds.length;''', '''  paintMockEntry();
  $("#go-review").disabled = !ngIds.length;''')
s = rep(s, '''      <span class="chip">${esc(q.field)}</span>
      <span class="num" style="color:var(--sub);font-size:13px">${esc(quiz.title)}''', '''      <span class="chip">${esc(q.field)}</span>${todayTag(q.id)}
      <span class="num" style="color:var(--sub);font-size:13px">${esc(quiz.title)}''')
# 保存とクラウドからの取りこみ
s = rep(s, "  const r = await KQ.save(APP, { v: 1, at: Date.now(), rec, weak });", "  const r = await KQ.save(APP, { v: 1, at: Date.now(), rec, weak, mock, mockh: mockH });")
s = rep(s, "  if (mergeIn(d.rec, d.weak)) { saveLocal(); saveWeak(); render(); }", "  const mch = mergeMock(d.mock, d.mockh);\n  if (mergeIn(d.rec, d.weak) || mch) { saveLocal(); saveWeak(); if (!(view === \"mock\" && mockScreen === \"exam\")) render(); }")
# URL から
s = rep(s, '''  const st = P.get("start"), one = P.get("q"), f = P.get("field");''', '''  const st = P.get("start"), one = P.get("q"), f = P.get("field"), th = P.get("theme"), pn = +P.get("n") || 0;''')
s = rep(s, '''  if (st === "random") return''', '''  if (st === "mock") return show("mock");
  if (st === "today") return startToday(Math.max(0, +P.get("n") || 0), Math.max(0, +P.get("c") || 0));
  if (f && (th || pn)) return startTheme(f, th, pn);
  if (st === "random") return''')
open(p, "w", encoding="utf-8").write(s); print(p, "模試・今日やること・おすすめ ok")
