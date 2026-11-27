/* 関数電卓（全ページ共通・shared/update.js が読みこむ）
   ・問題を解いている画面の左下に「電卓」ボタン。押すと下から電卓が出る（解く画面の並び・操作はそのまま）
   ・iPhone の電卓のように、右上のボタンで「基本」⇔「関数」を切りかえ
   ・模試の本番画面では出さない（本番の国試は電卓が使えないため）
   ・マイページの「関数電卓」でボタンを出さない設定にできる（localStorage: kq-calc-off）
   ・外部ファイルなし。オフラインでも動く。計算は自前の式の読みとり（eval は使わない） */
(function () {
  "use strict";
  if (window.KQCalc) return;
  var OFF_KEY = "kq-calc-off", MODE_KEY = "kq-calc-mode";
  function lsGet(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }
  function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (_) {} }

  var listeners = [];
  window.KQCalc = {
    isOff: function () { return lsGet(OFF_KEY) === "1"; },
    setOff: function (off) { lsSet(OFF_KEY, off ? "1" : null); listeners.forEach(function (f) { try { f(); } catch (_) {} }); },
    onChange: function (f) { listeners.push(f); }
  };

  /* ---------- 式の読みとり ---------- */
  // tokens: 表示用の文字列の並び。1回のボタン押し＝1トークン（⌫ で1つずつ消える）
  var FN = { "ln(": "ln", "log(": "log", "log₂(": "log2", "√(": "sqrt", "∛(": "cbrt", "sin(": "sin", "cos(": "cos", "tan(": "tan" };
  function evaluate(tokens, ans) {
    var t = tokens.slice(), open = 0, i;
    for (i = 0; i < t.length; i++) { if (t[i] === ")") open--; else if (/\($/.test(t[i])) open++; }
    while (open-- > 0) t.push(")");
    // 数字はつなげる
    var s = [];
    for (i = 0; i < t.length; i++) {
      if (/^[0-9.]$/.test(t[i]) && s.length && /^[0-9.]+$/.test(s[s.length - 1])) s[s.length - 1] += t[i];
      else s.push(t[i]);
    }
    var p = 0;
    function peek() { return s[p]; }
    function startsPrimary(x) { return x != null && (/^[0-9.]+$/.test(x) || x === "(" || x === "π" || x === "e" || x === "Ans" || FN[x] || x === "10^("); }
    function expr() {
      var v = term();
      while (peek() === "+" || peek() === "−") { var o = s[p++]; var r = term(); v = o === "+" ? v + r : v - r; }
      return v;
    }
    function term() {
      var v = unary();
      for (;;) {
        var x = peek();
        if (x === "×" || x === "÷") { p++; var r = unary(); v = x === "×" ? v * r : v / r; }
        else if (startsPrimary(x)) v = v * unary();      // 2π・3(4) などは かけ算
        else return v;
      }
    }
    function unary() {
      if (peek() === "−" || peek() === "neg") { p++; return -unary(); }
      if (peek() === "+") { p++; return unary(); }
      return power();
    }
    function power() {
      var b = postfix();
      if (peek() === "^" || peek() === "^(") {
        var paren = s[p++] === "^(";
        var ex = paren ? expr() : unary();
        if (paren) { if (peek() !== ")") throw 0; p++; }
        return Math.pow(b, ex);
      }
      return b;
    }
    function postfix() {
      var v = primary();
      for (;;) {
        var x = peek();
        if (x === "²") { p++; v = v * v; }
        else if (x === "³") { p++; v = v * v * v; }
        else if (x === "⁻¹") { p++; v = 1 / v; }
        else if (x === "!") { p++; v = fact(v); }
        else if (x === "%") { p++; v = v / 100; }
        else if (x === "ᴇ") { p++; v = v * Math.pow(10, unary()); }
        else return v;
      }
    }
    function primary() {
      var x = s[p++];
      if (x == null) throw 0;
      if (/^[0-9.]+$/.test(x)) { if ((x.match(/\./g) || []).length > 1) throw 0; return parseFloat(x === "." ? "0" : x); }
      if (x === "π") return Math.PI;
      if (x === "e") return Math.E;
      if (x === "Ans") return ans;
      if (x === "(" || x === "10^(" || FN[x]) {
        var v = expr();
        if (s[p++] !== ")") throw 0;
        if (x === "(") return v;
        if (x === "10^(") return Math.pow(10, v);
        var f = FN[x], d = Math.PI / 180;
        if (f === "ln") return Math.log(v);
        if (f === "log") return Math.log10 ? Math.log10(v) : Math.log(v) / Math.LN10;
        if (f === "log2") return Math.log(v) / Math.LN2;
        if (f === "sqrt") return Math.sqrt(v);
        if (f === "cbrt") return Math.cbrt ? Math.cbrt(v) : (v < 0 ? -Math.pow(-v, 1 / 3) : Math.pow(v, 1 / 3));
        if (f === "sin") return Math.sin(v * d);
        if (f === "cos") return Math.cos(v * d);
        if (f === "tan") return Math.tan(v * d);
      }
      throw 0;
    }
    function fact(n) {
      if (n < 0 || n !== Math.floor(n) || n > 170) return NaN;
      var r = 1; for (var k = 2; k <= n; k++) r *= k; return r;
    }
    if (!s.length) return 0;
    var v = expr();
    if (p !== s.length) throw 0;
    return v;
  }

  // 数字の見せかた：10けたまで。とても大きい・小さい数は 1.23×10⁻⁵ の形
  var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function fmt(v) {
    if (typeof v !== "number" || !isFinite(v)) return "計算できません";
    if (Math.abs(v) < 1e-12) v = 0;
    var a = Math.abs(v);
    if (a !== 0 && (a >= 1e10 || a < 1e-5)) {
      var ex = Math.floor(Math.log10 ? Math.log10(a) : Math.log(a) / Math.LN10);
      var m = v / Math.pow(10, ex);
      if (Math.abs(m) >= 9.9999999995) { m /= 10; ex++; }
      return trim(m.toFixed(7)).replace("-", "−") + "×10" + String(ex).split("").map(function (c) { return SUP[c]; }).join("");
    }
    var str = String(parseFloat(v.toPrecision(10)));
    if (/e/.test(str)) str = trim(v.toFixed(10));
    var parts = str.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".").replace("-", "−");
  }
  function trim(x) { return x.indexOf(".") < 0 ? x : x.replace(/0+$/, "").replace(/\.$/, ""); }

  /* ---------- 画面 ---------- */
  var CSS = "" +
  ".kqc-fab{position:fixed;left:max(16px,env(safe-area-inset-left));bottom:calc(16px + env(safe-area-inset-bottom));z-index:8990;width:44px;height:44px;border-radius:14px;" +
    "border:1px solid var(--line,var(--rule,#dbe2ea));background:var(--sheet,#fff);color:var(--ink,#152033);display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;" +
    "box-shadow:0 1px 2px rgba(21,32,51,.08);-webkit-tap-highlight-color:transparent;transition:transform .15s}" +
  ".kqc-fab.kqc-r{left:auto;right:max(16px,env(safe-area-inset-right))}" +
  ".kqc-fab:active{transform:scale(.94)}" +
  ".kqc-fab[hidden],.kqc[hidden],.kqc-menu[hidden]{display:none}" +
  ".kqc-fab svg{width:22px;height:22px}" +
  ".kqc{position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:440px;z-index:9050;background:#0f1b2d;color:#fff;border-radius:14px 14px 0 0;" +
    "padding:10px 16px calc(16px + env(safe-area-inset-bottom));border:1px solid rgba(255,255,255,.08);border-bottom:0;box-shadow:0 -1px 10px rgba(5,9,15,.25);" +
    "font-family:var(--f-body,\"BIZ UDPGothic\",\"Hiragino Sans\",\"Noto Sans JP\",sans-serif);-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;" +
    "animation:kqc-up .2s ease-out}" +
  "@keyframes kqc-up{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}" +
  "@media (prefers-reduced-motion:reduce){.kqc{animation:none}}" +
  ".kqc-top{display:flex;align-items:center;justify-content:space-between;gap:8px;position:relative}" +
  ".kqc-ic{width:40px;height:40px;border-radius:999px;border:0;background:rgba(255,255,255,.1);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}" +
  ".kqc-ic svg{width:20px;height:20px}" +
  ".kqc-note{flex:1;text-align:center;font-size:11px;line-height:1.4;color:#8fa6c2}" +
  ".kqc-menu{position:absolute;right:0;top:48px;z-index:2;min-width:200px;background:#1a2a40;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:4px;box-shadow:0 4px 16px rgba(0,0,0,.35)}" +
  ".kqc-menu button{display:flex;align-items:center;gap:10px;width:100%;border:0;background:none;color:#fff;font:inherit;font-size:16px;padding:10px 16px;border-radius:10px;cursor:pointer;text-align:left}" +
  ".kqc-menu button:active{background:rgba(255,255,255,.08)}" +
  ".kqc-menu .ck{width:16px;color:#7fd3ff;font-weight:700}" +
  ".kqc-menu .sy{width:28px;color:#8fa6c2;font-family:var(--f-num,\"Outfit\",system-ui,sans-serif);font-size:14px}" +
  ".kqc-disp{padding:8px 4px 10px;text-align:right;min-height:84px;display:flex;flex-direction:column;justify-content:flex-end}" +
  ".kqc-row{display:flex;align-items:flex-end;gap:8px}" +
  ".kqc-deg{font-size:12px;color:#8fa6c2;padding-bottom:8px}" +
  ".kqc-exp{font-family:var(--f-num,\"Outfit\",system-ui,sans-serif);font-size:16px;line-height:1.4;color:#8fa6c2;min-height:22px;overflow-x:auto;white-space:nowrap;direction:rtl;scrollbar-width:none}" +
  ".kqc-exp::-webkit-scrollbar{display:none}" +
  ".kqc-exp span{direction:ltr;unicode-bidi:embed}" +
  ".kqc-out{flex:1;font-family:var(--f-num,\"Outfit\",system-ui,sans-serif);font-weight:300;font-size:48px;line-height:1.1;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
  ".kqc-out.sm{font-size:34px}.kqc-out.xs{font-size:24px}" +
  ".kqc-out.err{font-size:24px;color:#ff7b73}" +
  ".kqc-sci{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:10px}" +
  ".kqc-sci[hidden]{display:none}" +
  ".kqc-pad{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}" +
  ".kqc button.k{border:0;border-radius:999px;font-weight:400;line-height:1;color:#fff;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center;touch-action:manipulation;transition:filter .1s}" +
  ".kqc button.k:active{filter:brightness(1.35)}" +
  ".kqc-sci .k{height:38px;font-weight:400;background:rgba(255,255,255,.07);font-size:15px;font-family:var(--f-num,\"Outfit\",system-ui,sans-serif)}" +
  ".kqc-sci .k sup{font-size:11px;margin-left:1px;vertical-align:8px;line-height:0}.kqc-sci .k sub{font-size:10px;vertical-align:-4px;line-height:0}" +
  ".kqc-pad .k{height:60px;font-weight:400;background:rgba(255,255,255,.14);font-family:var(--f-num,\"Outfit\",system-ui,sans-serif);font-size:28px}" +
  ".kqc.fx .kqc-pad .k{height:48px;font-size:24px}" +
  ".kqc-pad .k.g{background:rgba(255,255,255,.3);font-size:22px}" +
  ".kqc-pad .k.o{background:#1d6fd8;font-size:30px}" +
  ".kqc-pad .k.o.on{background:#fff;color:#1d6fd8}" +
  ".kqc-pad .k svg{width:28px;height:28px}" +
  ".kqc button:focus-visible{outline:2px solid #7fd3ff;outline-offset:2px}" +
  "html.kqc-fab-on body{padding-bottom:calc(72px + env(safe-area-inset-bottom))}" +
  "html.kqc-open body{padding-bottom:var(--kqc-h,0px)!important}";

  var ICON_CALC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="3"/><rect x="8" y="6" width="8" height="3" rx="1"/><circle cx="9" cy="13" r=".6" fill="currentColor"/><circle cx="12" cy="13" r=".6" fill="currentColor"/><circle cx="15" cy="13" r=".6" fill="currentColor"/><circle cx="9" cy="17" r=".6" fill="currentColor"/><circle cx="12" cy="17" r=".6" fill="currentColor"/><circle cx="15" cy="17" r=".6" fill="currentColor"/></svg>';
  var ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var ICON_BS = '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M10 7h13v14H10l-6-7z"/><path d="M13.5 11l6 6M19.5 11l-6 6"/></svg>';

  // 関数のボタン（6列×3段）  [表示, 押したときに入るトークン, 読み上げ]
  var SCI = [
    ["(", "(", "かっこ"], [")", ")", "かっことじ"], ["x<sup>2</sup>", "²", "2乗"], ["x<sup>y</sup>", "^(", "べき乗"], ["e<sup>x</sup>", "e^(", "eのx乗"], ["10<sup>x</sup>", "10^(", "10のx乗"],
    ["<sup>1</sup>/x", "⁻¹", "逆数"], ["√x", "√(", "ルート"], ["∛x", "∛(", "3乗根"], ["ln", "ln(", "自然対数"], ["log<sub>10</sub>", "log(", "常用対数"], ["EE", "ᴇ", "かける10のn乗"],
    ["x!", "!", "階乗"], ["sin", "sin(", "サイン（度）"], ["cos", "cos(", "コサイン（度）"], ["tan", "tan(", "タンジェント（度）"], ["e", "e", "ネイピア数e"], ["π", "π", "円周率"]
  ];
  var PAD = [
    ["⌫", "bs", "g", "1文字消す"], ["AC", "ac", "g", "全部消す"], ["%", "%", "g", "パーセント"], ["÷", "÷", "o", "わる"],
    ["7", "7"], ["8", "8"], ["9", "9"], ["×", "×", "o", "かける"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["−", "−", "o", "ひく"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["+", "+", "o", "たす"],
    ["+/−", "pm", "", "プラスマイナス"], ["0", "0"], [".", "."], ["=", "eq", "o", "イコール"]
  ];

  var fab, box, menu, sci, expEl, outEl, degEl, modeBtn;
  var tokens = [], ans = 0, done = false, lastOk = "0", inited = false;

  function build() {
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    fab = document.createElement("button");
    fab.type = "button"; fab.className = "kqc-fab"; fab.hidden = true;
    fab.setAttribute("aria-label", "関数電卓をひらく"); fab.title = "関数電卓";
    fab.innerHTML = ICON_CALC;
    fab.onclick = function () { open(); };
    document.body.appendChild(fab);

    box = document.createElement("div");
    box.className = "kqc"; box.hidden = true;
    box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "関数電卓");
    var sciHtml = SCI.map(function (k) { return '<button type="button" class="k" data-t="' + k[1] + '" aria-label="' + k[2] + '">' + k[0] + "</button>"; }).join("");
    var padHtml = PAD.map(function (k) {
      var lab = k[1] === "bs" ? ICON_BS : k[0];
      return '<button type="button" class="k' + (k[2] ? " " + k[2] : "") + '" data-t="' + k[1] + '"' + (k[3] ? ' aria-label="' + k[3] + '"' : "") + ">" + lab + "</button>";
    }).join("");
    box.innerHTML =
      '<div class="kqc-top">' +
        '<button type="button" class="kqc-ic" data-act="close" aria-label="電卓をとじる">' + ICON_X + "</button>" +
        '<span class="kqc-note">練習用です（本番の国試は電卓なし）</span>' +
        '<button type="button" class="kqc-ic" data-act="mode" aria-label="基本と関数の切りかえ" aria-haspopup="true" aria-expanded="false">' + ICON_CALC + "</button>" +
        '<div class="kqc-menu" role="menu" hidden>' +
          '<button type="button" role="menuitemradio" data-mode="basic"><span class="ck"></span><span class="sy">+−</span>基本</button>' +
          '<button type="button" role="menuitemradio" data-mode="fx"><span class="ck"></span><span class="sy"><i>f</i>(x)</span>関数（科学計算）</button>' +
        "</div>" +
      "</div>" +
      '<div class="kqc-disp"><div class="kqc-exp"><span></span></div><div class="kqc-row"><span class="kqc-deg">Deg</span><div class="kqc-out" aria-live="polite">0</div></div></div>' +
      '<div class="kqc-sci">' + sciHtml + "</div>" +
      '<div class="kqc-pad">' + padHtml + "</div>";
    document.body.appendChild(box);
    menu = box.querySelector(".kqc-menu"); sci = box.querySelector(".kqc-sci");
    expEl = box.querySelector(".kqc-exp span"); outEl = box.querySelector(".kqc-out"); degEl = box.querySelector(".kqc-deg");
    modeBtn = box.querySelector('[data-act="mode"]');

    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.act === "close") return close();
      if (b.dataset.act === "mode") return toggleMenu();
      if (b.dataset.mode) { setMode(b.dataset.mode); toggleMenu(false); return; }
      if (!menu.hidden) toggleMenu(false);
      if (b.dataset.t) press(b.dataset.t);
    });
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", padBody);
    setMode(lsGet(MODE_KEY) === "fx" ? "fx" : "basic");
    paint();
  }

  function toggleMenu(show) {
    if (show == null) show = menu.hidden;
    menu.hidden = !show; modeBtn.setAttribute("aria-expanded", show ? "true" : "false");
  }
  function setMode(m) {
    var fx = m === "fx";
    box.classList.toggle("fx", fx); sci.hidden = !fx; degEl.hidden = !fx;
    lsSet(MODE_KEY, fx ? "fx" : null);
    [].forEach.call(menu.querySelectorAll("[data-mode]"), function (b) {
      var on = b.dataset.mode === (fx ? "fx" : "basic");
      b.setAttribute("aria-checked", on ? "true" : "false"); b.querySelector(".ck").textContent = on ? "✓" : "";
    });
    padBody();
  }

  var VALUE_END = /^([0-9.]|\)|π|e|Ans|²|³|⁻¹|!|%)$/;
  function isOp(t) { return t === "+" || t === "−" || t === "×" || t === "÷"; }
  function press(t) {
    if (t === "ac") { tokens = []; done = false; lastOk = "0"; return paint(); }
    if (t === "bs") {
      if (done) { done = false; tokens = []; lastOk = "0"; return paint(); }
      tokens.pop(); return paint();
    }
    if (t === "eq") {
      if (!tokens.length) return;
      try {
        var v = evaluate(tokens, ans);
        if (typeof v !== "number" || isNaN(v)) v = NaN;
        ans = isFinite(v) ? v : ans; done = true; paint(v);
      } catch (_) { paint(null, true); }
      return;
    }
    if (t === "pm") return negate();
    var postfix = /^(²|³|⁻¹|!|%|\^\(|ᴇ)$/.test(t);
    if (done) {
      done = false;
      // 答えのあとに 演算・2乗など → 答えの続きで計算。数字・関数 → 新しい式
      tokens = (isOp(t) || postfix) ? ["Ans"] : [];
    }
    if (isOp(t)) {
      var last = tokens[tokens.length - 1];
      if (last && isOp(last) && !(t === "−" && last !== "−")) tokens.pop();   // 演算の押しなおし
      if (!tokens.length && t !== "−") tokens.push("Ans");
    }
    if (postfix && !(tokens.length && VALUE_END.test(tokens[tokens.length - 1]))) {
      if (!tokens.length) tokens.push("Ans"); else return;
    }
    if (t === "e^(") { tokens.push("e"); tokens.push("^("); return paint(); }
    tokens.push(t);
    paint();
  }
  // ± … 最後の数字の符号を入れかえる
  function negate() {
    if (done) { done = false; tokens = ["neg", "Ans"]; return paint(); }
    var i = tokens.length;
    while (i > 0 && /^[0-9.]$/.test(tokens[i - 1])) i--;
    if (i === tokens.length && i > 0 && /^(π|e|Ans)$/.test(tokens[i - 1])) i--;
    if (i > 0 && tokens[i - 1] === "neg") tokens.splice(i - 1, 1);
    else tokens.splice(i, 0, "neg");
    paint();
  }

  function show(tok) {
    return tok.map(function (x) {
      if (x === "neg") return "−";
      if (x === "^(") return "^(";
      if (x === "ᴇ") return "×10^";
      return x;
    }).join("");
  }
  function sizeOut(text) {
    outEl.classList.remove("sm", "xs", "err");
    if (text.length > 14) outEl.classList.add("xs"); else if (text.length > 9) outEl.classList.add("sm");
  }
  function paint(result, err) {
    if (!outEl) return;
    if (err) {
      expEl.textContent = show(tokens) + " =";
      outEl.textContent = "式をたしかめてね"; outEl.className = "kqc-out err"; return;
    }
    if (done && result != null) {
      expEl.textContent = show(tokens) + " =";
      var r = fmt(result); outEl.textContent = r; sizeOut(r); lastOk = r;
      if (/計算できません/.test(r)) outEl.className = "kqc-out err";
      return;
    }
    expEl.textContent = show(tokens);
    // 途中の答え（式が完成していれば）を大きく見せる
    var txt = lastOk;
    if (!tokens.length) txt = "0";
    else {
      try { var v = evaluate(tokens, ans); if (typeof v === "number" && !isNaN(v)) txt = fmt(v); } catch (_) {}
    }
    lastOk = txt; outEl.textContent = txt; sizeOut(txt);
  }

  function onKey(e) {
    if (!box || box.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
    var a = document.activeElement;
    if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
    var k = e.key, map = { "*": "×", "/": "÷", "-": "−", "+": "+", "(": "(", ")": ")", "^": "^(", "%": "%", ".": ".", "Enter": "eq", "=": "eq", "Backspace": "bs", "Delete": "ac" };
    if (k === "Escape") { e.preventDefault(); return close(); }
    var t = /^[0-9]$/.test(k) ? k : map[k];
    if (!t) return;
    e.preventDefault(); press(t);
  }

  function padBody() {
    if (!box || box.hidden) return;
    document.documentElement.style.setProperty("--kqc-h", (box.offsetHeight + 16) + "px");
  }
  function open() {
    if (!box) return;
    box.hidden = false; fab.hidden = true;
    document.documentElement.classList.add("kqc-open"); padBody();
  }
  function close() {
    if (!box) return;
    box.hidden = true; toggleMenu(false);
    document.documentElement.classList.remove("kqc-open");
    sync();
    try { fab.focus({ preventScroll: true }); } catch (_) {}
  }

  /* ---------- いつボタンを出すか ---------- */
  // ・section.view で画面を切りかえるページ（過去問・対策・治療）… 解いている時（body.in-quiz）だけ。模試は出さない
  // ・1ページで解くドリル（医用工学・計測など）… いつでも
  // ・トップページ … 出さない
  function isTop() {
    var me = document.querySelector('script[src*="shared/update.js"]');
    if (!me) return false;
    var src = me.getAttribute("src") || "";
    return src.indexOf("../") !== 0;
  }
  function wanted() {
    if (window.KQCalc.isOff() || isTop()) return false;
    var b = document.body;
    if (document.querySelector("section.view")) {
      if (!b.classList.contains("in-quiz")) return false;
      try { if (window.KQPage && window.KQPage.view === "mock") return false; } catch (_) {}
      return true;
    }
    return true;
  }
  function sync() {
    if (!fab) return;
    var w = wanted();
    if (!w && !box.hidden) { box.hidden = true; toggleMenu(false); document.documentElement.classList.remove("kqc-open"); }
    // 案内キャラが左下にいる時は、ボタンを右下へ
    var g = document.querySelector(".kqg:not([hidden])");
    fab.classList.toggle("kqc-r", !!(g && g.classList.contains("kqg-l") && !g.classList.contains("kqg-t")));
    fab.hidden = !w || !box.hidden;
    document.documentElement.classList.toggle("kqc-fab-on", w);
  }

  function init() {
    if (inited || !document.body) return;
    inited = true;
    if (isTop()) return;          // トップページは設定（KQCalc.isOff/setOff）だけ
    build(); sync();
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    var g = 0, t = setInterval(function () { sync(); if (++g > 10) clearInterval(t); }, 500);
    window.KQCalc.onChange(sync);
    window.addEventListener("storage", function (e) { if (e.key === OFF_KEY) sync(); });
  }
  window.KQCalc._eval = function (str) { return evaluate(str, ans); };   // テスト用
  window.KQCalc._fmt = fmt;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
