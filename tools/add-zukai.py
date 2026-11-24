# 過去問ページ（kakomon）の解説に「図解」（shared/zukai.js）を出す
#  ・答え合わせのあと、解説の箱に「次へ」で1手順ずつ進む図を入れる（図のない問題は何も変わらない）
# 使い方: python3 tools/add-zukai.py   （何回実行しても同じ。mksite.py で作り直したあとにも実行）
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VER = "1795700000"
TAG = '<script src="../shared/zukai.js?v=' + VER + '"></script>'
HOOK_OLD = '    </div>`;\n}\nfunction weakNote(w, ok){'
HOOK_NEW = ('    </div>`;\n  if (done && window.ZukaiMount) ZukaiMount(document.querySelector("#sheet .exp"), q.id);\n'
            '}\nfunction weakNote(w, ok){')

p = os.path.join(ROOT, "kakomon", "index.html")
s = open(p, encoding="utf-8").read()
s2 = re.sub(r'<script src="\.\./shared/zukai\.js\?v=\d+"( defer)?></script>', TAG, s)
if TAG not in s2:
    s2 = s2.replace('<script src="../shared/guide.js', TAG + '<script src="../shared/guide.js', 1)
if "ZukaiMount(" not in s2:
    assert HOOK_OLD in s2, "renderQuiz の終わりが見つかりません"
    s2 = s2.replace(HOOK_OLD, HOOK_NEW, 1)
if s2 != s:
    open(p, "w", encoding="utf-8").write(s2)
    print("kakomon: 図解を入れました")
else:
    print("kakomon: 変更なし")
