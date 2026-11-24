/* いつも最新版を出すためのしくみ（全ページ共通）
   1) サービスワーカー（sw.js）を登録 … ひらくたびにネットから最新を取る
   2) ホーム画面のアプリにもどってきた時、サイトが更新されていないか確かめる
      ・5分以上はなれていたら → 自動で読みこみ直す
      ・それより短い時 → 下に「新しい版があります」を出して、タップで更新
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

  var AWAY_RELOAD_MS = 5 * 60 * 1000;
  var CHECK_EVERY_MS = 30 * 60 * 1000;
  var stamps = null;   // { url: "ETag か Last-Modified" }
  var hiddenAt = 0, lastCheck = 0, busy = false, shown = false;

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

  function check(awayMs) {
    if (busy || shown || !stamps || !navigator.onLine) return;
    busy = true; lastCheck = Date.now();
    var urls = Object.keys(stamps);
    takeStamps(urls).then(function (now) {
      busy = false;
      var changed = urls.some(function (u) { return stamps[u] && now[u] && stamps[u] !== now[u]; });
      if (!changed) return;
      if (awayMs >= AWAY_RELOAD_MS) reloadNow();
      else showToast();
    });
  }

  function reloadNow() {
    var go = function () { location.reload(); };
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(function (r) {
        if (r && r.update) r.update().then(go, go); else go();
      }, go);
    } else go();
  }

  function showToast() {
    shown = true;
    var box = document.createElement("div");
    box.setAttribute("role", "status");
    box.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:99999;" +
      "display:flex;align-items:center;gap:12px;max-width:calc(100% - 32px);box-sizing:border-box;padding:10px 10px 10px 16px;border-radius:14px;" +
      "background:#0f1b2d;color:#e8f1fb;box-shadow:0 6px 24px rgba(0,0,0,.3);font:600 14px/1.4 system-ui,-apple-system,sans-serif";
    var t = document.createElement("span");
    t.textContent = "新しい版があります";
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = "更新する";
    b.style.cssText = "border:0;border-radius:10px;padding:8px 14px;background:#7fd3ff;color:#06121f;font:700 14px system-ui,-apple-system,sans-serif;cursor:pointer";
    b.onclick = function () { b.disabled = true; b.textContent = "更新中…"; reloadNow(); };
    var x = document.createElement("button");
    x.type = "button";
    x.textContent = "×";
    x.setAttribute("aria-label", "あとで");
    x.style.cssText = "border:0;background:none;color:#8fa6c2;font:700 18px system-ui;padding:4px 6px;cursor:pointer";
    x.onclick = function () { box.remove(); };
    box.appendChild(t); box.appendChild(b); box.appendChild(x);
    document.body.appendChild(box);
  }

  function onBack(awayMs) {
    if (!stamps) return;
    check(awayMs);
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
    else if (hiddenAt) { var away = Date.now() - hiddenAt; hiddenAt = 0; onBack(away); }
  });
  // iPhone/iPad で、前の画面がそのまま出てきた時
  window.addEventListener("pageshow", function (e) { if (e.persisted) onBack(AWAY_RELOAD_MS); });
  // ひらきっぱなしの時も、30分ごとにそっと確認
  setInterval(function () {
    if (document.visibilityState === "visible" && Date.now() - lastCheck >= CHECK_EVERY_MS) check(0);
  }, 60 * 1000);
})();
