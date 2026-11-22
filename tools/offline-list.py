# オフライン用の「保存するファイルの一覧」offline.json を作る
# 使い方: python3 tools/offline-list.py   （リポジトリのいちばん上で。問題や画像を足したら毎回実行する）
#
# offline.json の中身
#   v     … 一覧ぜんたいの版（中身が変わると変わる）
#   files … [{"u": サイトの上からのURL, "h": 中身のハッシュ, "s": バイト数, "i": 1=画像}]
# shared/offline.js がこれを読んで、ハッシュが変わったファイルだけをスマホに保存し直す。
import hashlib, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKIP_DIRS = {".git", ".github", "tools", "icons"}
TEXT = (".html", ".js", ".json", ".css")
IMG = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg")


def sha(path):
    with open(path, "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()[:12]


files = {}


def add(url, path, img=False):
    files[url] = {"u": url, "h": sha(path), "s": os.path.getsize(path), **({"i": 1} if img else {})}


for d, dirs, names in os.walk(ROOT):
    rel = os.path.relpath(d, ROOT).replace(os.sep, "/")
    rel = "" if rel == "." else rel + "/"
    dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS and not x.startswith("."))
    for n in sorted(names):
        p = os.path.join(d, n)
        low = n.lower()
        if n == "offline.json" and not rel:
            continue
        if n == "sw.js" and not rel:
            continue  # サービスワーカー本体はブラウザが自分で管理する
        if n == "index.html":
            add(rel or "./", p)  # ページはフォルダのURL（…/kakomon/）で開かれる
            # ページが読む JS（?v=… つき）も、そのままのURLで保存しておく
            html = open(p, encoding="utf-8").read()
            for src in re.findall(r'<script[^>]+src="([^"]+\?[^"]+)"', html):
                if "//" in src:
                    continue
                target = os.path.normpath(os.path.join(d, src.split("?")[0]))
                if os.path.isfile(target):
                    u = os.path.relpath(target, ROOT).replace(os.sep, "/") + "?" + src.split("?", 1)[1]
                    add(u, target)
        elif low.endswith(TEXT) and not low.endswith(".webmanifest"):
            add(rel + n, p)
        elif low.endswith(IMG):
            add(rel + n, p, img=True)

out = sorted(files.values(), key=lambda f: (f.get("i", 0), f["u"]))
v = hashlib.sha1("".join(f["u"] + f["h"] for f in out).encode()).hexdigest()[:12]
with open(os.path.join(ROOT, "offline.json"), "w", encoding="utf-8") as f:
    json.dump({"v": v, "files": out}, f, ensure_ascii=False, separators=(",", ":"))
core = [f for f in out if not f.get("i")]
img = [f for f in out if f.get("i")]
print(f"offline.json: ページ・データ {len(core)}件 {sum(f['s'] for f in core)/1e6:.1f}MB ／ 画像 {len(img)}枚 {sum(f['s'] for f in img)/1e6:.1f}MB")
