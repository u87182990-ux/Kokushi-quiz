/* 問題タグ（コクシル式の3段階）：完璧／復習中／要学習 を、自分で問題に付ける印。苦手リストが主軸で、これは補助。
   ・過去問の問題画面（答える前も後も）に3つのボタン。もう一度押すと外れる
   ・「タグ」画面：回×午前/午後 ×番号のマス目（タグ付きのマスに色）、タグごとに出題
   記録：localStorage「<過去問の記録キー>-tag」＝{問題id: {g: 1完璧/2復習中/3要学習/0外した, t: 時刻}}。クラウドは kakomon の data.tag
   トップ（index.html）は KQTags.count(lsBase, cloudTag) で件数だけ読む。 */
(() => {
  const TAGS = [[1, "完璧", "★"], [2, "復習中", "✓"], [3, "要学習", "✕"]];
  const readLS = key => { try { const v = JSON.parse(localStorage.getItem(key) || "null"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
  function mergeInto(a, b){
    let ch = false;
    for (const [id, x] of Object.entries(b && typeof b === "object" ? b : {})) if (x && (!a[id] || (x.t || 0) > (a[id].t || 0))) { a[id] = x; ch = true; }
    return ch;
  }
  function count(lsBase, cloudTag){
    const a = readLS(lsBase + "-tag"); mergeInto(a, cloudTag);
    const n = { 1: 0, 2: 0, 3: 0 };
    for (const x of Object.values(a)) if (x && n[x.g] != null) n[x.g]++;
    return n;
  }
  window.KQTags = { TAGS, count };

  /* ---------- ここから過去問ページだけ ---------- */
  let P = null, KEY = "", T = {}, filt = 0;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tagOf = id => (T[id] && T[id].g) || 0;

  function boot(lsKey){ KEY = lsKey + "-tag"; T = readLS(KEY); }
  function init(page){ P = page; document.addEventListener("click", onClick); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(T)); } catch {} if (P) P.dirtyTag(); };
  const dump = () => KEY ? T : undefined;
  function merge(b){ const ch = mergeInto(T, b); if (ch) { try { localStorage.setItem(KEY, JSON.stringify(T)); } catch {} if (P && P.view === "tags") render(); } return ch; }
  const ids = g => P.Q.filter(q => tagOf(q.id) === g).map(q => q.id);

  // 問題画面のボタン（render のたびに作る）
  function btns(id){
    const g = tagOf(id);
    return `<span class="tg-btns" role="group" aria-label="タグ">${TAGS.map(([k, name, ic]) => `<button type="button" class="tg-b tg${k}" data-tg="${k}" data-id="${esc(id)}" aria-pressed="${g === k}" title="${name}"><i aria-hidden="true">${ic}</i>${name}</button>`).join("")}</span>`;
  }
  function set(id, k){
    const g = tagOf(id) === k ? 0 : k;
    T[id] = { g, t: Date.now() }; save();
    document.querySelectorAll(`.tg-b[data-id="${CSS.escape(id)}"]`).forEach(b => b.setAttribute("aria-pressed", +b.dataset.tg === g));
  }

  // タグ画面
  function render(){
    const box = $("#tg-box"); if (!box || !P) return;
    const n = { 1: ids(1).length, 2: ids(2).length, 3: ids(3).length };
    const kais = [...new Set(P.Q.map(q => q.kai))].sort((a, b) => b - a), ses = ["午前", "午後"];
    const by = {}; for (const q of P.Q) by[q.kai + q.session + q.no] = q;
    const maxNo = Math.max(...P.Q.map(q => q.no));
    const head = `<tr><th></th>${Array.from({ length: maxNo }, (_, i) => `<th>${i + 1}</th>`).join("")}</tr>`;
    const rows = kais.flatMap(k => ses.map(s => `<tr><th>第${k}回<br>${s}</th>${Array.from({ length: maxNo }, (_, i) => {
      const q = by[k + s + (i + 1)]; if (!q) return "<td></td>";
      const g = tagOf(q.id), on = g && (!filt || filt === g);
      return `<td><button class="${on ? "tg" + g : ""}" data-tq="${esc(q.id)}" aria-label="第${k}回${s}${i + 1}${g ? " " + TAGS[g - 1][1] : ""}"></button></td>`;
    }).join("")}</tr>`)).join("");
    box.innerHTML = `<div class="panel">
      <h2>問題タグ</h2>
      <p class="tg-note">問題を解く画面の「完璧・復習中・要学習」で付けた印がここに集まります。苦手リスト（2回続けて正解で卒業）とは別の、自分用のメモです。</p>
      <div class="tg-sum">${TAGS.map(([k, name, ic]) => `<div class="tg-s tg${k}"><span><i>${ic}</i>${name}</span><b class="num">${n[k]}</b><button class="btn ${n[k] ? "primary" : ""}" data-tgo="${k}" ${n[k] ? "" : "disabled"}>解く</button></div>`).join("")}</div>
    </div>
    <div class="panel">
      <h2>タグリスト</h2>
      <div class="tg-filt" role="group" aria-label="表示するタグ">${[[0, "すべて"], ...TAGS.map(([k, name]) => [k, name])].map(([k, name]) => `<button class="chip${filt === k ? " on" : ""}" data-tgf="${k}">${name}</button>`).join("")}</div>
      <p class="tg-note">色のついたマスをタップすると、その問題を開きます。横にスクロールできます。</p>
      <div class="tg-grid-w"><table class="tg-grid"><thead>${head}</thead><tbody>${rows}</tbody></table></div>
    </div>
    <div class="row"><button class="btn" data-view="home">‹ 過去問のホームへ</button></div>`;
  }
  function onClick(e){
    const t = e.target.closest("button"); if (!t || !P) return;
    if (t.dataset.tg) { e.preventDefault(); return set(t.dataset.id, +t.dataset.tg); }
    if (P.view !== "tags") return;
    if (t.dataset.tq) { if (tagOf(t.dataset.tq)) P.startQuiz("タグ", [t.dataset.tq]); return; }
    if (t.dataset.tgf != null) { filt = +t.dataset.tgf; return render(); }
    if (t.dataset.tgo) { const k = +t.dataset.tgo, xs = ids(k); if (xs.length) P.startQuiz(`タグ：${TAGS[k - 1][1]}`, xs); }
  }
  // ?start=tag1|tag2|tag3 で、そのタグの問題を解く
  const startTag = k => { const xs = ids(k); if (xs.length) { P.startQuiz(`タグ：${TAGS[k - 1][1]}`, xs); return true; } return false; };

  Object.assign(window.KQTags, { boot, init, btns, render, dump, merge, startTag });

  const css = document.createElement("style");
  css.textContent = `
  .tg-btns{display:inline-flex;gap:4px}
  .tg-b{display:inline-flex;align-items:center;gap:4px;border:1px solid var(--line);background:var(--sheet);color:var(--sub);border-radius:999px;padding:4px 8px;font-size:11.5px;font-weight:700;line-height:1.2;cursor:pointer}
  .tg-b i{font-style:normal}
  .tg-b.tg1[aria-pressed="true"]{border-color:var(--ok);color:var(--ok);background:var(--ok-soft)}
  .tg-b.tg2[aria-pressed="true"]{border-color:#e8b730;color:#a77700;background:rgba(232,183,48,.14)}
  .tg-b.tg3[aria-pressed="true"]{border-color:var(--ng);color:var(--ng);background:var(--ng-soft)}
  .tg-note{font-size:12.5px;color:var(--sub);line-height:1.6;margin:-6px 0 10px}
  .tg-sum{display:grid;gap:8px}
  .tg-s{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:10px;padding:10px 16px;border:1px solid var(--line);border-radius:14px;background:var(--paper)}
  .tg-s span{display:flex;align-items:center;gap:8px;font-weight:700} .tg-s i{font-style:normal}
  .tg-s.tg1 i{color:var(--ok)} .tg-s.tg2 i{color:#a77700} .tg-s.tg3 i{color:var(--ng)}
  .tg-s b{font-family:var(--f-num);font-size:22px}
  .tg-s .btn{padding:4px 16px}
  .tg-filt{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px}
  .tg-filt .chip{cursor:pointer;font-size:12.5px;padding:4px 10px}
  .tg-filt .chip.on{background:var(--accent);color:var(--accent-ink)}
  #tg-box,#tg-box .panel{min-width:0;max-width:100%}
  .tg-grid-w{overflow:auto;max-height:70vh;border:1px solid var(--line);border-radius:14px}
  .tg-grid{border-collapse:collapse;font-size:10px}
  .tg-grid th{position:sticky;top:0;background:var(--sheet);color:var(--sub);font-weight:700;padding:4px 0;min-width:20px;z-index:1}
  .tg-grid tbody th{position:sticky;left:0;top:auto;z-index:2;padding:4px 8px;white-space:nowrap;line-height:1.3;text-align:left;border-right:1px solid var(--line)}
  .tg-grid thead th:first-child{left:0;z-index:3}
  .tg-grid td{padding:0;border:1px solid var(--line)}
  .tg-grid tbody tr:nth-child(odd) td{background:var(--paper)}
  .tg-grid td button{display:block;width:20px;height:28px;border:0;padding:0;background:transparent;cursor:default}
  .tg-grid td button.tg1{background:var(--ok);cursor:pointer} .tg-grid td button.tg2{background:#e8b730;cursor:pointer} .tg-grid td button.tg3{background:var(--ng);cursor:pointer}
  `;
  (document.head || document.documentElement).appendChild(css);
})();
