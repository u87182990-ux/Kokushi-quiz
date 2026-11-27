/* 苦手リストの間隔反復（2026-11-24）
 *  ・まちがえた問題は苦手リストに入る → ステージ1（あした）
 *  ・ステージが進むのは「復習日（due）の日以降に正解したとき」だけ。復習日より前の正解では進まない
 *    （解説を読んだ直後の正解を数えないため）
 *  ・まちがえたら、いつでもステージ1（あした）にもどる
 *  ・最後のステージで正解したら卒業（out=1）
 *  ・間隔はリスト入り／ステージ1にもどった時点の「試験までの残り日数」で決めて iv に保存
 *      残り11日以上：1・3・7日 ／ 7〜10日：1・2・3日 ／ 4〜6日：1・1・1日 ／ 3日以内：1・1日
 *    復習日は試験の前日をこえない（ただし、あしたより前にはしない）
 *  ・今日の復習は上限なし（復習日が来た問題ぜんぶ）。復習日が来た問題を「復習日が古い順 → 優先度の高い順」で並べる（2026-11-27 から上限なし。前は30問まで）。
 *    その日の分は rv = {d:日付, ids:[...], at} に固定（あふれた分は復習日が古いので次の日の先頭に来る）
 *  ・優先度：みんなの正答率が高いのにまちがえた問題ほど上。30%以下の難問は下げる。データがない問題は中間（50）
 *  記録：苦手リスト weak[id] = { s:0, t:最後に答えた時刻, st:ステージ, due:"YYYY-MM-DD", iv:[日数...], lr:最後の結果1/0, out?:1 }
 *  （s は前の版との互換のために 0 のまま残す）
 */
