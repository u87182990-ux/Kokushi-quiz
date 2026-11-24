// 成績（毎日の解答数）とブックマークを記録する共通部品
// ・どのドリルでも、答え合わせのたびに KQStats.hit(正解か) を呼ぶ → 日ごとの解答数・正解数が残る
// ・ブックマークは KQStats.bm.toggle(アプリ名, 問題id, {l:見出し, s:問題文の頭})
// ・どちらもニックネームごとに端末へ保存し、account.js がクラウド保存の時にいっしょに送る
(() => {
  const sfx = () => { const s = window.KQ && KQ.session(); return s ? "@" + s.nick.toLowerCase() : ""; };
  const mem = {};
  function get(k, d){
    try { const v = JSON.parse(localStorage.getItem(k) || "null"); if (v && typeof v === "object") return v; } catch {}
    return mem[k] || d;
  }
  function put(k, v){ mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  const pad = n => String(n).padStart(2, "0");
  const ymd = t => { const d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };

  /* ---------- 日ごとの記録 { "2026-11-20": [解答数, 正解数] } ---------- */
  const dKey = () => "kq-days-v1" + sfx();
  const days = () => get(dKey(), {});
  function hit(ok){
    const d = days(), k = ymd(Date.now()), v = Array.isArray(d[k]) ? d[k] : [0, 0];
    v[0]++; if (ok) v[1]++; d[k] = v; put(dKey(), d);
  }
  function mergeDays(add){
    if (!add || typeof add !== "object") return false;
    const d = days(); let ch = false;
    for (const [k, v] of Object.entries(add)) {
      if (!/^\d{4}-\d\d-\d\d$/.test(k) || !Array.isArray(v)) continue;
      const cur = d[k] || [0, 0];
      const n = Math.max(cur[0], +v[0] || 0), c = Math.max(cur[1], +v[1] || 0);
      if (n !== cur[0] || c !== cur[1]) { d[k] = [n, c]; ch = true; }
    }
    if (ch) put(dKey(), d);
    return ch;
  }

  /* ---------- 開いた日と学習時間（ホームの学習レポート用） ----------
     kq-visit-v1 = { "2026-11-25": 1 }  サイトを開いた日
     kq-time-v1  = { "2026-11-25": 秒 }  問題のページ（ホーム以外）を開いていて、さわっている時間。
     画面が見えていて、最後の操作から90秒以内のときだけ数える（放置した時間は入れない）。
     端末をまたぐと日ごとに大きいほうを残す（同じ日に2台で使うと少なめに出る） */
  const vKey = () => "kq-visit-v1" + sfx(), tKey = () => "kq-time-v1" + sfx();
  const visits = () => get(vKey(), {}), times = () => get(tKey(), {});
  function markVisit(){ const v = visits(), k = ymd(Date.now()); if (!v[k]) { v[k] = 1; put(vKey(), v); } }
  const IDLE = 90e3, TICK = 15e3;
  let lastAct = Date.now(), lastTick = Date.now();
  const isHome = () => !!document.getElementById("v-home");   // ホーム（index.html）は数えない
  function tick(){
    const now = Date.now(), dt = Math.min(now - lastTick, TICK * 2); lastTick = now;
    if (document.hidden || now - lastAct > IDLE || dt <= 0 || isHome()) return;
    const t = times(), k = ymd(now); t[k] = Math.round((+t[k] || 0) + dt / 1000); put(tKey(), t);
  }
  function mergeNum(key, cur, add){
    if (!add || typeof add !== "object") return false;
    let ch = false;
    for (const [k, v] of Object.entries(add)) {
      if (!/^\d{4}-\d\d-\d\d$/.test(k) || !(+v > 0)) continue;
      if (+v > (+cur[k] || 0)) { cur[k] = +v; ch = true; }
    }
    if (ch) put(key, cur);
    return ch;
  }
  try {
    markVisit();
    {
      for (const ev of ["pointerdown", "keydown", "scroll", "touchstart"]) addEventListener(ev, () => { if (Date.now() - lastAct > IDLE) lastTick = Date.now(); lastAct = Date.now(); }, { passive: true, capture: true });
      document.addEventListener("visibilitychange", () => { if (document.hidden) tick(); else { lastTick = Date.now(); lastAct = Date.now(); } });
      addEventListener("pagehide", tick);
      setInterval(tick, TICK);
    }
  } catch {}

  /* ---------- ブックマーク { app: { id: {t, l, s} or {t, x:1}(消した印) } } ---------- */
  const bKey = () => "kq-bm-v1" + sfx();
  const bms = () => get(bKey(), {});
  const bm = {
    has(app, id){ const e = (bms()[app] || {})[id]; return !!e && !e.x; },
    toggle(app, id, meta){
      const all = bms(), a = all[app] || (all[app] = {});
      const on = !(a[id] && !a[id].x);
      a[id] = on ? Object.assign({ t: Date.now() }, meta || {}) : { t: Date.now(), x: 1 };
      put(bKey(), all);
      return on;
    },
    // 新しい順の一覧 [{app, id, t, l, s}]
    list(app){
      const out = [];
      for (const [ap, a] of Object.entries(bms())) {
        if (app && ap !== app) continue;
        for (const [id, e] of Object.entries(a)) if (e && !e.x) out.push(Object.assign({ app: ap, id }, e));
      }
      return out.sort((x, y) => y.t - x.t);
    },
    ids(app){ return bm.list(app).map(e => e.id); }
  };
  function mergeBm(add){
    if (!add || typeof add !== "object") return false;
    const all = bms(); let ch = false;
    for (const [ap, a] of Object.entries(add)) {
      if (!a || typeof a !== "object") continue;
      const cur = all[ap] || (all[ap] = {});
      for (const [id, e] of Object.entries(a)) if (e && (e.t || 0) > ((cur[id] || {}).t || 0)) { cur[id] = e; ch = true; }
    }
    if (ch) put(bKey(), all);
    return ch;
  }

  window.KQStats = {
    ymd, hit, days, bm, visits, times,
    // account.js から呼ばれる：クラウドに送るデータにつける／クラウドから来たデータを取りこむ
    forSave(data){ return Object.assign({}, data, { days: days(), bm: bms(), visit: visits(), time: times() }); },
    fromLoad(data){
      if (!data) return;
      const a = mergeDays(data.days), b = mergeBm(data.bm), c = mergeNum(vKey(), visits(), data.visit), e = mergeNum(tKey(), times(), data.time);
      if (a || b || c || e) { try { window.dispatchEvent(new CustomEvent("kq-stats")); } catch {} }
    }
  };
})();
