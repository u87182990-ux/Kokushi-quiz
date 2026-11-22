/* 国試ドリル サービスワーカー
   ・ページ・問題データ・JS は「まずネットから最新」を取る（つながらない時だけ保存した控えを使う）
     電波が弱くて5秒たっても返事がない時は、控えを先に出す（うらで最新を取りに行く）
   ・画像は控えをすぐ出して、うらで新しいのに入れかえる
   ・オフライン用の控えは shared/offline.js が offline.json を見て同じ箱（CACHE）に入れる
   ・Supabase（記録の保存）など、ほかのサイトへの通信にはさわらない */
const CACHE = "kq-v1";
const SLOW_MS = 5000;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// 控えをさがす：まず同じURL、なければ ?… をのぞいたURLで
async function fromCache(cache, req) {
  return (await cache.match(req, { ignoreVary: true })) ||
         (await cache.match(req, { ignoreVary: true, ignoreSearch: true }));
}

const OFFLINE_PAGE = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>オフライン</title><style>body{font:16px/1.7 system-ui,-apple-system,sans-serif;background:#0f1b2d;color:#e8f1fb;margin:0;padding:48px 20px;text-align:center}a{color:#7fd3ff;font-weight:700}</style></head>
<body><p style="font-size:40px;margin:0">📴</p><p>いまオフラインで、このページはまだスマホに保存されていません。<br>電波のあるところで一度ひらくと、次からオフラインでも使えます。</p><p><a href="./">トップにもどる</a></p></body></html>`;

async function networkFirst(e) {
  const req = e.request;
  const cache = await caches.open(CACHE);
  // cache:"no-cache" … ブラウザの一時保存（最大10分）も使わず、必ずサーバーに確認する
  const net = fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(res => {
    if (res.ok && !res.redirected) cache.put(req, res.clone()).catch(() => {});
    return res;
  });
  const done = net.then(res => {
    if (req.mode === "navigate" && res.redirected) return Response.redirect(res.url, 302);
    return res;
  });
  const hitP = fromCache(cache, req);
  // 電波が弱い時：5秒待っても来なければ、控えがあれば控えを出す
  const slow = new Promise(r => setTimeout(r, SLOW_MS)).then(() => hitP).then(hit => hit || done);
  e.waitUntil(net.catch(() => {}));
  try {
    return await Promise.race([done, slow]);
  } catch (err) {
    const hit = await hitP;
    if (hit) return hit;
    if (req.mode === "navigate") return new Response(OFFLINE_PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    throw err;
  }
}

async function staleWhileRevalidate(e) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(e.request, { ignoreVary: true });
  const net = fetch(e.request).then(res => {
    if (res.ok) cache.put(e.request, res.clone()).catch(() => {});
    return res;
  });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\.(png|jpe?g|gif|webp|svg|ico)$/i.test(url.pathname)) e.respondWith(staleWhileRevalidate(e));
  else e.respondWith(networkFirst(e));
});
