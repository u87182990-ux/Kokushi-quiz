/* いつも最新版を出すためのしくみ（全ページ共通）
   1) サービスワーカー（sw.js）を登録 … ひらくたびにネットから最新を取る
   2) ホーム画面のアプリにもどってきた時・30分ごとに、サイトが更新されていないか確かめる
      ・区切り（ホーム・一覧など）にいる時 → 自動で読みこみ直して、上に小さく「最新版になりました」
      ・問題を解いている途中 → 上に小さく知らせるだけ（ボタンなし）。ホームにもどった時に自動で入れかえる
      ※ページが自分で「いま途中」と言いたい時は window.KQBusy = () => true を用意する
   記録は localStorage とクラウドに入っているので、読みこみ直しても消えません。 */
(function () {
  "use strict";
  var me = document.currentScript;
  var root = new URL("../", me ? me.src : location.href); // サイトのいちばん上（/Kokushi-quiz/）

  // ホーム画面のアイコン（トップページで選べる。e〜n は内臓・細胞キャラ。はじめは C）
  var ICONS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n"];
  function applyIcon(k) {
    if (ICONS.indexOf(k) < 0) k = "c";
    var t = document.querySelector('link[rel="apple-touch-icon"]');
    if (t) t.href = new URL("icons/" + k + "/apple-touch-icon.png", root).href;
    var m = document.querySelector('link[rel="manifest"]');
    if (m) m.href = new URL(k === "c" ? "manifest.webmanifest" : "manifest-" + k + ".webmanifest", root).href;
  }
  var picked = "c";
  try { picked = localStorage.getItem("kq-icon") || "c"; } catch (_) {}
  applyIcon(picked);
  window.KQIcon = {
    list: ICONS,
    get: function () { try { return localStorage.getItem("kq-icon") || "c"; } catch (_) { return "c"; } },
    set: function (k) { try { localStorage.setItem("kq-icon", k); } catch (_) {} applyIcon(k); },
    url: function (k) { return new URL("icons/" + k + "/icon-192.png", root).href; }
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(new URL("sw.js", root).href, { scope: root.pathname })
      .then(function (reg) { reg.update && reg.update(); })
      .catch(function () {});
  }

  // オフラインで使うしくみ（shared/offline.js）
  var off = document.createElement("script");
  off.src = new URL("shared/offline.js", root).href;
  off.async = true;
  (document.head || document.documentElement).appendChild(off);

  if (!window.fetch || !window.performance || !performance.getEntriesByType) return;

  var CHECK_EVERY_MS = 30 * 60 * 1000;
  var stamps = null;   // { url: "ETag か Last-Modified" }
  var hiddenAt = 0, lastCheck = 0, busy = false;

  function watchList() {
    var urls = [location.href.split("#")[0]];
    performance.getEntriesByType("resource").forEach(function (e) {
      if (!/^(script|fetch|xmlhttprequest|link|css)$/.test(e.initiatorType)) return;
      var u;
      try { u = new URL(e.name); } catch (_) { return; }
      if (u.origin !== location.origin || u.pathname.indexOf(root.pathname) !== 0) return;
      if (/\/sw\.js$|\.webmanifest$/.test(u.pathname)) return;
      if (urls.indexOf(u.href) < 0) urls.push(u.href);
    });
    return urls.slice(0, 12);
  }

  function stampOf(url) {
    return fetch(url, { method: "HEAD", cache: "no-store", credentials: "same-origin" })
      .then(function (r) { return r.ok ? (r.headers.get("etag") || r.headers.get("last-modified") || "") : ""; })
      .catch(function () { return ""; });
  }

  function takeStamps(urls) {
    return Promise.all(urls.map(stampOf)).then(function (vals) {
      var o = {};
      urls.forEach(function (u, i) { o[u] = vals[i]; });
      return o;
    });
  }

  // いま「区切り」にいるか（＝読みこみ直しても、解いている途中の問題が消えない所か）
  //  ・トップページ … ふだんはOK（入力中・ひらいた小窓がある時だけ待つ）
  //  ・演習ページ（過去問・治療など）… ホーム／一覧の画面にいる時だけOK
  //  ・1ページで解くドリル（医用工学など）… ページにいる間は待つ（次にひらいた時は最新が出る）
  var SAFE_VIEWS = { "view-home": 1, "view-list": 1, "view-tags": 1 };
  function isSafe() {
    var b = document.body;
    if (!b) return false;
    if (window.KQBusy && window.KQBusy()) return false;
    if (b.classList.contains("in-quiz")) return false;
    var a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return false;
    if (document.querySelector("dialog[open], [role=dialog]:not([hidden]), [aria-modal=true]:not([hidden])")) return false;
    var views = document.querySelectorAll("section.view");
    if (views.length) {
      for (var i = 0; i < views.length; i++) if (!views[i].hidden) return !!SAFE_VIEWS[views[i].id];
      return false;
    }
    if (document.getElementById("card") || document.getElementById("stage")) return false;
    return true;
  }

  var pending = false;   // 新しい版が見つかって、区切りを待っているところ
  function check() {
    if (busy || pending || !stamps || !navigator.onLine) return;
    busy = true; lastCheck = Date.now();
    var urls = Object.keys(stamps);
    takeStamps(urls).then(function (now) {
      busy = false;
      var changed = urls.some(function (u) { return stamps[u] && now[u] && stamps[u] !== now[u]; });
      if (!changed) return;
      pending = true;
      if (isSafe()) reloadNow();
      else { note("更新中…"); waitSafe(); }
    });
  }

  // 区切り（ホームにもどった時など）になったら、そっと入れかえる
  function waitSafe() {
    var t = setInterval(function () {
      if (document.visibilityState === "visible" && isSafe()) { clearInterval(t); setTimeout(function () { if (isSafe()) reloadNow(); else waitSafe(); }, 600); }
    }, 1000);
  }

  var FLAG = "kq-updated";
  function reloadNow() {
    // 読みこみ直したあと、同じ場所（スクロール位置）にもどす
    try { sessionStorage.setItem(FLAG, JSON.stringify({ url: location.href, y: window.scrollY || 0 })); } catch (_) {}
    var go = function () { location.reload(); };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(function (r) {
        if (r && r.update) r.update().then(go, go); else go();
      }, go);
    } else go();
  }

  // 上に小さく出す（ボタンなし・さわれない・3秒で消える）
  function note(msg) {
    function put() {
      var box = document.createElement("div");
      box.setAttribute("role", "status");
      box.textContent = msg;
      box.style.cssText = "position:fixed;left:50%;top:calc(8px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:99999;" +
        "pointer-events:none;max-width:calc(100% - 32px);box-sizing:border-box;padding:4px 10px;border-radius:14px;" +
        "background:rgba(15,27,45,.86);color:#e8f1fb;border:1px solid rgba(232,241,251,.16);font:600 12px/1.5 system-ui,-apple-system,sans-serif;" +
        "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;transition:opacity .2s";
      document.body.appendChild(box);
      requestAnimationFrame(function () { box.style.opacity = "1"; });
      setTimeout(function () { box.style.opacity = "0"; setTimeout(function () { box.remove(); }, 250); }, 3000);
    }
    if (document.body) put(); else document.addEventListener("DOMContentLoaded", put);
  }

  // 更新して読みこみ直した直後：スクロール位置をもどして「最新版になりました」
  (function () {
    var f = null;
    try { f = JSON.parse(sessionStorage.getItem(FLAG) || "null"); sessionStorage.removeItem(FLAG); } catch (_) {}
    if (!f) return;
    window.addEventListener("load", function () {
      if (f.url === location.href && f.y) setTimeout(function () { window.scrollTo(0, f.y); }, 50);
      note("✓ 最新版になりました");
    });
  })();

  function onBack() {
    if (!stamps) return;
    check();
  }

  window.addEventListener("load", function () {
    // データ（questions.json など）を読み終わるのを少し待ってから、今の版を記録する
    setTimeout(function () {
      var urls = watchList();
      takeStamps(urls).then(function (o) { stamps = o; });
    }, 4000);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") hiddenAt = Date.now();
    else if (hiddenAt) { hiddenAt = 0; onBack(); }
  });
  // iPhone/iPad で、前の画面がそのまま出てきた時
  window.addEventListener("pageshow", function (e) { if (e.persisted) onBack(); });
  // ひらきっぱなしの時も、30分ごとにそっと確認
  setInterval(function () {
    if (document.visibilityState === "visible" && Date.now() - lastCheck >= CHECK_EVERY_MS) check();
  }, 60 * 1000);
})();
