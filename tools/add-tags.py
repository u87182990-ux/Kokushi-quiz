#!/usr/bin/env python3
"""問題タグ（shared/tags.js：完璧／復習中／要学習）を過去問ページ kakomon/index.html に組みこむ（何回実行してもOK）。
add-weekly.py・add-judge.py のあとに実行 → tools/offline-list.py。
入れるもの：<head> に tags.js、上のタブに「タグ」、<section id="view-tags">、問題画面のタグボタン、
?start=tags / tag1 / tag2 / tag3、クラウド保存に data.tag。
"""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
V = "1795900000"
p = ROOT / "kakomon" / "index.html"
s = p.read_text(encoding="utf-8")
MARK = "/*tag*/"


def rep(a, b):
    global s
    assert s.count(a) == 1, a[:80]
    s = s.replace(a, b, 1)


if MARK not in s:
    rep('<script src="../shared/update.js" defer></script>',
        f'<script src="../shared/tags.js?v={V}"></script><script src="../shared/update.js" defer></script>')
    rep('''      <button id="tab-review" data-view="review">''',
        '''      <button id="tab-tags" data-view="tags">タグ</button>
      <button id="tab-review" data-view="review">''')
    rep('''  <!-- 結果 -->
  <section class="view" id="view-result" hidden>''', '''  <!-- 問題タグ（shared/tags.js） -->
  <section class="view" id="view-tags" hidden>
    <div id="tg-box"></div>
  </section>

  <!-- 結果 -->
  <section class="view" id="view-result" hidden>''')
    rep('/*wk*/if (window.KQWeekly) KQWeekly.boot(LS);',
        '/*wk*/if (window.KQWeekly) KQWeekly.boot(LS);\n' + MARK + 'if (window.KQTags) KQTags.boot(LS);')
    rep('  /*wk*/if (view === "weekly" && window.KQWeekly) KQWeekly.render();\n',
        '  /*wk*/if (view === "weekly" && window.KQWeekly) KQWeekly.render();\n  ' + MARK + 'if (view === "tags" && window.KQTags) KQTags.render();\n')
    rep('  /*wk*/if (st === "weekly") return show("weekly");\n',
        '  /*wk*/if (st === "weekly") return show("weekly");\n  ' + MARK + 'if (st === "tags") return show("tags");\n  if (/^tag[123]$/.test(st || "") && window.KQTags && KQTags.startTag(+st.slice(3))) return;\n')
    rep('wk: window.KQWeekly ? KQWeekly.dump() : undefined }',
        'wk: window.KQWeekly ? KQWeekly.dump() : undefined, ' + MARK + 'tag: window.KQTags ? KQTags.dump() : undefined }')
    rep('  /*wk*/if (window.KQWeekly) KQWeekly.merge(d.wk);\n',
        '  /*wk*/if (window.KQWeekly) KQWeekly.merge(d.wk);\n  ' + MARK + 'if (window.KQTags) KQTags.merge(d.tag);\n')
    rep('  /*wk*/if (window.KQWeekly) KQWeekly.init(window.KQPage);\n',
        '  /*wk*/if (window.KQWeekly) KQWeekly.init(window.KQPage);\n  ' + MARK + 'if (window.KQTags) KQTags.init(window.KQPage);\n')
    rep('window.KQPage = { app: APP, ',
        'window.KQPage = { app: APP, ' + MARK + 'dirtyTag: () => { dirty.add("tag"); flush(); }, ')
    # 問題画面：ブックマークの下にタグボタン
    rep('''      <button class="bmk" id="q-bm" data-id="${esc(q.id)}" aria-pressed="${isBm(q.id)}" aria-label="ブックマーク">${isBm(q.id) ? "★ 保存ずみ" : "☆ 保存"}</button>
    </div>
    <div class="jprog''', '''      <div class="jtools"><button class="bmk" id="q-bm" data-id="${esc(q.id)}" aria-pressed="${isBm(q.id)}" aria-label="ブックマーク">${isBm(q.id) ? "★ 保存ずみ" : "☆ 保存"}</button>${window.KQTags ? KQTags.btns(q.id) : ""}</div>
    </div>
    <div class="jprog''')
    rep('.jhead{display:flex;align-items:flex-start;gap:8px}',
        '.jhead{display:flex;align-items:flex-start;gap:8px}\n.jtools{display:flex;flex-direction:column;align-items:flex-end;gap:4px}')
else:
    s = re.sub(r'shared/tags\.js\?v=\d+', f'shared/tags.js?v={V}', s)
p.write_text(s, encoding="utf-8")
print("ok kakomon")
