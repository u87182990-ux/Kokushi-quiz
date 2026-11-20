// 内臓・細胞キャラのホーム画面アイコン（オリジナル絵・ぬいぐるみ風）を作るスクリプト
// 使い方: node tools/organ-icons.js  → icons/e〜n に PNG ができる
const fs = require("fs");
const path = require("path");
const INK = "#4a3540"; // 目・口の色

// 小さい点の目＋ちょこんとした口（mouth: smile / open / cat / flat）
function face(x, y, s = 1, mouth = "smile", blush = "#ff8fa3") {
  s *= 1.15;
  const ex = 30 * s;
  const eye = (cx) => `<ellipse cx="${cx}" cy="${y}" rx="${9 * s}" ry="${11 * s}" fill="${INK}"/>`;
  const b = (cx) => `<ellipse cx="${cx}" cy="${y + 16 * s}" rx="${15 * s}" ry="${8 * s}" fill="${blush}" opacity=".5"/>`;
  const st = `fill="none" stroke="${INK}" stroke-width="${5.5 * s}" stroke-linecap="round" stroke-linejoin="round"`;
  const m = {
    smile: `<path d="M${x - 10 * s} ${y + 6 * s} Q${x} ${y + 17 * s} ${x + 10 * s} ${y + 6 * s}" ${st}/>`,
    cat: `<path d="M${x - 14 * s} ${y + 6 * s} Q${x - 7 * s} ${y + 15 * s} ${x} ${y + 7 * s} Q${x + 7 * s} ${y + 15 * s} ${x + 14 * s} ${y + 6 * s}" ${st}/>`,
    open: `<path d="M${x - 9 * s} ${y + 5 * s} Q${x} ${y + 22 * s} ${x + 9 * s} ${y + 5 * s} Z" fill="${INK}" stroke="${INK}" stroke-width="${3 * s}" stroke-linejoin="round"/>`,
    tri: `<path d="M${x} ${y + 3 * s} L${x - 8 * s} ${y + 15 * s} L${x + 8 * s} ${y + 15 * s} Z" fill="none" stroke="${INK}" stroke-width="${4.5 * s}" stroke-linejoin="round"/>`,
  }[mouth];
  return b(x - 58 * s) + b(x + 58 * s) + eye(x - ex) + eye(x + ex) + m;
}
const circles = (list, fill) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join("");
const tube = (d, color, w) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const star = (x, y, s, c) => `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="${c}"/>`;

