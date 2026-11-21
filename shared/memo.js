// 手書きの計算メモ（Apple Pencil・指・マウスで書ける）。どのドリルでも使える共通部品。
// 使い方（新しいドリルにつけるとき）:
//   1. <script src="../shared/memo.js"></script> を読みこむ
//   2. const memo = KQMemo.mount(document.getElementById("card"));   // 問題を表示する箱
//   3. 問題を表示するたびに memo.sync(問題のid) を呼ぶ → 問題がかわると自動で白紙になる
// 広い画面（iPad 横など）では問題の右どなりに、せまい画面では問題の下に出ます。
(() => {
  if (window.KQMemo) return;

  const CSS = `
.kqm-row{display:flex;flex-direction:column;gap:16px;min-width:0}
.kqm-row>*{min-width:0}
.kqm{--kqm-line:var(--line,var(--rule,#cfd6de));--kqm-line2:var(--line2,var(--rule,#c9d3de));--kqm-sub:var(--sub,var(--muted,#5d6876));
  --kqm-red:var(--ng,var(--red,#d23c3c));--kqm-blue:var(--accent,var(--focus,#1d6fd8));--kqm-soft:var(--accent-soft,var(--chip,#e5effc));
  background:var(--sheet,#fff);color:var(--ink,#152033);border:1px solid var(--kqm-line);border-radius:14px;
  display:flex;flex-direction:column;overflow:hidden;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.kqm-bar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 10px;border-bottom:1px solid var(--kqm-line)}
.kqm-bar h3{order:-2;flex:1 1 auto;min-width:0;margin:0;font-size:14px;line-height:1.4}
.kqm-bar h3 small{display:block;font-weight:400;font-size:11.5px;color:var(--kqm-sub)}
.kqm-bar .kqm-toggle{order:-1}
.kqm-br{order:-1;flex-basis:100%;height:0}
.kqm.off .kqm-br{display:none}
.kqm-b{font:inherit;min-width:38px;height:40px;padding:0 9px;border:1px solid var(--kqm-line2);background:var(--sheet,#fff);color:var(--ink,#152033);
  border-radius:10px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;touch-action:manipulation}
.kqm-b[aria-pressed="true"]{border-color:var(--kqm-blue);background:var(--kqm-soft);color:var(--kqm-blue)}
.kqm-b:disabled{opacity:.4;cursor:not-allowed}
.kqm-b .kqm-dot{width:14px;height:14px;border-radius:50%;background:var(--ink,#152033)}
.kqm-b[data-tool="red"] .kqm-dot{background:var(--kqm-red)} .kqm-b[data-tool="blue"] .kqm-dot{background:var(--kqm-blue)}
.kqm-pad{position:relative;flex:1;min-height:360px;touch-action:none;cursor:crosshair;
  background-color:var(--sheet,#fff);background-image:radial-gradient(circle,var(--kqm-line2) 1px,transparent 1.2px);background-size:24px 24px;background-position:12px 12px}
.kqm-pad canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block}
.kqm-hint{position:absolute;left:0;right:0;top:40%;text-align:center;color:var(--kqm-sub);font-size:13px;pointer-events:none;padding:0 16px}
.kqm.off .kqm-pad,.kqm.off .kqm-tool{display:none}
.kqm.off .kqm-bar{border-bottom:0}
@media (min-width:760px){
  body.kqm-open .wrap{max-width:1280px}
  body.kqm-open .kqm-row{display:grid;grid-template-columns:minmax(0,1fr) clamp(300px,40%,480px);align-items:start}
  body.kqm-open .kqm{position:sticky;top:12px;height:calc(100vh - 24px);height:calc(100dvh - 24px);max-height:900px}
}`;

  function mount(target){
    if (!document.getElementById("kqm-css")) {
      const s = document.createElement("style"); s.id = "kqm-css"; s.textContent = CSS; document.head.appendChild(s);
    }
    // 問題の箱と メモを横ならびにするための入れもの
    const row = document.createElement("div"); row.className = "kqm-row";
    target.parentNode.insertBefore(row, target); row.appendChild(target);
    const box = document.createElement("div"); box.className = "kqm";
    box.innerHTML = `
      <div class="kqm-bar">
        <h3>計算メモ <small>次の問題で自動で消えます</small></h3>
        <button class="kqm-b kqm-tool" data-tool="ink" aria-pressed="true" aria-label="黒ペン"><span class="kqm-dot"></span></button>
        <button class="kqm-b kqm-tool" data-tool="red" aria-pressed="false" aria-label="赤ペン"><span class="kqm-dot"></span></button>
        <button class="kqm-b kqm-tool" data-tool="blue" aria-pressed="false" aria-label="青ペン"><span class="kqm-dot"></span></button>
        <button class="kqm-b kqm-tool" data-tool="eraser" aria-pressed="false">消しゴム</button>
        <button class="kqm-b kqm-tool" data-act="undo">戻す</button>
        <button class="kqm-b kqm-tool" data-act="clear">全部消す</button>
        <button class="kqm-b kqm-toggle" data-act="toggle" aria-expanded="true">しまう</button>
        <span class="kqm-br"></span>
      </div>
      <div class="kqm-pad"><canvas></canvas><div class="kqm-hint">Apple Pencil や指で、ここに書けます</div></div>`;
    row.appendChild(box);

    const pad = box.querySelector(".kqm-pad"), cv = box.querySelector("canvas"), ctx = cv.getContext("2d"), hint = box.querySelector(".kqm-hint");
    const undoB = box.querySelector('[data-act="undo"]'), clearB = box.querySelector('[data-act="clear"]'), togB = box.querySelector('[data-act="toggle"]');
    const MLS = "kokushi-memo-v1";   // 過去問クイズと同じ設定（ペンの色・開け閉め）を使う
    let pref = {}; try { pref = JSON.parse(localStorage.getItem(MLS) || "{}") || {}; } catch {}
    let tool = pref.tool || "ink", open = pref.open === true;
    let strokes = [], cur = null, penSeen = false, W = 0, H = 0, dpr = 1;
    const savePref = () => { try { localStorage.setItem(MLS, JSON.stringify({ tool, open })); } catch {} };
    const color = c => getComputedStyle(box).getPropertyValue(c === "red" ? "--kqm-red" : c === "blue" ? "--kqm-blue" : "color").trim()
      || getComputedStyle(box).color || "#000";
    const widthOf = (s, p) => s.mode === "erase" ? 26 : 2.4 * (0.35 + p * 1.3);
    const inkOf = s => s.mode === "erase" ? "#000" : (s.color === "ink" ? getComputedStyle(box).color : color(s.color));
    function seg(s, a, b){
      ctx.globalCompositeOperation = s.mode === "erase" ? "destination-out" : "source-over";
      ctx.strokeStyle = ctx.fillStyle = inkOf(s);
      ctx.lineWidth = widthOf(s, (a[2] + b[2]) / 2);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    function dot(s, a){
      ctx.globalCompositeOperation = s.mode === "erase" ? "destination-out" : "source-over";
      ctx.fillStyle = inkOf(s);
      ctx.beginPath(); ctx.arc(a[0], a[1], widthOf(s, a[2]) / 2, 0, Math.PI * 2); ctx.fill();
    }
    function redraw(){
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over"; ctx.clearRect(0, 0, W, H);
      ctx.lineCap = ctx.lineJoin = "round";
      for (const s of strokes) { dot(s, s.pts[0]); for (let i = 1; i < s.pts.length; i++) seg(s, s.pts[i - 1], s.pts[i]); }
      ctx.globalCompositeOperation = "source-over";
      hint.hidden = strokes.length > 0;
      undoB.disabled = clearB.disabled = !strokes.length;
    }
    function resize(){
      const r = pad.getBoundingClientRect(); if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 3); W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); redraw();
    }
    new ResizeObserver(resize).observe(pad);
    matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", redraw);
    const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, e.pointerType === "pen" ? (e.pressure || 0.5) : 0.5]; };
    cv.addEventListener("pointerdown", e => {
      if (e.pointerType === "pen") penSeen = true;
      else if (e.pointerType === "touch" && penSeen) return;   // ペンを使ったあとは、手のひらや指は無視
      if (cur || e.button > 0) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch {}
      cur = { id: e.pointerId, mode: tool === "eraser" ? "erase" : "pen", color: tool, pts: [pt(e)] };
      strokes.push(cur);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = ctx.lineJoin = "round";
      dot(cur, cur.pts[0]); hint.hidden = true;
    });
    cv.addEventListener("pointermove", e => {
      if (!cur || e.pointerId !== cur.id) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      for (const ev of evs.length ? evs : [e]) { const p = pt(ev), a = cur.pts[cur.pts.length - 1]; cur.pts.push(p); seg(cur, a, p); }
      ctx.globalCompositeOperation = "source-over";
    });
    const end = e => { if (cur && e.pointerId === cur.id) { cur = null; redraw(); } };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    cv.addEventListener("touchstart", e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
    cv.addEventListener("contextmenu", e => e.preventDefault());
    function setTool(t){ tool = t; box.querySelectorAll("[data-tool]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === t)); savePref(); }
    function setOpen(o){
      open = o; box.classList.toggle("off", !o); document.body.classList.toggle("kqm-open", o);
      togB.textContent = o ? "しまう" : "メモを開く"; togB.setAttribute("aria-expanded", o); savePref();
    }
    box.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      e.stopPropagation();
      if (b.dataset.tool) return setTool(b.dataset.tool);
      if (b.dataset.act === "undo") { strokes.pop(); redraw(); }
      if (b.dataset.act === "clear") { strokes = []; redraw(); }
      if (b.dataset.act === "toggle") setOpen(!open);
    });
    setTool(tool); setOpen(open);
    let key;
    return {
      // 問題がかわったら自動で白紙にもどす
      sync(k){ if (k !== key) { key = k; strokes = []; cur = null; redraw(); } }
    };
  }

  window.KQMemo = { mount };
})();
