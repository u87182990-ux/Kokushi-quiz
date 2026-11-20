/* 国試ドリル サービスワーカー
   ・ページ・問題データ・JS は「まずネットから最新」を取る（つながらない時だけ保存した控えを使う）
   ・画像は控えをすぐ出して、うらで新しいのに入れかえる
   ・Supabase（記録の保存）など、ほかのサイトへの通信にはさわらない */
const CACHE = "kq-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    // cache:"no-cache" … ブラウザの一時保存（最大10分）も使わず、必ずサーバーに確認する
    const res = await fetch(req.url, { cache: "no-cache", credentials: "same-origin" });
    if (req.mode === "navigate" && res.redirected) return Response.redirect(res.url, 302);
    if (res.ok) cache.put(req, res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(e) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(e.request);
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
  else e.respondWith(networkFirst(req));
});
