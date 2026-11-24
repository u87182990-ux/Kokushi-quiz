// 案内キャラ：画面のすみにいて、あいさつ・正解/まちがいのリアクション・声かけをする
// 見た目のパーツは下の TYPES / COLORS / OUTFITS / ACCS に1行足すだけで選べるようになります
(() => {
  if (window.KQGuide) return;
  const BASE = (document.currentScript && document.currentScript.src || location.href).replace(/[^/]*$/, "");

  /* ---------- 見た目のパーツ ---------- */
  const TYPES = [
    { id: "neko", name: "ねこ" },
    { id: "usagi", name: "うさぎ" },
    { id: "kuma", name: "くま" },
    { id: "inu", name: "いぬ" },
    { id: "hiyoko", name: "ひよこ" },
    { id: "robo", name: "ロボ" },
    { id: "hito", name: "ひと" },
    { id: "nui", name: "ぬいぐるみ" },
    { id: "mofu", name: "もふもふ" },
    // 絵（画像）のキャラは、shared/chara/<名前>-normal.png（と -happy / -cheer / -think）を置いて、下のように1行足す
    // { id: "xxx", name: "なまえ", img: "xxx", moods: ["happy", "cheer", "think"] },
    // ここから下は内臓・細胞キャラ（服はなし。色は OCOLORS から。絵は ORGANS）
    { id: "o-heart", name: "しんぞう" }, { id: "o-brain", name: "のう" }, { id: "o-stomach", name: "い" },
    { id: "o-gut", name: "ちょう" }, { id: "o-lung", name: "はい" }, { id: "o-liver", name: "かんぞう" },
    { id: "o-rbc", name: "赤血球" }, { id: "o-wbc", name: "白血球" }, { id: "o-stem", name: "幹細胞" },
    { id: "o-neuron", name: "ニューロン" }
  ];
  const COLORS = [
    { id: "#ffc48a", name: "オレンジ" }, { id: "#ffb3c7", name: "ピンク" }, { id: "#ffe27a", name: "きいろ" },
    { id: "#a8e0a0", name: "みどり" }, { id: "#9fd8f5", name: "みずいろ" }, { id: "#c9b3ff", name: "むらさき" },
    { id: "#f7f4ee", name: "しろ" }, { id: "#c89b74", name: "ちゃいろ" }, { id: "#b8c0cc", name: "グレー" },
    { id: "#5b4a42", name: "こげちゃ" },
    { id: "#f1e6d6", name: "クリーム" }
  ];
  const OUTFITS = [
    { id: "none", name: "なし" }, { id: "hakui", name: "白衣" }, { id: "scrub", name: "スクラブ" },
    { id: "parka", name: "パーカー" }, { id: "sailor", name: "セーラー" }, { id: "tee", name: "放射線Tシャツ" }
  ];
  const ACCS = [
    { id: "none", name: "なし" }, { id: "megane", name: "メガネ" }, { id: "stetho", name: "聴診器" },
    { id: "ribbon", name: "リボン" }, { id: "crown", name: "王冠" }, { id: "phones", name: "ヘッドホン" },
    { id: "badge", name: "名札" }
  ];
  const GOALS = [5, 10, 20, 30, 50, 80, 100];
  const DEF = { type: "neko", color: "#ffc48a", ocolor: "orig", outfit: "hakui", acc: "none", name: "ナビ", goal: 10, pos: "br" };
  // キャラのいる場所。四すみか、指でつかんで動かした好きな場所（free：xy に画面の何割の位置かを入れる）
  const POS = [{ id: "bl", name: "左下" }, { id: "br", name: "右下" }, { id: "tl", name: "左上" }, { id: "tr", name: "右上" }, { id: "free", name: "動かした場所" }];

  /* ---------- 絵（SVG） ---------- */
  const L = "#3b2f2f"; // 線の色
  const sw = 'stroke="' + L + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  const shade = (hex, k) => {
    const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k)));
    return "#" + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(c => c.toString(16).padStart(2, "0")).join("");
  };
  function ears(t, c){
    const inner = "#ffc9d3";
    switch (t) {
      case "neko": return `<path d="M22 42 L27 12 L46 27 Z" fill="${c}" ${sw}/><path d="M78 42 L73 12 L54 27 Z" fill="${c}" ${sw}/>
        <path d="M27 34 L29 19 L39 27 Z" fill="${inner}"/><path d="M73 34 L71 19 L61 27 Z" fill="${inner}"/>`;
      case "usagi": return `<ellipse cx="37" cy="17" rx="8" ry="20" fill="${c}" ${sw} transform="rotate(-10 37 17)"/><ellipse cx="63" cy="17" rx="8" ry="20" fill="${c}" ${sw} transform="rotate(10 63 17)"/>
        <ellipse cx="37" cy="18" rx="3.6" ry="13" fill="${inner}" transform="rotate(-10 37 18)"/><ellipse cx="63" cy="18" rx="3.6" ry="13" fill="${inner}" transform="rotate(10 63 18)"/>`;
      case "kuma": return `<circle cx="26" cy="28" r="11" fill="${c}" ${sw}/><circle cx="74" cy="28" r="11" fill="${c}" ${sw}/>
        <circle cx="26" cy="28" r="5.5" fill="${shade(c, .85)}"/><circle cx="74" cy="28" r="5.5" fill="${shade(c, .85)}"/>`;
      case "hiyoko": return `<path d="M50 21 C46 10 52 6 54 12 C57 6 62 12 56 20" fill="${c}" ${sw}/>`;
      case "robo": return `<line x1="50" y1="21" x2="50" y2="9" ${sw}/><circle cx="50" cy="8" r="4.5" fill="#ff6b6b" ${sw}/>
        <rect x="13" y="42" width="8" height="16" rx="3" fill="${shade(c, .85)}" ${sw}/><rect x="79" y="42" width="8" height="16" rx="3" fill="${shade(c, .85)}" ${sw}/>`;
      default: return "";
    }
  }
  function headShape(t, c){
    if (t === "robo") return `<rect x="20" y="21" width="60" height="56" rx="16" fill="${c}" ${sw}/><rect x="28" y="38" width="44" height="28" rx="10" fill="#e9fbff" opacity=".55"/>`;
    if (t === "hito") return `<circle cx="50" cy="50" r="29" fill="#ffe0c7" ${sw}/>
      <path d="M21 50 C19 26 36 17 50 17 C66 17 82 27 79 50 C72 40 62 33 52 31 C46 38 33 44 21 50 Z" fill="${c}" ${sw}/>`;
    return `<circle cx="50" cy="50" r="30" fill="${c}" ${sw}/>`;
  }
  function floppy(t, c){ // いぬの耳は顔の上にたれる
    return t === "inu" ? `<path d="M24 30 C12 34 11 56 19 62 C27 60 30 44 31 34 Z" fill="${shade(c, .78)}" ${sw}/><path d="M76 30 C88 34 89 56 81 62 C73 60 70 44 69 34 Z" fill="${shade(c, .78)}" ${sw}/>` : "";
  }
  function face(t, mood, c){
    const ink = "#2b2230";
    let eyes, mouth, extra = "";
    if (mood === "happy") {
      eyes = `<path d="M34 53 Q39 46 44 53" fill="none" ${sw} stroke-width="2.8"/><path d="M56 53 Q61 46 66 53" fill="none" ${sw} stroke-width="2.8"/>`;
      mouth = `<path d="M43 60 Q50 71 57 60 Z" fill="#e5576b" ${sw} stroke-width="2"/>`;
    } else if (mood === "cheer") {
      eyes = `<ellipse cx="39" cy="53" rx="3.2" ry="4" fill="${ink}"/><ellipse cx="61" cy="53" rx="3.2" ry="4" fill="${ink}"/>
        <circle cx="40.2" cy="51.6" r="1.2" fill="#fff"/><circle cx="62.2" cy="51.6" r="1.2" fill="#fff"/>
        <path d="M33 44 L44 46" ${sw}/><path d="M67 44 L56 46" ${sw}/>`;
      mouth = `<path d="M45 62 Q50 65 55 62" fill="none" ${sw}/>`;
      extra = `<path d="M74 34 C71 39 71 42 74 43 C77 42 77 39 74 34 Z" fill="#9fd8f5" stroke="#5aa2d0" stroke-width="1.2"/>`;
    } else if (mood === "think") {
      eyes = `<ellipse cx="41" cy="51" rx="3" ry="3.8" fill="${ink}"/><ellipse cx="63" cy="51" rx="3" ry="3.8" fill="${ink}"/>`;
      mouth = `<path d="M46 63 L54 62" fill="none" ${sw}/>`;
    } else {
      eyes = `<g class="kqg-eyes"><ellipse cx="39" cy="53" rx="3.4" ry="4.4" fill="${ink}"/><ellipse cx="61" cy="53" rx="3.4" ry="4.4" fill="${ink}"/>
        <circle cx="40.4" cy="51.4" r="1.4" fill="#fff"/><circle cx="62.4" cy="51.4" r="1.4" fill="#fff"/></g>`;
      mouth = `<path d="M45 61 Q50 66 55 61" fill="none" ${sw}/>`;
    }
    if (t === "robo") {
      if (mood !== "happy") eyes = `<g class="kqg-eyes"><rect x="34" y="47" width="10" height="10" rx="3" fill="#2fd2ff" ${sw} stroke-width="1.6"/><rect x="56" y="47" width="10" height="10" rx="3" fill="#2fd2ff" ${sw} stroke-width="1.6"/></g>`;
      if (mood === "cheer") eyes += `<path d="M33 43 L44 45" ${sw}/><path d="M67 43 L56 45" ${sw}/>`;
    }
    let muzzle = "";
    if (t === "kuma" || t === "inu") muzzle = `<ellipse cx="50" cy="62" rx="11" ry="8" fill="${shade(c, 1.12)}" ${sw} stroke-width="1.6"/><ellipse cx="50" cy="58" rx="3.6" ry="2.6" fill="${ink}"/>`;
    if (t === "neko") muzzle = `<path d="M47.5 57.5 L52.5 57.5 L50 60 Z" fill="#e5576b"/><path d="M28 58 L18 56 M28 61 L18 62 M72 58 L82 56 M72 61 L82 62" ${sw} stroke-width="1.4"/>`;
    if (t === "usagi") muzzle = `<ellipse cx="50" cy="58.5" rx="2.6" ry="2" fill="#e5576b"/>`;
    if (t === "hiyoko") mouth = mood === "happy" ? `<path d="M44 59 L50 56 L56 59 L50 66 Z" fill="#ff9f43" ${sw} stroke-width="1.8"/>` : `<path d="M44 60 L50 56 L56 60 L50 63 Z" fill="#ff9f43" ${sw} stroke-width="1.8"/>`;
    const cheeks = t === "robo" ? `<rect x="26" y="60" width="8" height="4" rx="2" fill="#ff8fa3" opacity=".8"/><rect x="66" y="60" width="8" height="4" rx="2" fill="#ff8fa3" opacity=".8"/>`
      : `<ellipse cx="30" cy="62" rx="5" ry="3.2" fill="#ff8fa3" opacity=".6"/><ellipse cx="70" cy="62" rx="5" ry="3.2" fill="#ff8fa3" opacity=".6"/>`;
    return cheeks + muzzle + eyes + mouth + extra;
  }
  const TORSO = "M22 112 C22 90 34 80 50 80 C66 80 78 90 78 112 Z";
  function outfit(o, c){
    switch (o) {
      case "hakui": return `<path d="${TORSO}" fill="#ffffff" ${sw}/><path d="M43 80 L50 98 L57 80 Z" fill="#9fd8f5" ${sw} stroke-width="1.6"/>
        <path d="M43 80 L39 95 L50 98" fill="none" ${sw} stroke-width="1.6"/><path d="M57 80 L61 95 L50 98" fill="none" ${sw} stroke-width="1.6"/>
        <rect x="58" y="100" width="11" height="8" rx="1.5" fill="#fff" ${sw} stroke-width="1.4"/><line x1="61" y1="97" x2="61" y2="103" stroke="#1d6fd8" stroke-width="2.2" stroke-linecap="round"/>`;
      case "scrub": return `<path d="${TORSO}" fill="#3fb8a9" ${sw}/><path d="M42 81 L50 93 L58 81 Z" fill="${c}" ${sw} stroke-width="1.6"/><rect x="33" y="99" width="10" height="7" rx="1.5" fill="#35a093" ${sw} stroke-width="1.3"/>`;
      case "parka": return `<path d="M30 86 C34 76 66 76 70 86 C62 82 38 82 30 86 Z" fill="#e8655a" ${sw}/><path d="${TORSO}" fill="#ff7a6b" ${sw}/>
        <path d="M45 84 L44 96 M55 84 L56 96" ${sw} stroke-width="1.6"/><circle cx="44" cy="97" r="1.8" fill="#fff" ${sw} stroke-width="1"/><circle cx="56" cy="97" r="1.8" fill="#fff" ${sw} stroke-width="1"/>
        <path d="M38 104 L62 104 L60 112 L40 112 Z" fill="#e8655a" ${sw} stroke-width="1.4"/>`;
      case "sailor": return `<path d="${TORSO}" fill="#ffffff" ${sw}/><path d="M34 84 L50 100 L66 84 L62 82 L50 94 L38 82 Z" fill="#2c4a7a" ${sw} stroke-width="1.6"/>
        <path d="M50 98 L42 104 L44 108 L50 102 L56 108 L58 104 Z" fill="#e5576b" ${sw} stroke-width="1.4"/>`;
      case "tee": return `<path d="${TORSO}" fill="#ffe27a" ${sw}/><path d="M43 81 Q50 87 57 81" fill="none" ${sw} stroke-width="1.6"/>
        <g transform="translate(50 99)"><circle r="2.2" fill="${L}"/>
        <path d="M0 -3.6 L-4.2 -9 A10 10 0 0 1 4.2 -9 Z M3.1 1.8 L9.9 0.8 A10 10 0 0 1 5.7 8.2 Z M-3.1 1.8 L-5.7 8.2 A10 10 0 0 1 -9.9 0.8 Z" fill="${L}"/></g>`;
      default: return `<path d="${TORSO}" fill="${c}" ${sw}/>`;
    }
  }
  function acc(a, t){
    switch (a) {
      case "megane": if (t === "mofu" || t === "nui") return `<circle cx="42" cy="53" r="6.5" fill="#fff" fill-opacity=".15" stroke="${L}" stroke-width="1.8"/><circle cx="58" cy="53" r="6.5" fill="#fff" fill-opacity=".15" stroke="${L}" stroke-width="1.8"/><path d="M48.5 52.5 Q50 51.5 51.5 52.5" fill="none" stroke="${L}" stroke-width="1.8"/>`;
        return `<circle cx="39" cy="53" r="8" fill="#fff" fill-opacity=".18" stroke="${L}" stroke-width="2.2"/><circle cx="61" cy="53" r="8" fill="#fff" fill-opacity=".18" stroke="${L}" stroke-width="2.2"/><path d="M47 52 Q50 50 53 52" fill="none" stroke="${L}" stroke-width="2.2"/>`;
      case "stetho": return `<path d="M38 82 C34 92 40 102 50 102 C60 102 66 92 62 82" fill="none" stroke="#56606e" stroke-width="2.6" stroke-linecap="round"/><path d="M62 92 C70 96 70 104 66 106" fill="none" stroke="#56606e" stroke-width="2.4" stroke-linecap="round"/><circle cx="65" cy="107" r="4" fill="#c9d3de" stroke="#56606e" stroke-width="2"/>`;
      case "ribbon": { const y = t === "usagi" ? 30 : t === "mofu" ? 20 : t === "nui" ? 30 : 24, x = t === "robo" ? 70 : t === "nui" ? 70 : 72;
        return `<g transform="translate(${x} ${y}) rotate(18)"><path d="M0 0 L-12 -7 L-12 7 Z M0 0 L12 -7 L12 7 Z" fill="#ff6b9a" ${sw} stroke-width="1.8"/><circle r="3.4" fill="#ff4f86" ${sw} stroke-width="1.6"/></g>`; }
      case "crown": { const y = t === "robo" ? 6 : t === "usagi" ? 8 : t === "mofu" ? 2 : t === "nui" ? 6 : 10;
        return `<path d="M37 ${y + 14} L35 ${y} L43 ${y + 7} L50 ${y - 3} L57 ${y + 7} L65 ${y} L63 ${y + 14} Z" fill="#ffd23f" ${sw} stroke-width="1.8"/><circle cx="50" cy="${y + 9}" r="2" fill="#e5576b"/>`; }
      case "phones": return `<path d="M20 52 C18 22 82 22 80 52" fill="none" stroke="#4a4f5c" stroke-width="4.5" stroke-linecap="round"/><rect x="13" y="44" width="11" height="18" rx="5" fill="#6c63ff" ${sw}/><rect x="76" y="44" width="11" height="18" rx="5" fill="#6c63ff" ${sw}/>`;
      case "badge": if (t === "mofu") return `<rect x="56" y="82" width="16" height="10" rx="2" fill="#fff" ${sw} stroke-width="1.4"/><line x1="59" y1="86" x2="69" y2="86" stroke="#1d6fd8" stroke-width="1.6"/><line x1="59" y1="89" x2="66" y2="89" stroke="#8fa6c2" stroke-width="1.4"/>`;
        return `<rect x="31" y="94" width="16" height="10" rx="2" fill="#fff" ${sw} stroke-width="1.4"/><line x1="34" y1="98" x2="44" y2="98" stroke="#1d6fd8" stroke-width="1.6"/><line x1="34" y1="101" x2="41" y2="101" stroke="#8fa6c2" stroke-width="1.4"/>`;
      default: return "";
    }
  }
  let uid = 0;
  function softDefs(c, id){ const skin = "#f7e3d3"; return `<defs>
      <filter id="${id}f" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter>
      <filter id="${id}t" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.8 .9" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 -.18"/><feComposite in2="SourceAlpha" operator="in"/></filter>
      <filter id="${id}b"><feGaussianBlur stdDeviation="1.6"/></filter>
      <radialGradient id="${id}g" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${shade(c, 1.16)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, .74)}"/></radialGradient>
      <radialGradient id="${id}s" cx=".45" cy=".35" r=".75"><stop offset="0" stop-color="#fff6ee"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="#e8c6b0"/></radialGradient>
    </defs>`; }
  function softFace(mood){
    const ink = "#2b2230";
    let eyes, mouth;
    if (mood === "happy") {
      eyes = `<path d="M38 53 Q42 48.5 46 53 M54 53 Q58 48.5 62 53" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`;
      mouth = `<path d="M46 59 Q50 65 54 59 Z" fill="#d9536a"/>`;
    } else if (mood === "cheer") {
      eyes = `<circle cx="42" cy="53" r="2.8" fill="${ink}"/><circle cx="58" cy="53" r="2.8" fill="${ink}"/><circle cx="43" cy="52" r=".9" fill="#fff"/><circle cx="59" cy="52" r=".9" fill="#fff"/>
        <path d="M37 46.5 L45 48 M63 46.5 L55 48" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`;
      mouth = `<path d="M47 60 Q50 62 53 60" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`;
    } else {
      eyes = `<g class="kqg-eyes"><circle cx="42" cy="53" r="3" fill="${ink}"/><circle cx="58" cy="52" r="3" fill="${ink}"/><circle cx="43.1" cy="51.9" r="1" fill="#fff"/><circle cx="59.1" cy="50.9" r="1" fill="#fff"/></g>`;
      mouth = mood === "think" ? `<path d="M47 60 L53 59.5" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>` : `<path d="M46.5 59 Q50 62.5 53.5 59" fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round"/>`;
    }
    return eyes + mouth;
  }
  function drawMofu(av, mood){ // ふわふわの毛玉キャラ（毛のふち・やわらかい影つき）
    const c = av.color, id = "kqm" + (++uid);
    const defs = softDefs(c, id);
    const blob = "M50 7 C79 7 92 33 91 62 C90 93 75 111 50 111 C25 111 10 93 9 62 C8 33 21 7 50 7 Z";
    const eyes = softFace(mood), mouth = "";
    const top = (av.acc === "crown" || av.acc === "ribbon") ? acc(av.acc, "mofu") : "";
    const other = (av.acc !== "crown" && av.acc !== "ribbon") ? acc(av.acc, "mofu") : "";
    return `<svg viewBox="0 -2 100 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}
      <ellipse cx="50" cy="110" rx="30" ry="4" fill="#000" opacity=".12" filter="url(#${id}b)"/>
      <g filter="url(#${id}f)"><path d="${blob}" fill="url(#${id}g)"/><path d="${blob}" fill="#fff" filter="url(#${id}t)"/></g>
      <ellipse cx="50" cy="55" rx="21" ry="18" fill="#000" opacity=".16" filter="url(#${id}b)"/>
      <ellipse cx="50" cy="54" rx="20" ry="17" fill="url(#${id}s)"/>
      <ellipse cx="50" cy="54" rx="21.5" ry="18.5" fill="none" stroke="${shade(c, 1.05)}" stroke-width="3.5" filter="url(#${id}f)"/>
      <ellipse cx="36.5" cy="58.5" rx="4.6" ry="3.2" fill="#ff9aa8" opacity=".6" filter="url(#${id}b)"/><ellipse cx="63.5" cy="58.5" rx="4.6" ry="3.2" fill="#ff9aa8" opacity=".6" filter="url(#${id}b)"/>
      ${eyes}${mouth}${other}${top}</svg>`;
  }
  function drawNui(av, mood){ // たて長のぬいぐるみ体型（3頭身・小さな手足・おなかの縫い目）
    const c = av.color, id = "kqn" + (++uid), defs = softDefs(c, id), lite = shade(c, 1.14), dark = shade(c, .86);
    const body = "M50 6 C69 6 79 21 79 40 C79 50 77 56 78 64 C81 80 82 98 67 105 C59 109 41 109 33 105 C18 98 19 80 22 64 C23 56 21 50 21 40 C21 21 31 6 50 6 Z";
    const fur = d => `<g filter="url(#${id}f)"><path d="${d}" fill="url(#${id}g)"/><path d="${d}" fill="#fff" filter="url(#${id}t)"/></g>`;
    // 手のポーズ：ふつう＝下、よろこぶ＝ばんざい、はげます＝片手でガッツポーズ
    const armL = mood === "happy" ? "rotate(125 27 64)" : mood === "cheer" ? "rotate(0 27 64)" : "rotate(18 27 64)";
    const armR = mood === "happy" ? "rotate(-125 73 64)" : mood === "cheer" ? "rotate(-150 73 64)" : "rotate(-18 73 64)";
    const arm = (x, tr) => `<g transform="${tr}"><g filter="url(#${id}f)"><ellipse cx="${x}" cy="76" rx="6.5" ry="11" fill="${dark}"/><ellipse cx="${x}" cy="76" rx="6.5" ry="11" fill="#fff" filter="url(#${id}t)"/></g></g>`;
    const top = (av.acc === "crown" || av.acc === "ribbon") ? acc(av.acc, "nui") : "";
    const other = (av.acc !== "crown" && av.acc !== "ribbon") ? acc(av.acc, "nui") : "";
    return `<svg viewBox="0 -10 100 124" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs}
      <ellipse cx="50" cy="110" rx="26" ry="3.6" fill="#000" opacity=".13" filter="url(#${id}b)"/>
      ${fur("M30 13 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0")}${fur("M70 13 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0")}
      <circle cx="30" cy="13" r="3.4" fill="${dark}" opacity=".7"/><circle cx="70" cy="13" r="3.4" fill="${dark}" opacity=".7"/>
      ${fur("M30 104 m-10 0 a10 6 0 1 0 20 0 a10 6 0 1 0 -20 0")}${fur("M70 104 m-10 0 a10 6 0 1 0 20 0 a10 6 0 1 0 -20 0")}
      ${fur(body)}
      <ellipse cx="50" cy="84" rx="15" ry="13" fill="${lite}" opacity=".85" filter="url(#${id}b)"/>
      <ellipse cx="50" cy="84" rx="13" ry="11" fill="none" stroke="${dark}" stroke-width="1" stroke-dasharray="2.2 2" opacity=".8"/>
      ${arm(27, armL)}${arm(73, armR)}
      <ellipse cx="50" cy="42" rx="17" ry="12" fill="${lite}" opacity=".7" filter="url(#${id}b)"/>
      <g transform="translate(0 -14)">
        <ellipse cx="36.5" cy="58.5" rx="4.6" ry="3.2" fill="#ff9aa8" opacity=".65" filter="url(#${id}b)"/><ellipse cx="63.5" cy="58.5" rx="4.6" ry="3.2" fill="#ff9aa8" opacity=".65" filter="url(#${id}b)"/>
        ${softFace(mood)}
      </g>
      <g transform="translate(0 -14)">${other}${top}</g></svg>`;
  }
  function drawImg(t, mood){
    const m = (t.moods || []).includes(mood) ? mood : "normal";
    return `<svg viewBox="0 -2 100 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><image href="${BASE}chara/${t.img}-${m}.png" x="0" y="-2" width="100" height="116" preserveAspectRatio="xMidYMax meet"/></svg>`;
  }
  function draw(av, mood){
    if (isOrgan(av.type)) return drawOrgan(av, mood);
    const ti = TYPES.find(x => x.id === av.type);
    if (ti && ti.img) return drawImg(ti, mood);
    if (av.type === "mofu") return drawMofu(av, mood);
    if (av.type === "nui") return drawNui(av, mood);
    const t = av.type, c = av.color;
    const wings = t === "hiyoko" ? `<ellipse cx="23" cy="96" rx="6" ry="10" fill="${c}" ${sw} transform="rotate(25 23 96)"/><ellipse cx="77" cy="96" rx="6" ry="10" fill="${c}" ${sw} transform="rotate(-25 77 96)"/>` : "";
    const top = (av.acc === "crown" || av.acc === "ribbon") ? acc(av.acc, t) : "";
    const front = (av.acc !== "crown" && av.acc !== "ribbon") ? acc(av.acc, t) : "";
    // 首まわりの小物（聴診器・名札）は服の上、メガネ・ヘッドホンは顔の上
    const neck = (av.acc === "stetho" || av.acc === "badge") ? front : "";
    const headAcc = neck ? "" : front;
    return `<svg viewBox="0 -2 100 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${wings}${outfit(av.outfit, c)}${neck}${ears(t, c)}${headShape(t, c)}${floppy(t, c)}${face(t, mood, c)}${headAcc}${top}</svg>`;
  }


  /* ---------- 内臓・細胞キャラ（ぬいぐるみ風。ホーム画面アイコン icons/e〜n と同じ子たち） ---------- */
  // 512×512 の座標でかいて、キャラの枠（100×116）に縮めて置く。f = 顔の位置 [x, y, 大きさ, ふだんの口]
  const OINK = "#4a3540";
  const oc = (list, fill) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");
  const ot = (d, color, w) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const ORGANS = {
    "o-heart": { main: "#ff9fb3", f: [[256, 290, 1.15, "tri"]],
      body: ot("M206 205 L206 128", "#8cc4f0", 44) + ot("M300 200 C300 130 352 118 368 160", "#ff8ea4", 44) +
        `<ellipse cx="118" cy="300" rx="30" ry="22" transform="rotate(-25 118 300)" fill="#ff9fb3"/><ellipse cx="394" cy="300" rx="30" ry="22" transform="rotate(25 394 300)" fill="#ff9fb3"/>` +
        `<path d="M256 430 C160 380 112 320 116 250 C120 190 170 160 214 180 C236 190 250 204 256 214 C264 202 280 186 302 180 C352 166 398 200 396 258 C394 324 348 382 256 430 Z" fill="#ff9fb3"/>` },
    "o-brain": { main: "#ffc6d6", f: [[256, 270, 1.15, "smile"]],
      body: ot("M262 350 L272 418", "#f2a6bd", 48) +
        oc([[256, 250, 140], [150, 255, 88], [362, 255, 88], [190, 175, 78], [322, 175, 78], [256, 160, 82], [180, 320, 72], [332, 320, 72], [256, 335, 80]], "#ffc6d6"),
      deco: `<g fill="none" stroke="#f08aa8" stroke-width="9" stroke-linecap="round"><path d="M256 118 C244 150 268 172 256 200"/><path d="M168 178 C190 160 214 196 236 180"/><path d="M344 178 C322 160 298 196 276 180"/><path d="M118 232 C140 214 160 246 182 228"/><path d="M394 232 C372 214 352 246 330 228"/><path d="M150 330 C170 350 192 330 200 350"/><path d="M362 330 C342 350 320 330 312 350"/></g>` },
    "o-stomach": { main: "#ffcfa6", f: [[298, 318, 1.1, "smile"]],
      body: ot("M196 78 L196 170", "#ffc59a", 46) + ot("M396 332 C432 356 436 404 404 424", "#ffc59a", 38) +
        `<path d="M170 150 C166 230 150 300 190 365 C232 432 352 440 398 368 C436 306 410 222 348 220 C298 218 282 255 260 226 C240 200 246 160 222 150 Z" fill="#ffcfa6"/>` },
    "o-gut": { main: "#ffb7a3", f: [[256, 160, 0.95, "cat"]],
      body: oc([[150, 380, 52], [130, 310, 56], [134, 236, 56], [168, 172, 56], [232, 140, 56], [300, 140, 56], [356, 172, 56], [382, 236, 56], [384, 310, 56], [364, 380, 52]], "#ffb7a3") +
        `<rect x="186" y="210" width="140" height="140" rx="56" fill="#ffd3c4"/>`,
      deco: `<path d="M206 238 C230 222 246 250 270 236 C292 224 306 246 306 260 M206 300 C226 290 244 316 266 302 C290 290 302 312 306 324" fill="none" stroke="#f6a993" stroke-width="9" stroke-linecap="round"/>` },
    "o-lung": { main: "#b8dcf7", f: [[172, 312, 0.85, "smile"], [340, 312, 0.85, "cat"]],
      body: ot("M256 86 L256 196 M256 196 L222 224 M256 196 L290 224", "#9edf8e", 30) +
        `<path d="M232 210 C232 170 208 150 180 152 C126 156 104 240 106 316 C108 380 140 418 186 416 C232 414 240 380 236 330 Z" fill="#b8dcf7"/>` +
        `<path d="M280 210 C280 170 304 150 332 152 C386 156 408 240 406 316 C404 380 372 418 326 416 C280 414 272 380 276 330 Z" fill="#b8dcf7"/>` },
    "o-liver": { main: "#ffc96b", f: [[196, 262, 1.1, "smile"]],
      body: `<path d="M104 236 C104 186 160 170 230 172 C320 174 400 168 414 200 C426 230 392 268 340 300 C284 336 220 372 170 368 C124 364 104 300 104 236 Z" fill="#ffc96b"/>`,
      deco: `<path d="M292 182 C300 226 296 280 280 326" fill="none" stroke="#f0a64a" stroke-width="9" stroke-linecap="round"/>` },
    "o-rbc": { main: "#ff7f8f", f: [[256, 262, 1.05, "smile", "#ffc0ca"]],
      body: `<ellipse cx="256" cy="272" rx="168" ry="158" fill="#ff7f8f"/>`,
      deco: `<ellipse cx="256" cy="276" rx="96" ry="80" fill="#f26b7a" opacity=".6"/>` },
    "o-wbc": { main: "#fffaf0", f: [[256, 262, 1.15, "smile", "#ffb6c8"]],
      body: oc([[256, 262, 138], [256, 124, 50], [352, 154, 52], [394, 254, 50], [356, 358, 52], [256, 398, 50], [156, 358, 52], [118, 254, 50], [160, 154, 52], [306, 120, 40], [206, 120, 40], [400, 310, 40], [112, 310, 40]], "#fffaf0") },
    "o-stem": { main: "#cdf5d9", f: [[250, 268, 1.15, "open"]],
      body: ot("M256 140 C256 112 252 98 256 80", "#6fcf86", 16) +
        `<path d="M256 98 C222 62 182 72 174 94 C202 112 236 114 256 98 Z M258 94 C290 54 334 60 342 84 C314 106 280 108 258 94 Z" fill="#8fe0a2"/>` +
        `<circle cx="256" cy="285" r="150" fill="#cdf5d9"/>`,
      deco: `<circle cx="345" cy="352" r="34" fill="#b49af0"/><circle cx="170" cy="352" r="12" fill="#a8e8bb"/><circle cx="198" cy="386" r="8" fill="#a8e8bb"/>` },
    "o-neuron": { main: "#ffe27a", f: [[256, 264, 1.1, "smile", "#ffab8a"]],
      body: ot("M210 220 L136 166 M136 166 L104 180 M136 166 L126 128", "#ffe27a", 26) + ot("M302 220 L376 166 M376 166 L408 180 M376 166 L386 128", "#ffe27a", 26) +
        ot("M256 190 L256 116 M256 116 L230 92 M256 116 L282 92", "#ffe27a", 26) + ot("M186 316 L124 346", "#ffe27a", 26) + ot("M326 322 C356 362 360 400 398 428", "#ffe27a", 20) +
        `<path d="M256 180 C326 180 350 224 348 270 C346 330 302 352 256 352 C206 352 164 328 164 268 C164 218 194 180 256 180 Z" fill="#ffe27a"/>`,
      deco: `<g fill="#9fdcff"><rect x="334" y="340" width="34" height="24" rx="12" transform="rotate(58 351 352)"/><rect x="358" y="392" width="34" height="24" rx="12" transform="rotate(35 375 404)"/></g>` }
  };
  const isOrgan = t => !!ORGANS[t];
  // 内臓・細胞キャラの色（「もとの色」＋ふつうの色）。体の色だけが変わる
  const OCOLORS = [{ id: "orig", name: "もとの色", bg: "conic-gradient(#ff9fb3,#ffe27a,#b8dcf7,#cdf5d9,#ff9fb3)" }].concat(COLORS);
  const OK = 108 / 512, OX = -4, OY = 0; // 512 の絵 → キャラ枠への縮め方
  function organFace(x, y, s, mouth, blush, mood){
    s *= 1.32;
    const ex = 30 * s, st = `fill="none" stroke="${OINK}" stroke-width="${5.5 * s}" stroke-linecap="round" stroke-linejoin="round"`;
    const dot = cx => `<ellipse cx="${cx}" cy="${y}" rx="${9 * s}" ry="${11 * s}" fill="${OINK}"/>`;
    const b = cx => `<ellipse cx="${cx}" cy="${y + 16 * s}" rx="${15 * s}" ry="${8 * s}" fill="${blush || "#ff8fa3"}" opacity=".5"/>`;
    let eyes = `<g class="kqg-eyes" style="transform-box:fill-box;transform-origin:center">${dot(x - ex) + dot(x + ex)}</g>`, m, extra = "";
    const M = {
      smile: `<path d="M${x - 10 * s} ${y + 6 * s} Q${x} ${y + 17 * s} ${x + 10 * s} ${y + 6 * s}" ${st}/>`,
      cat: `<path d="M${x - 14 * s} ${y + 6 * s} Q${x - 7 * s} ${y + 15 * s} ${x} ${y + 7 * s} Q${x + 7 * s} ${y + 15 * s} ${x + 14 * s} ${y + 6 * s}" ${st}/>`,
      open: `<path d="M${x - 9 * s} ${y + 5 * s} Q${x} ${y + 22 * s} ${x + 9 * s} ${y + 5 * s} Z" fill="${OINK}" stroke="${OINK}" stroke-width="${3 * s}" stroke-linejoin="round"/>`,
      tri: `<path d="M${x} ${y + 3 * s} L${x - 8 * s} ${y + 15 * s} L${x + 8 * s} ${y + 15 * s} Z" fill="none" stroke="${OINK}" stroke-width="${4.5 * s}" stroke-linejoin="round"/>`
    };
    if (mood === "happy") {
      const arc = cx => `<path d="M${cx - 11 * s} ${y + 4 * s} Q${cx} ${y - 12 * s} ${cx + 11 * s} ${y + 4 * s}" ${st}/>`;
      eyes = arc(x - ex) + arc(x + ex);
      m = `<path d="M${x - 12 * s} ${y + 6 * s} Q${x} ${y + 26 * s} ${x + 12 * s} ${y + 6 * s} Z" fill="#e5576b" stroke="${OINK}" stroke-width="${4 * s}" stroke-linejoin="round"/>`;
    } else if (mood === "cheer") {
      m = `<path d="M${x - 8 * s} ${y + 11 * s} Q${x} ${y + 14 * s} ${x + 8 * s} ${y + 11 * s}" ${st}/>`;
      extra = `<path d="M${x - ex - 14 * s} ${y - 22 * s} L${x - ex + 10 * s} ${y - 17 * s} M${x + ex + 14 * s} ${y - 22 * s} L${x + ex - 10 * s} ${y - 17 * s}" ${st}/>` +
        `<path d="M${x + ex + 34 * s} ${y - 34 * s} C${x + ex + 26 * s} ${y - 20 * s} ${x + ex + 26 * s} ${y - 12 * s} ${x + ex + 34 * s} ${y - 10 * s} C${x + ex + 42 * s} ${y - 12 * s} ${x + ex + 42 * s} ${y - 20 * s} ${x + ex + 34 * s} ${y - 34 * s} Z" fill="#9fd8f5"/>`;
    } else if (mood === "think") {
      m = `<path d="M${x - 8 * s} ${y + 12 * s} L${x + 8 * s} ${y + 10 * s}" ${st}/>`;
    } else m = M[mouth] || M.smile;
    return b(x - 58 * s) + b(x + 58 * s) + eyes + m + extra;
  }
  let organN = 0;
  function drawOrgan(av, mood){
    const o = ORGANS[av.type], id = "kqgp" + (++organN);
    const body = av.ocolor && av.ocolor !== "orig" ? o.body.split(o.main).join(av.ocolor) : o.body;
    const faces = o.f.map(([x, y, s, mouth, blush]) => organFace(x, y, s, mouth, blush, mood)).join("");
    // 小物は、いちばん目の顔の位置に合わせて動かす（服はなし）
    const [fx, fy] = o.f[0], dx = OX + fx * OK - 50, dy = OY + fy * OK - 53;
    const a = av.acc !== "none" ? `<g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})">${acc(av.acc, "o")}</g>` : "";
    return `<svg viewBox="0 -2 100 116" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="b"/>
        <feSpecularLighting in="b" surfaceScale="7" specularConstant=".55" specularExponent="16" lighting-color="#fff" result="s"><fePointLight x="170" y="90" z="260"/></feSpecularLighting>
        <feComposite in="s" in2="SourceAlpha" operator="in" result="hi"/>
        <feOffset in="b" dy="-12" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="edge"/>
        <feFlood flood-color="#7a3a50" flood-opacity=".16"/><feComposite in2="edge" operator="in" result="sh"/>
        <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="hi"/></feMerge></filter></defs>
      <ellipse cx="50" cy="${OY + 452 * OK}" rx="30" ry="4.5" fill="#000" opacity=".12"/>
      <g transform="translate(${OX} ${OY}) scale(${OK})"><g filter="url(#${id})">${body}</g>${o.deco || ""}${faces}</g>${a}</svg>`;
  }

  /* ---------- 設定と記録 ---------- */
  const S = () => (window.KQ && KQ.session()) || null;
  const nickSfx = () => { const s = S(); return s ? "@" + s.nick.toLowerCase() : ""; };
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const pick = xs => xs[Math.floor(Math.random() * xs.length)];
  const valid = (list, v, d) => list.some(x => x.id === v) ? v : d;
  function getAv(){
    let a = window.KQ ? KQ.avatar.get() : null;
    if (!a && S()) { // ログイン前に作ったキャラがあれば、そのまま引きつぐ
      try { const anon = JSON.parse(localStorage.getItem("kq-avatar-v1") || "null"); if (anon) a = KQ.avatar.set(anon); } catch {}
    }
    const v = Object.assign({}, DEF, a || {});
    v.type = valid(TYPES, v.type, DEF.type); v.color = valid(COLORS, v.color, DEF.color);
    v.ocolor = valid(OCOLORS, v.ocolor, DEF.ocolor);
    v.outfit = valid(OUTFITS, v.outfit, DEF.outfit); v.acc = valid(ACCS, v.acc, DEF.acc);
    v.goal = GOALS.includes(+v.goal) ? +v.goal : DEF.goal;
    v.pos = valid(POS, v.pos, DEF.pos);
    const okXY = Array.isArray(v.xy) && v.xy.length === 2 && v.xy.every(n => typeof n === "number" && n >= 0 && n <= 1);
    v.xy = okXY ? v.xy : null;
    if (v.pos === "free" && !v.xy) v.pos = DEF.pos;
    v.name = String(v.name || DEF.name).slice(0, 10);
    v.off = !(a && a.on === true); // 最初はオフ。トップページの「オンにする」で出てくる
    v.isNew = !a;
    return v;
  }
  const dayKey = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); };
  const dayStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const sumKey = () => "kq-guide-v1" + nickSfx();
  function sum(){ const s = lsGet(sumKey(), {}); if (s.day !== dayKey()) { s.day = dayKey(); s.today = {}; } s.today = s.today || {}; s.weak = s.weak || {}; return s; }
  const countToday = r => { const t0 = dayStart(); let n = 0; for (const v of Object.values(r || {})) if (v && (v.t || 0) >= t0) n++; return n; };
  const P = () => window.KQPage || null; // 問題ページの記録（トップページでは null）
  const pageApp = () => (P() ? P().app : null);
  function refreshSum(){
    const s = sum(), app = pageApp();
    if (app) {
      const pg = P(), Q = pg.Q || [];
      s.today[app] = countToday(pg.rec);
      if (Q.length) {
        const by = {};
        for (const q of Q) if (pg.isWeak(q.id)) { const f = q.topic || q.field; by[f] = (by[f] || 0) + 1; }
        const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0];
        s.weak[app] = top ? { f: top[0], n: top[1], all: Object.values(by).reduce((a, b) => a + b, 0) } : { f: null, n: 0, all: 0 };
      }
    } else if (!app && !S()) {
      s.today.kakomon = countToday(lsGet("kokushi-rec-v1", {}));
      s.today.prep = countToday(lsGet("kokushi-prep-rec-v1", {}));
    }
    lsSet(sumKey(), s);
    return s;
  }
  const todayN = s => (s.today.kakomon || 0) + (s.today.prep || 0);

  /* ---------- 画面 ---------- */
  const CSS = `
  .kqg{--g-bg:#ffffff;--g-ink:#1d2433;--g-sub:#5d6a7e;--g-line:#d9e0e8;--g-acc:#1d6fd8;--g-acc-ink:#fff;--g-soft:#eef3f9;
    position:fixed;right:max(12px,env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));z-index:9000;
    font-family:"BIZ UDPGothic","Hiragino Sans","Noto Sans JP",sans-serif;-webkit-tap-highlight-color:transparent}
  .kqg-sheet{--g-bg:#ffffff;--g-ink:#1d2433;--g-sub:#5d6a7e;--g-line:#d9e0e8;--g-acc:#1d6fd8;--g-acc-ink:#fff;--g-soft:#eef3f9}
  @media (prefers-color-scheme:dark){.kqg,.kqg-sheet{--g-bg:#1a2331;--g-ink:#e8eef6;--g-sub:#9fb0c6;--g-line:#2e3d54;--g-acc:#5aa2ff;--g-acc-ink:#06121f;--g-soft:#222e40}}
  html.kqg-on:not(.kqg-top) body{padding-bottom:calc(92px + env(safe-area-inset-bottom))}
  .kqg.kqg-l{right:auto;left:max(12px,env(safe-area-inset-left))}
  .kqg.kqg-t{bottom:auto;top:calc(12px + env(safe-area-inset-top))}
  .kqg.kqg-free{right:auto;bottom:auto}
  .kqg.kqg-free .kqg-bubble{max-width:var(--kqg-bw,290px)}
  .kqg.kqg-drag{transition:none;opacity:.9}
  .kqg.kqg-drag .kqg-me{outline:2px dashed var(--g-acc);outline-offset:2px;border-radius:14px}
  .kqg.kqg-drag .kqg-bubble{display:none}
  .kqg[hidden]{display:none}
  .kqg-me{display:block;width:72px;height:80px;padding:0;border:0;background:none;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.22));transition:transform .25s}
  .kqg-me svg{width:100%;height:100%;overflow:visible}
  .kqg-me:focus-visible{outline:3px solid var(--g-acc);outline-offset:2px;border-radius:16px}
  .kqg.min .kqg-me{width:40px;height:44px;transform:translateX(18px);opacity:.85}
  .kqg.min .kqg-bubble{display:none}
  .kqg.kqg-l.min .kqg-me{transform:translateX(-18px)}
  .kqg-bob{animation:kqg-bob 3.2s ease-in-out infinite}
  .kqg-jump{animation:kqg-jump .7s ease-out 2}
  .kqg-shake{animation:kqg-tilt .9s ease-in-out 1}
  @keyframes kqg-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
  @keyframes kqg-jump{0%,100%{transform:translateY(0)}35%{transform:translateY(-16px) scale(1.04)}60%{transform:translateY(0) scale(1.05,.95)}}
  @keyframes kqg-tilt{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg)}60%{transform:rotate(5deg)}}
  .kqg-eyes{transform-origin:50px 53px;animation:kqg-blink 4.6s infinite}
  @keyframes kqg-blink{0%,95%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}
  @media (prefers-reduced-motion:reduce){.kqg-bob,.kqg-jump,.kqg-shake,.kqg-eyes{animation:none}}
  .kqg-bubble{position:absolute;right:4px;bottom:86px;width:max-content;max-width:min(290px,calc(100vw - 32px));background:var(--g-bg);color:var(--g-ink);
    border:1.5px solid var(--g-line);border-radius:16px 16px 4px 16px;padding:10px 14px;font-size:14px;line-height:1.6;box-shadow:0 6px 20px rgba(0,0,0,.16);
    opacity:0;transform:translateY(6px);pointer-events:none;transition:opacity .2s,transform .2s}
  .kqg-bubble.on{opacity:1;transform:none;pointer-events:auto}
  .kqg-l .kqg-bubble{right:auto;left:4px;border-radius:16px 16px 16px 4px}
  .kqg-t .kqg-bubble{bottom:auto;top:86px;border-radius:16px 4px 16px 16px;transform:translateY(-6px)}
  .kqg-t.kqg-l .kqg-bubble{border-radius:4px 16px 16px 16px}
  .kqg-t .kqg-bubble.on{transform:none}
  .kqg-bubble b.kqg-who{display:block;font-size:11.5px;color:var(--g-sub);margin-bottom:1px}
  .kqg-bubble p{margin:0;white-space:pre-line}
  .kqg-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .kqg-acts:empty{display:none}
  .kqg-btn{font:inherit;font-size:13px;font-weight:700;border:1.5px solid var(--g-line);background:var(--g-bg);color:var(--g-ink);border-radius:999px;padding:6px 12px;cursor:pointer}
  .kqg-btn.pri{background:var(--g-acc);border-color:var(--g-acc);color:var(--g-acc-ink)}
  .kqg-sheet{position:fixed;inset:0;z-index:9100;background:rgba(10,16,26,.45);display:flex;align-items:flex-end;justify-content:center;
    font-family:"BIZ UDPGothic","Hiragino Sans","Noto Sans JP",sans-serif}
  .kqg-sheet[hidden]{display:none}
  .kqg-panel{background:var(--g-bg);color:var(--g-ink);width:100%;max-width:520px;max-height:90vh;max-height:90dvh;overflow:auto;border-radius:22px 22px 0 0;
    padding:16px 16px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -8px 30px rgba(0,0,0,.25)}
  .kqg-panel h2{font-size:17px;margin:0 0 4px;font-family:"Zen Kaku Gothic New","Hiragino Sans",sans-serif}
  .kqg-panel .kqg-note{font-size:12.5px;color:var(--g-sub);margin:0 0 10px}
  .kqg-prev{display:flex;justify-content:center;background:var(--g-soft);border-radius:16px;padding:8px;margin-bottom:10px}
  .kqg-prev svg{width:120px;height:136px}
  .kqg-row{margin:10px 0}
  .kqg-row>span{display:block;font-size:12.5px;font-weight:700;color:var(--g-sub);margin-bottom:6px}
  .kqg-chips{display:flex;flex-wrap:wrap;gap:6px}
  .kqg-chip{font:inherit;font-size:13.5px;border:1.5px solid var(--g-line);background:var(--g-bg);color:var(--g-ink);border-radius:999px;padding:6px 12px;cursor:pointer}
  .kqg-chip[aria-pressed="true"]{border-color:var(--g-acc);background:var(--g-acc);color:var(--g-acc-ink);font-weight:700}
  .kqg-sw{width:34px;height:34px;border-radius:50%;border:2px solid rgba(0,0,0,.18);cursor:pointer;padding:0}
  .kqg-sw[aria-pressed="true"]{outline:3px solid var(--g-acc);outline-offset:2px}
  .kqg-panel input{font:inherit;font-size:16px;width:100%;color:var(--g-ink);background:var(--g-bg);border:1.5px solid var(--g-line);border-radius:12px;padding:9px 12px}
  .kqg-foot{display:flex;gap:8px;margin-top:14px;position:sticky;bottom:-18px;background:var(--g-bg);padding:8px 0}
  .kqg-foot .kqg-btn{flex:1;padding:11px;font-size:15px}
  .kqg-msg{font-size:13px;font-weight:700;min-height:1.4em;margin-top:6px}`;

  let drag = null, dragged = 0;
  let root, meBtn, bubble, sheet, hideT = 0, curMood = "normal", av = null, streak = 0, lastKey = "", draft = null;
  const minKey = "kq-guide-min";

  function paint(mood){
    curMood = mood || "normal";
    meBtn.innerHTML = draw(av, curMood);
  }
  function anim(cls){
    meBtn.classList.remove("kqg-bob", "kqg-jump", "kqg-shake"); void meBtn.offsetWidth;
    meBtn.classList.add(cls);
    if (cls !== "kqg-bob") setTimeout(() => { meBtn.classList.remove(cls); meBtn.classList.add("kqg-bob"); }, 1500);
  }
  function say(text, o = {}){
    if (av.off || (root.classList.contains("min") && !o.force)) return;
    if (o.force) setMin(false);
    paint(o.mood || "normal");
    if (o.anim) anim(o.anim);
    bubble.innerHTML = "";
    const who = document.createElement("b"); who.className = "kqg-who"; who.textContent = av.name;
    const p = document.createElement("p"); p.textContent = text;
    const acts = document.createElement("div"); acts.className = "kqg-acts";
    for (const a of o.acts || []) {
      const b = document.createElement("button"); b.type = "button"; b.className = "kqg-btn" + (a.pri ? " pri" : ""); b.textContent = a.label;
      b.onclick = e => { e.stopPropagation(); hide(); a.fn(); };
      acts.appendChild(b);
    }
    bubble.append(who, p, acts);
    bubble.classList.add("on");
    clearTimeout(hideT);
    const ms = o.ms || (o.acts && o.acts.length ? 12000 : Math.min(9000, 3500 + text.length * 90));
    hideT = setTimeout(hide, ms);
  }
  function hide(){ bubble.classList.remove("on"); clearTimeout(hideT); setTimeout(() => { if (!bubble.classList.contains("on")) paint("normal"); }, 300); }
  // 好きな場所のときは、はみ出さないように画面の中におさめる（ホームは下タブより上・上のバーより下）
  function freeBox(){
    const tab = document.querySelector(".kt:not([hidden])") || document.querySelector(".tabbar"), bar = document.querySelector(".topbar");
    const w = root.offsetWidth || 72, h = root.offsetHeight || 80;
    const top = (bar ? bar.getBoundingClientRect().bottom : 0) + 8;
    const bottom = (tab ? tab.getBoundingClientRect().top : innerHeight) - 8 - h;
    return { w, h, x0: 8, x1: innerWidth - 8 - w, y0: top, y1: Math.max(top, bottom) };
  }
  function applyPos(){
    let p = (av && av.pos) || DEF.pos, free = p === "free" && av.xy;
    root.classList.toggle("kqg-free", !!free);
    if (free) {
      const b = freeBox(), cx = av.xy[0] * innerWidth, cy = av.xy[1] * innerHeight;
      const x = Math.min(b.x1, Math.max(b.x0, cx - b.w / 2)), y = Math.min(b.y1, Math.max(b.y0, cy - b.h / 2));
      root.style.left = x + "px"; root.style.top = y + "px";
      p = (cy < innerHeight / 2 ? "t" : "b") + (cx < innerWidth / 2 ? "l" : "r");
      // 吹き出しは画面の広いほうへ。はみ出さない幅にする
      const room = p[1] === "l" ? innerWidth - x - 16 : x + b.w - 16;
      root.style.setProperty("--kqg-bw", Math.max(180, Math.min(290, room)) + "px");
    } else { root.style.left = root.style.top = ""; }
    root.classList.toggle("kqg-l", p[1] === "l"); root.classList.toggle("kqg-t", p[0] === "t");
    document.documentElement.classList.toggle("kqg-top", p[0] === "t");
  }
  function setPos(p, xy){
    const { isNew, off, ...keep } = av; // eslint-disable-line no-unused-vars
    KQ.avatar.set(Object.assign(keep, { pos: p, xy: xy || keep.xy || null, on: true })); av = getAv(); applyPos();
    pushCloud();
  }
  // 長押し（0.5秒）してから動かす → はなした場所にそのまま置く
  // ふつうのタップや、キャラの上をさっとなぞっただけでは動かない（うっかり動かさないため）
  const HOLD_MS = 500;
  function dragStart(e){
    if (e.button > 0) return;
    const id = e.pointerId;
    drag = { x: e.clientX, y: e.clientY, on: false, moved: false };
    drag.t = setTimeout(() => {
      if (!drag) return;
      drag.on = true; root.classList.add("kqg-drag"); hide();
      try { meBtn.setPointerCapture(id); } catch {}
    }, HOLD_MS);
  }
  function dragMove(e){
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) { if (Math.hypot(dx, dy) >= 10) { clearTimeout(drag.t); drag = null; } return; } // 長押し前に指が動いた＝動かさない
    if (Math.hypot(dx, dy) >= 10) drag.moved = true;
    root.style.transform = `translate(${dx}px,${dy}px)`;
  }
  function dragEnd(e){
    const d = drag; drag = null;
    if (!d) return;
    clearTimeout(d.t);
    if (!d.on) return;
    dragged = Date.now(); // 長押しのあとのタップは「話す」にしない
    const b = root.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    root.style.transform = ""; root.classList.remove("kqg-drag");
    if (e.type === "pointercancel" || !d.moved) return;
    const r3 = n => Math.round(Math.min(1, Math.max(0, n)) * 1000) / 1000;
    setPos("free", [r3(cx / innerWidth), r3(cy / innerHeight)]);
  }
  function setMin(on){ root.classList.toggle("min", on); lsSet(minKey, on ? 1 : 0); meBtn.setAttribute("aria-label", on ? av.name + "（タップで出す）" : av.name + "（タップで話す・着せかえ）"); }

  /* ---------- セリフ ---------- */
  function hello(){
    const h = new Date().getHours();
    return h < 5 ? "夜おそくまでおつかれさま" : h < 11 ? "おはよう" : h < 18 ? "こんにちは" : "こんばんは";
  }
  function progressLine(s){
    const n = todayN(s), g = av.goal;
    if (n >= g) return `今日はもう${n}問解いたよ。目標${g}問クリア、すごい！`;
    if (n === 0) return `今日の目標は${g}問。まずは1問いってみよう！`;
    return `今日は${n}問解いたよ。目標まであと${g - n}問！`;
  }
  function weakLine(s){
    const app = pageApp(), w = app ? s.weak[app] : (s.weak.kakomon && s.weak.kakomon.n ? s.weak.kakomon : s.weak.prep);
    if (!w || !w.n) return null;
    return `苦手な分野は「${w.f}」みたい（苦手リストに${w.n}問）。どこで解いても2回続けて正解すると卒業だよ。`;
  }
  const TIPS = [
    "まちがえた問題は、解説の○✕をぜんぶ読むと、ほかの選択肢もいっしょに覚えられるよ。",
    "10問ずつ区切ると、集中が続きやすいよ。",
    "寝る前にちょっと復習すると、次の日に思い出しやすいよ。",
    "同じ問題を3日後にもう一度解くと、記憶に残りやすいよ。",
    "計算問題は、式を紙に書いてから解くとミスがへるよ。",
    "わたしを長押しして（0.5秒）そのまま動かすと、画面の好きなところに置けるよ。"
  ];
  const OK_LINES = ["正解！その調子！", "やったね！", "さすが！", "ばっちり！", "いいね、覚えてる！", "ナイス！"];
  const NG_LINES = ["おしい！解説を読めば、もう覚えたも同然だよ。", "だいじょうぶ、まちがえた問題こそ伸びしろ！", "ドンマイ！次は解けるよ。", "ここで覚えれば本番で解ける！", "むずかしい問題だったね。解説をチェックしよう。"];

  function greet(){
    const s = refreshSum(), me = S();
    if (av.isNew) {
      return say(`${hello()}！わたしは${av.name}。あなたの勉強の案内係だよ。\n見た目や名前は、あなた好みに変えられるよ！`, { mood: "happy", anim: "kqg-jump", acts: [{ label: "着せかえする", pri: true, fn: openEditor }, { label: "あとで", fn: () => {} }] });
    }
    const who = me ? `おかえり、${me.nick}さん！` : `${hello()}！`;
    const line2 = pageApp() ? progressLine(s) : (me ? progressLine(s) : "ログインすると、記録もわたしの見た目も、どの端末でも同じになるよ。");
    say(`${who}\n${line2}`, { mood: "happy", anim: "kqg-jump" });
  }
  function talk(){
    const s = refreshSum(), lines = [progressLine(s)], w = weakLine(s);
    if (w) lines.push(w);
    lines.push(pick(TIPS));
    const acts = [{ label: "着せかえ", fn: openEditor }];
    if (w && document.getElementById("go-weak") && P() && P().view === "home") acts.unshift({ label: "苦手をやる", pri: true, fn: () => document.getElementById("go-weak").click() });
    acts.push({ label: "しまう", fn: () => setMin(true) }, { label: "オフ", fn: () => setOff(true) });
    say(pick(lines), { mood: "normal", acts });
  }
  function onVerdict(ok){
    const s = refreshSum(), n = todayN(s), g = av.goal;
    if (ok) {
      streak++;
      if (n === g) return say(`今日の目標${g}問、達成！🎉 よくがんばったね！`, { mood: "happy", anim: "kqg-jump", ms: 6000 });
      if (streak === 3 || streak === 5 || streak === 10 || (streak > 10 && streak % 10 === 0)) return say(`${streak}問連続で正解！ノッてるね！`, { mood: "happy", anim: "kqg-jump" });
      if (Math.random() < .55) say(pick(OK_LINES) + (n < g && g - n <= 3 ? `　目標まであと${g - n}問！` : ""), { mood: "happy", anim: "kqg-jump", ms: 3200 });
      else paint("happy"), anim("kqg-jump"), setTimeout(() => paint("normal"), 1600);
    } else {
      streak = 0;
      if (n === g) return say(`これで今日の目標${g}問、達成！まちがえた問題は復習でとりかえそう。`, { mood: "happy", anim: "kqg-jump", ms: 6000 });
      say(pick(NG_LINES), { mood: "cheer", anim: "kqg-shake", ms: 4200 });
    }
  }
  function onResult(el){
    const big = parseInt(el.textContent, 10), m = /\/\s*(\d+)問/.exec(el.parentElement ? el.parentElement.textContent : "");
    const n = m ? +m[1] : 0, r = n ? big / n : 0;
    const t = !n ? "おつかれさま！" : r >= .9 ? `${n}問中${big}問正解！完ぺきに近いね！` : r >= .6 ? `${n}問中${big}問正解！いい感じ。まちがえた問題をもう一度やると確実だよ。` : `おつかれさま！まちがえた問題は「もう一度」で、その場で覚えちゃおう。`;
    say(t, { mood: r >= .6 ? "happy" : "cheer", anim: r >= .6 ? "kqg-jump" : "kqg-bob" });
  }
  function watch(){
    const mo = new MutationObserver(() => {
      if (!P()) return;
      const v = document.querySelector(".verdict.ok, .verdict.ng");
      const q = P().quiz;
      if (v && q) {
        const k = "v" + q.seq + ":" + q.i;
        if (k !== lastKey) { lastKey = k; onVerdict(v.classList.contains("ok")); }
        return;
      }
      const r = document.querySelector("#result .result-big");
      if (r && q && r.offsetParent !== null) {
        const k = "r" + q.seq + ":" + q.results.length;
        if (k !== lastKey) { lastKey = k; onResult(r); }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- 着せかえ ---------- */
  function chipRow(label, list, key, swatch){
    const row = document.createElement("div"); row.className = "kqg-row";
    const h = document.createElement("span"); h.textContent = label; row.appendChild(h);
    const box = document.createElement("div"); box.className = "kqg-chips"; box.setAttribute("role", "group"); box.setAttribute("aria-label", label);
    for (const it of list) {
      const b = document.createElement("button"); b.type = "button";
      b.className = swatch ? "kqg-sw" : "kqg-chip";
      if (swatch) { b.style.background = it.bg || it.id; b.title = it.name; b.setAttribute("aria-label", it.name); } else b.textContent = it.name;
      b.setAttribute("aria-pressed", String(draft[key] === it.id));
      b.onclick = () => { draft[key] = it.id; for (const x of box.children) x.setAttribute("aria-pressed", String(x === b)); prev(); };
      box.appendChild(b);
    }
    row.appendChild(box); return row;
  }
  function prev(){ sheet.querySelector(".kqg-prev").innerHTML = draw(draft, "happy"); }
  function openEditor(){
    draft = Object.assign({}, av);
    const p = sheet.querySelector(".kqg-panel"); p.innerHTML = "";
    const h = document.createElement("h2"); h.textContent = "キャラの着せかえ";
    const note = document.createElement("p"); note.className = "kqg-note";
    note.textContent = S() ? `${S().nick}さんだけのキャラとして保存されます。どの端末でも同じキャラが出てきます。` : "いまはこの端末だけに保存されます。ログインすると、ニックネームといっしょに保存できます。";
    const pv = document.createElement("div"); pv.className = "kqg-prev";
    const nameRow = document.createElement("div"); nameRow.className = "kqg-row";
    const nl = document.createElement("span"); nl.textContent = "名前（10文字まで）";
    const ni = document.createElement("input"); ni.maxLength = 10; ni.value = draft.name; ni.setAttribute("aria-label", "キャラの名前");
    ni.oninput = () => { draft.name = ni.value; };
    nameRow.append(nl, ni);
    const goalRow = chipRow("1日の目標（問題数）", GOALS.map(g => ({ id: g, name: g + "問" })), "goal");
    const posRow = chipRow("いる場所（キャラを長押ししてから動かすと、好きな場所に置けます）", draft.xy ? POS : POS.filter(x => x.id !== "free"), "pos");
    const msg = document.createElement("div"); msg.className = "kqg-msg"; msg.setAttribute("role", "status");
    const foot = document.createElement("div"); foot.className = "kqg-foot";
    const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "kqg-btn"; cancel.textContent = "やめる"; cancel.onclick = closeEditor;
    const ok = document.createElement("button"); ok.type = "button"; ok.className = "kqg-btn pri"; ok.textContent = "これにする";
    ok.onclick = async () => {
      draft.name = (ni.value || "").trim().slice(0, 10) || DEF.name;
      const { isNew, off, ...keep } = draft; // eslint-disable-line no-unused-vars
      KQ.avatar.set(Object.assign(keep, { on: true })); av = getAv(); applyPos();
      ok.disabled = true; msg.textContent = S() ? "保存中…" : "";
      const r = await pushCloud();
      ok.disabled = false;
      closeEditor(); paint("happy");
      say(r.ok ? `${av.name}になったよ！これからよろしくね。` : `${av.name}になったよ！\n（クラウドにはつながらなかったので、この端末にだけ保存したよ。電波のいいところで、もう一度着せかえの「これにする」を押してね）`, { mood: "happy", anim: "kqg-jump", force: true });
    };
    const offB = document.createElement("button"); offB.type = "button"; offB.className = "kqg-btn"; offB.style.cssText = "width:100%;margin-top:6px";
    offB.textContent = "キャラをオフにする（画面から消す）"; offB.onclick = () => { closeEditor(); setOff(true); };
    foot.append(cancel, ok);
    p.append(h, note, pv, nameRow, chipRow("種類", TYPES, "type"), chipRow(draft.type === "hito" ? "かみの色" : "色", COLORS, "color", true), chipRow("色", OCOLORS, "ocolor", true),
      chipRow("服（もふもふ・ぬいぐるみは服なし）", OUTFITS, "outfit"), chipRow("小物", ACCS, "acc"), goalRow, posRow, msg, foot, offB);
    // 「ひと」を選ぶと色の見出しを「かみの色」にする
    // 内臓・細胞キャラのときは「色」「服」の行をかくし、内臓用の「色」（もとの色つき）を出す
    const rowsFix = () => {
      const sp = p.querySelectorAll(".kqg-row>span"); sp[2].textContent = draft.type === "hito" ? "かみの色" : "色";
      const o = isOrgan(draft.type); sp[2].parentNode.hidden = o; sp[3].parentNode.hidden = !o; sp[4].parentNode.hidden = o;
    };
    p.querySelector('[aria-label="種類"]').addEventListener("click", rowsFix); rowsFix();
    prev();
    sheet.hidden = false; hide();
    setTimeout(() => ok.focus({ preventScroll: true }), 50);
  }
  function applyOff(){
    applyPos();
    root.hidden = av.off; document.documentElement.classList.toggle("kqg-on", !av.off);
    if (av.off) { sheet.hidden = true; clearTimeout(hideT); bubble.classList.remove("on"); }
    try { window.dispatchEvent(new CustomEvent("kq-guide")); } catch {}
  }
  async function setOff(on){
    const { isNew, ...keep } = av; // eslint-disable-line no-unused-vars
    if (on) {
      say("オフにするね。トップページの「案内キャラ」から、いつでももどせるよ。またね！", { mood: "cheer", ms: 2600 });
      await new Promise(r => setTimeout(r, 2400));
    }
    delete keep.off; KQ.avatar.set(Object.assign(keep, { on: !on })); av = getAv(); applyOff();
    if (!on) { setMin(false); paint("happy"); say(`ただいま！${av.name}だよ。またいっしょにがんばろう！`, { mood: "happy", anim: "kqg-jump" }); }
    pushCloud();
  }
  function closeEditor(){ sheet.hidden = true; meBtn.focus({ preventScroll: true }); }
  async function pushCloud(){
    if (!S() || !KQ.ready()) return { ok: true };
    const here = pageApp(); let ok = true;
    for (const app of ["kakomon", "prep"]) {
      if (app === here && P().cloud) { P().doSave(); continue; }
      const r = await KQ.load(app);
      if (!r.ok) { ok = false; continue; }
      const d = r.data && typeof r.data === "object" ? r.data : { v: 1, at: Date.now(), rec: {}, weak: {} };
      const s = await KQ.save(app, d);
      if (!s.ok) ok = false;
    }
    return { ok };
  }

  /* ---------- はじめる ---------- */
  async function fromCloud(){ // トップページ：クラウドからキャラと今日の記録を読む
    if (pageApp() || !S() || !KQ.ready()) return;
    const s = sum();
    for (const app of ["kakomon", "prep"]) {
      const r = await KQ.load(app);
      if (r.ok && r.data) s.today[app] = countToday(r.data.rec);
    }
    lsSet(sumKey(), s);
  }
  async function refresh(){
    av = getAv(); paint("normal"); applyOff();
    meBtn.setAttribute("aria-label", av.name + "（タップで話す・着せかえ）");
    await fromCloud();
    av = getAv(); paint("normal"); applyOff();
    if (!av.off) greet();
  }
  function init(){
    if (!window.KQ || !KQ.avatar) return;
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement("div"); root.className = "kqg";
    bubble = document.createElement("div"); bubble.className = "kqg-bubble"; bubble.setAttribute("role", "status"); bubble.setAttribute("aria-live", "polite");
    bubble.onclick = hide;
    meBtn = document.createElement("button"); meBtn.type = "button"; meBtn.className = "kqg-me kqg-bob";
    meBtn.addEventListener("pointerdown", dragStart);
    meBtn.addEventListener("pointermove", dragMove);
    meBtn.addEventListener("pointerup", dragEnd);
    meBtn.addEventListener("pointercancel", dragEnd);
    meBtn.addEventListener("contextmenu", e => e.preventDefault());
    // 長押しで動かしているあいだは、画面がスクロールしないようにする
    document.addEventListener("touchmove", e => { if (drag && drag.on) e.preventDefault(); }, { passive: false });
    meBtn.onclick = () => { if (Date.now() - dragged < 500) return; if (root.classList.contains("min")) { setMin(false); return say("よんだ？", { mood: "happy", anim: "kqg-jump" }); } bubble.classList.contains("on") ? hide() : talk(); };
    root.append(bubble, meBtn);
    sheet = document.createElement("div"); sheet.className = "kqg-sheet"; sheet.hidden = true;
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true"); sheet.setAttribute("aria-label", "キャラの着せかえ");
    const panel = document.createElement("div"); panel.className = "kqg-panel"; sheet.appendChild(panel);
    sheet.addEventListener("click", e => { if (e.target === sheet) closeEditor(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) closeEditor(); });
    document.body.append(root, sheet);
    av = getAv(); paint("normal");
    root.classList.toggle("min", !!lsGet(minKey, 0));
    meBtn.setAttribute("aria-label", av.name + (root.classList.contains("min") ? "（タップで出す）" : "（タップで話す・着せかえ）"));
    applyOff();
    window.addEventListener("resize", () => { if (av && av.pos === "free") applyPos(); });
    window.addEventListener("kq-avatar", () => { av = getAv(); paint(curMood); applyOff(); });
    watch();
    setTimeout(() => refresh(), pageApp() ? 900 : 300);
  }
  window.KQGuide = { push: () => pushCloud(), refresh: () => root && refresh(), open: () => { if (!root) return; if (av.off) setOff(false); openEditor(); },
    isOff: () => !!(av && av.off), setOff: on => root && setOff(on), draw, parts: { TYPES, COLORS, OUTFITS, ACCS } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
