// ニックネーム＋4ケタ数字で記録をクラウドに保存する小さなライブラリ
(() => {
  const SK = "kq-session-v1";
  const cfg = () => window.KQ_CONFIG || {};
  const ready = () => !!(cfg().url && cfg().anonKey);
  async function rpc(fn, args){
    const c = cfg();
    const r = await fetch(c.url.replace(/\/$/, "") + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: c.anonKey, Authorization: "Bearer " + c.anonKey },
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
  window.KQ = { ready, session, login, load, save, logout: () => setSession(null) };
})();
