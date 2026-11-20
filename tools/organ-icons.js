// 内臓・細胞キャラのホーム画面アイコン（オリジナル絵）を作るスクリプト
// 使い方: node tools/organ-icons.js  → icons/e〜l に PNG ができる
const fs = require("fs");
const path = require("path");
const O = "#3b2740";   // 線の色
const SW = 12;         // 線の太さ

function face(x, y, s = 1, opt = {}) {
  s *= 1.3;
  const ex = 38 * s, ey = 17 * s;
  const eye = (cx) => `<ellipse cx="${cx}" cy="${y}" rx="${13 * s}" ry="${ey}" fill="${opt.eye || O}"/>` +
    `<circle cx="${cx - 4 * s}" cy="${y - 6 * s}" r="${5 * s}" fill="#fff"/>` +
    `<circle cx="${cx + 5 * s}" cy="${y + 7 * s}" r="${2.4 * s}" fill="#fff"/>`;
  const blush = (cx) => `<ellipse cx="${cx}" cy="${y + 26 * s}" rx="${17 * s}" ry="${9 * s}" fill="${opt.blush || "#ff6f91"}" opacity=".55"/>`;
  const mouth = `<path d="M${x - 13 * s} ${y + 22 * s} Q${x} ${y + 42 * s} ${x + 13 * s} ${y + 22 * s} Z" fill="${opt.mouth || "#7a2238"}" stroke="${opt.eye || O}" stroke-width="${5 * s}" stroke-linejoin="round"/>`;
  return blush(x - 66 * s) + blush(x + 66 * s) + eye(x - ex) + eye(x + ex) + mouth;
}
// 丸をたくさん重ねて「もこもこ」の形にする（外側だけ線が出る）
function blob(circles, fill) {
  const c = (w) => circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"${w}/>`).join("");
  return `<g fill="${O}" stroke="${O}" stroke-width="${SW * 2}">${c("")}</g><g fill="${fill}">${c("")}</g>`;
}
// 太い管（線つき）
function tube(d, color, w) {
  return `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const arm = (x, y, r, fill) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="17" transform="rotate(${r} ${x} ${y})" fill="${fill}" stroke="${O}" stroke-width="${SW - 2}"/>`;
const sp = (x, y, s, c) => `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="${c}"/>`;

const ICONS = {
  e: { name: "しんぞう", bg: ["#fff3c4", "#ffd88a"], body: () =>
    tube("M300 190 C300 120 370 105 382 160", "#ee4b5f", 40) +
    tube("M216 190 L216 118", "#6fa3ec", 38) +
    arm(104, 300, -30, "#ee4b5f") + arm(408, 300, 30, "#ee4b5f") +
    `<path d="M256 432 C150 365 104 305 112 236 C120 176 178 146 222 170 C240 180 251 194 256 204 C262 192 276 176 296 169 C346 152 400 184 400 244 C401 308 352 366 256 432 Z" fill="#ff5d6e" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/>` +
    `<path d="M150 230 C155 200 180 188 200 192" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".7"/>` +
    face(256, 290, 1, { blush: "#ffd1d7" }) },
  f: { name: "のう", bg: ["#d9fbe9", "#9fe8c4"], body: () =>
    tube("M256 360 L256 420", "#f58aa6", 46) +
    blob([[256, 250, 140], [150, 250, 85], [362, 250, 85], [190, 170, 75], [322, 170, 75], [256, 150, 80], [170, 320, 70], [342, 320, 70], [256, 340, 80]], "#ffa9c0") +
    `<g fill="none" stroke="#e0718f" stroke-width="9" stroke-linecap="round">` +
    `<path d="M256 120 C246 150 266 175 256 205"/><path d="M175 180 C200 170 205 205 230 200"/><path d="M337 180 C312 170 307 205 282 200"/>` +
    `<path d="M128 255 C150 235 165 262 185 248"/><path d="M384 255 C362 235 347 262 327 248"/></g>` +
    face(256, 290) },
  g: { name: "い", bg: ["#dff1ff", "#a8d5ff"], body: () =>
    tube("M196 70 L196 170", "#ffb27a", 44) +
    tube("M392 330 C430 350 440 400 410 425", "#ffb27a", 34) +
    arm(132, 300, -35, "#ffb27a") +
    `<path d="M172 150 C168 230 150 300 190 365 C232 432 352 440 398 368 C436 306 410 222 348 220 C298 218 282 255 260 226 C240 200 246 160 222 150 Z" fill="#ffc08c" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/>` +
    `<path d="M196 200 C192 240 186 280 200 320" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" opacity=".6"/>` +
    face(296, 320, 0.95) },
  h: { name: "ちょう", bg: ["#fff8d6", "#ffe58f"], body: () =>
    arm(98, 300, -30, "#f39a74") + arm(414, 300, 30, "#f39a74") +
    `<rect x="104" y="116" width="304" height="304" rx="96" fill="#f39a74" stroke="${O}" stroke-width="${SW}"/>` +
    `<g fill="none" stroke="#d9714f" stroke-width="8" stroke-linecap="round"><path d="M120 200 h12 M120 260 h12 M120 320 h12 M380 200 h12 M380 260 h12 M380 320 h12 M200 130 v12 M256 130 v12 M312 130 v12"/></g>` +
    `<rect x="156" y="168" width="200" height="200" rx="70" fill="#ffd2b8" stroke="${O}" stroke-width="8"/>` +
    `<path d="M180 205 C210 180 230 225 256 200 C282 175 302 220 332 196 M180 345 C210 320 230 365 256 340 C282 315 302 360 332 336" fill="none" stroke="#f2a585" stroke-width="9" stroke-linecap="round"/>` +
    face(256, 262, 0.9) },
  i: { name: "せっけっきゅう", bg: ["#e2f0ff", "#b6d6ff"], body: () =>
    `<ellipse cx="256" cy="270" rx="172" ry="160" fill="#e8394f" stroke="${O}" stroke-width="${SW}"/>` +
    `<ellipse cx="256" cy="275" rx="105" ry="92" fill="#c92740"/>` +
    `<path d="M140 210 C160 160 205 135 250 132" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round" opacity=".55"/>` +
    face(256, 262, 1, { blush: "#ff9fb0", mouth: "#5c0f20" }) },
  j: { name: "はっけっきゅう", bg: ["#efe6ff", "#c9b2ff"], body: () =>
    blob([[256, 262, 140], [256, 118, 42], [360, 152, 44], [398, 258, 42], [360, 366, 44], [256, 404, 42], [152, 366, 44], [114, 258, 42], [152, 152, 44]], "#ffffff") +
    `<path d="M200 380 C190 360 210 350 222 360 C230 340 255 345 255 365" fill="none" stroke="#c7b8e8" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M300 170 C320 160 345 175 340 195" fill="none" stroke="#c7b8e8" stroke-width="9" stroke-linecap="round"/>` +
    face(256, 262, 1, { blush: "#ffb0c8" }) },
  k: { name: "かんさいぼう", bg: ["#e9fff3", "#b4f0d0"], body: () =>
    tube("M256 140 C256 110 250 95 256 76", "#4fbf6a", 14) +
    `<path d="M256 96 C220 60 180 70 172 92 C200 110 236 112 256 96 Z M258 92 C290 50 336 56 344 80 C316 104 280 106 258 92 Z" fill="#7ad98e" stroke="${O}" stroke-width="9" stroke-linejoin="round"/>` +
    `<circle cx="256" cy="285" r="150" fill="#c4f5d2" stroke="${O}" stroke-width="${SW}"/>` +
    `<circle cx="345" cy="350" r="34" fill="#9b7bea" stroke="${O}" stroke-width="8"/><circle cx="335" cy="340" r="9" fill="#fff" opacity=".7"/>` +
    `<circle cx="168" cy="350" r="12" fill="#8fe0a8"/><circle cx="196" cy="384" r="8" fill="#8fe0a8"/>` +
    face(250, 270) },
  l: { name: "ニューロン", bg: ["#2b3d78", "#16204a"], body: () =>
    sp(110, 120, 18, "#ffe680") + sp(410, 410, 14, "#9fe8ff") + sp(420, 120, 12, "#ffe680") + sp(96, 420, 10, "#9fe8ff") +
    tube("M200 210 L130 160 M130 160 L100 175 M130 160 L120 125", "#ffd34d", 22) +
    tube("M312 210 L382 160 M382 160 L412 175 M382 160 L392 125", "#ffd34d", 22) +
    tube("M256 180 L256 112 M256 112 L230 90 M256 112 L282 90", "#ffd34d", 22) +
    tube("M180 310 L120 340", "#ffd34d", 22) +
    tube("M330 320 C360 360 360 400 400 430", "#ffd34d", 18) +
    `<g fill="#7fd6ff" stroke="${O}" stroke-width="7"><rect x="336" y="340" width="34" height="26" rx="12" transform="rotate(58 353 353)"/><rect x="360" y="392" width="34" height="26" rx="12" transform="rotate(35 377 405)"/></g>` +
    `<path d="M256 172 C330 172 352 222 350 268 C348 330 302 352 256 352 C204 352 160 326 160 266 C160 214 190 172 256 172 Z" fill="#ffd34d" stroke="${O}" stroke-width="${SW}" stroke-linejoin="round"/>` +
    face(256, 262, 0.95, { blush: "#ff8a6e" }) },
};

function svg(k) {
  const ic = ICONS[k];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">` +
    `<defs><radialGradient id="bg${k}" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${ic.bg[0]}"/><stop offset="1" stop-color="${ic.bg[1]}"/></radialGradient></defs>` +
    `<rect width="512" height="512" fill="url(#bg${k})"/>` +
    `<g transform="translate(256 262) scale(0.9) translate(-256 -262)">${ic.body()}</g></svg>`;
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
        await p.screenshot({ path: path.join(dir, file), omitBackground: false });
      }
      console.log(k, ICONS[k].name);
    }
    await b.close();
  })();
}
