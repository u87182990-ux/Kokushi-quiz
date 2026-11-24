/* ホームの上に出す「お知らせ」（文面はサイトのいちばん上の notice.json）
   ・毎回ネットから最新の notice.json を取る（オフラインの時はスマホに保存した控え）
   ・× か「わかった」で閉じると、同じ id のお知らせは二度と出ない（kq-notice-seen に記録）
   ・who:"app" … ホーム画面に追加して使っている人だけに出す */
(function () {
  "use strict";
  var me = document.currentScript;
  var root = new URL("../", me ? me.src : location.href);
  var KEY = "kq-notice-seen";

  function seen() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (_) { return []; } }
  function markSeen(id) {
    var s = seen();
    if (s.indexOf(id) < 0) s.push(id);
    try { localStorage.setItem(KEY, JSON.stringify(s.slice(-30))); } catch (_) {}
  }
  function isApp() {
    return navigator.standalone === true ||
      (window.matchMedia && matchMedia("(display-mode: standalone)").matches);
  }
  function today() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  function css() {
    if (document.getElementById("kq-notice-css")) return;
    var s = document.createElement("style");
    s.id = "kq-notice-css";
    s.textContent =
      ".kq-notice{background:var(--sheet,#fff);color:var(--ink,#152033);border:1px solid var(--line,#dbe2ea);border-left:4px solid var(--accent,#1d6fd8);" +
      "border-radius:var(--r-card,14px);padding:16px;margin:0 0 16px;font-size:13.5px;line-height:1.7}" +
      ".kq-notice .lab{display:block;font-size:11.5px;font-weight:700;color:var(--accent,#1d6fd8);letter-spacing:.04em}" +
      ".kq-notice .hd{display:flex;align-items:center;justify-content:space-between}" +
      ".kq-notice b.t{display:block;font-family:var(--f-disp,inherit);font-size:15.5px;line-height:1.4;margin:4px 0 8px}" +
      ".kq-notice p{margin:0;white-space:pre-line;color:var(--ink,#152033)}" +
      ".kq-notice ol{margin:8px 0 0;padding-left:16px;color:var(--sub,#5d6a7e)}" +
      ".kq-notice ol li{margin:4px 0 0}" +
      ".kq-notice .x{flex:none;width:40px;height:40px;margin:-10px -10px -10px 0;border:0;background:none;color:var(--sub,#5d6a7e);font:700 20px/1 system-ui,sans-serif;cursor:pointer;border-radius:14px}" +
      ".kq-notice .ok{display:block;margin:10px 0 0 auto;border:1px solid var(--line2,#c9d3de);background:none;color:var(--accent,#1d6fd8);font:700 13.5px/1 var(--f-body,system-ui);padding:10px 16px;border-radius:14px;cursor:pointer}" +
      ".kq-notice .x:active,.kq-notice .ok:active{opacity:.6}" +
      ".kq-notice.bye{opacity:0;transition:opacity .2s}";
    document.head.appendChild(s);
  }

  function show(n) {
    var home = document.getElementById("v-home");
    if (!home || document.getElementById("kq-notice")) return;
    css();
    var box = document.createElement("div");
    box.className = "kq-notice"; box.id = "kq-notice"; box.setAttribute("role", "status");
    var lab = document.createElement("span"); lab.className = "lab"; lab.textContent = "お知らせ";
    var t = document.createElement("b"); t.className = "t"; t.textContent = n.title || "お知らせ";
    var hd = document.createElement("div"); hd.className = "hd"; hd.appendChild(lab);
    box.appendChild(hd); box.appendChild(t);
    if (n.body) { var p = document.createElement("p"); p.textContent = n.body; box.appendChild(p); }
    if (n.steps && n.steps.length) {
      var ol = document.createElement("ol");
      n.steps.forEach(function (s) { var li = document.createElement("li"); li.textContent = s; ol.appendChild(li); });
      box.appendChild(ol);
    }
    var close = function () {
      markSeen(n.id);
      box.classList.add("bye");
      setTimeout(function () { box.remove(); }, 200);
    };
    var x = document.createElement("button"); x.type = "button"; x.className = "x"; x.textContent = "×"; x.setAttribute("aria-label", "お知らせを閉じる"); x.onclick = close;
    var ok = document.createElement("button"); ok.type = "button"; ok.className = "ok"; ok.textContent = "わかった"; ok.onclick = close;
    hd.appendChild(x); box.appendChild(ok);
    home.insertBefore(box, home.firstChild);
  }

  function go() {
    var force = /[?&]notice=show\b/.test(location.search); // 確認用：?notice=show で条件を無視して出す
    fetch(new URL("notice.json", root).href, { cache: "no-store", credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (n) {
        if (!n || !n.id || (!force && n.show === false)) return;
        if (!force && seen().indexOf(n.id) >= 0) return;
        if (!force && n.until && today() > n.until) return;
        if (!force && n.who !== "all" && !isApp()) return;
        show(n);
      })
      .catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
