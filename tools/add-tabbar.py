#!/usr/bin/env python3
"""画面の下に浮く丸いタブバー（shared/tabbar.js）を、過去問型のドリルページに入れる（何回実行してもOK）。
mksite.py などでページを作り直したあとにも実行する。そのあと tools/offline-list.py。
問題を解いている間（body.in-quiz）はバーが自動でかくれる。"""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
V = "1796200000"
PAGES = ["kakomon", "prep", "chiryo", "chiryo-quiz"]
for d in PAGES:
    p = ROOT / d / "index.html"
    s = p.read_text(encoding="utf-8")
    tag = (f'<link rel="stylesheet" href="../shared/tabbar.css?v={V}">'
           f'<script src="../shared/tabbar.js?v={V}" data-root="../" data-tab="drill"></script>')
    s = re.sub(r'<link rel="stylesheet" href="\.\./shared/tabbar\.css[^"]*"><script src="\.\./shared/tabbar\.js[^"]*"[^>]*></script>', "", s)
    anchor = '<script src="../shared/update.js" defer></script>'
    assert anchor in s, d
    s = s.replace(anchor, tag + anchor, 1)
    # 模試の画面にいるときは「模試」のタブを強調
    hook = 'if (window.KQTab) KQTab.set(v === "mock" ? "mock" : "drill");'
    if hook not in s and "KQTab.set(" not in s:
        s = s.replace("function show(v){\n", "function show(v){\n  " + hook + "\n", 1)
    p.write_text(s, encoding="utf-8")
    print("ok", d)
