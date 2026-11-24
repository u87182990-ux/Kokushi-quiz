#!/usr/bin/env python3
"""みんなの正答率（コクシル）がない問題に「難易度（AI推定）」を付ける → kakomon/difficulty.json
使い方: python3 tools/difficulty.py   （rates.json や questions.json を変えたら再実行 → offline-list.py）

やり方（正答率とは別データ。数字の正答率は作らない）
 1. 正答率がある約1,800問で、問題の特徴 → 正答率 を当てる式（リッジ回帰）を学習する。
    特徴：同じテーマ・分野のみんなの正答率（物差し）、計算量（数値の選択肢・計算の言葉・数式）、
          選択肢の紛らわしさ（2つ選ぶ・否定形・組合せ・選択肢どうしの似かた）、用語の専門性（英字・カタカナ・専門語の多さ）、画像の有無
 2. 正答率がない問題に式を当て、予測値を「正答率がある問題の予測値の並び」と比べて順位にし、
    実際の正答率の分布の同じ順位の値に置きかえる（ならし）。
 3. 5段階に分ける：80%以上 やさしい／65〜79 やややさしい／50〜64 ふつう／35〜49 やや難しい／34以下 難しい
 出力：{"src": 説明, "at": 日付, "levels": [5つの名前], "d": {問題id: 1〜5}}  1=やさしい … 5=難しい
"""
import json, re, pathlib, datetime, difflib
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parent.parent
Q = json.load(open(ROOT / "kakomon/questions.json", encoding="utf-8"))["questions"]
R = json.load(open(ROOT / "kakomon/rates.json", encoding="utf-8"))["r"]
TH = json.load(open(ROOT / "kakomon/themes.json", encoding="utf-8"))
LEVELS = ["やさしい", "やややさしい", "ふつう", "やや難しい", "難しい"]

def level(p):
    return 1 if p >= 80 else 2 if p >= 65 else 3 if p >= 50 else 4 if p >= 35 else 5

NUMC = re.compile(r"^[\s\d０-９.,．，/／×xX\-−～〜%％:：()（）a-zA-Zμ²³⁻¹⁰₀₁₂³√π]+$")
CALC = re.compile(r"求めよ|いくらか|何[倍%％]|計算|およそ|約何|[=＝]|log|√|×10")
NEG = re.compile(r"誤っている|誤り|正しくない|でない|ないのは|含まれない|関係ない|不適切")
TERM = re.compile(r"[A-Za-z]{2,}|[ァ-ヴー]{4,}")

def sim(cs):
    if len(cs) < 2: return 0
    s = [difflib.SequenceMatcher(None, a, b).ratio() for i, a in enumerate(cs) for b in cs[i + 1:]]
    return sum(s) / len(s)

def group_means(key):
    g = {}
    for q in Q:
        if q["id"] in R: g.setdefault(key(q), []).append(R[q["id"]])
    return g

gT = group_means(lambda q: (q["field"], TH.get(q["id"], "")))
gF = group_means(lambda q: q["field"])
ALL = float(np.mean(list(R.values())))

def loo(g, k, qid):
    xs = g.get(k, []); own = R.get(qid)
    if own is not None: xs = list(xs); xs.remove(own)
    return (sum(xs) / len(xs), len(xs)) if xs else (None, 0)

def feats(q):
    qt, cs = q["question"], q["choices"]
    tm, tn = loo(gT, (q["field"], TH.get(q["id"], "")), q["id"])
    fm, _ = loo(gF, q["field"], q["id"])
    fm = fm if fm is not None else ALL
    # テーマの平均は件数が少ないとぶれるので、分野の平均に寄せる
    w = tn / (tn + 5)
    base = (tm if tm is not None else fm) * w + fm * (1 - w)
    numc = sum(bool(NUMC.match(c.strip())) for c in cs) / max(1, len(cs))
    need2 = 1 if (len(q["answer"]) >= 2 or "2つ選べ" in qt or "２つ選べ" in qt) else 0
    text = qt + "".join(cs)
    return [base, fm,
            numc, 1 if CALC.search(qt) else 0, len(re.findall(r"\d", qt)) / 10,
            need2, 1 if NEG.search(qt) else 0, 1 if "組合せ" in qt else 0, sim(cs),
            len(TERM.findall(text)) / 5, len(text) / 200, 1 if q.get("images") else 0,
            (q["kai"] - 74) / 4]

X = np.array([feats(q) for q in Q if q["id"] in R]); y = np.array([R[q["id"]] for q in Q if q["id"] in R], float)
def fit(X, y, lam=3.0):
    mu, sd = X.mean(0), X.std(0) + 1e-9; Z = (X - mu) / sd
    Z1 = np.hstack([Z, np.ones((len(Z), 1))]); I = np.eye(Z1.shape[1]); I[-1, -1] = 0
    w = np.linalg.solve(Z1.T @ Z1 + lam * I, Z1.T @ y)
    return lambda A: np.hstack([(A - mu) / sd, np.ones((len(A), 1))]) @ w

# 5分割で、どれくらい当たるか（確認用）
rng = np.random.default_rng(0); idx = rng.permutation(len(y)); folds = np.array_split(idx, 5); pred = np.zeros(len(y))
for f in folds:
    tr = np.setdiff1d(idx, f); pred[f] = fit(X[tr], y[tr])(X[f])
r = np.corrcoef(pred, y)[0, 1]
base_r = np.corrcoef(X[:, 0], y)[0, 1]
def quant(p_new, p_ref, y_ref):
    pr = np.sort(p_ref); ys = np.sort(y_ref)
    q = np.searchsorted(pr, p_new) / len(pr)
    return np.quantile(ys, np.clip(q, 0, 1))
lv_true = np.array([level(v) for v in y]); lv_pred = np.array([level(v) for v in quant(pred, pred, y)])
print(f"学習 {len(y)}問  予測と実際の相関 r={r:.2f}（テーマ平均だけなら {base_r:.2f}）  5段階の一致 {np.mean(lv_true == lv_pred):.0%}・1段以内 {np.mean(abs(lv_true - lv_pred) <= 1):.0%}")

model = fit(X, y)
miss = [q for q in Q if q["id"] not in R]
pm = model(np.array([feats(q) for q in miss])); pref = model(X)
vals = quant(pm, pref, y)
out = {"src": "AI推定（コクシルの正答率1,789問を物差しに、計算量・選択肢の紛らわしさ・用語の専門性・テーマから推定。正答率の数字ではありません）",
       "at": datetime.date.today().isoformat(), "levels": LEVELS,
       "d": {q["id"]: level(v) for q, v in zip(miss, vals)}}
cnt = [sum(1 for v in out["d"].values() if v == k) for k in range(1, 6)]
print(f"推定 {len(miss)}問  " + "・".join(f"{LEVELS[k]} {cnt[k]}" for k in range(5)))
json.dump(out, open(ROOT / "kakomon/difficulty.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
