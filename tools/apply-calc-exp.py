# 過去問の計算問題の解説を強化する（2026-11-21 チノのフィードバック 5）
#   tools/calc-exp/*.txt の内容で、
#   ・「計算が合いません」だけだった選択肢の説明を、どうまちがえるとその値になるか／代入して確かめる説明に差しかえ
#   ・解説の最後に【よくある間違い】を足す
# 使い方: python3 tools/apply-calc-exp.py [quiz-appのsrc/expフォルダ]   （何回実行しても同じ）
import json, re, sys, glob, os
E = {}
for f in sorted(glob.glob(os.path.join(os.path.dirname(__file__), "calc-exp", "*.txt"))):
    for blk in open(f, encoding="utf-8").read().split("\n@")[0:]:
        blk = blk.lstrip("@").strip()
        if not blk: continue
        lines = blk.split("\n"); qid = lines[0].strip(); e = {"m": None, "c": {}}
        for ln in lines[1:]:
            if ln.startswith("M: "): e["m"] = ln[3:]
            elif re.match(r"^[1-5]: ", ln): e["c"][int(ln[0])] = ln[3:]
        assert qid not in E, qid; E[qid] = e
TAG = "【よくある間違い】"
p = "kakomon/questions.json"; d = json.load(open(p, encoding="utf-8"))
n = 0
for q in d["questions"]:
    e = E.get(q["id"])
    if not e: continue
    for i, t in e["c"].items():
        assert i not in q["answer"] or q.get("alt"), (q["id"], i)
        q["exp"]["c"][i - 1] = t
    if e["m"] and TAG not in q["exp"]["p"]: q["exp"]["p"] = q["exp"]["p"].rstrip() + "\n" + TAG + e["m"]
    n += 1
json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
left = [q["id"] for q in d["questions"] if any(re.fullmatch(r"[^。]{0,12}計算(が|と)合いません。", c) for c in q["exp"]["c"])]
print(n, "問を更新。まだ「計算が合いません」だけの説明:", len(left), left[:20])
missing = set(E) - {q["id"] for q in d["questions"]}; assert not missing, missing
# 元の解説ファイル（quiz-app/src/exp/<回>-<am|pm>.txt）にも同じ変更を入れる
if len(sys.argv) > 1:
    for qid, e in E.items():
        kai, ses, no = qid.split("-"); f = os.path.join(sys.argv[1], f"{kai}-{ses}.txt")
        s = open(f, encoding="utf-8").read()
        m = re.search(r"(?m)^@" + re.escape(qid) + r"\n(.*?)(?=^@|\Z)", s, re.S); assert m, qid
        body = m.group(1)
        for i, t in e["c"].items(): body = re.sub(r"(?m)^%d: .*$" % i, lambda _: f"{i}: {t}", body, count=1)
        if e["m"] and TAG not in body: body = re.sub(r"(?m)^1: ", lambda _: TAG + e["m"] + "\n1: ", body, count=1)
        s = s[:m.start(1)] + body + s[m.end(1):]
        open(f, "w", encoding="utf-8").write(s)
    print("src/exp も更新しました")
