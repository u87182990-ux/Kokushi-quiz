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
    ymd, hit, days, bm,
    // account.js から呼ばれる：クラウドに送るデータにつける／クラウドから来たデータを取りこむ
    forSave(data){ return Object.assign({}, data, { days: days(), bm: bms() }); },
    fromLoad(data){
      if (!data) return;
      const a = mergeDays(data.days), b = mergeBm(data.bm);
      if (a || b) { try { window.dispatchEvent(new CustomEvent("kq-stats")); } catch {} }
    }
  };
})();
