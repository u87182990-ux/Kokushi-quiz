/* ホームの上に出す「お知らせ」（文面はサイトのいちばん上の notice.json）
   ・毎回ネットから最新の notice.json を取る（オフラインの時はスマホに保存した控え）
   ・× か「わかった」で閉じると、同じ id のお知らせは二度と出ない（kq-notice-seen に記録）
   ・who:"app" … ホーム画面に追加して使っている人だけに出す
   ・pop … 目立つ「NEW」のまど（新しい追加ドリル・大きな新機能だけに使う）。1件ずつ1回だけ出る（kq-pop-seen）
       {"id":"…","drill":"houka","until":"2026-12-20"}  … drill があると「メニューに入れて開く」ボタンとNEWバッジがつく
       {"id":"…","ic":"🧮","title":"…","body":"…","until":"…"} … ドリル以外（ボタンは「わかった」だけ）
       drill の title / body / ic は書かなければ index.html の EXTRA（ドリルの名前・説明）から入る */
(function () {
  "use strict";
  var me = document.currentScript;
  var root = new URL("../", me ? me.src : location.href);
  var KEY = "kq-notice-seen", POP_KEY = "kq-pop-seen";

  function seen(k) { try { return JSON.parse(localStorage.getItem(k || KEY) || "[]"); } catch (_) { return []; } }
  function markSeen(id, k) {
    var s = seen(k);
    if (s.indexOf(id) < 0) s.push(id);
    try { localStorage.setItem(k || KEY, JSON.stringify(s.slice(-30))); } catch (_) {}
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
      ".kq-notice.bye{opacity:0;transition:opacity .2s}" +
      ".kq-pop{position:fixed;inset:0;z-index:2147482500;background:rgba(8,14,24,.5);display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .2s}" +
      ".kq-pop.on{opacity:1}" +
      ".kq-pop .in{background:var(--sheet,#fff);color:var(--ink,#152033);border:1px solid var(--line,#dbe2ea);border-top:4px solid var(--accent,#1d6fd8);border-radius:var(--r-card,14px);width:min(420px,100%);max-height:86vh;max-height:86dvh;overflow:auto;padding:16px}" +
      ".kq-pop .lab{display:inline-block;font:700 11.5px/1 var(--f-body,system-ui);letter-spacing:.06em;padding:4px 8px;border-radius:14px;background:var(--accent,#1d6fd8);color:var(--accent-ink,#fff)}" +
      ".kq-pop h2{font-family:var(--f-disp,inherit);font-size:19px;line-height:1.4;margin:10px 0 0}" +
      ".kq-pop .it{display:flex;gap:10px;align-items:flex-start;margin:16px 0 0;padding:16px 0 0;border-top:1px solid var(--line,#dbe2ea)}" +
      ".kq-pop .it .ic{flex:none;font-size:28px;line-height:1.2}" +
      ".kq-pop .it b{display:block;font-family:var(--f-disp,inherit);font-size:16px;line-height:1.4}" +
      ".kq-pop .it p{margin:4px 0 0;font-size:13.5px;line-height:1.7;color:var(--sub,#5d6a7e);white-space:pre-line}" +
      ".kq-pop .go{display:block;width:100%;margin:10px 0 0;border:1px solid var(--accent,#1d6fd8);background:var(--accent,#1d6fd8);color:var(--accent-ink,#fff);font:700 15px/1 var(--f-body,system-ui);padding:16px;border-radius:14px;cursor:pointer}" +
      ".kq-pop .later{display:block;width:100%;margin:16px 0 0;border:1px solid var(--line2,#c9d3de);background:none;color:var(--ink,#152033);font:700 14px/1 var(--f-body,system-ui);padding:16px;border-radius:14px;cursor:pointer}" +
      ".kq-pop button:active{opacity:.6}";
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

  /* ---------- NEW のまど（pop） ---------- */
  var pending = [];
  function homeFree() {
    var home = document.getElementById("v-home");
    if (!home || home.hidden) return false;
    if (document.body.classList.contains("modal-open") || document.body.classList.contains("in-quiz")) return false;
    if (document.querySelector(".kq-pop")) return false;
    return true;
  }
  function fill(p) {
    var d = p.drill && window.KQExtra ? window.KQExtra.info(p.drill) : null;
    if (p.drill && !d) return null;                   // まだ index.html にないドリルは出さない
    return {
      id: p.id, drill: p.drill || "",
      ic: p.ic || (d && d.ic) || "✨",
      title: p.title || (d && d.name) || "",
      body: p.body || (d && d.sub) || ""
    };
  }
  function showPop() {
    if (!pending.length) return;
    if (!homeFree()) return setTimeout(showPop, 1500);
    var list = pending.map(fill).filter(Boolean);
    pending = [];
    if (!list.length) return;
    css();
    var allDrill = list.every(function (x) { return x.drill; });
    var wrap = document.createElement("div"); wrap.className = "kq-pop";
    var box = document.createElement("div"); box.className = "in";
    box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "kq-pop-h");
    var lab = document.createElement("span"); lab.className = "lab"; lab.textContent = "NEW";
    var h = document.createElement("h2"); h.id = "kq-pop-h";
    h.textContent = allDrill ? "新しい追加ドリルが入りました" : (list.length > 1 ? "新しくなりました" : "新しい機能が入りました");
    box.appendChild(lab); box.appendChild(h);
    var done = function () {
      list.forEach(function (x) { markSeen(x.id, POP_KEY); });
      document.body.classList.remove("modal-open");
      wrap.classList.remove("on");
      setTimeout(function () { wrap.remove(); }, 200);
    };
    list.forEach(function (x) {
      var it = document.createElement("div"); it.className = "it";
      var ic = document.createElement("span"); ic.className = "ic"; ic.textContent = x.ic;
      var tx = document.createElement("div"); tx.style.flex = "1"; tx.style.minWidth = "0";
      var b = document.createElement("b"); b.textContent = x.title;
      tx.appendChild(b);
      if (x.body) { var p = document.createElement("p"); p.textContent = x.body; tx.appendChild(p); }
      if (x.drill) {
        var go = document.createElement("button"); go.type = "button"; go.className = "go";
        go.textContent = "メニューに入れて開く";
        go.onclick = function () {
          if (window.KQExtra) window.KQExtra.add(x.drill);
          done();
          location.href = new URL(x.drill + "/", root).href;
        };
        tx.appendChild(go);
      }
      it.appendChild(ic); it.appendChild(tx); box.appendChild(it);
    });
    var later = document.createElement("button"); later.type = "button"; later.className = "later";
    later.textContent = list.some(function (x) { return x.drill; }) ? "あとで（ホームの追加ドリルにNEWで出ます）" : "わかった";
    later.onclick = done;
    box.appendChild(later);
    wrap.appendChild(box);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) done(); });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape" && wrap.isConnected) { done(); document.removeEventListener("keydown", esc); } });
    document.body.appendChild(wrap);
    document.body.classList.add("modal-open");
    requestAnimationFrame(function () { wrap.classList.add("on"); });

  }
  function pops(n, force) {
    var all = (n && Array.isArray(n.pop) ? n.pop : []).filter(function (p) {
      return p && p.id && (force || !p.until || today() <= p.until);
    });
    // NEW バッジ：期限内の drill は、まどを閉じたあとも期限まで出す
    window.KQNew = { drills: all.filter(function (p) { return p.drill; }).map(function (p) { return p.drill; }) };
    try { window.dispatchEvent(new Event("kq-new")); } catch (_) {}
    var s = seen(POP_KEY);
    pending = all.filter(function (p) { return force || s.indexOf(p.id) < 0; });
    if (pending.length) setTimeout(showPop, 600);
  }
  window.addEventListener("hashchange", function () { if (pending.length) setTimeout(showPop, 300); });

  function go() {
    var force = /[?&]notice=show\b/.test(location.search); // 確認用：?notice=show で条件を無視して出す
    fetch(new URL("notice.json", root).href, { cache: "no-store", credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (n) {
        if (n) pops(n, /[?&]pop=show\b/.test(location.search)); // 確認用：?pop=show
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
