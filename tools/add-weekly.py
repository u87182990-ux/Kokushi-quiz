#!/usr/bin/env python3
"""週間模試（shared/weekly.js）を過去問ページ kakomon/index.html に組みこむ（何回実行してもOK）。
mksite.py などで作り直したら、ほかの add-*.py のあとに実行 → tools/offline-list.py。
入れるもの：
  ・<head> に weekly.js、本文に <section id="view-weekly">
  ・show()/render() に週間模試の画面、?start=weekly
  ・クラウド保存に data.wk（週ごとの結果）を足す、読むときに合わせる
"""
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
V = "1795800000"
p = ROOT / "kakomon" / "index.html"
s = p.read_text(encoding="utf-8")
MARK = "/*wk*/"


def rep(a, b):
    global s
    assert s.count(a) == 1, a[:80]
    s = s.replace(a, b, 1)


if MARK not in s:
    rep('<script src="../shared/update.js" defer></script>',
        f'<script src="../shared/weekly.js?v={V}"></script><script src="../shared/update.js" defer></script>')
    rep('''  <!-- 結果 -->
  <section class="view" id="view-result" hidden>''', '''  <!-- 週間模試（shared/weekly.js） -->
  <section class="view" id="view-weekly" hidden>
    <div id="wk-box"></div>
  </section>

  <!-- 結果 -->
  <section class="view" id="view-result" hidden>''')
    rep('const LS = "kokushi-rec-v1" + (KQS ? "@" + KQS.nick.toLowerCase() : "");',
        'const LS = "kokushi-rec-v1" + (KQS ? "@" + KQS.nick.toLowerCase() : "");\n' + MARK + 'if (window.KQWeekly) KQWeekly.boot(LS);')
    rep('function show(v){\n', 'function show(v){\n  ' + MARK + 'if (window.KQWeekly) { if (view === "weekly" && v !== "weekly") KQWeekly.leave(); if (v === "weekly") KQWeekly.open(); }\n')
    rep('if (window.KQTab) KQTab.set(v === "mock" ? "mock" : "drill");',
        'if (window.KQTab) KQTab.set(v === "mock" || v === "weekly" ? "mock" : "drill");')
    rep('const memoHost = v === "mock" ? $("#view-mock") : $("#view-quiz");',
        'const memoHost = v === "mock" ? $("#view-mock") : v === "weekly" ? $("#view-weekly") : $("#view-quiz");')
    rep('if (v !== "mock") $("#memo").hidden = false;', 'if (v !== "mock" && v !== "weekly") $("#memo").hidden = false;')
    rep('  if (view === "home") renderHome(ngIds);\n',
        '  if (view === "home") renderHome(ngIds);\n  ' + MARK + 'if (view === "weekly" && window.KQWeekly) KQWeekly.render();\n')
    rep('  if (st === "mock") return show("mock");\n', '  if (st === "mock") return show("mock");\n  ' + MARK + 'if (st === "weekly") return show("weekly");\n')
    rep('{ v: 1, at: Date.now(), rec, weak, mock, mockh: mockH }',
        '{ v: 1, at: Date.now(), rec, weak, mock, mockh: mockH, ' + MARK + 'wk: window.KQWeekly ? KQWeekly.dump() : undefined }')
    rep('  const mch = mergeMock(d.mock, d.mockh);\n',
        '  const mch = mergeMock(d.mock, d.mockh);\n  ' + MARK + 'if (window.KQWeekly) KQWeekly.merge(d.wk);\n')
    rep('  show("home");\n  startFromUrl();', '  ' + MARK + 'if (window.KQWeekly) KQWeekly.init(window.KQPage);\n  show("home");\n  startFromUrl();')
    rep('window.KQPage = { app: APP,',
        'window.KQPage = { app: APP, ' + MARK + 'show, startQuiz, record, weakRecord, needOf, fmt, memo, get byId(){ return byId; }, dirtyWk: () => { dirty.add("wk"); flush(); },')
else:
    import re
    s = re.sub(r'shared/weekly\.js\?v=\d+', f'shared/weekly.js?v={V}', s)
p.write_text(s, encoding="utf-8")
print("ok kakomon")
