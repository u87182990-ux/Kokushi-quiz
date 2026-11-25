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
     スクロールが止まるたびに「バーの下はしが、画面の下から決めた位置にあるか」をはかり、
     ずれていたら ①描き直させる ②それでもずれていたら、ずれた分だけ動かして画面の下にもどす。
     小さなずれ（Safari のツールバーぶん程度）や、ピンチで拡大しているときは動かさない。 */
  let dy = 0, raf = 0, tm = 0;
  function gap(){ const b = parseFloat(getComputedStyle(nav).bottom); return isFinite(b) ? b : 10; }
  function off(){
    // 見えている画面の下はし（visualViewport）から決めた位置と、バーの下はしの差（＋ならバーが上にずれている）
    const vv = window.visualViewport;
    const H = vv ? vv.offsetTop + vv.height : (window.innerHeight || document.documentElement.clientHeight);
    return (H - gap()) - nav.getBoundingClientRect().bottom;
  }
  const bad = d => d > 60 || d < -20; // 上に60px以上、または画面の外へ20px以上
  function fix(){
    raf = 0;
    if (!nav || nav.hidden) return;
    const vv = window.visualViewport;
    if (vv && vv.scale > 1.05) return;
    // ① 描き直し：スクロールが止まるたびにバーを描き直させる（同じフレーム内なのでちらつかない）
    nav.style.display = "none"; void nav.offsetHeight; nav.style.display = "";
    const d = off();
    if (!bad(d)) return;
    // ② それでもずれていたら、ずれた分だけ動かす
    dy += d;
    if (Math.abs(dy) > window.innerHeight) dy = 0; // ありえない値になったら元にもどす
    nav.style.setProperty("--kt-dy", dy + "px");
  }
  function reset(){
    // 画面の大きさが変わったら、いったん動かした分をもどしてからはかり直す
    if (dy && nav) { dy = 0; nav.style.removeProperty("--kt-dy"); }
    later();
  }
  function now(){ if (!raf) raf = requestAnimationFrame(fix); }
  function later(){ clearTimeout(tm); tm = setTimeout(now, 150); }
  function watch(){
    addEventListener("scroll", later, { passive: true });
    addEventListener("scrollend", now, { passive: true });
    addEventListener("touchend", later, { passive: true });
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
