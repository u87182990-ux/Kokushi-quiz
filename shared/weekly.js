/* 週間模試（コクシル式）：週替わりで1分野だけ、20問・制限時間30分。その週は全員同じ問題。
   ・トップ（index.html）… KQWeekly.info() で今週の分野、KQWeekly.read(lsBase, cloudWk) で自分の状態を見るだけ
   ・過去問（kakomon/index.html）… KQWeekly.render() で 概要 → 本番 → 結果レポート を出す（tools/add-weekly.py で組みこみ）
   記録：localStorage「<過去問の記録キー>-wk」＝{ cur: いま解いている回, h: [週ごとの結果] }。クラウドは kakomon の data.wk。
   答え合わせのとき、答えた問題は過去問の成績（rec）と苦手リストにも入る（200問模試と同じ）。 */
(() => {
  const N = 20, LIMIT = 30 * 60000, PASS = 0.6;
  // 回す分野（問題が20問以上ある14分野。医療安全学は16問なので外す）。順番は固定＝全員同じ
  const ROT = ["放射線安全管理学", "X線撮影技術学", "放射線物理学", "核医学検査技術学", "医用画像情報学", "基礎医学大要", "放射線計測学",
    "診療画像検査学", "放射線治療技術学", "放射化学", "診療画像機器学", "放射線生物学", "医用工学", "画像工学"];
  const BASE = new Date(2026, 0, 5);   // 2026年1月5日（月）を第0週に
  const DAY = 864e5;

  /* ---------- 今週 ---------- */
  function info(at){
    const d = new Date(at || Date.now()); d.setHours(0, 0, 0, 0);
    const mon = new Date(d); mon.setDate(d.getDate() - (d.getDay() + 6) % 7);
    const wk = Math.round((mon - BASE) / (7 * DAY));
    const field = ROT[((wk % ROT.length) + ROT.length) % ROT.length];
    const label = `${mon.getFullYear()}年${mon.getMonth() + 1}月${Math.ceil(mon.getDate() / 7)}週目`;
    const end = new Date(mon); end.setDate(mon.getDate() + 6);
    return { wk, field, label, from: mon, to: end, next: ROT[(((wk + 1) % ROT.length) + ROT.length) % ROT.length] };
  }
  // 決まった種から並べかえ（全員同じになる）
  function rand(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function pick(Q, inf){
    const r = rand(inf.wk * 7919 + 17), pool = Q.filter(q => q.field === inf.field && q.answer && q.answer.length);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const ses = s => s === "午前" ? 0 : 1;
    return pool.slice(0, N).sort((a, b) => b.kai - a.kai || ses(a.session) - ses(b.session) || a.no - b.no).map(q => q.id);
  }

  /* ---------- 記録 ---------- */
  const blank = () => ({ cur: null, h: [] });
  function readLS(key){ try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v && typeof v === "object" ? { cur: v.cur || null, h: Array.isArray(v.h) ? v.h : [] } : blank(); } catch { return blank(); } }
  function mergeInto(a, b){
    let ch = false;
    if (!b || typeof b !== "object") return false;
    if (b.cur && (!a.cur || (b.cur.at || 0) > (a.cur.at || 0))) { a.cur = b.cur; ch = true; }
    for (const h of Array.isArray(b.h) ? b.h : []) if (h && h.wk != null && !a.h.some(x => x.wk === h.wk)) { a.h.push(h); ch = true; }
    if (ch) { a.h.sort((x, y) => y.wk - x.wk); a.h = a.h.slice(0, 60); }
    // 結果が出ている週の「解いている回」は終わりにする
    if (a.cur && a.h.some(x => x.wk === a.cur.wk)) { a.cur = null; ch = true; }
    return ch;
  }
  // トップ用：端末＋クラウドをあわせた状態
  function read(lsBase, cloudWk){ const a = readLS(lsBase + "-wk"); mergeInto(a, cloudWk); return a; }

  window.KQWeekly = { info, pick, read, N, LIMIT, PASS };

  /* =========================================================
     ここから下は過去問ページ（KQPage がある時）だけ
     ========================================================= */
  let P = null, S = blank(), KEY = "", screen = "top", showH = null, ask = false, timer = null, seen = null, RATES = null, TH = null;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pcA = p => window.KQPlan ? KQPlan.pcAttr(p) : "";
  const mmss = ms => { const t = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
  const jtime = ms => { const t = Math.max(0, Math.round(ms / 1000)); return t >= 60 ? `${Math.floor(t / 60)}分${String(t % 60).padStart(2, "0")}秒` : `${t}秒`; };
  const src = q => `第${q.kai}回 ${q.session || ""}${q.no}`;

  // 記録だけ先に読む（クラウド保存の前に必ず。過去問ページの LS が決まった直後に呼ぶ）
  function boot(lsKey){ KEY = lsKey + "-wk"; S = readLS(KEY); }
  function init(page){
    P = page;
    fetch("rates.json").then(r => r.ok ? r.json() : null).then(d => { RATES = d; if (P.view === "weekly") render(); }).catch(() => {});
    fetch("themes.json").then(r => r.ok ? r.json() : null).then(d => { TH = d || {}; if (P.view === "weekly" && screen === "result") render(); }).catch(() => {});
    document.addEventListener("visibilitychange", () => { if (document.hidden) stopSeen(); else if (P.view === "weekly" && screen === "exam") startSeen(); });
    document.addEventListener("click", onClick);
    // 時間切れのまま閉じていた回は、開いたときに採点する
    const c = S.cur; if (c && c.status === "run" && Date.now() > c.start + LIMIT) submit(true, false);
  }
  function save(sync = true){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} if (sync && P) P.dirtyWk(); }
  const dump = () => KEY ? S : undefined;
  function merge(b){ const ch = mergeInto(S, b); if (ch) { save(false); if (P && P.view === "weekly" && screen !== "exam") render(); } return ch; }
  const running = () => !!(S.cur && S.cur.status === "run" && S.cur.wk === info().wk);
  const left = () => S.cur ? S.cur.start + LIMIT - Date.now() : 0;

  /* ---------- 1問ごとの解答時間 ---------- */
  function startSeen(){ if (running()) seen = { i: S.cur.i || 0, t: Date.now() }; }
  function stopSeen(){ if (!seen || !S.cur || !S.cur.tm) { seen = null; return; } S.cur.tm[seen.i] = (S.cur.tm[seen.i] || 0) + (Date.now() - seen.t); seen = null; S.cur.at = Date.now(); save(false); }

  /* ---------- 画面 ---------- */
  function render(){
    const box = $("#wk-box"); if (!box || !P) return;
    clearInterval(timer); timer = null;
    const memoEl = document.getElementById("memo");
    if (screen === "exam" && running()) { document.body.classList.add("in-quiz"); if (memoEl) memoEl.hidden = false; return exam(box); }
    document.body.classList.remove("in-quiz"); if (memoEl) memoEl.hidden = true; stopSeen();
    if (screen === "result" && showH) return result(box, showH);
    screen = "top"; top(box);
  }
  function top(box){
    const inf = info(), done = S.h.find(h => h.wk === inf.wk), run = running();
    const ids = pick(P.Q, inf), rs = RATES ? ids.map(id => RATES.r[id]).filter(x => x != null) : [];
    const avg = rs.length ? Math.round(rs.reduce((a, b) => a + b, 0) / rs.length) : null;
    const notes = [
      `試験問題は<b>${N}問</b>、解答時間は<b>30分</b>です。分野は毎週月曜に変わり、その週は<b>全員同じ問題</b>です。`,
      `<b>始めたら中断できません。</b>ページを閉じても時間は進みます。30分とれるときに始めてください。`,
      `時間になると、そこまでの答えで<b>自動で提出</b>されます。`,
      `答えは選択肢をタップ。<b>2つ選ぶ問題</b>は、問題文の下に「2つ選ぶ」と出ます。`,
      `結果は週ごとに残ります（その週の<b>1回目</b>の結果）。答えた問題は成績と苦手リストにも入ります。`
    ];
    const hist = S.h.slice(0, 20).map(h => `<button class="wk-hrow" data-wkh="${h.wk}"><span><b>${esc(h.label)}</b><small>${esc(h.field)}・${jtime(h.used)}</small></span><b class="pc-c num" style="${pcA(h.score / h.n)}">${h.score}<small>/${h.n}</small></b></button>`).join("");
    box.innerHTML = `<div class="panel wk-card">
      <h2 class="wk-title">週間模試（${esc(inf.label)}）<br><span>［${esc(inf.field)}］</span></h2>
      <div class="wk-tiles">
        <div><b class="num">${N}</b><span>問題数</span></div>
        <div><b class="num">30</b><span>制限時間（分）</span></div>
        <div><b class="num">${avg == null ? "–" : avg + "%"}</b><span>みんなの正答率</span></div>
      </div>
      <div class="wk-go">${run ? `<button class="btn primary" id="wk-resume">続きを解く（残り ${mmss(left())}）</button>`
        : done ? `<button class="btn primary" data-wkh="${done.wk}">今週の結果を見る（${done.score}/${done.n}点）</button>`
        : `<button class="btn primary" id="wk-start">${ask ? "もう一度押すと始まります（30分）" : "試験を開始する"}</button>`}</div>
      ${done ? `<p class="wk-note">今週はもう受けました。同じ問題を練習で解き直すと、解説つきで1問ずつ答え合わせできます（週間模試の結果は1回目のまま）。</p><div class="wk-go"><button class="btn" id="wk-practice">練習で解き直す</button></div>` : ""}
    </div>
    <div class="panel wk-card">
      <h2>注意事項</h2>
      <ul class="wk-rules">${notes.map(n => `<li>${n}</li>`).join("")}</ul>
      <p class="wk-note">来週の分野：${esc(inf.next)}　出典：過去問（第67〜78回）。みんなの正答率はコクシルの利用者データ（2026年11月取得）の平均です。</p>
    </div>
    <div class="panel wk-card">
      <h2>これまでの週間模試</h2>
      ${hist ? `<div class="wk-hist">${hist}</div>` : `<p class="wk-note" style="margin:0">まだ結果はありません。受けると、週ごとの点数と分析レポートがここに残ります。</p>`}
    </div>
    <div class="row"><button class="btn" data-view="home">‹ 過去問のホームへ</button></div>`;
  }
  function start(){
    const inf = info(), ids = pick(P.Q, inf);
    if (ids.length < 5) return;
    S.cur = { wk: inf.wk, label: inf.label, field: inf.field, ids, ans: {}, tm: {}, i: 0, start: Date.now(), at: Date.now(), status: "run" };
    ask = false; screen = "exam"; save(); render(); window.scrollTo(0, 0);
  }
  function exam(box){
    const c = S.cur, n = c.ids.length, i = Math.min(c.i || 0, n - 1), q = P.byId[c.ids[i]];
    if (!q) { S.cur = null; save(); screen = "top"; return render(); }
    const need = P.needOf(q), picks = new Set(c.ans[i] || []), aN = c.ids.filter((_, k) => (c.ans[k] || []).length).length;
    if (P.memo) P.memo.sync("wk:" + c.wk + ":" + i);
    const imgs = (q.images || []).map(s => `<img src="${esc(s)}" alt="問題の画像" loading="lazy">`).join("");
    box.innerHTML = `<div class="sheet wk-exam">
      <div class="mk-top"><span class="qno">週間模試 ${esc(c.label)}</span><span class="mk-time num" id="wk-time">${mmss(left())}</span></div>
      <div class="wk-pal" role="group" aria-label="問題番号">${c.ids.map((_, k) => `<button class="${(c.ans[k] || []).length ? "a" : ""}${k === i ? " cur" : ""}" data-wkj="${k}" aria-label="${k + 1}問目">${k + 1}</button>`).join("")}</div>
      <div class="wk-count num">${i + 1} / ${n}問　<small>答えた ${aN}問</small></div>
      <div class="mk-src">出典：${esc(src(q))}・${esc(q.field)}</div>
      <div class="qtext">${P.fmt(q.question)}</div>
      ${need > 1 ? `<span class="howmany">※ ${need}つ選ぶ問題です</span>` : ""}
      ${imgs ? `<div class="qimg">${imgs}</div>` : ""}
      <ol class="choices">${q.choices.map((ch, k) => `<li><button class="choice" data-wkn="${k + 1}" aria-pressed="${picks.has(k + 1)}"><span class="bubble">${k + 1}</span><span>${esc(ch)}</span></button></li>`).join("")}</ol>
      <p class="wk-sel">選択：<b class="num">${picks.size ? [...picks].join("・") : "–"}</b></p>
      <div class="mk-nav">
        <button class="btn" id="wk-prev" ${i ? "" : "disabled"}>‹ 戻る</button><span></span>
        <button class="btn ${i + 1 < n ? "primary" : ""}" id="wk-next" ${i + 1 < n ? "" : "disabled"}>次へ ›</button>
      </div>
      <div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn ${i + 1 === n ? "primary" : ""}" id="wk-submit">提出して採点する</button></div>
      ${ask ? `<div class="mk-confirm">${n - aN ? `まだ答えていない問題が <b>${n - aN}問</b> あります（0点になります）。` : "全部の問題に答えました。"}<br>提出しますか？<div class="row" style="margin-top:8px"><button class="btn primary" id="wk-yes">提出する</button><button class="btn" id="wk-no">もどる</button></div></div>` : ""}
    </div>`;
    if (!seen) startSeen();
    const tick = () => {
      const el = $("#wk-time"); if (!el || !running()) return;
      const l = left(); el.textContent = mmss(l); el.className = "mk-time num" + (l < 5 * 60000 ? " low" : "");
      if (l <= 0) submit(true);
    };
    timer = setInterval(tick, 1000);
  }
  function go(i){ if (!running()) return; stopSeen(); S.cur.i = Math.max(0, Math.min(S.cur.ids.length - 1, i)); ask = false; S.cur.at = Date.now(); save(false); startSeen(); render(); window.scrollTo(0, 0); }
  function choose(k){
    const c = S.cur, i = c.i || 0, q = P.byId[c.ids[i]], need = P.needOf(q), cur = new Set(c.ans[i] || []);
    if (cur.has(k)) cur.delete(k); else { if (need === 1) cur.clear(); else if (cur.size >= need) return; cur.add(k); }
    c.ans[i] = [...cur].sort((a, b) => a - b); if (!c.ans[i].length) delete c.ans[i];
    c.at = Date.now(); save(false); render();
  }
  function submit(auto, show = true){
    const c = S.cur; if (!c) return;
    stopSeen(); clearInterval(timer);
    const ok = [], per = {};
    let score = 0;
    c.ids.forEach((id, i) => {
      const q = P.byId[id]; if (!q) { ok.push(0); return; }
      const p = c.ans[i] || [], same = a => a.length === p.length && a.every(x => p.includes(x));
      const good = p.length > 0 && [q.answer, ...(q.alt || [])].some(same);
      ok.push(good ? 1 : 0); if (good) score++;
      if (p.length) { P.record(id, good); P.weakRecord(id, good, false); }
    });
    const used = Math.min(LIMIT, Date.now() - c.start);
    const h = { wk: c.wk, label: c.label, field: c.field, ids: c.ids, ans: c.ans, ok, tm: c.tm, n: c.ids.length, score, used, auto: !!auto, at: Date.now() };
    S.h = [h, ...S.h.filter(x => x.wk !== h.wk)].sort((a, b) => b.wk - a.wk).slice(0, 60);
    S.cur = null; ask = false; save();
    if (show && P.view === "weekly") { showH = h; screen = "result"; render(); window.scrollTo(0, 0); }
  }
  function result(box, h){
    const pct = h.score / h.n, line = Math.ceil(h.n * PASS), diff = h.score - line;
    // 分野別成績：今週の分野ぜんたい＋その中のテーマごと
    const rows = [{ f: h.field + "（全体）", ok: h.score, n: h.n, all: true }];
    if (TH) {
      const g = new Map();
      h.ids.forEach((id, i) => { const t = TH[id] || "そのほか"; const v = g.get(t) || { f: t, ok: 0, n: 0 }; v.n++; v.ok += h.ok[i]; g.set(t, v); });
      rows.push(...[...g.values()].sort((a, b) => a.ok / a.n - b.ok / b.n || b.n - a.n));
    }
    const bar = r => { const p = r.ok / r.n; return `<div class="wk-frow${r.all ? " all" : ""}" style="${pcA(p)}"><span class="wk-fn">${esc(r.f)}</span><b class="pc-c num">${Math.round(p * 100)}%</b><em class="num">${r.ok}/${r.n}</em><span class="wk-fbar"><i class="pc-bg" style="width:${p * 100}%"></i><u></u></span></div>`; };
    const crowd = id => RATES && RATES.r[id] != null ? RATES.r[id] + "%" : "–";
    const table = h.ids.map((id, i) => { const q = P.byId[id], a = h.ans[i] || []; return q ? `<tr data-wkq="${esc(id)}"><td class="num">${i + 1}</td><td>${esc(src(q))}</td><td class="${h.ok[i] ? "o" : "x"}">${h.ok[i] ? "○" : a.length ? "×" : "－"}</td><td class="num">${crowd(id)}</td><td class="num">${h.tm && h.tm[i] ? (h.tm[i] < 1000 ? "1秒未満" : jtime(h.tm[i])) : "–"}</td></tr>` : ""; }).join("");
    const wrong = h.ids.filter((id, i) => !h.ok[i] && P.byId[id]);
    box.innerHTML = `<div class="panel wk-card">
      <h2 class="wk-title">週間模試レポート（${esc(h.label)}）<br><span>［${esc(h.field)}］</span></h2>
      <div class="wk-tiles">
        <div><b class="num pc-c" style="${pcA(pct)}">${h.score}<small>/${h.n}</small></b><span>得点</span></div>
        <div><b class="num">${Math.round(pct * 100)}%</b><span>得点率</span></div>
        <div><b class="num">${mmss(h.used)}</b><span>所要時間</span></div>
      </div>
      <p class="wk-pass" style="color:${diff >= 0 ? "var(--ok)" : "var(--ng)"}">${diff >= 0 ? `合格ライン（6割＝${line}点）を ${diff}点 上回りました` : `合格ライン（6割＝${line}点）まで あと ${-diff}点`}</p>
      ${h.auto ? `<p class="wk-note" style="margin:0">時間になったので、自動で提出しました。</p>` : ""}
    </div>
    <div class="panel wk-card">
      <h2>分野別成績</h2>
      <p class="wk-note" style="margin:-6px 0 10px">縦の線が合格ライン（60%）。下はテーマごと、低い（苦手な）順です。</p>
      <div class="wk-fields">${rows.map(bar).join("")}</div>
    </div>
    <div class="panel wk-card">
      <h2>問題分析表</h2>
      <p class="wk-note" style="margin:-6px 0 10px">行をタップすると、その問題を解説つきで開きます。正答率はコクシルの利用者データ（2026年11月取得）。</p>
      <div class="wk-tw"><table class="wk-table"><thead><tr><th>問</th><th>出典</th><th>正誤</th><th>正答率</th><th>解答時間</th></tr></thead><tbody>${table}</tbody></table></div>
      <div class="row" style="margin-top:16px">
        ${wrong.length ? `<button class="btn primary" id="wk-wrong">まちがえた${wrong.length}問を解説つきで解き直す</button>` : ""}
        <button class="btn" id="wk-back">週間模試のページへ</button>
      </div>
    </div>`;
  }
  function onClick(e){
    if (!P || P.view !== "weekly") return;
    const t = e.target.closest("button,tr[data-wkq]"); if (!t) return;
    if (t.dataset.wkq) return P.startQuiz("週間模試の問題", [t.dataset.wkq]);
    if (t.dataset.wkn && running() && screen === "exam") return choose(+t.dataset.wkn);
    if (t.dataset.wkj) return go(+t.dataset.wkj);
    if (t.dataset.wkh) { showH = S.h.find(h => h.wk === +t.dataset.wkh); if (showH) { screen = "result"; render(); window.scrollTo(0, 0); } return; }
    switch (t.id) {
      case "wk-start": if (!ask) { ask = true; return render(); } return start();
      case "wk-resume": screen = "exam"; return render();
      case "wk-prev": return go((S.cur.i || 0) - 1);
      case "wk-next": return go((S.cur.i || 0) + 1);
      case "wk-submit": ask = true; render(); $("#wk-yes")?.scrollIntoView({ block: "center" }); return;
      case "wk-no": ask = false; return render();
      case "wk-yes": return submit(false);
      case "wk-wrong": return P.startQuiz("週間模試のまちがい", showH.ids.filter((id, i) => !showH.ok[i] && P.byId[id]));
      case "wk-practice": { const h = S.h.find(x => x.wk === info().wk); if (h) P.startQuiz("週間模試（練習）", h.ids.filter(id => P.byId[id])); return; }
      case "wk-back": showH = null; screen = "top"; return render();
    }
  }
  // 過去問ページで ?start=weekly などから開いたとき：解いている回があれば続きへ
  function open(){ if (running()) screen = "exam"; else if (screen === "exam") screen = "top"; }
  function leave(){ stopSeen(); clearInterval(timer); document.body.classList.remove("in-quiz"); if (screen === "exam") screen = "top"; }

  Object.assign(window.KQWeekly, { boot, init, render, dump, merge, open, leave, running });

  const css = document.createElement("style");
  css.textContent = `
  .wk-card>h2{margin-bottom:16px}
  .wk-title{display:block!important;font-size:17px;line-height:1.5;text-align:center}
  .wk-title::before{display:none!important}
  .wk-title span{font-size:15px;color:var(--sub)}
  .wk-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .wk-tiles>div{display:grid;justify-items:center;gap:4px;padding:16px 8px;border:1px solid var(--line);border-radius:14px;background:var(--paper)}
  .wk-tiles b{font-family:var(--f-num);font-size:26px;line-height:1.1}
  .wk-tiles b small{font-size:13px;color:var(--sub);margin-left:2px}
  .wk-tiles>div>span{font-size:12px;color:var(--sub);text-align:center;line-height:1.4}
  .wk-go{display:flex;justify-content:center;margin-top:16px}
  .wk-note{font-size:12.5px;color:var(--sub);line-height:1.6;margin:10px 0 0}
  .wk-pass{margin:16px 0 0;font-weight:700;text-align:center}
  .wk-rules{list-style:none;margin:0;padding:0;display:grid;gap:8px}
  .wk-rules li{position:relative;padding:10px 16px 10px 36px;border-radius:14px;background:var(--paper);font-size:13.5px;line-height:1.6}
  .wk-rules li::before{content:"✓";position:absolute;left:14px;top:10px;color:var(--ok);font-weight:700}
  .wk-hist{display:grid}
  .wk-hrow{display:flex;align-items:center;gap:10px;padding:10px 4px;border:0;border-top:1px solid var(--line);background:none;text-align:left;width:100%}
  .wk-hrow:first-child{border-top:0}
  .wk-hrow>span{flex:1;display:grid}
  .wk-hrow small{font-size:12px;color:var(--sub)}
  .wk-hrow>b{font-family:var(--f-num);font-size:20px} .wk-hrow>b small{font-size:12px}
  .wk-pal{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin:16px 0 8px}
  .wk-pal button{aspect-ratio:1;min-width:0;padding:0;border:1px solid var(--line2);background:var(--sheet);border-radius:8px;font-family:var(--f-mono);font-size:12px;color:var(--sub)}
  .wk-pal button.a{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);font-weight:700}
  .wk-pal button.cur{outline:2px solid var(--ink);outline-offset:1px}
  .wk-count{font-size:14px;font-weight:700;margin-bottom:4px} .wk-count small{font-weight:400;color:var(--sub)}
  .wk-sel{margin:10px 0 0;font-size:14px}
  .wk-fields{display:grid;gap:10px}
  .wk-frow{display:grid;grid-template-columns:1fr auto auto;gap:4px 10px;align-items:baseline}
  .wk-frow .wk-fn{font-size:13.5px} .wk-frow.all .wk-fn{font-weight:700}
  .wk-frow em{font-style:normal;font-size:12px;color:var(--sub)}
  .wk-fbar{grid-column:1/-1;position:relative;height:8px;border-radius:4px;background:var(--line);overflow:visible}
  .wk-fbar i{display:block;height:100%;border-radius:4px}
  .wk-fbar u{position:absolute;left:60%;top:-4px;bottom:-4px;width:2px;background:var(--ink);opacity:.55}
  .wk-tw{overflow-x:auto;margin:0 -4px}
  .wk-table{width:100%;border-collapse:collapse;font-size:13px}
  .wk-table th{font-size:12px;font-weight:700;color:var(--sub);text-align:left;padding:8px 4px;border-bottom:1px solid var(--line2);white-space:nowrap}
  .wk-table td{padding:10px 4px;border-bottom:1px solid var(--line);white-space:nowrap}
  .wk-table tbody tr{cursor:pointer} .wk-table tbody tr:hover{background:var(--accent-soft)}
  .wk-table td.o{color:var(--ok);font-weight:700} .wk-table td.x{color:var(--ng);font-weight:700}
  `;
  (document.head || document.documentElement).appendChild(css);
})();
