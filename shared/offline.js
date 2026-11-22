/* オフラインで使うためのしくみ（全ページ共通。shared/update.js が読みこむ）
   1) 問題・解説・ページ（約5MB）… つながっている時に、うらで自動でスマホに保存する
   2) 問題の画像（約11MB）… マイページの「画像も保存する」を押した人だけ保存する
      どちらも offline.json（tools/offline-list.py で作る）を見て、中身が変わったファイルだけ取り直す
   3) オフラインになったら、画面の上に「オフライン中」を少しだけ出す
   保存先はサービスワーカー（sw.js）と同じ箱。記録（localStorage・クラウド）にはさわらない。 */
(function () {
  "use strict";
  if (window.KQOffline) return;
  var me = document.currentScript;
  var root = new URL("../", me ? me.src : location.href);
  var CACHE = "kq-v1";
  var KEY = "kq-off-v1";       // { core: "済んだ版", img: "済んだ版" }
  var IMG_ON = "kq-off-img";   // "1" … 画像も保存する
  var CHECK_MS = 6 * 60 * 60 * 1000;
  var ok = !!(window.caches && window.fetch && window.Promise);

  function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function lsSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) {} }
  function state() { try { return JSON.parse(lsGet(KEY) || "{}") || {}; } catch (_) { return {}; } }
  function setState(s) { lsSet(KEY, JSON.stringify(s)); }

  var st = { busy: false, part: "", done: 0, total: 0, err: "", list: null };
  var subs = [];
  function emit() { subs.forEach(function (f) { try { f(info()); } catch (_) {} }); }

  function getList() {
    return fetch(new URL("offline.json", root).href, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("list"); return r.json(); })
      .then(function (d) { st.list = d; try { sessionStorage.setItem(KEY + "-list", JSON.stringify(d)); } catch (_) {} return d; });
  }
  function cachedList() {
    if (st.list) return st.list;
    try { return JSON.parse(sessionStorage.getItem(KEY + "-list") || "null"); } catch (_) { return null; }
  }
  function sumOf(list, img) {
    var n = 0, b = 0;
    (list ? list.files : []).forEach(function (f) { if (!!f.i === img) { n++; b += f.s; } });
    return { n: n, mb: Math.max(1, Math.round(b / 1e6)) };
  }
  function verOf(list, img) {
    var t = "";
    list.files.forEach(function (f) { if (!!f.i === img) t += f.u + f.h; });
    var h = 0;
    for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
    return String(h >>> 0);
  }

  // ハッシュつきでおぼえておく（どのファイルを、どの中身で保存したか）
  function hashes() { try { return JSON.parse(lsGet(KEY + "-h") || "{}") || {}; } catch (_) { return {}; } }

  function saveFiles(files, part) {
    st.busy = true; st.part = part; st.done = 0; st.total = files.length; st.err = ""; emit();
    var hs = hashes();
    return caches.open(CACHE).then(function (cache) {
      var i = 0, fails = 0;
      function one() {
        if (i >= files.length) return Promise.resolve();
        var f = files[i++];
        var url = new URL(f.u, root).href;
        return cache.match(url, { ignoreVary: true }).then(function (hit) {
          if (hit && hs[f.u] === f.h) return;
          return fetch(url, { cache: "no-cache", credentials: "same-origin" }).then(function (res) {
            if (!res.ok || res.redirected) throw new Error("http");
            return cache.put(url, res).then(function () { hs[f.u] = f.h; });
          });
        }).catch(function () { fails++; }).then(function () {
          st.done++;
          if (st.done % 10 === 0 || st.done === st.total) { lsSet(KEY + "-h", JSON.stringify(hs)); emit(); }
          return one();
        });
      }
      return Promise.all([one(), one(), one(), one()]).then(function () {
        lsSet(KEY + "-h", JSON.stringify(hs));
        st.busy = false;
        if (fails) { st.err = fails + "件 保存できませんでした"; emit(); throw new Error("fail"); }
        emit();
      });
    }, function (e) { st.busy = false; st.err = "このブラウザでは保存できません"; emit(); throw e; });
  }

  function sync(force) {
    if (!ok || st.busy) return Promise.resolve(false);
    if (navigator.onLine === false) return Promise.resolve(false);
    var s = state();
    if (!force && s.at && Date.now() - s.at < CHECK_MS && cachedList()) return Promise.resolve(false);
    var wantImg = lsGet(IMG_ON) === "1";
    return getList().then(function (list) {
      var cv = verOf(list, false), iv = verOf(list, true);
      var jobs = Promise.resolve();
      if (force || s.core !== cv) {
        jobs = jobs.then(function () {
          return saveFiles(list.files.filter(function (f) { return !f.i; }), "core")
            .then(function () { s.core = cv; setState(s); });
        });
      }
      if (wantImg && (force || s.img !== iv)) {
        jobs = jobs.then(function () {
          return saveFiles(list.files.filter(function (f) { return f.i; }), "img")
            .then(function () { s.img = iv; setState(s); });
        });
      }
      return jobs.then(function () { s.at = Date.now(); setState(s); emit(); return true; });
    }).catch(function () { st.busy = false; emit(); return false; });
  }

  function info() {
    var s = state(), list = cachedList();
    return {
      supported: ok,
      online: navigator.onLine !== false,
      busy: st.busy, part: st.part, done: st.done, total: st.total, err: st.err,
      core: !!s.core && (!list || s.core === verOf(list, false)),
      coreSize: sumOf(list, false),
      imgOn: lsGet(IMG_ON) === "1",
      img: !!s.img && (!list || s.img === verOf(list, true)),
      imgSize: sumOf(list, true)
    };
  }

  function setImages(on) {
    if (on) {
      lsSet(IMG_ON, "1");
      try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (_) {}
      return sync(true);
    }
    lsSet(IMG_ON, null);
    var s = state(); delete s.img; setState(s);
    var list = cachedList();
    var hs = hashes();
    if (!ok || !list) { emit(); return Promise.resolve(); }
    return caches.open(CACHE).then(function (cache) {
      return Promise.all(list.files.filter(function (f) { return f.i; }).map(function (f) {
        delete hs[f.u];
        return cache.delete(new URL(f.u, root).href, { ignoreVary: true });
      }));
    }).then(function () { lsSet(KEY + "-h", JSON.stringify(hs)); emit(); }, function () { emit(); });
  }

  window.KQOffline = {
    info: info,
    sync: sync,
    setImages: setImages,
    onChange: function (f) { subs.push(f); if (!st.list && navigator.onLine !== false) getList().then(emit, function () {}); }
  };

  // オフライン中のおしらせ（数秒で消える）
  function note(text) {
    if (!document.body) return;
    var old = document.getElementById("kq-off-note");
    if (old) old.remove();
    var b = document.createElement("div");
    b.id = "kq-off-note";
    b.setAttribute("role", "status");
    b.textContent = text;
    b.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);top:calc(10px + env(safe-area-inset-top,0px));z-index:99998;" +
      "max-width:calc(100% - 32px);box-sizing:border-box;padding:8px 14px;border-radius:999px;background:#33261a;color:#ffe7c2;" +
      "box-shadow:0 4px 16px rgba(0,0,0,.3);font:600 13px/1.4 system-ui,-apple-system,sans-serif;text-align:center;pointer-events:none";
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 4500);
  }
  window.addEventListener("offline", function () { note("📴 オフライン中：解いた記録はこの端末に保存されます"); emit(); });
  window.addEventListener("online", function () { if (window.KQ && KQ.session && KQ.session()) note("📶 つながりました：記録をクラウドに送ります"); emit(); setTimeout(function () { sync(false); }, 3000); });
  window.addEventListener("load", function () {
    if (navigator.onLine === false) note("📴 オフライン中：解いた記録はこの端末に保存されます");
    // お試し版でも問題は保存してOK（記録とは関係ない）
    setTimeout(function () {
      var c = navigator.connection;
      if (c && c.saveData) return;
      sync(false);
    }, 6000);
  });
})();
