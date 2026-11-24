# トップページの「今日やること」「今日のおすすめ」用の軽いデータ kakomon/plan.json を作る
#   questions.json（2MB以上）を毎回読まなくても、問題ごとの分野・テーマがわかるように
#   形：{"f":[分野...], "t":[テーマ...], "q":[[id, 分野の番号, テーマの番号(-1=なし)], ...]}
# questions.json か themes.json を作り直したら実行：python3 tools/plan-meta.py
import json
Q = json.load(open("kakomon/questions.json", encoding="utf-8"))["questions"]
TH = json.load(open("kakomon/themes.json", encoding="utf-8"))
F = sorted({q["field"] for q in Q}); T = sorted(set(TH.values()))
fi = {f: i for i, f in enumerate(F)}; ti = {t: i for i, t in enumerate(T)}
out = {"f": F, "t": T, "q": [[q["id"], fi[q["field"]], ti.get(TH.get(q["id"]), -1)] for q in Q]}
json.dump(out, open("kakomon/plan.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print("kakomon/plan.json", len(Q), "問", len(F), "分野", len(T), "テーマ")