(function(){
  const DEF_EXAM = "2027-02-18", CAP = Infinity, MOTTAINAI = 70, HARD = 30;
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const today = () => ymd(new Date());
  const parse = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const addD = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);   // a から b まで何日
  const okDay = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  function exam(){
    let av = null; try { av = window.KQ && KQ.avatar && KQ.avatar.get(); } catch {}
    const e = av && av.exam;
    return okDay(e) && e !== "2027-02-20" ? e : DEF_EXAM;
  }
  const leftDays = (day = today()) => diff(day, exam());
  function ivFor(day = today()){
    const L = leftDays(day);
    return L >= 11 ? [1, 3, 7] : L >= 7 ? [1, 2, 3] : L >= 4 ? [1, 1, 1] : [1, 1];
  }
  // 復習日：試験の前日まで（あしたより前にはしない）
  function dueAfter(day, n){
    let d = addD(day, n);
    const last = addD(exam(), -1), tmr = addD(day, 1);
    if (d > last) d = last < tmr ? tmr : last;
    return d;
  }
  const active = w => !!w && !w.out;
  // 前の版の記録（ステージなし）を、ステージ1・復習日あした に直す（卒業ずみはそのまま）
  function fix(w, day = today()){
    if (!w || typeof w !== "object" || w.out) return false;
    let ch = false;
    if (!(w.st >= 1) || !okDay(w.due) || !Array.isArray(w.iv) || !w.iv.length) {
      w.iv = ivFor(day); w.st = 1; w.due = dueAfter(day, w.iv[0]); w.s = 0; ch = true;
    }
    if (w.st > w.iv.length) { w.st = w.iv.length; ch = true; }
    return ch;
  }
  function fixAll(map){ let n = 0; const day = today(); for (const w of Object.values(map || {})) if (fix(w, day)) n++; return n; }
  // 答えた結果を入れる。まちがい→ステージ1、正解→復習日以降ならステージを進める
  // 返り値：{ w:新しい記録, was:もとから苦手, adv:進んだ, early:復習日前の正解 } ／ 苦手でない問題の正解は null
  function answer(old, ok, now = Date.now()){
    const day = ymd(new Date(now)), was = active(old);
    if (!ok) {
      const iv = ivFor(day);
      return { w: { s: 0, t: now, st: 1, due: dueAfter(day, iv[0]), iv, lr: 0 }, ok: false, was, adv: false, early: false };
    }
    if (!was) return null;
    const w = { ...old }; fix(w, day);
    w.t = now; w.lr = 1;
    if (day < w.due) return { w, ok: true, was, adv: false, early: true };
    if (w.st >= w.iv.length) { w.out = 1; delete w.due; return { w, ok: true, was, adv: true, early: false }; }
    w.st++; w.due = dueAfter(day, w.iv[w.st - 1]);
    return { w, ok: true, was, adv: true, early: false };
  }
  const isDue = (w, day = today()) => active(w) && okDay(w.due) && w.due <= day;
  // 優先度（大きいほど先）。rate は みんなの正答率（%）か null
  const score = r => r == null ? 50 : r <= HARD ? r - 100 : r;
  const mottainai = r => r != null && r >= MOTTAINAI;
  // 苦手リストの並び：優先度 → 復習日が近い順 → 古くまちがえた順
  function order(ids, map, rate){
    const rt = rate || (() => null);
    return ids.slice().sort((a, b) => score(rt(b)) - score(rt(a)) || String(map[a]?.due || "9").localeCompare(String(map[b]?.due || "9")) || (map[a]?.t || 0) - (map[b]?.t || 0));
  }
  // 今日の復習：復習日が古い順（繰り越し分が先）→ 優先度 → 古くまちがえた順 で最大30問
  function pick(ids, map, rate, day = today()){
    const rt = rate || (() => null);
    return ids.filter(id => isDue(map[id], day))
      .sort((a, b) => map[a].due.localeCompare(map[b].due) || score(rt(b)) - score(rt(a)) || (map[a].t || 0) - (map[b].t || 0))
      .slice(0, CAP);
  }
  // 今日の30問（rv）を使う。rv が今日の分でなければ作り直す（save=false のときは作るだけで返す）
  // 返り値：{ rv, ids:今日の30問のうちまだ復習日が来ている（＝まだやっていない）問題, total:今日の30問の数, made:新しく作った }
  function todays(ids, map, rate, rv, day = today()){
    if (!rv || rv.d !== day || !Array.isArray(rv.ids)) {
      const p = pick(ids, map, rate, day);
      rv = { d: day, ids: p, at: Date.now() };
      return { rv, ids: p, total: p.length, made: true };
    }
    const set = new Set(ids);
    return { rv, ids: rv.ids.filter(id => set.has(id) && isDue(map[id], day)), total: rv.ids.length, made: false };
  }
  // 件数だけ（ホーム用）：今日の30問があれば残り、なければ min(30, 復習日が来た数)
  function dueCount(map, rv, day = today()){
    const due = Object.keys(map || {}).filter(id => isDue(map[id], day));
    if (rv && rv.d === day && Array.isArray(rv.ids)) return rv.ids.filter(id => isDue(map[id], day)).length;
    return Math.min(CAP, due.length);
  }
  function nextDue(map, day = today()){
    let d = null, n = 0;
    for (const w of Object.values(map || {})) if (active(w) && okDay(w.due) && w.due > day) { if (!d || w.due < d) { d = w.due; n = 1; } else if (w.due === d) n++; }
    return d ? { d, n, inDays: diff(day, d) } : null;
  }
  // rv のクラウドとのまぜかた：新しい日付を優先、同じ日なら先に作った方
  function mergeRv(a, b){
    if (!b || !okDay(b.d) || !Array.isArray(b.ids)) return a;
    if (!a || !okDay(a.d) || b.d > a.d || (b.d === a.d && (b.at || 0) < (a.at || 0))) return b;
    return a;
  }
  // 表示用
  const W = "日月火水木金土";
  function dayLabel(s, day = today()){
    if (!okDay(s)) return "";
    const n = diff(day, s), d = parse(s), md = `${d.getMonth() + 1}/${d.getDate()}（${W[d.getDay()]}）`;
    return n < 0 ? `${md}（${-n}日すぎ）` : n === 0 ? `今日 ${md}` : n === 1 ? `あした ${md}` : `${n}日後 ${md}`;
  }
  const ivText = iv => (iv || ivFor()).map((n, i) => i === 0 && n === 1 ? "あした" : `${n}日後`).join(" → ");
  // ステージの表示（●がすんだステージ）。dots の色は ok（緑）
  function badge(w, day = today()){
    if (!w) return "";
    if (w.out) return `<span class="chip ok">卒業</span>`;
    const c = { ...w }; fix(c, day);
    const n = c.iv.length, due = isDue(c, day);
    return `<span class="streak srs-st" title="ステージ（期限の日以降に正解すると進む）">${Array.from({ length: n }, (_, i) => `<i class="${i < c.st - 1 ? "on" : ""}"></i>`).join("")} ステージ${c.st}/${n}</span><span class="srs-due${due ? " now" : ""}">${due ? "今日が復習日" + (c.due < day ? "（繰り越し）" : "") : "次回 " + dayLabel(c.due, day)}</span>`;
  }
  function mtag(r){ return mottainai(r) ? `<span class="chip srs-mt" title="みんなの正答率が${r}%なのにまちがえた問題">もったいない ${r}%</span>` : ""; }
  // 答えたあとのひとこと
  function note(res){
    if (!res) return "";
    const w = res.w, n = (w.iv || []).length;
    if (!res.ok) {
      return res.was ? `ステージ1にもどりました。次の復習は${dayLabel(w.due)}`
        : `苦手リストに入りました。次の復習は${dayLabel(w.due)}。${ivText(w.iv)}の復習日に正解すると卒業です`;
    }
    if (w.out) return `🎉 最後のステージで正解！苦手リストから卒業しました`;
    if (res.early) return `正解！ただ、復習日（${dayLabel(w.due)}）の前なのでステージは進みません。復習日に正解すると進みます`;
    return `ステージ${w.st}/${n}に進みました。次の復習は${dayLabel(w.due)}`;
  }
  const RULE = "まちがえた問題は苦手リストに入り、あした → 3日後 → 7日後の復習日に正解すると卒業します（復習日より前の正解ではステージは進みません。試験が近づくと間隔は短くなります）";
  const RULE_SHORT = "復習日に正解でステージが進み、3回で卒業";
  window.KQSrs = { CAP, MOTTAINAI, today, addD, diff, exam, leftDays, ivFor, dueAfter, fix, fixAll, answer, isDue, active, score, mottainai, order, pick, todays, dueCount, nextDue, mergeRv, dayLabel, ivText, badge, mtag, note, RULE, RULE_SHORT };
})();
