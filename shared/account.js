// ニックネーム＋4ケタ数字で記録をクラウドに保存する小さなライブラリ
(() => {
  const SK = "kq-session-v1";
  // お試し版（ログインなし）: /demo/ か ?demo=1 から入ると、このタブの間はログインなし・記録は端末だけ・クラウドには送らない
  const DK = "kq-demo";
  let DEMO = false;
  try {
    const q = new URLSearchParams(location.search).get("demo");
    if (q === "0") sessionStorage.removeItem(DK);
    else if (q !== null) sessionStorage.setItem(DK, "1");
    DEMO = sessionStorage.getItem(DK) === "1";
  } catch { DEMO = /[?&]demo=(?!0)/.test(location.search); }
  if (DEMO) setupDemo();
  const cfg = () => window.KQ_CONFIG || {};
  const ready = () => !DEMO && !!(cfg().url && cfg().anonKey);
  async function rpc(fn, args){
    const c = cfg();
    const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json", apikey: c.anonKey }, /^eyJ/.test(c.anonKey) ? { Authorization: "Bearer " + c.anonKey } : {}),
      body: JSON.stringify(args)
    });
    if (!r.ok) throw new Error("http " + r.status);
    return r.json();
  }
  let mem = null; // localStorage が使えないブラウザ用
  function session(){
    if (DEMO) return null;
    try { const s = JSON.parse(localStorage.getItem(SK) || "null"); if (s && s.nick && s.pin) return s; } catch {}
    try { const s = JSON.parse(sessionStorage.getItem(SK) || "null"); if (s && s.nick && s.pin) return s; } catch {}
    return mem;
  }
  function setSession(s){
    mem = s;
    try { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch {}
    try { s ? sessionStorage.setItem(SK, JSON.stringify(s)) : sessionStorage.removeItem(SK); } catch {}
  }
  const MSG = {
    none: "そのニックネームは見つかりません。はじめての人は「はじめて使う」から登録してください",
    wrong: "数字がちがいます",
    locked: "数字を5回まちがえたので、10分間ロックしました。少し待ってからためしてください",
    taken: "そのニックネームはもう使われています。別の名前にしてください",
    bad_nick: "ニックネームは1〜20文字にしてください",
    bad_pin: "数字は4ケタにしてください",
    too_big: "記録が大きすぎて保存できませんでした",
    net: "つながりませんでした。電波のいいところで、もう一度ためしてください",
    setup: "まだ保存の準備ができていません（管理者の設定待ち）"
  };
  async function login(nick, pin, isNew){
    if (DEMO) return { ok: false, msg: "お試し版なのでログインはありません" };
    nick = String(nick || "").trim(); pin = String(pin || "").trim();
    if (!ready()) return { ok: false, msg: MSG.setup };
    if (!nick || nick.length > 20) return { ok: false, msg: MSG.bad_nick };
    if (!/^[0-9]{4}$/.test(pin)) return { ok: false, msg: MSG.bad_pin };
    try {
      if (isNew) {
        const r = await rpc("kq_register", { p_nick: nick, p_pin: pin });
        if (r !== "ok") return { ok: false, msg: MSG[r] || r };
      }
      const r = await rpc("kq_login", { p_nick: nick, p_pin: pin });
      if (r.status !== "ok") return { ok: false, msg: MSG[r.status] || r.status };
      setSession({ nick: r.nick || nick, pin });
      return { ok: true, nick: r.nick || nick };
    } catch { return { ok: false, msg: MSG.net }; }
  }
  // 案内キャラの設定（ニックネームごと）。記録といっしょにクラウドへ保存する
  const memAv = {};
  const avKey = () => { const s = session(); return "kq-avatar-v1" + (s ? "@" + s.nick.toLowerCase() : ""); };
  function getAvatar(){
    const k = avKey();
    try { const v = JSON.parse(localStorage.getItem(k) || "null"); if (v && typeof v === "object") return v; } catch {}
    return memAv[k] || null;
  }
  function putAvatar(v){
    const k = avKey(); memAv[k] = v;
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  }
  function takeAvatar(d){
    const v = d && d.avatar;
    if (v && typeof v === "object" && (v.t || 0) > ((getAvatar() || {}).t || 0)) {
      putAvatar(v);
      try { window.dispatchEvent(new CustomEvent("kq-avatar")); } catch {}
    }
  }
  async function load(app){
    const s = session(); if (!s || !ready()) return { ok: false };
    try {
      const r = await rpc("kq_load", { p_nick: s.nick, p_pin: s.pin, p_app: app });
      if (r.status === "wrong" || r.status === "none") setSession(null);
      if (r.status === "ok") { takeAvatar(r.data); if (window.KQStats) KQStats.fromLoad(r.data); }
      return r.status === "ok" ? { ok: true, data: r.data } : { ok: false, msg: MSG[r.status] || r.status, status: r.status };
    } catch { return { ok: false, msg: MSG.net, status: "net" }; }
  }
  async function save(app, data){
    const s = session(); if (!s || !ready()) return { ok: false };
    try {
      const av = getAvatar();
      if (av && data && typeof data === "object") data = Object.assign({}, data, { avatar: av });
      if (window.KQStats && data && typeof data === "object") data = KQStats.forSave(data);
      const r = await rpc("kq_save", { p_nick: s.nick, p_pin: s.pin, p_app: app, p_data: data });
      return r.status === "ok" ? { ok: true } : { ok: false, msg: MSG[r.status] || r.status };
    } catch { return { ok: false, msg: MSG.net }; }
  }

  // 前のアプリ（Claudeのページ）で書き出したコードを読む。2つのアプリのコードをまとめて貼ってもOK
  const unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
  async function gunzip(u8){ return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer()); }
  async function decodeOne(b64, gz){
    let u8 = unb64(b64);
    if (gz) { if (!window.DecompressionStream) throw new Error("old"); u8 = await gunzip(u8); }
    const d = JSON.parse(new TextDecoder().decode(u8));
    return d && (d.app === "kakomon" || d.app === "prep") && d.rec ? d : null;
  }
  async function decode(text){
    // 見えない文字・全角文字・改行をならしてから探す
    const t = String(text || "").normalize("NFKC").replace(/[​-‍﻿]/g, "");
    const out = [], seen = new Set();
    const push = d => { if (d) { const k = d.app + ":" + d.at; if (!seen.has(k)) { seen.add(k); out.push(d); } } };
    for (const part of t.split(/(?=K\s*O\s*K\s*U\s*S\s*H\s*I)/i)) {
      const m = /^KOKUSHI\s*-?\s*([A-Za-z]+)\s*1\s*([GJgj])\s*:\s*([A-Za-z0-9+\/=\s]+)/i.exec(part); if (!m) continue;
      try { push(await decodeOne(m[3].replace(/\s+/g, ""), m[2].toUpperCase() === "G")); } catch (e) { if (e.message === "old") throw e; }
    }
    if (!out.length) {
      // 先頭の「KOKUSHI-…:」が欠けていても、中身だけで読んでみる
      const flat = t.replace(/\s+/g, "");
      for (const mm of flat.matchAll(/H4sI[A-Za-z0-9+\/=]{20,}/g)) { try { push(await decodeOne(mm[0], true)); } catch (e) { if (e.message === "old") throw e; } }
      for (const mm of flat.matchAll(/eyJ[A-Za-z0-9+\/=]{20,}/g)) { try { push(await decodeOne(mm[0], false)); } catch {} }
    }
    return out;
  }
  function merge(base, add){
    const rec = { ...(base?.rec || {}) }, weak = { ...(base?.weak || {}) };
    let n = 0;
    for (const [id, r] of Object.entries(add.rec || {})) if (r && (!rec[id] || (r.t || 0) > (rec[id].t || 0))) { rec[id] = r; n++; }
    for (const [id, w] of Object.entries(add.weak || {})) if (w && (!weak[id] || (w.t || 0) > (weak[id].t || 0))) weak[id] = w;
    return { data: { v: 1, at: Date.now(), rec, weak }, n, total: Object.keys(rec).length };
  }
  async function migrate(text){
    let list;
    try { list = await decode(text); } catch (e) { return { ok: false, msg: e.message === "old" ? "このブラウザでは読めません。新しいSafariやChromeで開いてください" : "コードが読めませんでした。最初から最後までぜんぶ貼れているか確かめてください" }; }
    if (!list.length) return { ok: false, msg: "コードが見つかりませんでした。「KOKUSHI-」で始まる文字をぜんぶ貼ってください" };
    const res = [];
    for (const d of list) {
      const cur = await load(d.app);
      if (!cur.ok) return { ok: false, msg: cur.msg || "クラウドにつながりませんでした" };
      const m = merge(cur.data, d);
      const s = await save(d.app, m.data);
      if (!s.ok) return { ok: false, msg: s.msg || "保存できませんでした" };
      res.push({ app: d.app, n: m.n, total: m.total });
    }
    return { ok: true, res };
  }
  // お試し版の見た目：ログインまわりをかくして、説明の文をお試し版むけに言いかえる
  function setupDemo(){
    // 記録は本番と分ける：この端末の localStorage のキーに「kq-demo:」をつけて、本番の記録とまざらないようにする
    try {
      const P = "kq-demo:", SP = Storage.prototype, L = window.localStorage;
      const g = SP.getItem, st = SP.setItem, rm = SP.removeItem, ky = SP.key, ln = Object.getOwnPropertyDescriptor(SP, "length");
      const mine = () => { const a = []; for (let i = 0; i < ln.get.call(L); i++) { const k = ky.call(L, i); if (k && k.startsWith(P)) a.push(k); } return a; };
      SP.getItem = function (k){ return this === L ? g.call(this, P + k) : g.call(this, k); };
      SP.setItem = function (k, v){ return this === L ? st.call(this, P + k, v) : st.call(this, k, v); };
      SP.removeItem = function (k){ return this === L ? rm.call(this, P + k) : rm.call(this, k); };
      SP.key = function (i){ if (this !== L) return ky.call(this, i); const k = mine()[i]; return k ? k.slice(P.length) : null; };
      SP.clear = (c => function (){ if (this !== L) return c.call(this); mine().forEach(k => rm.call(L, k)); })(SP.clear);
    } catch {}
    const de = document.documentElement; de.classList.add("kq-demo");
    const st = document.createElement("style");
    st.textContent = ".kq-demo #acct,.kq-demo #h-login,.kq-demo #login-box,.kq-demo #me-box,.kq-demo #setup-warn,.kq-demo #move-box{display:none!important}"
      + ".kq-demo-badge{background:#e8b730;color:#2a1d00;font:700 12px/1.5 system-ui,sans-serif;padding:3px 12px;text-align:center;letter-spacing:.04em}";
    (document.head || de).appendChild(st);
    const REP = [
      [/ログインしていないので、記録はこのブラウザだけに保存しています。.*$/, "お試し版なので、記録はこのブラウザだけに保存しています"],
      ["ニックネームでログインしていれば、記録は自動でクラウドに保存されます。", "お試し版なので、記録はこの端末だけに保存されます。"],
      ["ログインすると、記録もわたしの見た目も、どの端末でも同じになるよ。", "お試し版だよ。記録はこの端末だけに保存されるよ。"],
      ["いまはこの端末だけに保存されます。ログインすると、ニックネームといっしょに保存できます。", "この端末だけに保存されます。"],
      ["（ログインしていれば記録はそのままです）", ""],
      ["お試し版なので、記録はこのブラウザだけに保存しています", "お試し版なので、記録はこのブラウザだけに保存しています（本番のサイトの記録とは別です）"]
    ];
    const fix = n => {
      const t = n.nodeValue; if (!t || t.indexOf("ログイン") < 0) return;
      let v = t; for (const [a, b] of REP) v = v.replace(a, b);
      if (v !== t) n.nodeValue = v;
    };
    const walk = root => {
      if (root.nodeType === 3) return fix(root);
      if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) fix(n);
    };
    const start = () => {
      walk(document.body);
      const b = document.createElement("div"); b.className = "kq-demo-badge"; b.textContent = "お試し版（ログインなし・記録は本番と別）";
      document.body.insertBefore(b, document.body.firstChild);
      new MutationObserver(ms => { for (const m of ms) { if (m.type === "characterData") fix(m.target); else m.addedNodes.forEach(walk); } })
        .observe(document.body, { childList: true, subtree: true, characterData: true });
    };
    if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  }
  window.KQ = { demo: DEMO, ready, session, login, load, save, logout: () => setSession(null), decode, migrate,
    avatar: { get: getAvatar, set: v => { v = Object.assign({}, v, { t: Date.now() }); putAvatar(v); return v; } } };
})();