// body: ぬいぐるみの体（ふわっと立体にする）／ deco: 体の上の模様／ face: 顔
const ICONS = {
  e: { name: "しんぞう", bg: "#ffe9b8", dot: "#ffd98a",
    body: () => tube("M206 205 L206 128", "#8cc4f0", 44) + tube("M300 200 C300 130 352 118 368 160", "#ff8ea4", 44) +
      `<ellipse cx="118" cy="300" rx="30" ry="22" transform="rotate(-25 118 300)" fill="#ff9fb3"/><ellipse cx="394" cy="300" rx="30" ry="22" transform="rotate(25 394 300)" fill="#ff9fb3"/>` +
      `<path d="M256 430 C160 380 112 320 116 250 C120 190 170 160 214 180 C236 190 250 204 256 214 C264 202 280 186 302 180 C352 166 398 200 396 258 C394 324 348 382 256 430 Z" fill="#ff9fb3"/>`,
    deco: () => "", face: () => face(256, 290, 1.15, "tri") },
  f: { name: "のう", bg: "#d7f5e6", dot: "#b5ebd0",
    body: () => tube("M262 350 L272 418", "#f2a6bd", 48) +
      circles([[256, 250, 140], [150, 255, 88], [362, 255, 88], [190, 175, 78], [322, 175, 78], [256, 160, 82], [180, 320, 72], [332, 320, 72], [256, 335, 80]], "#ffc6d6"),
    deco: () => `<g fill="none" stroke="#f08aa8" stroke-width="9" stroke-linecap="round"><path d="M256 118 C244 150 268 172 256 200"/><path d="M168 178 C190 160 214 196 236 180"/><path d="M344 178 C322 160 298 196 276 180"/><path d="M118 232 C140 214 160 246 182 228"/><path d="M394 232 C372 214 352 246 330 228"/><path d="M150 330 C170 350 192 330 200 350"/><path d="M362 330 C342 350 320 330 312 350"/></g>`,
    face: () => face(256, 270, 1.15, "smile") },
  g: { name: "い", bg: "#dcecff", dot: "#c2dcfb",
    body: () => tube("M196 78 L196 170", "#ffc59a", 46) + tube("M396 332 C432 356 436 404 404 424", "#ffc59a", 38) +
      `<path d="M170 150 C166 230 150 300 190 365 C232 432 352 440 398 368 C436 306 410 222 348 220 C298 218 282 255 260 226 C240 200 246 160 222 150 Z" fill="#ffcfa6"/>`,
    deco: () => "", face: () => face(298, 318, 1.1, "smile") },
  h: { name: "ちょう", bg: "#efe4ff", dot: "#dccbff",
    body: () => circles([[150, 380, 52], [130, 310, 56], [134, 236, 56], [168, 172, 56], [232, 140, 56], [300, 140, 56], [356, 172, 56], [382, 236, 56], [384, 310, 56], [364, 380, 52]], "#ffb7a3") +
      `<rect x="186" y="210" width="140" height="140" rx="56" fill="#ffd3c4"/>`,
    deco: () => `<path d="M206 238 C230 222 246 250 270 236 C292 224 306 246 306 260 M206 300 C226 290 244 316 266 302 C290 290 302 312 306 324" fill="none" stroke="#f6a993" stroke-width="9" stroke-linecap="round"/>`,
    face: () => face(256, 160, 0.95, "cat") },
  i: { name: "せっけっきゅう", bg: "#dcecff", dot: "#c2dcfb",
    body: () => `<ellipse cx="256" cy="272" rx="168" ry="158" fill="#ff7f8f"/>`,
    deco: () => `<ellipse cx="256" cy="276" rx="96" ry="80" fill="#f26b7a" opacity=".6"/>`,
    face: () => face(256, 262, 1.05, "smile", "#ffc0ca") },
  j: { name: "はっけっきゅう", bg: "#efe4ff", dot: "#dccbff",
    body: () => circles([[256, 262, 138], [256, 124, 50], [352, 154, 52], [394, 254, 50], [356, 358, 52], [256, 398, 50], [156, 358, 52], [118, 254, 50], [160, 154, 52], [306, 120, 40], [206, 120, 40], [400, 310, 40], [112, 310, 40]], "#fffaf0"),
    deco: () => "", face: () => face(256, 262, 1.15, "smile", "#ffb6c8") },
  k: { name: "かんさいぼう", bg: "#ddf7e8", dot: "#c0efd5",
    body: () => tube("M256 140 C256 112 252 98 256 80", "#6fcf86", 16) +
      `<path d="M256 98 C222 62 182 72 174 94 C202 112 236 114 256 98 Z M258 94 C290 54 334 60 342 84 C314 106 280 108 258 94 Z" fill="#8fe0a2"/>` +
      `<circle cx="256" cy="285" r="150" fill="#cdf5d9"/>`,
    deco: () => `<circle cx="345" cy="352" r="34" fill="#b49af0"/><circle cx="170" cy="352" r="12" fill="#a8e8bb"/><circle cx="198" cy="386" r="8" fill="#a8e8bb"/>`,
    face: () => face(250, 268, 1.15, "open") },
  l: { name: "ニューロン", bg: "#2e3f7a", dot: "#3a4c8c",
    body: () => tube("M210 220 L136 166 M136 166 L104 180 M136 166 L126 128", "#ffe27a", 26) +
      tube("M302 220 L376 166 M376 166 L408 180 M376 166 L386 128", "#ffe27a", 26) +
      tube("M256 190 L256 116 M256 116 L230 92 M256 116 L282 92", "#ffe27a", 26) +
      tube("M186 316 L124 346", "#ffe27a", 26) + tube("M326 322 C356 362 360 400 398 428", "#ffe27a", 20) +
      `<path d="M256 180 C326 180 350 224 348 270 C346 330 302 352 256 352 C206 352 164 328 164 268 C164 218 194 180 256 180 Z" fill="#ffe27a"/>`,
    deco: () => `<g fill="#9fdcff"><rect x="334" y="340" width="34" height="24" rx="12" transform="rotate(58 351 352)"/><rect x="358" y="392" width="34" height="24" rx="12" transform="rotate(35 375 404)"/></g>` +
      star(110, 110, 18, "#fff1a8") + star(420, 112, 12, "#fff1a8") + star(96, 420, 11, "#bfe8ff") + star(426, 300, 9, "#bfe8ff"),
    face: () => face(256, 264, 1.1, "smile", "#ffab8a") },
  m: { name: "はい", bg: "#e4f3ff", dot: "#cbe6fb",
    body: () => tube("M256 86 L256 196 M256 196 L222 224 M256 196 L290 224", "#9edf8e", 30) +
      `<path d="M232 210 C232 170 208 150 180 152 C126 156 104 240 106 316 C108 380 140 418 186 416 C232 414 240 380 236 330 Z" fill="#b8dcf7"/>` +
      `<path d="M280 210 C280 170 304 150 332 152 C386 156 408 240 406 316 C404 380 372 418 326 416 C280 414 272 380 276 330 Z" fill="#b8dcf7"/>`,
    deco: () => "", face: () => face(172, 312, 0.85, "smile") + face(340, 312, 0.85, "cat") },
  n: { name: "かんぞう", bg: "#fff1d9", dot: "#ffe3b0",
    body: () => `<path d="M104 236 C104 186 160 170 230 172 C320 174 400 168 414 200 C426 230 392 268 340 300 C284 336 220 372 170 368 C124 364 104 300 104 236 Z" fill="#ffc96b"/>`,
    deco: () => `<path d="M292 182 C300 226 296 280 280 326" fill="none" stroke="#f0a64a" stroke-width="9" stroke-linecap="round"/>`,
    face: () => face(196, 262, 1.1, "smile") },
};

