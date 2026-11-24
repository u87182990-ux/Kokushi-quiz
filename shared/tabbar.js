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
    new MutationObserver(vis).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }
  window.KQTab = {
    set(v){ cur = v; paintCur(); },
    skin
  };
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);
  // ほかのタブ・ページで見た目を変えたとき
  window.addEventListener("storage", skin);
  window.addEventListener("pageshow", () => { skin(); vis(); });
})();
