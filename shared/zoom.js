// 問題の画像をタップすると全画面で開き、ピンチで拡大・指で移動できる共通部品
// ・対象：.qimg の中の画像（過去問・対策問題集・治療ドリル）と figure の中の画像（計算ドリル）
// ・ダブルタップで 2.5倍 ⇔ もとの大きさ。×・Esc・画像の外をタップで閉じる
(() => {
  const SEL = ".qimg img, figure img, img[data-zoom]";
  const css = `
  .kqz-hint{cursor:zoom-in}
  .kqz{position:fixed;inset:0;z-index:2147483000;background:rgba(5,9,15,.94);display:flex;align-items:center;justify-content:center;touch-action:none;overscroll-behavior:contain;-webkit-user-select:none;user-select:none}
  .kqz[hidden]{display:none}
  .kqz img{max-width:100vw;max-height:100vh;max-height:100dvh;object-fit:contain;transform-origin:0 0;will-change:transform;background:#fff;-webkit-user-drag:none;user-select:none;pointer-events:none}
  .kqz-x{position:absolute;top:calc(10px + env(safe-area-inset-top,0px));right:calc(12px + env(safe-area-inset-right,0px));width:46px;height:46px;border-radius:50%;border:0;background:rgba(255,255,255,.16);color:#fff;font-size:26px;line-height:1;cursor:pointer}
  .kqz-bar{position:absolute;left:0;right:0;bottom:calc(14px + env(safe-area-inset-bottom,0px));display:flex;justify-content:center;gap:10px;pointer-events:none}
  .kqz-bar button{pointer-events:auto;border:0;border-radius:999px;background:rgba(255,255,255,.16);color:#fff;font:700 14px/1 "BIZ UDPGothic","Hiragino Sans",sans-serif;padding:11px 16px;cursor:pointer}
  .kqz-tip{position:absolute;top:calc(18px + env(safe-area-inset-top,0px));left:16px;right:70px;color:rgba(255,255,255,.75);font:12.5px/1.5 "BIZ UDPGothic","Hiragino Sans",sans-serif}
  .qimg img{cursor:zoom-in}`;
  let box, img, tip, s = 1, x = 0, y = 0, base = { w: 0, h: 0, l: 0, t: 0 };
  const pts = new Map(); let pinch = null, pan = null, lastTap = 0, moved = false, opener = null;

  function build(){
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    box = document.createElement("div"); box.className = "kqz"; box.hidden = true;
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "画像の拡大");
    box.innerHTML = `<img alt=""><p class="kqz-tip">2本の指でひろげると拡大、1本の指で動かせます。ダブルタップでも拡大します。</p>
      <button class="kqz-x" type="button" aria-label="閉じる">×</button>
      <div class="kqz-bar"><button type="button" data-z="out" aria-label="縮小">－</button><button type="button" data-z="fit">もとの大きさ</button><button type="button" data-z="in" aria-label="拡大">＋</button></div>`;
    document.body.appendChild(box);
    img = box.querySelector("img"); tip = box.querySelector(".kqz-tip");
    box.querySelector(".kqz-x").onclick = close;
    box.querySelector(".kqz-bar").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return; e.stopPropagation();
      const cx = innerWidth / 2, cy = innerHeight / 2;
      if (b.dataset.z === "fit") reset(); else zoomAt(b.dataset.z === "in" ? 1.6 : 1 / 1.6, cx, cy);
    });
    box.addEventListener("pointerdown", down); box.addEventListener("pointermove", move);
    box.addEventListener("pointerup", up); box.addEventListener("pointercancel", up);
    box.addEventListener("wheel", e => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
    box.addEventListener("touchmove", e => e.preventDefault(), { passive: false });   // iPhone で後ろの画面が動かないように
    document.addEventListener("keydown", e => { if (!box.hidden && e.key === "Escape") close(); });
  }
  function apply(){ img.style.transform = `translate(${x}px,${y}px) scale(${s})`; }
  function measure(){
    img.style.transform = "none";
    const r = img.getBoundingClientRect(); base = { w: r.width, h: r.height, l: r.left, t: r.top };
  }
  function clamp(){
    s = Math.min(8, Math.max(1, s));
    const W = base.w * s, H = base.h * s;
    // 画像が画面より小さい向きは真ん中に、大きい向きは端が画面の中に残るように
    const minX = Math.min(0, innerWidth - W) - base.l, maxX = Math.max(0, innerWidth - W) - base.l;
    const minY = Math.min(0, innerHeight - H) - base.t, maxY = Math.max(0, innerHeight - H) - base.t;
    if (W <= innerWidth) x = (innerWidth - W) / 2 - base.l; else x = Math.min(maxX, Math.max(minX, x));
    if (H <= innerHeight) y = (innerHeight - H) / 2 - base.t; else y = Math.min(maxY, Math.max(minY, y));
  }
  function reset(){ s = 1; x = 0; y = 0; apply(); }
  // 画面の点 (cx, cy) を動かさずに k 倍する
  function zoomAt(k, cx, cy){
    const ns = Math.min(8, Math.max(1, s * k)), r = ns / s;
    x = cx - base.l - (cx - base.l - x) * r; y = cy - base.t - (cy - base.t - y) * r; s = ns;
    clamp(); apply();
  }
  function open(src, from){
    if (!box) build();
    opener = from || null;
    img.onload = () => { measure(); reset(); };
    img.src = src; img.alt = (from && from.alt) || "問題の画像";
    box.hidden = false; document.documentElement.style.overflow = "hidden";
    tip.hidden = false; setTimeout(() => { tip.hidden = true; }, 3500);
    if (img.complete) { measure(); reset(); }
    box.querySelector(".kqz-x").focus({ preventScroll: true });
  }
  function close(){
    box.hidden = true; document.documentElement.style.overflow = ""; pts.clear(); pinch = pan = null;
    if (opener && opener.focus) try { opener.focus({ preventScroll: true }); } catch {}
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function down(e){
    if (e.target.closest("button")) return;
    e.preventDefault();
    try { box.setPointerCapture(e.pointerId); } catch {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = false;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d: dist(a, b), s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, x, y }; pan = null;
    } else if (pts.size === 1) pan = { sx: e.clientX, sy: e.clientY, x, y };
  }
  function move(e){
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()], cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      const ns = Math.min(8, Math.max(1, pinch.s * dist(a, b) / pinch.d)), r = ns / pinch.s;
      // 指のまん中を中心に拡大して、指といっしょに動かす
      x = cx - base.l - (pinch.cx - base.l - pinch.x) * r; y = cy - base.t - (pinch.cy - base.t - pinch.y) * r; s = ns;
      clamp(); apply(); moved = true;
    } else if (pan) {
      const dx = e.clientX - pan.sx, dy = e.clientY - pan.sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (s > 1) { x = pan.x + dx; y = pan.y + dy; clamp(); apply(); }
    }
  }
  function up(e){
    const p = pts.get(e.pointerId); pts.delete(e.pointerId);
    if (pts.size < 2) pinch = null;
    if (pts.size === 1) { const q = [...pts.values()][0]; pan = { sx: q.x, sy: q.y, x, y }; return; }
    pan = null;
    if (!p || moved || e.type === "pointercancel") return;
    const now = Date.now();
    if (now - lastTap < 320) { lastTap = 0; if (s > 1.05) reset(); else zoomAt(2.5, p.x, p.y); return; }
    lastTap = now;
    // 1回タップ：画像の外なら閉じる（ダブルタップを待ってから）
    const r = img.getBoundingClientRect(), outside = p.x < r.left || p.x > r.right || p.y < r.top || p.y > r.bottom;
    if (outside && s <= 1.05) setTimeout(() => { if (lastTap === now) close(); }, 330);
  }
  addEventListener("resize", () => { if (box && !box.hidden) { measure(); reset(); } });
  document.addEventListener("click", e => {
    const t = e.target.closest && e.target.closest(SEL);
    if (!t || (box && box.contains(t))) return;
    e.preventDefault();
    open(t.currentSrc || t.src, t);
  });
  // 拡大できることがわかるように、画像に印（キーボードでも開ける）
  const mark = () => document.querySelectorAll(SEL).forEach(i => { if (i.dataset.kqz) return; i.dataset.kqz = "1"; i.classList.add("kqz-hint"); i.tabIndex = 0; i.setAttribute("role", "button"); i.title = "タップで拡大"; });
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(SEL)) { e.preventDefault(); open(e.target.currentSrc || e.target.src, e.target); } });
  new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
  window.KQZoom = { open, close };
})();
