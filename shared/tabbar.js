/* 画面の下に浮く丸いタブバー（ホーム／演習／模試／その他）
   使い方：<script src="(../)shared/tabbar.js" data-root="../" data-tab="drill" defer></script>
     data-root … トップ（index.html）までの道。トップ自身は "" 。
     data-tab  … はじめに強調するタブ（home / drill / mock / me）。あとから KQTab.set("mock") で変えられる。
   問題を解いている画面（body.in-quiz）ではバーをかくす。
   色は KQ.avatar の look.theme（見た目の6種類）に合わせる。 */
(() => {
  const me = document.currentScript;
  const root = (me && me.dataset.root) || "";
  const ICON = {
    home: '<path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>',
    drill: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
    mock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
    me: '<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>'
  };
  const TABS = [["home", "ホーム", ""], ["drill", "演習", "#drill"], ["mock", "模試", "#mock"], ["me", "その他", "#me"]];
  let nav = null, cur = (me && me.dataset.tab) || "";

  function skin(){
    if (!nav) return;
    let t = "";
    try { t = ((window.KQ && KQ.avatar.get() || {}).look || {}).theme || ""; } catch {}
    if (t) nav.dataset.skin = t; else delete nav.dataset.skin;
  }
  function paintCur(){
    if (!nav) return;
    nav.querySelectorAll("a").forEach(a => a.dataset.v === cur ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  }
  function vis(){
    if (!nav) return;
    const hide = document.body.classList.contains("in-quiz");
    nav.hidden = hide;
    document.body.classList.toggle("kt-on", !hide);
  }
  function mount(){
    if (nav) return;
    nav = document.createElement("nav");
    nav.className = "kt"; nav.setAttribute("aria-label", "メニュー");
    nav.innerHTML = TABS.map(([v, label, h]) =>
      `<a href="${root ? root + h : (h || "#")}" data-v="${v}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[v]}</svg>${label}</a>`).join("");
    document.body.appendChild(nav);
    skin(); paintCur(); vis();
    new MutationObserver(() => { vis(); later(); }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    watch();
  }

  /* ずれ直し：iPad / iPhone（iOS 26 の Safari・ホーム画面アプリ）で、ページの一番下までスクロールしたときなどに
     position:fixed のバーが画面の下からはなれて、ページの途中に残ることがある（Safari 側の不具合）。
     スクロールが止まって指もはなれているときだけ、バーの位置をはかる。
       ① まず描き直させる
       ② それでも「上に60px以上」ずれていて、200ms あけて2回はかっても同じなら、その分だけ下へ動かす
     まちがって動かさないための決まり（v2）：
       ・指がふれている間・ページの上下はし（ゴムのようにのびる所）をこえている間・ピンチ拡大中ははからない
       ・動かすのは下向きだけ。動かしたあとバーが画面の外に出たら、すぐ元にもどす
       ・動かしている間は、スクロール中も毎フレーム見はり、画面の外に出たらすぐ元にもどす */
  let dy = 0, raf = 0, tm = 0, touching = false, first = null, guard = 0;
  function gap(){ const b = parseFloat(getComputedStyle(nav).bottom); return isFinite(b) ? b : 10; }
  function vh(){ return window.innerHeight || document.documentElement.clientHeight; }
  // ＋ならバーが上にずれている
  function off(){ return (vh() - gap()) - nav.getBoundingClientRect().bottom; }
  function calm(){
    const vv = window.visualViewport;
    if (vv && (vv.scale > 1.05 || Math.abs(vv.offsetTop) > 1)) return false;
    const y = window.scrollY, max = document.documentElement.scrollHeight - vh();
    if (y < 0 || y > max + 1) return false;
    return !touching;
  }
  function setDy(v){
    dy = v;
    if (dy) nav.style.setProperty("--kt-dy", dy + "px"); else nav.style.removeProperty("--kt-dy");
    if (dy && !guard) guard = requestAnimationFrame(watchDy);
  }
  function watchDy(){
    // 動かしている間だけ：バーが画面の下からはみ出したら、すぐ元にもどす
    guard = 0;
    if (!dy || !nav || nav.hidden) return;
    if (nav.getBoundingClientRect().bottom > vh() + 2) { setDy(0); later(); return; }
    guard = requestAnimationFrame(watchDy);
  }
  function fix(){
    raf = 0;
    if (!nav || nav.hidden) { first = null; return; }
    if (!calm()) { first = null; later(); return; }
    // ① 描き直し（同じフレーム内なのでちらつかない）
    nav.style.display = "none"; void nav.offsetHeight; nav.style.display = "";
    const d = off();
    if (dy && d < -2) { setDy(Math.max(0, dy + d)); first = null; return; } // 動かしすぎ → もどす
    if (d <= 60) { first = null; return; }
    // ② 2回はかって同じときだけ動かす
    if (first === null || Math.abs(first - d) > 2) { first = d; clearTimeout(tm); tm = setTimeout(now, 200); return; }
    first = null;
    const v = Math.min(dy + d, vh());
    setDy(v);
    if (nav.getBoundingClientRect().bottom > vh() + 2) setDy(0); // 画面の外に出たら元にもどす
  }
  function reset(){
    // 画面の大きさが変わったら、いったん動かした分をもどしてからはかり直す
    if (dy && nav) setDy(0);
    first = null; later();
  }
  function now(){ if (!raf) raf = requestAnimationFrame(fix); }
  function later(){ clearTimeout(tm); tm = setTimeout(now, 200); }
  function watch(){
    addEventListener("scroll", () => { first = null; later(); }, { passive: true });
    addEventListener("scrollend", later, { passive: true });
    addEventListener("touchstart", () => { touching = true; first = null; }, { passive: true });
    addEventListener("touchend", () => { touching = false; later(); }, { passive: true });
    addEventListener("touchcancel", () => { touching = false; later(); }, { passive: true });
    addEventListener("resize", reset);
    addEventListener("orientationchange", reset);
    if (window.visualViewport) { visualViewport.addEventListener("resize", reset); visualViewport.addEventListener("scroll", later); }
    later();
  }
  window.KQTab = {
    set(v){ cur = v; paintCur(); if (nav) later(); },
    skin
  };
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  // ほかのタブ・ページで見た目を変えたとき
  window.addEventListener("storage", skin);
  window.addEventListener("pageshow", () => { skin(); vis(); if (nav) later(); });
})();
