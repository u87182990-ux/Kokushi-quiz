# 問題ページ（過去問・対策・治療ドリル・治療クイズ）を、オフラインでも記録がちゃんとクラウドに届くようにする
#  ・オフラインの時は「オフライン中：この端末に保存、つながったら自動で送る」と出す
#  ・電波がもどった時（online）や、アプリにもどってきた時に、クラウドにつなぎ直して、たまった記録を送る
# 使い方: python3 tools/offline-patch.py   （何回実行しても同じ。mksite.py で作り直したあとにも実行）
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OFF = '"📴 オフライン中：記録はこの端末に保存しています。つながったら自動でクラウドに送ります"'
REPL = [
    (  # 読みこみに失敗した時
        '    else setSync("クラウドにつながりませんでした（この端末の記録で続けます）" + (r.msg ? "：" + r.msg : ""));',
        '    else setSync(navigator.onLine === false ? ' + OFF + ' : "クラウドにつながりませんでした（この端末の記録で続けます）" + (r.msg ? "：" + r.msg : ""));',
    ),
    (  # 保存に失敗した時
        '  else { setSync("クラウド保存に失敗しました（この端末には保存されています）" + (r.msg ? "：" + r.msg : ""));',
        '  else { setSync(navigator.onLine === false ? ' + OFF + ' : "クラウド保存に失敗しました（この端末には保存されています）" + (r.msg ? "：" + r.msg : ""));',
    ),
    (  # ログイン中の人に「ログインしていないので」を出さない
        'setTimeout(() => { if (!cloud && lsOk) setSync("ログインしていないので',
        'setTimeout(() => { if (!cloud && lsOk && !KQS) setSync("ログインしていないので',
    ),
    (  # つながったら、つなぎ直して送る
        '\nconnectCloud();\n',
        '\nconnectCloud();\n'
        '/* オフラインから復帰した時：まだつながっていなければつなぎ直す（たまった記録もまとめて送る） */\n'
        'let reconnecting = false;\n'
        'async function backOnline(){\n'
        '  if (!KQS || navigator.onLine === false || reconnecting || cloud === false) return;\n'
        '  if (cloud) { dirty.add("all"); flush(); return; }\n'
        '  reconnecting = true; try { await connectCloud(); } finally { reconnecting = false; }\n'
        '}\n'
        'window.addEventListener("online", () => setTimeout(backOnline, 1500));\n'
        'document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && !cloud) backOnline(); });\n',
    ),
]
MARK = "async function backOnline(){"

for app in ["kakomon", "prep", "chiryo", "chiryo-quiz"]:
    p = os.path.join(ROOT, app, "index.html")
    s = open(p, encoding="utf-8").read()
    if MARK in s:
        print(app, "はもう入っています")
        continue
    for a, b in REPL:
        assert s.count(a) == 1, (app, a[:50])
        s = s.replace(a, b, 1)
    open(p, "w", encoding="utf-8").write(s)
    print(app, "OK")
