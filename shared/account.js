// ニックネーム＋4ケタ数字で記録をクラウドに保存する小さなライブラリ
(() => {
  const SK = "kq-session-v1";
  const cfg = () => window.KQ_CONFIG || {};
  const ready = () => !!(cfg().url && cfg().anonKey);
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
  async function load(app){
    const s = session(); if (!s || !ready()) return { ok: false };
    try {
      const r = await rpc("kq_load", { p_nick: s.nick, p_pin: s.pin, p_app: app });
      if (r.status === "wrong" || r.status === "none") setSession(null);
      return r.status === "ok" ? { ok: true, data: r.data } : { ok: false, msg: MSG[r.status] || r.status, status: r.status };
    } catch { return { ok: false, msg: MSG.net, status: "net" }; }
  }
  async function save(app, data){
    const s = session(); if (!s || !ready()) return { ok: false };
    try {
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
  window.KQ = { ready, session, login, load, save, logout: () => setSession(null), decode, migrate };
})();