const DEFS = `<filter id="puff" x="-10%" y="-10%" width="120%" height="120%">
  <feGaussianBlur in="SourceAlpha" stdDeviation="16" result="b"/>
  <feSpecularLighting in="b" surfaceScale="7" specularConstant=".55" specularExponent="16" lighting-color="#ffffff" result="s"><fePointLight x="170" y="90" z="260"/></feSpecularLighting>
  <feComposite in="s" in2="SourceAlpha" operator="in" result="hi"/>
  <feOffset in="b" dy="-12" result="o"/>
  <feComposite in="SourceAlpha" in2="o" operator="out" result="edge"/>
  <feFlood flood-color="#7a3a50" flood-opacity=".16"/><feComposite in2="edge" operator="in" result="sh"/>
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .22 0" result="nw"/>
  <feComposite in="nw" in2="SourceAlpha" operator="in" result="fuzz"/>
  <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="fuzz"/><feMergeNode in="sh"/><feMergeNode in="hi"/></feMerge>
</filter>
<filter id="soft"><feGaussianBlur stdDeviation="14"/></filter>`;

function svg(k) {
  const ic = ICONS[k];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">` +
    `<defs>${DEFS}<pattern id="dots${k}" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="16" cy="16" r="7" fill="${ic.dot}"/><circle cx="48" cy="48" r="7" fill="${ic.dot}"/></pattern></defs>` +
    `<rect width="512" height="512" fill="${ic.bg}"/><rect width="512" height="512" fill="url(#dots${k})" opacity=".55"/>` +
    `<g transform="translate(256 262) scale(0.88) translate(-256 -262)">` +
    `<ellipse cx="256" cy="452" rx="150" ry="22" fill="#000" opacity=".10" filter="url(#soft)"/>` +
    `<g filter="url(#puff)">${ic.body()}</g>${ic.deco()}${ic.face()}</g></svg>`;
}

module.exports = { ICONS, svg };

if (require.main === module) {
  const { chromium } = require("playwright");
  (async () => {
    const root = path.join(__dirname, "..");
    const b = await chromium.launch();
    const p = await b.newPage();
    for (const k of Object.keys(ICONS)) {
      const dir = path.join(root, "icons", k);
      fs.mkdirSync(dir, { recursive: true });
      for (const [file, size] of [["icon-512.png", 512], ["icon-192.png", 192], ["apple-touch-icon.png", 180]]) {
        await p.setViewportSize({ width: size, height: size });
        await p.setContent(`<html><body style="margin:0">${svg(k).replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`);
        await p.screenshot({ path: path.join(dir, file) });
      }
      console.log(k, ICONS[k].name);
    }
    await b.close();
  })();
}
