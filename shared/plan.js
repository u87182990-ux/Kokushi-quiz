// 勉強の段取りの共通部品（トップと過去問ページで同じ計算をする）
// ・KQPlan.pcAttr(割合)  … 正答率の色（赤→黄→緑）。<b class="pc-c" style="${KQPlan.pcAttr(p)}"> のように使う
// ・KQPlan.stats(items, rec) … 分野ごと・テーマごとの成績
// ・KQPlan.recommend(st)    … いちばん苦手なテーマ（なければ分野）
// ・KQPlan.today(...)       … 「今日やること」の中身（復習 → 弱点分野 → 新しい問題）
// items は [{id, f:分野, t:テーマ}]。過去問ページは questions.json から、トップは kakomon/plan.json から作る
(() => {
  /* ---------- 正答率の色 ---------- */
  // 40%以下＝赤、60%（合格ライン）＝黄、80%以上＝緑。そのあいだはなめらかに変わる
  const hue = p => Math.round(Math.max(0, Math.min(1, (p - 0.4) / 0.4)) * 120);
  const pcAttr = p => (p == null || isNaN(p)) ? "" : `--pc-h:${hue(p)}`;
  const css = `
  .pc-c{color:hsl(var(--pc-h,210) 78% 36%)!important}
  .pc-bg{background:hsl(var(--pc-h,210) 70% 47%)!important}
  .pc-soft{background:hsl(var(--pc-h,210) 85% 94%)!important}
  .pc-legend{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11.5px;color:var(--sub)}
  .pc-legend i{display:inline-block;width:34px;height:7px;border-radius:4px;background:linear-gradient(90deg,hsl(0 70% 47%),hsl(60 70% 47%),hsl(120 70% 47%))}
  @media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .pc-c{color:hsl(var(--pc-h,210) 75% 64%)!important}
    :root:not([data-theme="light"]) .pc-soft{background:hsl(var(--pc-h,210) 45% 17%)!important}}
  :root[data-theme="dark"] .pc-c{color:hsl(var(--pc-h,210) 75% 64%)!important}
  :root[data-theme="dark"] .pc-soft{background:hsl(var(--pc-h,210) 45% 17%)!important}`;
  function addCss(){ if (document.getElementById("kq-plan-css")) return; const s = document.createElement("style"); s.id = "kq-plan-css"; s.textContent = css; document.head.appendChild(s); }
  if (document.head) addCss(); else document.addEventListener("DOMContentLoaded", addCss);
  const legend = () => `<span class="pc-legend">正答率の色：<span>赤＝苦手</span><i></i><span>緑＝得意</span>（黄色が合格ラインの60%）</span>`;

  /* ---------- 日付で決まる並べかえ（同じ日なら同じ順番） ---------- */
  function seeded(seed){ let h = 2166136261; for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1e6) / 1e6; }; }
  function shuffle(a, seed){ const r = seed == null ? Math.random : seeded(seed); a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pad = n => String(n).padStart(2, "0");
  const todayKey = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };

  /* ---------- 成績（分野・テーマ） ---------- */
  const MIN_ATT = 5;   // 正答率で「苦手」と決めるのに必要なのべ回答
  function stats(items, rec){
    const F = new Map();
    const add = (m, k, r) => { let v = m.get(k); if (!v) m.set(k, v = { name: k, n: 0, done: 0, att: 0, okc: 0, sub: new Map() }); v.n++; if (r) { v.done++; v.att += (r.c || 0) + (r.w || 0); v.okc += r.c || 0; } return v; };
    for (const q of items) { const r = rec[q.id], v = add(F, q.f, r); if (q.t) { const t = add(v.sub, q.t, r); t.field = q.f; } }
    for (const v of F.values()) { v.pct = v.att ? v.okc / v.att : null; for (const t of v.sub.values()) t.pct = t.att ? t.okc / t.att : null; }
    return F;
  }
  const byPct = (a, b) => a.pct - b.pct || b.att - a.att;
  // 苦手な分野の順（正答率が低い順。のべ回答が少ない分野は後ろ）
  function weakFields(st){ return [...st.values()].filter(v => v.att >= MIN_ATT && v.done < v.n).sort(byPct); }
  // いちばん苦手なテーマ（なければ分野）。{field, theme, pct, att}
  function recommend(st, k = 1){
    const out = [], th = [];
    for (const f of st.values()) for (const t of f.sub.values()) if (t.att >= MIN_ATT && t.n >= 3) th.push(t);
    th.sort(byPct);
    for (const t of th) { if (out.length >= k) break; if (t.pct < 0.8) out.push({ field: t.field, theme: t.name, pct: t.pct, att: t.att, n: t.n }); }
    if (out.length < k) for (const f of [...st.values()].filter(v => v.att >= MIN_ATT).sort(byPct)) {
      if (out.length >= k) break;
      if (!out.some(o => o.field === f.name)) out.push({ field: f.name, theme: null, pct: f.pct, att: f.att, n: f.n });
    }
    return out;
  }
  // おすすめから出す問題：まだ解いていない → 正答率が低い の順で n問
  function pickFrom(items, rec, field, theme, n){
    const xs = items.filter(q => q.f === field && (!theme || q.t === theme));
    const rate = id => { const r = rec[id]; return r ? r.c / Math.max(1, r.c + r.w) : -1; };
    const fresh = shuffle(xs.filter(q => !rec[q.id]).map(q => q.id), todayKey() + field + theme);
    const seen = xs.filter(q => rec[q.id]).sort((a, b) => rate(a.id) - rate(b.id) || (rec[a.id].t || 0) - (rec[b.id].t || 0)).map(q => q.id);
    return [...fresh, ...seen].slice(0, n);
  }

  /* ---------- 今日やること ---------- */
  // total：今日ここで解く数（目標 − 今日もう解いた数。目標達成ずみなら目標ぶんもう1セット）
  // cardsDue：暗記カードの復習期限が来た枚数（暗記カードを使っていない人は 0）
  // 優先順：①復習（苦手リストの卒業待ち・暗記カードの期限分）→ ②弱点分野のまだ解いていない問題 → ③新しい問題
  // 暗記カードは数が多い日もあるので、最大で全体の半分まで（のこりは次の日に回る）。問題の数は total − 暗記カード
  function today(items, rec, weak, opt){
    const total = Math.max(1, opt.total | 0), seed = todayKey();
    const isW = id => weak[id] && !weak[id].out;
    // 卒業まであと1回の問題 → 古い順
    const w = items.filter(q => isW(q.id)).sort((a, b) => (weak[b.id].s || 0) - (weak[a.id].s || 0) || (weak[a.id].t || 0) - (weak[b.id].t || 0)).map(q => q.id);
    // 復習の中で、暗記カードは最大で全体の半分。のこりを苦手リストの問題に
    const cards = Math.min(opt.cardsDue || 0, total > 1 ? Math.floor(total / 2) : 0);
    const weakIds = w.slice(0, total - cards);
    let left = total - weakIds.length - cards;
    const used = new Set(weakIds), field = [];
    let fieldName = null, fieldPct = null;
    for (const f of weakFields(stats(items, rec))) {
      if (left <= 0) break;
      const ids = shuffle(items.filter(q => q.f === f.name && !rec[q.id] && !used.has(q.id)).map(q => q.id), seed + f.name).slice(0, left);
      if (!ids.length) continue;
      if (!fieldName) { fieldName = f.name; fieldPct = f.pct; }
      ids.forEach(id => used.add(id)); field.push(...ids); left -= ids.length;
      if (field.length >= Math.ceil(total / 2)) break;   // 弱点は全体の半分くらいまで（1分野だけにかたよらない）
    }
    // 新しい問題：新しい回から順に、まだ解いていない問題
    const fresh = [];
    if (left > 0) {
      const pool = items.filter(q => !rec[q.id] && !used.has(q.id));
      fresh.push(...shuffle(pool.map(q => q.id), seed + "new").slice(0, left));
      left -= fresh.length;
    }
    // それでも足りないとき（ほぼ全部解いた人）：正答率が低い問題
    if (left > 0) {
      const rate = id => { const r = rec[id]; return r ? r.c / Math.max(1, r.c + r.w) : 1; };
      const more = items.filter(q => !used.has(q.id) && !fresh.includes(q.id)).sort((a, b) => rate(a.id) - rate(b.id)).slice(0, left).map(q => q.id);
      fresh.push(...more);
    }
    return { weak: weakIds, field, fieldName, fieldPct, fresh, cards, ids: [...weakIds, ...field, ...fresh] };
  }

  window.KQPlan = { hue, pcAttr, legend, stats, weakFields, recommend, pickFrom, today, shuffle, todayKey, MIN_ATT };
})();
