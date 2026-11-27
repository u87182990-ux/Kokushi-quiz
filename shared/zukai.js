// 図解（段階表示）: 解説エリアの中で「次へ」で1手順ずつ進む SVG 図。
// 使い方：ページで ../shared/zukai.js を読み、解説の箱を出したあと ZukaiMount(箱, 問題id) を呼ぶ（図のない問題は何もしない）。
// CSS はこのファイルが自動で入れる。色はページの変数（--ink, --muted/--sub, --red/--ng など）を使う。
// window.ZUKAI[問題id] = { h: viewBox の高さ, s: [手順ごとの説明], d: () => SVG の中身 }
// SVG の中の <g data-s="n"> は n 番目の手順で現れる。data-dim="n" は n 番目の手順から薄くなる。
// 図の数値・曲線は data.js の解説文に合わせてある（解説文が正）。
(()=>{
const R = n => Math.round(n*10)/10;
const PI = Math.PI;

// 座標の箱 b={x,y,w,h} に、値の範囲 xr=[min,max], yr=[min,max] をのせる
function P(b, xr, yr){
  const X = v => R(b.x + (v-xr[0])/(xr[1]-xr[0])*b.w);
  const Y = v => R(b.y + b.h - (v-yr[0])/(yr[1]-yr[0])*b.h);
  return {X, Y, b, xr, yr,
    fn(f, a, c, cls="cv", n=90){ let d=""; for(let i=0;i<=n;i++){const t=a+(c-a)*i/n; d+=(i?"L":"M")+X(t)+" "+Y(f(t));} return `<path class="${cls}" d="${d}"/>`; },
    pl(pts, cls="cv"){ return `<path class="${cls}" d="${pts.map((p,i)=>(i?"L":"M")+X(p[0])+" "+Y(p[1])).join("")}"/>`; },
    // 点からx軸・y軸への点線
    guide(x, y, cls="gd2"){ const y0 = Y(Math.max(yr[0], Math.min(0, yr[1]))) ; return `<path class="${cls}" d="M${X(x)} ${y0}V${Y(y)}H${X(xr[0])}"/>`; },
    dot(x, y, cls="pt"){ return `<circle class="${cls}" cx="${X(x)}" cy="${Y(y)}" r="3.5"/>`; },
    hline(y, cls="dsh", a=xr[0], c=xr[1]){ return `<path class="${cls}" d="M${X(a)} ${Y(y)}H${X(c)}"/>`; },
    // 軸と目盛り。xt/yt = [[値, "ラベル"], ...]
    axes({xt=[], yt=[], xl="", yl="", x0=Math.max(yr[0],Math.min(0,yr[1]))}={}){
      const ya = Y(x0), xa = X(xr[0]);
      let s = `<path class="ax" d="M${xa} ${b.y-4}V${b.y+b.h}M${xa} ${ya}H${b.x+b.w+6}"/>`;
      s += `<path class="axh" d="M${b.x+b.w+6} ${ya}l-6 -3v6z"/><path class="axh" d="M${xa} ${b.y-6}l-3 6h6z"/>`;
      xt.forEach(([v,l])=>{ s += `<path class="ax" d="M${X(v)} ${ya}v4"/>`+T(X(v), ya+15, l, "lb", "middle"); });
      yt.forEach(([v,l])=>{ s += `<path class="ax" d="M${xa} ${Y(v)}h-4"/>`+T(xa-7, Y(v)+4, l, "lb", "end"); });
      if(xl) s += T(b.x+b.w+6, ya-7, xl, "lb", "end");
      if(yl) s += T(xa+6, b.y+4, yl, "lb", "start");
      return s;
    }
  };
}
const T = (x, y, s, cls="lb", a="start") => `<text class="${cls}" x="${R(x)}" y="${R(y)}" text-anchor="${a}">${s}</text>`;
const L = (x1,y1,x2,y2,cls="cv") => `<path class="${cls}" d="M${R(x1)} ${R(y1)}L${R(x2)} ${R(y2)}"/>`;
// 矢印（ベクトル）。cls の色で矢じりも塗る
const A = (x1,y1,x2,y2,cls="vec") => { const a=Math.atan2(y2-y1,x2-x1), h=8, w=4;
  const bx=x2-h*Math.cos(a), by=y2-h*Math.sin(a);
  return `<g class="${cls}"><path d="M${R(x1)} ${R(y1)}L${R(bx)} ${R(by)}"/><path class="hd" d="M${R(x2)} ${R(y2)}L${R(bx+w*Math.sin(a))} ${R(by-w*Math.cos(a))}L${R(bx-w*Math.sin(a))} ${R(by+w*Math.cos(a))}z"/></g>`; };
const G = (s, inner, dim) => `<g data-s="${s}"${dim?` data-dim="${dim}"`:""}>${inner}</g>`;
const tauRow = (p, n, unit) => Array.from({length:n},(_,i)=>T(p.X((i+1)*unit), p.Y(p.yr[0])+28, `${i+1}τ`, "lb2", "middle")).join("");

const Z = window.ZUKAI = {};

/* ---------- RC 充電（r-rcq） ---------- */
Z["r-rcq"] = { h: 200,
  s: ["時定数 τ = RC = 2 kΩ × 50 μF = <b>0.1 s</b>。横軸の1目盛り＝1τ。電圧はいずれ電源の 10 V に近づく。",
      "充電の式 Vc = 10(1 − e<sup>−t/τ</sup>)。はじめは速く、だんだんゆっくり 10 V に近づくカーブになる。",
      "1τ（0.1 s）で 10 V の 63%＝6.3 V まで来る。",
      "聞かれた 0.2 s は <b>2τ</b>。Vc = 10 × (1 − e<sup>−2</sup>) = 10 × (1 − 0.14) = <b>8.6 V</b>（86%）。"],
  d(){ const p = P({x:44,y:16,w:270,h:140},[0,0.5],[0,11]);
    return G(1, p.axes({xt:[[0.1,"0.1"],[0.2,"0.2"],[0.3,"0.3"],[0.4,"0.4"],[0.5,"0.5"]], yt:[[0,"0"],[5,"5"],[10,"10"]], xl:"t [s]", yl:"Vc [V]"})
              + tauRow(p,5,0.1) + p.hline(10) + T(p.X(0.5), p.Y(10)-6, "E = 10 V", "lb", "end"))
         + G(2, p.fn(t=>10*(1-Math.exp(-t/0.1)),0,0.5))
         + G(3, p.guide(0.1,6.32) + p.dot(0.1,6.32) + T(p.X(0.1)+8, p.Y(6.32)+14, "6.3 V（63%）"), 4)
         + G(4, p.guide(0.2,8.65,"gd3") + p.dot(0.2,8.65,"pt3") + T(p.X(0.2)+8, p.Y(8.65)+16, "8.6 V（86%）", "ans"));
  }};

/* ---------- RL 回路の電流（n13） ---------- */
Z["n13"] = { h: 200,
  s: ["RL 回路の時定数 τ = L/R = 0.2 H ÷ 100 Ω = <b>2 ms</b>（RL は割り算）。最後に流れる電流は 10 V ÷ 100 Ω = 100 mA。",
      "コイルは急な変化を嫌うので、電流は <b>0 から始まって</b> 100 mA に近づく：i = 100(1 − e<sup>−t/τ</sup>)。",
      "2 ms はちょうど 1τ。i = 100 × (1 − 0.37) = <b>63 mA</b>。",
      "注意：37 mA は「減っていく形」100e<sup>−t/τ</sup>（点線）の値。スイッチを入れた直後の RL 回路は増える形なので使わない。"],
  d(){ const p = P({x:44,y:16,w:270,h:140},[0,10],[0,110]);
    return G(1, p.axes({xt:[[2,"2"],[4,"4"],[6,"6"],[8,"8"],[10,"10"]], yt:[[0,"0"],[50,"50"],[100,"100"]], xl:"t [ms]", yl:"i [mA]"})
              + tauRow(p,5,2) + p.hline(100) + T(p.X(10), p.Y(100)-6, "10 V ÷ 100 Ω = 100 mA", "lb", "end"))
         + G(2, p.fn(t=>100*(1-Math.exp(-t/2)),0,10))
         + G(3, p.guide(2,63.2,"gd3") + p.dot(2,63.2,"pt3") + T(p.X(2)+8, p.Y(63.2)+16, "63 mA", "ans"))
         + G(4, p.fn(t=>100*Math.exp(-t/2),0,10,"dsh") + p.dot(2,36.8,"pt0") + T(p.X(2)+8, p.Y(36.8)+14, "37 mA（減る形・×）", "lb"));
  }};

/* ---------- 実効値と平均値（k-vava） ---------- */
Z["k-vava"] = { h: 200,
  s: ["最大値 Vm の正弦波。平均値は「山1つ（半周期）」で考える。",
      "平均値 Va = 2Vm/π ≒ <b>0.637Vm</b>：山の面積を、同じ幅の長方形にならした高さ。",
      "実効値 Ve = Vm/√2 ≒ <b>0.707Vm</b>：2乗の平均のルート。平均値より少し高い。",
      "Ve : Va = 1/√2 : 2/π。両方に √2π を掛けると <b>π : 2√2</b>（≒ 1.11 ＝ 波形率）。"],
  d(){ const p = P({x:44,y:16,w:250,h:150},[0,PI],[0,1.1]);
    const va = 2/PI, ve = 1/Math.SQRT2;
    return G(1, p.axes({xt:[[PI/2,"π/2"],[PI,"π"]], yt:[[0,"0"],[1,"Vm"]], xl:"ωt", yl:""})
              + p.fn(Math.sin,0,PI) + p.hline(1,"dsh"))
         + G(2, `<rect class="fl2" x="${p.X(0)}" y="${p.Y(va)}" width="${p.X(PI)-p.X(0)}" height="${p.Y(0)-p.Y(va)}"/>`
              + p.fn(Math.sin,0,PI) + p.hline(va,"cvo") + T(p.X(PI)+4, p.Y(va)+12, "Va 0.637", "ok"))
         + G(3, p.hline(ve,"gd3") + T(p.X(PI)+4, p.Y(ve)-3, "Ve 0.707", "ans"))
         + G(4, T(p.X(PI/2), p.Y(0.3), "Ve ÷ Va ≒ 1.11", "ans", "middle"));
  }};

/* ---------- 位相が進んだ電流の瞬時値（k-phase） ---------- */
Z["k-phase"] = { h: 210,
  s: ["電圧 v = Vm sin ωt。ωt = 0 のとき v = 0。",
      "電流は 30° <b>進む</b>＝波が左に 30° ずれる。最大値は Im = 2 × √2 = <b>2√2 A</b>（実効値の √2 倍）。",
      "v = 0 の瞬間（ωt = 0）：i = 2√2 × sin30° = 2√2 × ½ = <b>√2 A</b>。",
      "よくある間違い：実効値の 2 A に sin30° を掛けて 1 A にする。瞬時値の式には必ず最大値を使う。"],
  d(){ const p = P({x:44,y:14,w:270,h:170},[-PI/2,2*PI],[-3.2,3.2]);
    const s30 = PI/6;
    return G(1, p.axes({xt:[[PI,"180°"],[2*PI,"360°"]], yt:[[2*Math.SQRT2,"2√2"],[Math.SQRT2,"√2"],[0,"0"]], xl:"ωt", yl:""})
              + `<path class="ax" d="M${p.X(0)} ${p.b.y}V${p.b.y+p.b.h}"/>` + T(p.X(0)-4, p.Y(0)+14, "0", "lb2", "end")
              + p.fn(t=>2*Math.sin(t),0,2*PI,"cvm") + T(p.X(PI/2), p.Y(2)-6, "v", "lb", "middle"))
         + G(2, p.fn(t=>2*Math.SQRT2*Math.sin(t+s30),-PI/2,2*PI,"cvb") + T(p.X(PI/2-s30)+12, p.Y(2.83)+2, "i（最大 2√2 A）", "blu")
              + A(p.X(0),p.Y(-0.35),p.X(-s30),p.Y(-0.35),"vec0") + T(p.X(-s30/2), p.Y(-0.35)+16, "30°", "lb", "middle"))
         + G(3, `<path class="gd3" d="M${p.X(0)} ${p.Y(Math.SQRT2)}H${p.X(-PI/2)}"/>` + p.dot(0,Math.SQRT2,"pt3") + T(p.X(0)+8, p.Y(Math.SQRT2)-6, "i = √2 A", "ans"))
         + G(4, p.hline(1,"dsh",-PI/2,0) + T(p.X(-PI/2)+4, p.Y(1)+13, "1 A は ×", "lb"));
  }};

/* ---------- 交流の消費電力（k-power8） ---------- */
Z["k-power8"] = { h: 290,
  s: ["電圧 v：最大値 15 V。横軸の1目盛り = π/3（60°）。",
      "電流 i：最大値 10 A。v より1目盛り（π/3）遅れて 0 から上がる → <b>60° 遅れ</b>。",
      "v × i を掛けた電力の波（下）。マイナス（電源に返す時間）もあるので、平均すると (15 × 10 ÷ 2) × cos60° = 75 × 0.5 = 37.5 ≒ <b>38 W</b>。"],
  d(){ const p = P({x:44,y:14,w:270,h:130},[0,2*PI],[-16,16]);
       const q = P({x:44,y:180,w:270,h:90},[0,2*PI],[-45,120]);
    const tk = [1,2,3,4,5,6].map(k=>[k*PI/3, k%3?"":(k===3?"π":"2π")]);
    return G(1, p.axes({xt:tk, yt:[[15,"15"],[10,"10"],[0,"0"],[-15,"−15"]], xl:"ωt", yl:""})
              + p.fn(t=>15*Math.sin(t),0,2*PI) + T(p.X(PI/2), p.Y(15)-5, "v（15 V）", "lbi", "middle"))
         + G(2, p.fn(t=>10*Math.sin(t-PI/3),0,2*PI,"cvb") + T(p.X(PI/3+PI/2)+12, p.Y(10)+14, "i（10 A）", "blu", "start")
              + A(p.X(0),p.Y(-3),p.X(PI/3),p.Y(-3),"vec0") + T(p.X(PI/6), p.Y(-3)+15, "60°", "lb", "middle"))
         + G(3, q.axes({xt:[], yt:[[0,"0"],[37.5,"37.5"],[112.5,"112.5"]], xl:"ωt", yl:"p = v × i [W]"})
              + q.fn(t=>15*Math.sin(t)*10*Math.sin(t-PI/3),0,2*PI,"cvm") + q.hline(37.5,"gd3") + T(q.X(2*PI), q.Y(37.5)-5, "平均 37.5 W", "ans", "end"));
  }};

/* ---------- RLC 並列の電流（n11） ---------- */
Z["n11"] = { h: 214,
  s: ["並列なので電圧 V（100 V）は全部に共通。これを基準の向き（右）にする。IR = 100/50 = 2 A は V と同じ向き。",
      "IL = 100/25 = 4 A は 90° 遅れ（下向き）、IC = 100/50 = 2 A は 90° 進み（上向き）。",
      "上下は逆向きなので引き算：IL − IC = 4 − 2 = <b>2 A</b>（下向き）。",
      "IR と直角に合わせる：I = √(2² + 2²) = 2√2 ≒ <b>2.8 A</b>。全部そのまま足した 8 A は間違い。"],
  d(){ const o={x:110,y:76}, k=30;
    return G(1, `<path class="dsh" d="M${o.x} ${o.y}H${o.x+4.6*k}"/>` + T(o.x+4.6*k+4, o.y+4, "V", "lb")
              + A(o.x,o.y,o.x+2*k,o.y,"vec") + T(o.x+k, o.y-8, "IR = 2 A", "lbi", "middle"))
         + G(2, A(o.x,o.y,o.x,o.y+4*k,"vec") + T(o.x-8, o.y+4*k, "IL = 4 A", "lbi", "end")
              + A(o.x,o.y,o.x,o.y-2*k,"vecm") + T(o.x-8, o.y-2*k+10, "IC = 2 A", "lb", "end"), 3)
         + G(3, A(o.x+2*k,o.y,o.x+2*k,o.y+2*k,"vecr") + T(o.x+2*k+8, o.y+k+4, "IL − IC = 2 A", "ans"))
         + G(4, A(o.x,o.y,o.x+2*k,o.y+2*k,"vecr") + T(o.x+k-6, o.y+k+12, "I ≒ 2.8 A", "ans", "end"));
  }};

/* ---------- パルスの実効値（n8） ---------- */
Z["n8"] = { h: 278,
  s: ["周期 T = 5 ms、パルス幅 τ = 2 ms。1周期のうち 0.4（40%）の時間だけ 10 V。",
      "実効値は「2乗の平均のルート」。まず2乗する（下）：パルスの間は 10² = <b>100</b>、それ以外は 0。",
      "2乗を1周期で平均：100 × 0.4 = <b>40</b>。",
      "ルートをとって √40 ≒ <b>6.3 V</b>。ふつうの平均値（10 × 0.4 = 4 V）とは別物で、パルスでは実効値の方が大きい。"],
  d(){ const p = P({x:44,y:14,w:270,h:100},[0,18],[0,11]);
       const q = P({x:44,y:156,w:270,h:96},[0,18],[0,110]);
    const wave = (pp,a) => pp.pl([[0,0],[0,a],[2,a],[2,0],[5,0],[5,a],[7,a],[7,0],[10,0],[10,a],[12,a],[12,0],[13,0]]);
    return G(1, p.axes({xt:[[2,"2"],[5,"5"],[7,"7"],[10,"10"],[12,"12"]], yt:[[0,"0"],[10,"10"]], xl:"t [ms]", yl:"v [V]"}) + wave(p,10))
         + G(2, q.axes({xt:[[5,"5"],[10,"10"]], yt:[[0,"0"],[100,"100"]], xl:"t [ms]", yl:"v² [V²]"}) + wave(q,100))
         + G(3, q.hline(40,"gd3",0,13) + T(q.X(13)+4, q.Y(40)+4, "平均 40", "ans"))
         + G(4, p.hline(6.32,"gd3",0,13) + T(p.X(13)+4, p.Y(6.32)+4, "実効値 6.3", "ans")
              + p.hline(4,"dsh",0,13) + T(p.X(13)+4, p.Y(4)+8, "平均値 4", "lb"));
  }};

/* ---------- 三角波の実効値（n9） ---------- */
Z["n9"] = { h: 206,
  s: ["最大値 Vm = 6 V、周期 4 ms の三角波。",
      "同じ最大値の正弦波（点線）と比べると、三角波は山がとがって細い → 実効値は正弦波より<b>小さい</b>。",
      "三角波の実効値 = Vm/√3 = 6 ÷ 1.73 ≒ <b>3.5 V</b>。正弦波の Vm/√2 ≒ 4.2 V と取り違えないこと。"],
  d(){ const p = P({x:44,y:14,w:270,h:170},[0,8],[-7,7]);
    return G(1, p.axes({xt:[[1,"1"],[2,"2"],[3,"3"],[4,"4"],[8,"8"]], yt:[[6,"6"],[0,"0"],[-6,"−6"]], xl:"t [ms]", yl:"v [V]"})
              + p.pl([[0,0],[1,6],[3,-6],[5,6],[7,-6],[8,0]]))
         + G(2, p.fn(t=>6*Math.sin(2*PI*t/4),0,8,"dsh") + T(p.X(1.5), p.Y(6)-4, "正弦波", "lb", "middle"))
         + G(3, p.hline(6/Math.SQRT2,"dsh",4.6,8) + T(p.X(8)+2, p.Y(4.24)-2, "4.2", "lb")
              + p.hline(6/Math.sqrt(3),"gd3") + T(p.X(8)+2, p.Y(3.46)+10, "3.5", "ans"));
  }};

/* ---------- 三相 Y 結線の線間電圧（r-3phv） ---------- */
Z["r-3phv"] = { h: 220,
  s: ["Y 結線の相電圧 Ea・Eb・Ec（各 100 V）は 120° ずつずれている。",
      "線間電圧 Vab は2つの相電圧の差 Ea − Eb。−Eb（Eb を逆向きにしたもの）を Ea の先につなぐ。",
      "できた矢印の長さ = 2 × 100 × cos30° = √3 × 100 ≒ <b>173 V</b>。向きは Ea より 30° 進む。"],
  d(){ const o={x:120,y:116}, k=0.8, v=(deg,len=100)=>[o.x+len*k*Math.cos(deg*PI/180), o.y-len*k*Math.sin(deg*PI/180)];
    const a=v(0), b=v(-120), c=v(120), ab=v(30,173.2);
    const arc = `<path class="dsh" d="M${R(o.x+36)} ${o.y}A36 36 0 0 0 ${R(o.x+36*Math.cos(PI/6))} ${R(o.y-36*Math.sin(PI/6))}"/>`;
    return G(1, A(o.x,o.y,a[0],a[1],"vec") + T(a[0]+6,a[1]+4,"Ea","lbi")
              + A(o.x,o.y,b[0],b[1],"vec") + T(b[0]-6,b[1]+4,"Eb","lbi","end")
              + A(o.x,o.y,c[0],c[1],"vec") + T(c[0]-6,c[1]+4,"Ec","lbi","end")
              + T(o.x+40, o.y+16, "各 100 V", "lb", "middle"))
         + G(2, A(a[0],a[1],ab[0],ab[1],"vecm") + T(ab[0]+6, (a[1]+ab[1])/2+10, "−Eb", "lb"))
         + G(3, A(o.x,o.y,ab[0],ab[1],"vecr") + T(ab[0]-4, ab[1]-8, "Vab ≒ 173 V", "ans", "middle")
              + arc + T(o.x+42, o.y-6, "30°", "lb"));
  }};

/* ================= 部品（回路図・棒グラフ） ================= */
const W = (...p) => `<path class="wr" d="${p.map((q,i)=>(i?"L":"M")+R(q[0])+" "+R(q[1])).join("")}"/>`;
const Dot = (x,y,cls="nd") => `<circle class="${cls}" cx="${R(x)}" cy="${R(y)}" r="2.6"/>`;
// 抵抗（横向き／縦向き）。ラベルは上（横）か右（縦）。cls="hl" で赤く強調
const Rh = (x,y,lab="",cls="",below=false) => `<rect class="rz ${cls}" x="${R(x-14)}" y="${R(y-6)}" width="28" height="12"/>`+(lab?T(x,below?y+19:y-10,lab,cls?"ans":"lbi","middle"):"");
const Rv = (x,y,lab="",cls="",left=false) => `<rect class="rz ${cls}" x="${R(x-6)}" y="${R(y-14)}" width="12" height="28"/>`+(lab?T(left?x-10:x+10,y+4,lab,cls?"ans":"lbi",left?"end":"start"):"");
// 斜めの抵抗（ブリッジ用）
const Rr = (x,y,deg,lab="",cls="",lx=0,ly=0) => `<rect class="rz ${cls}" x="${R(x-14)}" y="${R(y-6)}" width="28" height="12" transform="rotate(${deg} ${R(x)} ${R(y)})"/>`+(lab?T(x+lx,y+ly,lab,cls?"ans":"lbi","middle"):"");
// 電池（縦の線の上。up=true で＋が上）
const Bv = (x,y,lab="",up=true,right=false) => `<rect class="gap" x="${R(x-13)}" y="${R(y-5)}" width="26" height="10"/><path class="pl" d="M${R(x-12)} ${R(y+(up?-3:3))}h24"/><path class="pl2" d="M${R(x-6)} ${R(y+(up?3:-3))}h12"/>`+(lab?T(right?x+16:x-16,y+4,lab,"lbi",right?"start":"end"):"");
// 電池（横の線の上。left=true で＋が左）
const Bh = (x,y,lab="",left=true) => `<rect class="gap" x="${R(x-5)}" y="${R(y-13)}" width="10" height="26"/><path class="pl" d="M${R(x+(left?-3:3))} ${R(y-12)}v24"/><path class="pl2" d="M${R(x+(left?3:-3))} ${R(y-6)}v12"/>`+(lab?T(x,y-17,lab,"lbi","middle"):"");
// コンデンサ（縦の線の上／横の線の上）
const Cv = (x,y,lab="",cls="",left=false) => `<rect class="gap" x="${R(x-13)}" y="${R(y-4)}" width="26" height="8"/><path class="pl ${cls}" d="M${R(x-11)} ${R(y-3)}h22M${R(x-11)} ${R(y+3)}h22"/>`+(lab?T(left?x-15:x+15,y+4,lab,cls?"ans":"lbi",left?"end":"start"):"");
const Ch = (x,y,lab="",cls="") => `<rect class="gap" x="${R(x-4)}" y="${R(y-13)}" width="8" height="26"/><path class="pl ${cls}" d="M${R(x-3)} ${R(y-11)}v22M${R(x+3)} ${R(y-11)}v22"/>`+(lab?T(x,y-16,lab,cls?"ans":"lbi","middle"):"");
// 定電流源（矢印が下向き）
const Isrc = (x,y,lab="") => `<circle class="rz" cx="${R(x)}" cy="${R(y)}" r="11"/>`+A(x,y-7,x,y+7,"vec")+(lab?T(x-15,y+4,lab,"lbi","end"):"");
// ダイオード（縦。up=true で下→上に流れる向き）
const Dv = (x,y,up=true,cls="") => { const s=up?-1:1; return `<rect class="gap" x="${R(x-9)}" y="${R(y-8)}" width="18" height="16"/><path class="dio ${cls}" d="M${R(x-8)} ${R(y-6*s)}L${R(x+8)} ${R(y-6*s)}L${R(x)} ${R(y+6*s)}z"/><path class="pl ${cls}" d="M${R(x-8)} ${R(y+6*s)}h16"/>`; };
// オペアンプ（左端 x、中心 y。入力は y−10（−）と y+10（＋）、出力は x+46）
const Op = (x,y) => `<path class="op" d="M${R(x)} ${R(y-26)}L${R(x)} ${R(y+26)}L${R(x+46)} ${R(y)}z"/>`+T(x+4,y-6,"−","lbi")+T(x+4,y+15,"+","lbi");
const Gnd = (x,y) => `<path class="wr" d="M${R(x-8)} ${R(y)}h16M${R(x-5)} ${R(y+3)}h10M${R(x-2)} ${R(y+6)}h4"/>`;
const Box = (x,y,w,h,lab,cls="blk",tc="lbi") => `<rect class="${cls}" x="${R(x)}" y="${R(y)}" width="${R(w)}" height="${R(h)}" rx="4"/>`+(lab?T(x+w/2,y+h/2+4,lab,tc,"middle"):"");
// 帯グラフ：parts=[[値, ラベル, 色クラス]]、値の比で幅を分ける
function Bar(x,y,w,h,parts){ const tot=parts.reduce((a,p)=>a+p[0],0); let s="",cx=x;
  parts.forEach(([v,lab,cls="fl3"])=>{ const ww=w*v/tot; s+=`<rect class="${cls} bs" x="${R(cx)}" y="${R(y)}" width="${R(ww)}" height="${h}"/>`+(lab?T(cx+ww/2,y+h/2+4,lab,cls==="fl"?"ans":"lbi","middle"):""); cx+=ww; });
  return s; }
// 両矢印の寸法線
const Dim = (x1,y1,x2,y2,lab,cls="lb",off=12) => A((x1+x2)/2,(y1+y2)/2,x1,y1,"vec0")+A((x1+x2)/2,(y1+y2)/2,x2,y2,"vec0")+(lab?T((x1+x2)/2+(y1===y2?0:off),(y1+y2)/2+(y1===y2?-6:4),lab,cls,y1===y2?"middle":"start"):"");

/* ================= 直流回路 ================= */
// 抵抗の直並列（k-sp・r-sp は同じ回路）
function spFig(rui){
  return { h: 206,
    s: ["回路の形：上の3本の並列 → 3 Ω → 下の並列（20 Ω と、5 + 25 Ω の枝）が<b>直列</b>につながっている。",
        "並列をまとめる。上：1/R = 1/20 + 1/30 + 1/60 = 6/60 → <b>10 Ω</b>。下：右の枝は 5 + 25 = 30 Ω、20 Ω と 30 Ω の並列 → 20 × 30 ÷ 50 = <b>12 Ω</b>。",
        "全体 10 + 3 + 12 = 25 Ω → 全電流 = 100 ÷ 25 = <b>4 A</b>。",
        rui ? "上の並列にかかる電圧 = 4 A × 10 Ω = 40 V。60 Ω の電流 = 40 ÷ 60 ≒ <b>0.67 A</b>（20 Ω に 2 A、30 Ω に 1.33 A、合計 4 A）。"
            : "下の並列にかかる電圧 = 4 A × 12 Ω = 48 V。I = 48 ÷ 20 = <b>2.4 A</b>（右の枝は 1.6 A、合計 4 A で検算OK）。"],
    d(){ const y=50, yb=132;
      const c = W([40,yb],[40,y],[64,y]) + W([64,20],[64,80]) + W([136,20],[136,80]) + [20,50,80].map(v=>W([64,v],[136,v])).join("")
        + W([136,y],[192,y]) + W([192,35],[192,65]) + W([304,35],[304,65]) + W([192,35],[304,35]) + W([192,65],[304,65]) + W([304,y],[322,y],[322,yb],[40,yb])
        + Bv(40,92,"100 V") + Rh(100,20,"20 Ω",rui?"":"") + Rh(100,50,"30 Ω") + Rh(100,80,rui?"":"60 Ω") + Rh(164,y,"3 Ω") + Rh(248,35,rui?"20 Ω":"") + Rh(226,65,"5 Ω") + Rh(272,65,"25 Ω")
        + (rui ? T(100,70,"60 Ω","lbi","middle") : A(200,35,214,35,"vecr") + T(206,27,"I","ans","middle") + T(248,25,"20 Ω","lbi","middle"));
      const eq = (x1,x2,lab,cls="ans") => `<path class="ax" d="M${x1} 146v4H${x2}v-4"/>` + T((x1+x2)/2,166,lab,cls,"middle");
      const hl = rui ? Rh(100,80,"","hl") + T(100,98,"0.67 A","ans","middle") : Rh(248,35,"","hl") + T(248,100,"I = 2.4 A","ans","middle");
      return G(1, c)
        + G(2, eq(64,136,"10 Ω") + eq(150,178,"3 Ω","lbi") + eq(192,304,"12 Ω"))
        + G(3, A(240,yb,170,yb,"vecr") + T(205,yb-6,"全電流 4 A","ans","middle"))
        + G(4, T(100,186,"40 V",rui?"ans":"lb","middle") + T(164,186,"12 V","lb","middle") + T(248,186,"48 V",rui?"lb":"ans","middle") + hl);
    }};
}
Z["k-sp"] = spFig(false);
Z["r-sp"] = spFig(true);

// ブリッジの平衡（k-bridge・r-bridge）
function bridgeFig(tl,tr,bl,rx,ans){
  return { h: 214,
    s: ["G の振れが 0 ＝ 平衡。平衡のときは<b>斜め向かいの辺どうしの積が等しい</b>（赤どうし・青どうし）。",
        `右下の辺（6 Ω と R の並列）を Rx とおく。${tl} × Rx = ${tr} × ${bl} = ${tr*bl} → <b>Rx = ${rx} Ω</b>。`,
        `6 Ω と R の並列が ${rx} Ω：6R ÷ (6 + R) = ${rx} → <b>R = ${ans} Ω</b>。Rx で止めて ${rx} を選ばないこと。`],
    d(){ const t=[150,24], l=[80,94], r=[220,94], b=[150,164];
      const mid=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2];
      const c = W(t,l,b,r,t) + W(l,[l[0]+30,l[1]]) + W([r[0]-30,r[1]],r) + `<circle class="rz" cx="150" cy="94" r="11"/>` + T(150,98,"G","lbi","middle")
        + W([l[0]+30,94],[139,94]) + W([161,94],[r[0]-30,94])
        + W(t,[150,8],[30,8],[30,180],[150,180],b) + Bv(30,94,"E")
        + Dot(...t) + Dot(...b) + Dot(...l) + Dot(...r);
      const m1=mid(t,l), m2=mid(t,r), m3=mid(l,b), m4=mid(r,b);
      return G(1, c + Rr(m1[0],m1[1],-45,`${tl} Ω`,"",-26,-8) + Rr(m2[0],m2[1],45,`${tr} Ω`,"",26,-8)
                    + Rr(m3[0],m3[1],45,`${bl} Ω`,"",-26,14) + Rr(m4[0],m4[1],-45,"Rx","",22,14)
                    + `<path class="gd3" d="M${m1[0]} ${m1[1]}L${m4[0]} ${m4[1]}"/><path class="gdb" d="M${m2[0]} ${m2[1]}L${m3[0]} ${m3[1]}"/>`)
           + G(2, T(m4[0],m4[1]+32,`Rx = ${rx} Ω`,"ans","middle"))
           + G(3, W([284,124],[284,136]) + W([270,136],[298,136]) + W([270,136],[270,176]) + W([298,136],[298,176]) + W([270,176],[298,176]) + W([284,176],[284,186])
                + Rv(270,156,"6 Ω","",true) + Rv(298,156,"","hl") + T(284,118,"Rx の中身","lb","middle") + T(284,202,`R = ${ans} Ω`,"ans","middle"));
    }};
}
Z["k-bridge"] = bridgeFig(300,60,10,2,3);
Z["r-bridge"] = bridgeFig(200,60,10,3,6);

// 定電流源のある回路（k-isrc・r-isrc）
function isrcFig(I,V){
  return { h: 190,
    s: ["P の電位を V とおく（下の線が 0 V）。<b>P から出ていく電流を全部足すと 0</b>（キルヒホッフの第1法則）。",
        `定電流源から ${I} A、1 Ω から V/1、2 Ω の枝から (V − 16)/2 が出ていく。`,
        `${I} + V + (V − 16)/2 = 0 → 2倍して ${2*I} + 2V + V − 16 = 0 → 3V = ${16-2*I} → <b>V = ${V} V</b>。`],
    d(){ const yt=40, yb=160;
      const c = W([70,yt],[270,yt]) + W([70,yt],[70,yb]) + W([170,yt],[170,yb]) + W([270,yt],[270,yb]) + W([70,yb],[270,yb]) + Gnd(170,yb+4)
        + Isrc(70,100,`${I} A`) + Rv(170,100,"1 Ω") + Rv(270,80,"2 Ω") + Bv(270,128,"16 V",true,true) + Dot(170,yt) + T(170,yt-10,"P","lbi","middle");
      return G(1, c + T(196,yt-10,"電位 V","lb"))
        + G(2, A(84,72,84,100,"vecr") + T(90,96,`${I}`,"ans") + A(186,62,186,90,"vecr") + T(192,70,"V","ans")
             + A(250,56,250,84,"vecr") + T(244,64,"(V−16)/2","ans","end"))
        + G(3, T(170,yt-24,`P = ${V} V`,"ans","middle"));
    }};
}
Z["k-isrc"] = isrcFig(5,2);
Z["r-isrc"] = isrcFig(2,4);

// 倍率器（k-mult）
Z["k-mult"] = { h: 160,
  s: ["100 V まで測るには、10 V までの電圧計に<b>倍率器 Rm を直列</b>につなぐ。",
      "電圧計が受け持つのは 10 V、残りの <b>90 V</b> を倍率器が受け持つ。",
      "直列は電流が同じなので、電圧は抵抗に比例：20 kΩ : Rm = 10 : 90 → <b>Rm = 180 kΩ</b>（= 20 × (10 − 1)）。"],
  d(){ const y=50;
    const c = W([30,y],[310,y]) + `<circle class="rz" cx="110" cy="${y}" r="16"/>` + T(110,y+4,"V","lbi","middle") + T(110,y-24,"電圧計 20 kΩ","lbi","middle")
      + Rh(230,y,"倍率器 Rm") + Dot(30,y) + Dot(310,y) + Dim(30,y+26,310,y+26,"100 V","lbi");
    return G(1, c)
      + G(2, Bar(30,108,280,22,[[10,"10 V","fl3"],[90,"90 V","fl"]]))
      + G(3, T(230,y+20,"180 kΩ","ans","middle"));
  }};
// 分流器（r-shunt）
Z["r-shunt"] = { h: 176,
  s: ["10 mA まで測るには、1 mA までの電流計に<b>分流器 Rs を並列</b>につなぐ。",
      "電流計に流すのは 1 mA、残りの <b>9 mA</b> を分流器に逃がす。",
      "並列は電圧が同じ：9 Ω × 1 mA = Rs × 9 mA → <b>Rs = 1 Ω</b>（= 9 ÷ (10 − 1)）。"],
  d(){ const c = W([30,70],[90,70]) + W([90,40],[90,100]) + W([250,40],[250,100]) + W([90,40],[250,40]) + W([90,100],[250,100]) + W([250,70],[310,70])
      + `<circle class="rz" cx="170" cy="40" r="14"/>` + T(170,44,"A","lbi","middle") + T(170,22,"電流計 9 Ω","lbi","middle") + Rh(170,100,"分流器 Rs","",true)
      + A(36,62,72,62,"vec") + T(54,54,"10 mA","lbi","middle");
    return G(1, c)
      + G(2, Bar(30,142,280,22,[[1,"","fl3"],[9,"9 mA → 分流器","fl"]]) + T(36,136,"1 mA → 電流計","lb"))
      + G(3, T(170,136,"Rs = 1 Ω","ans","middle"));
  }};

// パルスの平均値（k-pulse・r-pulse）
function pulseFig(amp,w,avg){
  const T0 = amp*w/avg, f = 1000/T0;
  return { h: 190,
    s: [`パルス1個の「面積」＝ ${amp} mA × ${w} ms = <b>${amp*w}</b>（mA·ms）。`,
        `平均値 ${avg} mA は、この面積を1周期 T に平らにならした高さ。${avg} × T = ${amp*w} → <b>T = ${T0} ms</b>。`,
        `パルスは ${T0} ms ごとにくり返す。f = 1 ÷ ${T0/1000} s = <b>${f} Hz</b>（ms → s の変換を忘れずに）。`],
    d(){ const xm=3*T0, p = P({x:44,y:20,w:270,h:120},[0,xm],[0,amp*1.2]);
      const pulse = t0 => p.pl([[t0,0],[t0,amp],[t0+w,amp],[t0+w,0]]);
      return G(1, p.axes({xt:[[w,String(w)],[T0,String(T0)],[2*T0,String(2*T0)]], yt:[[0,"0"],[avg,String(avg)],[amp,String(amp)]], xl:"t [ms]", yl:"i [mA]"})
                + `<rect class="fl" x="${p.X(0)}" y="${p.Y(amp)}" width="${R(p.X(w)-p.X(0))}" height="${R(p.Y(0)-p.Y(amp))}"/>` + pulse(0)
                + T(p.X(w/2), p.Y(amp/2)+4, String(amp*w), "lbi", "middle"))
           + G(2, `<rect class="fl2" x="${p.X(0)}" y="${p.Y(avg)}" width="${R(p.X(T0)-p.X(0))}" height="${R(p.Y(0)-p.Y(avg))}"/>`
                + pulse(0) + p.hline(avg,"gd3",0,T0) + T(p.X(w)+4, p.Y(avg)-6, `平均 ${avg} mA`, "lb")
                + A(p.X(T0/2),p.Y(0)+30,p.X(0),p.Y(0)+30,"vec0") + A(p.X(T0/2),p.Y(0)+30,p.X(T0),p.Y(0)+30,"vec0")
                + T(p.X(T0/2), p.Y(0)+44, `T = ${T0} ms`, "ans", "middle"))
           + G(3, p.pl([[w,0],[T0,0]]) + pulse(T0) + p.pl([[T0+w,0],[2*T0,0]]) + pulse(2*T0) + p.pl([[2*T0+w,0],[xm,0]])
                + T(p.X(xm), p.Y(amp*1.12), `f = 1/T = ${f} Hz`, "ans", "end"));
    }};
}
Z["k-pulse"] = pulseFig(5,20,2);
Z["r-pulse"] = pulseFig(4,10,1);

// はしご形回路（n1）
Z["n1"] = { h: 200,
  s: ["電源から<b>遠い側</b>からまとめていく。右の枝：2 Ω と 4 Ω は直列 → 6 Ω。",
      "その 6 Ω と 12 Ω が並列：12 × 6 ÷ 18 = <b>4 Ω</b>。全体は 4 + 4 = 8 Ω → 全電流 = 24 ÷ 8 = <b>3 A</b>。",
      "並列部分の電圧 = 3 A × 4 Ω = 12 V。右の枝の電流 I = 12 ÷ 6 = <b>2 A</b>（12 Ω には 1 A、合計 3 A）。"],
  d(){ const yt=40, yb=140;
    const c = W([40,yb],[40,yt],[300,yt],[300,yb],[40,yb]) + W([180,yt],[180,yb]) + Dot(180,yt) + Dot(180,yb)
      + Bv(40,90,"24 V") + Rh(110,yt,"4 Ω") + Rv(180,90,"12 Ω","",true) + Rh(240,yt,"2 Ω") + Rv(300,90,"4 Ω");
    return G(1, c + `<path class="ax" d="M228 ${yt-22}H312V${yb}"/>` + T(318,64,"6 Ω","ans"))
      + G(2, `<path class="ax" d="M166 ${yb+10}v4H312v-4"/>` + T(240,yb+28,"並列 → 4 Ω","ans","middle") + A(150,yb,90,yb,"vecr") + T(120,yb+16,"3 A","ans","middle"))
      + G(3, A(262,yt,292,yt,"vecr") + T(277,yt+16,"I = 2 A","ans","middle") + T(166,124,"1 A","lb","end") + T(180,yb+48,"並列部分の電圧 12 V","lb","middle"));
  }};

// 節点電位法（n2）
Z["n2"] = { h: 190,
  s: ["上の節点の電位を V とおく（下の線が 0 V）。左は 10 V と 1 Ω、右は 5 V と 1 Ω、中央が 2 Ω。",
      "入る電流 = 出る電流：(10 − V)/1 + (5 − V)/1 = V/2 → 15 − 2V = V/2 → <b>V = 6 V</b>。",
      "I = 6 ÷ 2 = <b>3 A</b>。左から 4 A 入り、右の枝は (5 − 6)/1 = −1 A（5 V の電池に流れ込む）。4 − 1 = 3 A。"],
  d(){ const yt=40, yb=160;
    const c = W([60,yt],[280,yt]) + W([60,yt],[60,yb],[280,yb],[280,yt]) + W([170,yt],[170,yb]) + Dot(170,yt) + Dot(170,yb)
      + Rv(60,70,"1 Ω","",true) + Bv(60,124,"10 V") + Rv(280,70,"1 Ω") + Bv(280,124,"5 V",true,true) + Rv(170,100,"2 Ω","",true);
    return G(1, c + T(170,yt-10,"V","lbi","middle"))
      + G(2, T(178,yt-10,"= 6 V","ans") + A(80,yt+10,140,yt+10,"vecr") + T(110,yt+24,"4 A","ans","middle")
           + A(260,yt+10,200,yt+10,"vec0") + T(230,yt+24,"−1 A","lb","middle"))
      + G(3, A(186,82,186,118,"vecr") + T(192,104,"I = 3 A","ans"));
  }};

/* ================= コンデンサ・過渡現象 ================= */
// 抵抗とコンデンサの分圧（k-ab・r-ab）
function abFig(rt,rb){
  const a = 10*rb/(rt+rb);
  return { h: 196,
    s: ["下の線を 0 V にして、a と b の電位を<b>別々に</b>出す。",
        `a（抵抗側）：${rt} Ω と ${rb} Ω の分圧 → a = 10 × ${rb} ÷ ${rt+rb} = <b>${a} V</b>。`,
        "b（コンデンサ側）：直列コンデンサは電荷が同じなので、電圧は<b>容量に反比例</b>。30 : 20 → 電圧は 2 : 3 → 上 4 V、下 6 V → <b>b = 6 V</b>。",
        `a − b 間 = 6 − ${a} = <b>${6-a} V</b>。${a===6?"抵抗の比とコンデンサの逆比が同じなので同電位（ブリッジの平衡と同じ）。":""}`],
    d(){ const yt=30, yb=170, ym=100;
      const c = W([40,yb],[40,yt],[260,yt],[260,yb],[40,yb]) + W([150,yt],[150,yb]) + Dot(150,yt) + Dot(150,yb)
        + Bv(40,100,"10 V") + Rv(150,65,`${rt} Ω`,"",true) + Rv(150,135,`${rb} Ω`,"",true) + Cv(260,65,"30 μF") + Cv(260,135,"20 μF")
        + Dot(150,ym) + Dot(260,ym) + T(162,ym+4,"a","lbi") + T(248,ym+4,"b","lbi","end") + `<path class="dsh" d="M166 ${ym-12}H244"/>`;
      return G(1, c)
        + G(2, T(205,ym-18,`a = ${a} V`,"ans","middle"))
        + G(3, T(276,88,"4 V","lb") + T(276,158,"6 V","ans") + T(205,ym+22,"b = 6 V","ans","middle"))
        + G(4, T(205,ym+42,`差 = ${6-a} V`,"ans","middle"));
    }};
}
Z["k-ab"] = abFig(10,10);
Z["r-ab"] = abFig(10,15);

// 平行板コンデンサの倍率（k-capd・r-capd）
function capdFig(k,er){
  return { h: 196,
    s: ["C = ε₀εr S ÷ d。容量は <b>εr に比例</b>、距離 d に<b>反比例</b>。",
        `距離を 1/${k} にすると、容量は <b>${k} 倍</b>（近いほど電荷をためやすい）。`,
        `比誘電率 ${er} の誘電体で さらに ${er} 倍。合計 ${k} × ${er} = <b>${k*er} 倍</b>（倍率どうしは掛ける）。`],
    d(){ const plate=(x,y,w)=>`<path class="pl2" d="M${x} ${y}h${w}"/>`;
      const d0=96, d1=d0/k;
      const A0 = plate(30,40,110) + plate(30,40+d0,110) + Dim(150,40,150,40+d0,"l","lb",6) + T(85,30,"図A（はじめ）","lbi","middle");
      const B1 = plate(190,40,110) + plate(190,40+d1,110) + Dim(310,40,310,40+d1,`l/${k}`,"lb",6) + T(245,30,"図B","lbi","middle");
      return G(1, A0 + T(85,170,"C","lbi","middle"))
        + G(2, B1 + T(245,170,`× ${k}`,"ans","middle"))
        + G(3, `<rect class="fl" x="191" y="${41}" width="108" height="${R(d1-2)}"/>` + T(245,40+d1/2+4,`εr = ${er}`,"ans","middle") + T(245,188,`合計 ${k*er} 倍`,"ans","middle"));
    }};
}
Z["k-capd"] = capdFig(2,3);
Z["r-capd"] = capdFig(4,5);

// 平行平板コンデンサの容量（k-cap3d・r-cap3d）
function cap3dFig(a,b,d,S,Sd,C){
  return { h: 190,
    s: [`面積 S = ${a} mm × ${b} mm。m に直すと <b>${S} m²</b>（mm² → m² は 10⁻⁶ 倍）。`,
        `極板の間隔 d = ${d} mm = ${d} × 10⁻³ m。S ÷ d = <b>${Sd} m</b>。`,
        `C = εS/d = 5.0 × 10⁻¹¹ × ${Sd} = <b>${C} pF</b>（1 pF = 10⁻¹² F）。`],
    d(){ const pg=(y,cls)=>`<path class="${cls}" d="M70 ${y}L210 ${y}L270 ${y-40}L130 ${y-40}z"/>`;
      return G(1, pg(80,"plt") + T(140,94,`${b} mm`,"lbi","middle") + T(250,66,`${a} mm`,"lbi"))
        + G(2, pg(150,"plt") + W([70,80],[70,150]) + W([210,80],[210,150]) + Dim(54,80,54,150,"","lb") + T(48,119,`d = ${d} mm`,"ans","end"))
        + G(3, T(170,178,`C = ${C} pF`,"ans","middle"));
    }};
}
Z["k-cap3d"] = cap3dFig(5,10,5,"5 × 10⁻⁵","10⁻²","0.5");
Z["r-cap3d"] = cap3dFig(10,10,2,"10⁻⁴","5 × 10⁻²","2.5");

// RC 回路の単パルス応答（k-rc・r-rc）
function rcFig(C,Rk){
  return { h: 206,
    s: ["入力（点線）は 10 V・10 ms のパルス。出力 vo はゆっくり上がって、パルスが終わるとゆっくり下がる。",
        "最終値 10 V の <b>63 %（6.3 V）</b>に届く時間が時定数 τ。グラフでは約 <b>3 ms</b>（下がる側も 37 % まで約 3 ms で同じ）。",
        `τ = RC → R = τ ÷ C = 3 ms ÷ ${C} μF = <b>${Rk} kΩ</b>（μF × kΩ = ms）。`],
    d(){ const p = P({x:44,y:16,w:270,h:150},[0,25],[0,11]);
      const v10 = 10*(1-Math.exp(-10/3));
      const vo = t => t<=10 ? 10*(1-Math.exp(-t/3)) : v10*Math.exp(-(t-10)/3);
      return G(1, p.axes({xt:[[3,"3"],[10,"10"],[13,"13"],[20,"20"]], yt:[[0,"0"],[6.3,"6.3"],[10,"10"]], xl:"t [ms]", yl:"v [V]"})
              + p.pl([[0,0],[0,10],[10,10],[10,0]],"dsh") + p.fn(vo,0,25))
        + G(2, p.guide(3,6.32,"gd3") + p.dot(3,6.32,"pt3") + T(p.X(3)+6,p.Y(6.32)+30,"τ ≒ 3 ms","ans")
             + p.dot(13,v10*Math.exp(-1),"pt0") + T(p.X(13)+8,p.Y(3.5)+2,"37 %（13 ms）","lb"))
        + G(3, T(p.X(25),p.Y(10.6),`R = ${Rk} kΩ`,"ans","end"));
    }};
}
Z["k-rc"] = rcFig(1,3);
Z["r-rc"] = rcFig(0.5,6);

// 微分回路（k-cr・r-cr）
function crFig(rui){
  return { h: 226,
    s: ["図Aは C が直列・R が出力側 → <b>微分回路</b>。入力は幅 T の方形パルス。",
        "出力は入力が<b>変わった瞬間だけ</b>鋭く立ち、すぐ 0 に戻る ＝ 充電がすぐ終わる ＝ 時定数 CR が T より<b>ずっと短い</b>。",
        rui ? "CR = 0.01 μF × 10 kΩ = 0.1 ms。きれいな微分波形には CR ≪ T → <b>T ≫ 0.1 ms</b>。CR が長いと（点線）なかなか 0 に戻らず微分にならない。"
            : "CR が T と同じくらい長いと（点線）なかなか 0 に戻らず、微分波形にならない。よって <b>CR &lt; T</b>（正確には CR ≪ T）。"],
    d(){ const a = P({x:44,y:14,w:270,h:60},[0,10],[0,1.3]); const p = P({x:44,y:110,w:270,h:96},[0,10],[-1.2,1.2]);
      const tc=0.15, big=2.5;
      const out=(k)=>t=> t<2?0: t<6? Math.exp(-(t-2)/k) : Math.exp(-(t-2)/k)-Math.exp(-(t-6)/k);
      return G(1, a.axes({xt:[], yt:[[0,"0"],[1,"E"]], xl:"t", yl:"入力"}) + a.pl([[0,0],[2,0],[2,1],[6,1],[6,0],[10,0]])
              + Dim(a.X(2),a.Y(1)-10,a.X(6),a.Y(1)-10,"T","lbi"))
        + G(2, p.axes({xt:[], yt:[[1,"E"],[0,"0"],[-1,"−E"]], xl:"t", yl:"出力"}) + p.fn(out(tc),0,10,"cv",400) + T(p.X(2)+10,p.Y(0.8),"CR が短い","ans"))
        + G(3, p.fn(out(big),0,10,"dsh",200) + T(p.X(3.2),p.Y(-0.45),"CR が長い（×）","lb"));
    }};
}
Z["k-cr"] = crFig(false);
Z["r-cr"] = crFig(true);

// コンデンサの直並列（n3）
Z["n3"] = { h: 186,
  s: ["C₂ と C₃ は<b>並列</b> → そのまま足して 3 + 1 = 4 μF。",
      "それと C₁ = 2 μF が直列：2 × 4 ÷ (2 + 4) = 4/3 μF。全体の電荷 Q = 4/3 × 12 = <b>16 μC</b>（直列なので C₁ にも並列部分にも同じ 16 μC）。",
      "電圧 = Q ÷ C。C₁ は 16 ÷ 2 = 8 V、並列部分は 16 ÷ 4 = <b>4 V</b>（C₃ も 4 V）。容量の小さい方に大きい電圧。"],
  d(){ const yt=40, yb=140;
    const c = W([40,yb],[40,yt],[300,yt],[300,yb],[40,yb]) + W([200,yt],[200,yb]) + Dot(200,yt) + Dot(200,yb)
      + Bv(40,90,"12 V") + Ch(120,yt,"C₁ 2 μF") + Cv(200,90,"C₂ 3 μF","",true) + Cv(300,90,"C₃ 1 μF","",true);
    return G(1, c + `<path class="ax" d="M186 ${yb+10}v4H314v-4"/>` + T(250,yb+28,"並列 4 μF","ans","middle"))
      + G(2, T(120,yt+24,"16 μC","ans","middle") + T(250,yt+24,"16 μC","ans","middle"))
      + G(3, T(120,yt-34,"8 V","lb","middle") + T(250,yb+46,"並列部分（C₃）は 4 V","ans","middle"));
  }};

/* ================= 交流回路 ================= */
// 波高率と波形率（r-crest）
Z["r-crest"] = { h: 200,
  s: ["最大値 Vm、実効値 Ve = Vm/√2 ≒ 0.707Vm、平均値 Va = 2Vm/π ≒ 0.637Vm の3本の高さを並べる。",
      "波高率 = <b>最大値 ÷ 実効値</b> = √2 ≒ 1.41。波形率 = <b>実効値 ÷ 平均値</b> = π/(2√2) ≒ 1.11。",
      "積 = 1.41 × 1.11 ≒ <b>1.57</b>。実効値が約分されて「最大値 ÷ 平均値」= π/2 になる。"],
  d(){ const p = P({x:44,y:16,w:220,h:150},[0,PI],[0,1.1]); const va=2/PI, ve=1/Math.SQRT2;
    return G(1, p.axes({xt:[[PI,"π"]], yt:[[0,"0"]], xl:"ωt"}) + p.fn(Math.sin,0,PI)
              + p.hline(1,"dsh") + T(p.X(PI)+4,p.Y(1)+4,"Vm 1","lbi") + p.hline(ve,"gd3") + T(p.X(PI)+4,p.Y(ve)-2,"Ve 0.707","ans") + p.hline(va,"cvo") + T(p.X(PI)+4,p.Y(va)+11,"Va 0.637","ok"))
      + G(2, Dim(p.X(PI/2)-30,p.Y(1),p.X(PI/2)-30,p.Y(ve),"","lb") + T(p.X(PI/2)-36,p.Y(0.86),"÷ 1.41","lb","end")
           + Dim(p.X(PI/2)+30,p.Y(ve),p.X(PI/2)+30,p.Y(va),"","lb") + T(p.X(PI/2)+36,p.Y(0.6),"÷ 1.11","lb"))
      + G(3, T(p.X(PI/2),p.Y(0.3),"Vm ÷ Va = π/2 ≒ 1.57","ans","middle"));
  }};

// 遅れ電流の瞬時値（r-phase）
Z["r-phase"] = { h: 210,
  s: ["電圧 v = Vm sin ωt。ωt = 0 で 0 から正に向かう。",
      "電流は 60° <b>遅れる</b>＝波が右に 60° ずれる。最大値は Im = 3√2 ≒ <b>4.24 A</b>。",
      "ωt = 0 のとき i = 4.24 × sin(−60°) = 4.24 × (−0.866) ≒ <b>−3.7 A</b>。遅れた電流はまだマイナス側にいる。"],
  d(){ const p = P({x:44,y:14,w:270,h:170},[-PI/2,2*PI],[-5,5]); const Im=3*Math.SQRT2;
    return G(1, p.axes({xt:[[PI,"180°"],[2*PI,"360°"]], yt:[[Im,"4.24"],[0,"0"],[-3.67,"−3.7"]], xl:"ωt"})
              + `<path class="ax" d="M${p.X(0)} ${p.b.y}V${p.b.y+p.b.h}"/>` + p.fn(t=>3*Math.sin(t),0,2*PI,"cvm") + T(p.X(PI/2),p.Y(3)-6,"v","lb","middle"))
      + G(2, p.fn(t=>Im*Math.sin(t-PI/3),-PI/2,2*PI,"cvb") + T(p.X(PI/2+PI/3)+10,p.Y(Im)+4,"i（最大 4.24 A）","blu")
           + A(p.X(0),p.Y(0.6),p.X(PI/3),p.Y(0.6),"vec0") + T(p.X(PI/6),p.Y(0.6)-6,"60°","lb","middle"))
      + G(3, `<path class="gd3" d="M${p.X(0)} ${p.Y(-3.67)}H${p.X(-PI/2)}"/>` + p.dot(0,-3.67,"pt3") + T(p.X(0)+8,p.Y(-3.67)+14,"i ≒ −3.7 A","ans"));
  }};

// 正弦波の式を読む（k-sine30・r-sine30）
function sineFig(Rr_,f){
  const Im = 100/Rr_, w = 2*f;
  return { h: 206,
    s: [`振幅：グラフの最大値 100 V は最大値なので √2 は不要。抵抗だけなので Im = 100 ÷ ${Rr_} = <b>${Im} A</b>。`,
        `角周波数 ω = 2πf = 2π × ${f} = <b>${w}π</b>。`,
        `波は ωt = π/6 で 0 から上がり始める ＝ <b>右に π/6 ずれている</b> → sin(ωt − π/6)。答え <b>i = ${Im} sin(${w}πt − π/6)</b>。`],
    d(){ const p = P({x:44,y:14,w:270,h:170},[0,2*PI+PI/6],[-120,120]);
      return G(1, p.axes({xt:[[PI/6,"π/6"],[PI,"π"],[2*PI,"2π"]], yt:[[100,"100"],[0,"0"],[-100,"−100"]], xl:"ωt", yl:"v [V]"})
                + p.fn(t=>100*Math.sin(t-PI/6),0,2*PI+PI/6) + T(p.X(PI)+10,p.Y(112),`最大 100 V → i 最大 ${Im} A`,"ans"))
        + G(2, T(p.X(2*PI+PI/6),p.Y(-112),`ω = ${w}π`,"ans","end"))
        + G(3, p.fn(t=>100*Math.sin(t),0,2*PI,"dsh") + A(p.X(0),p.Y(-16),p.X(PI/6),p.Y(-16),"vecr") + T(p.X(PI/12),p.Y(-16)+16,"右へ π/6","ans","start"));
    }};
}
Z["k-sine30"] = sineFig(10,100);
Z["r-sine30"] = sineFig(20,50);

// 電力の三角形（r-power8・r-power33）
function ptriFig(S,P_,Q,deg,ask){
  return { h: 190,
    s: [`皮相電力 S = Vm·Im ÷ 2 = <b>${S} VA</b>（斜めの辺）。位相差 θ = ${deg}°。`,
        `有効電力 P = S cosθ = ${S} × ${deg===60?"0.5":""} = <b>${P_} W</b>（横の辺）。力率 = cosθ = ${(P_/S).toFixed(1)}。`,
        `無効電力 Q = S sinθ = ${S} × 0.866 ≒ <b>${Q} var</b>（縦の辺）。${ask}`],
    d(){ const o=[90,174], k=150/S, a=deg*PI/180, e=[o[0]+S*k*Math.cos(a), o[1]-S*k*Math.sin(a)];
      return G(1, A(o[0],o[1],e[0],e[1],"vec") + T((o[0]+e[0])/2-8,(o[1]+e[1])/2-6,`S = ${S} VA`,"lbi","end")
                + `<path class="dsh" d="M${o[0]+30} ${o[1]}A30 30 0 0 0 ${R(o[0]+30*Math.cos(a))} ${R(o[1]-30*Math.sin(a))}"/>` + T(o[0]+36,o[1]-8,`${deg}°`,"lb"))
        + G(2, A(o[0],o[1],e[0],o[1],"vecr") + T((o[0]+e[0])/2,o[1]+16,`P = ${P_} W`,"ans","middle"))
        + G(3, A(e[0],o[1],e[0],e[1],"vecr") + T(e[0]+8,(o[1]+e[1])/2+4,`Q ≒ ${Q} var`,"ans"));
    }};
}
Z["r-power8"] = ptriFig(75,37.5,65,60,"<b>力率 = 0.5</b>。選択肢の 65 は Q を狙った誤答。");
Z["r-power33"] = ptriFig(20,10,17,60,"答えは <b>17 var</b>。S² = P² + Q²（20² = 10² + 17.3²）で検算。");

// 波形から消費電力（k-power33）
Z["k-power33"] = { h: 214,
  s: ["電圧 e：最大 8 V。t = 0 で e ≒ 4 V = 8 × sin30° → e = 8 sin(θ + <b>30°</b>)。",
      "電流 i：最大 5 A。t = 0 で i ≒ −2.5 A = 5 × sin(−30°) → i = 5 sin(θ − <b>30°</b>)。",
      "位相差は 30 + 30 = <b>60°</b>。P = (8 × 5 ÷ 2) × cos60° = 20 × 0.5 = <b>10 W</b>。"],
  d(){ const p = P({x:44,y:14,w:270,h:170},[0,2*PI],[-9.5,9.5]);
    return G(1, p.axes({xt:[[PI,"π"],[2*PI,"2π"]], yt:[[8,"8"],[4,"4"],[0,"0"],[-2.5,"−2.5"],[-8,"−8"]], xl:"θ"})
              + p.fn(t=>8*Math.sin(t+PI/6),0,2*PI) + p.dot(0,4,"pt3") + T(p.X(PI/3),p.Y(8)-5,"e","lbi","middle"))
      + G(2, p.fn(t=>5*Math.sin(t-PI/6),0,2*PI,"cvb") + p.dot(0,-2.5,"pt3") + T(p.X(2*PI/3)+6,p.Y(5)-4,"i","blu"))
      + G(3, A(p.X(PI/3),p.Y(8.8),p.X(2*PI/3),p.Y(8.8),"vecr") + T(p.X(2*PI/3)+6,p.Y(8.8)+4,"60° ずれ → P = 10 W","ans"));
  }};

// コンデンサ・コイルに流れる交流（k-capac・r-capac）
function reactFig(coil){
  return { h: 214,
    s: ["周期を読む：0 → 山（0.5 ms）→ 0（1 ms）→ 谷（1.5 ms）→ 0（<b>2 ms</b>）。f = 1 ÷ 2 ms = <b>500 Hz</b>。山の 0.5 ms を周期と読まないこと。",
        coil ? "コイルのリアクタンス XL = 2πfL = 2π × 500 × 0.1 ≒ <b>314 Ω</b>（周波数が高いほど通しにくい）。"
             : "コンデンサのリアクタンス Xc = 1/(2πfC) = 1/(2π × 500 × 0.1 × 10⁻⁶) ≒ <b>3180 Ω</b>。",
        coil ? "Im = 100 ÷ 314 ≒ 0.32 A = <b>320 mA</b>。電流はコイルで 90° 遅れる（青の波）。"
             : "Im = 100 ÷ 3180 ≒ 0.031 A = <b>31 mA</b>。電流はコンデンサで 90° 進む（青の波）。"],
    d(){ const p = P({x:44,y:14,w:270,h:170},[0,2.2],[-120,120]); const s=coil?-1:1;
      return G(1, p.axes({xt:[[0.5,"0.5"],[1,"1"],[1.5,"1.5"],[2,"2"]], yt:[[100,"100"],[0,"0"],[-100,"−100"]], xl:"t [ms]", yl:"v [V]"})
                + p.fn(t=>100*Math.sin(PI*t),0,2.2) + Dim(p.X(0),p.Y(-110),p.X(2),p.Y(-110),"周期 2 ms","ans"))
        + G(2, T(p.X(2.2),p.Y(108),coil?"XL ≒ 314 Ω":"Xc ≒ 3180 Ω","ans","end"))
        + G(3, p.fn(t=>60*Math.sin(PI*t+s*PI/2),0,2.2,"cvb") + T(p.X(2.2),p.Y(92),coil?"i 最大 320 mA":"i 最大 31 mA","blu","end"));
    }};
}
Z["k-capac"] = reactFig(false);
Z["r-capac"] = reactFig(true);

// RLC 直列のインピーダンス（k-z・r-z）
function zFig(Rv_,XL,XC,Zv,last){
  return { h: 206,
    s: [`抵抗 R = ${Rv_} Ω を横向きの矢印で描く。`,
        `コイル XL = ${XL} Ω は上向き、コンデンサ XC = ${XC} Ω は下向き。向きが逆なので打ち消し合う。`,
        `上下を差し引くと XL − XC = ${XL} − ${XC} = <b>${XL-XC} Ω</b>（上向き）。`,
        `斜めの辺が Z。Z = √(${Rv_}² + ${XL-XC}²) = <b>${Zv} Ω</b>。${last}`],
    d(){ const k = 150/Math.max(XL, Rv_*1.6), o={x:60,y:186};
      const rx=o.x+Rv_*k;
      return G(1, A(o.x,o.y,rx,o.y,"vec") + T((o.x+rx)/2, o.y+14, `R = ${Rv_} Ω`, "lbi", "middle"))
           + G(2, A(rx,o.y,rx,o.y-XL*k,"vec") + T(rx-8, o.y-XL*k+12, `XL = ${XL} Ω`, "lbi", "end")
                + A(rx+14,o.y-XL*k,rx+14,o.y-(XL-XC)*k,"vecm") + T(rx+22, o.y-(XL-XC/2)*k+4, `XC = ${XC} Ω`, "lb"), 3)
           + G(3, A(rx,o.y,rx,o.y-(XL-XC)*k,"vecr") + T(rx+10, o.y-(XL-XC)*k/2+4, `XL − XC = ${XL-XC} Ω`, "ans"))
           + G(4, A(o.x,o.y,rx,o.y-(XL-XC)*k,"vecr") + T((o.x+rx)/2-6, o.y-(XL-XC)*k/2-6, `Z = ${Zv} Ω`, "ans", "end"));
    }};
}
Z["k-z"] = zFig(40,60,30,50,"3:4:5 の直角三角形。130 は全部足したもの、2,500 はルートの取り忘れ。");
Z["r-z"] = zFig(30,80,40,50,"I = 100 ÷ 50 = 2 A。電力を使うのは抵抗だけ：P = I²R = 4 × 30 = <b>120 W</b>（200 は皮相電力）。");

// 共振曲線（r-q）
Z["r-q"] = { h: 200,
  s: ["Q = (1/R)√(L/C)。L/C = 10⁻³ ÷ 10⁻⁵ = 100 → √100 = 10 → <b>Q = 10/1 = 10</b>。",
      "共振周波数 f₀ = 1/(2π√LC) ≒ <b>1.6 kHz</b>。ここで Z = R が最小になり、電流が最大になる。",
      "Q が大きいほど山が<b>鋭い</b>（先鋭度）。点線は Q = 2 の場合。"],
  d(){ const p = P({x:44,y:16,w:270,h:150},[0.5,1.5],[0,1.1]); const cur=Q=>x=>1/Math.sqrt(1+Q*Q*(x-1/x)**2);
    return G(1, p.axes({xt:[[1,"f₀"]], yt:[[0,"0"],[1,"最大"]], xl:"f", yl:"電流"}) + p.fn(cur(10),0.5,1.5,"cv",200) + T(p.X(1.06),p.Y(0.9),"Q = 10","ans"))
      + G(2, p.guide(1,1,"gd3") + T(p.X(1),p.Y(0)+28,"1.6 kHz","ans","middle"))
      + G(3, p.fn(cur(2),0.5,1.5,"dsh",200) + T(p.X(1.38),p.Y(0.52),"Q = 2","lb"));
  }};

/* ================= 電磁気 ================= */
// 自己インダクタンス（k-ind・r-ind）
function indFig(N,dI,tI,dPhi,tPhi,Lm){
  const rI=+(dI/tI).toFixed(3), rP=+(dPhi/tPhi).toFixed(3);
  return { h: 214,
    s: [`電流の変化を「1秒あたり」にそろえる：${dI} A ÷ ${tI} s = <b>${rI} A/s</b>。`,
        `磁束の変化も1秒あたりに：${dPhi} mWb ÷ ${tPhi} s = <b>${rP} mWb/s</b>。時間が違うのがひっかけ。`,
        `起電力を2通りに書いて等しくする：N·ΔΦ/Δt = L·ΔI/Δt → ${N} × ${rP} mWb/s = L × ${rI} → <b>L = ${Lm} mH</b>。`],
    d(){ const a = P({x:44,y:16,w:120,h:150},[0,1],[0,rI*1.15]); const b = P({x:206,y:16,w:120,h:150},[0,1],[0,rP*1.15]);
      return G(1, a.axes({xt:[[tI,String(tI)],[1,"1"]], yt:[[dI,String(dI)],[rI,String(rI)]], xl:"t [s]", yl:"I [A]"}) + a.fn(t=>rI*t,0,1) + a.guide(tI,dI) + a.dot(1,rI,"pt3") + T(a.X(1)-4,a.Y(rI)-8,`${rI} A/s`,"ans","end"))
        + G(2, b.axes({xt:[[tPhi,String(tPhi)],[1,"1"]], yt:[[dPhi,String(dPhi)],[rP,String(rP)]], xl:"t [s]", yl:"Φ [mWb]"}) + b.fn(t=>rP*t,0,1,"cvb") + b.guide(tPhi,dPhi) + b.dot(1,rP,"pt3") + T(b.X(1)-4,b.Y(rP)-8,`${rP} mWb/s`,"ans","end"))
        + G(3, T(170,206,`L = ${N} × ${rP} ÷ ${rI} = ${Lm} mH`,"ans","middle"));
    }};
}
Z["k-ind"] = indFig(20,0.6,0.1,1.2,0.4,10);
Z["r-ind"] = indFig(50,1,0.2,2,0.5,40);

// 相互インダクタンス（r-mutual）
Z["r-mutual"] = { h: 204,
  s: ["M = k√(L₁L₂)。まず L₁ × L₂ = 4 × 9 = 36（たて 4・よこ 9 の長方形の面積）。",
      "√36 = <b>6 mH</b>（同じ面積の正方形の1辺）。",
      "結合係数 k = 0.5 を掛けて <b>M = 3 mH</b>。k = 1 が漏れ磁束なしの理想結合。"],
  d(){ const u=14;
    return G(1, `<rect class="fl3 bs" x="60" y="${170-4*u}" width="${9*u}" height="${4*u}"/>` + T(60+4.5*u,170-2*u+4,"4 × 9 = 36","lbi","middle") + T(60+4.5*u,170-4*u-6,"L₂ = 9","lb","middle") + T(54,170-2*u+4,"L₁ = 4","lb","end"))
      + G(2, `<rect class="fl2 bs" x="220" y="${170-6*u}" width="${6*u}" height="${6*u}"/>` + T(220+3*u,170-3*u+4,"36","lbi","middle") + T(220+3*u,170-6*u-6,"1辺 6","ok","middle"))
      + G(3, T(170,194,"6 × 0.5 → M = 3 mH","ans","middle"));
  }};

// 電子の加速（r-ev）
Z["r-ev"] = { h: 290,
  s: ["電子が電圧 V で加速されると、電気のエネルギー eV がそのまま運動エネルギー ½mv² になる。",
      "v = √(2eV/m) = √(3.2 × 10⁻¹⁶ ÷ 9.1 × 10⁻³¹) = √(3.5 × 10¹⁴) ≒ <b>1.9 × 10⁷ m/s</b>。",
      "v は √V に比例する（グラフ）。電圧が 100 倍なら速さは 10 倍。"],
  d(){ const p = P({x:54,y:146,w:250,h:110},[0,4],[0,2.3]);
    return G(1, `<path class="pl2" d="M60 40v60M150 40v60"/>` + T(60,32,"−","lbi","middle") + T(150,32,"+（1 kV）","lbi","middle") + Dot(70,70) + A(76,70,140,70,"vecr") + T(105,62,"e⁻","ans","middle") + T(105,120,"eV = ½mv²","ans","middle"))
      + G(2, T(170,74,"v ≒ 1.9 × 10⁷ m/s","ans"))
      + G(3, p.axes({xt:[[1,"1"],[4,"4"]], yt:[[1,"1.9"],[2,"3.8"]], xl:"V [kV]", yl:"v [×10⁷ m/s]"}) + p.fn(v=>Math.sqrt(v),0,4) + p.dot(1,1,"pt3") + p.dot(4,2,"pt3") + T(p.X(4)-4,p.Y(2)-8,"4倍 → 2倍","ans","end"));
  }};

// 磁界中の円運動（r-cyclo）
Z["r-cyclo"] = { h: 196,
  s: ["一様な磁界（紙面に垂直）の中で、電子は半径 r の円をえがく。",
      "ローレンツ力 evB が中心向きの力（向心力 mv²/r）になる：<b>evB = mv²/r</b>。",
      "v = eBr/m = 1.6 × 10⁻¹⁹ × 10⁻³ × 0.1 ÷ 9.1 × 10⁻³¹ ≒ <b>1.8 × 10⁷ m/s</b>。B や r が大きいほど速い電子を回せる。"],
  d(){ const cx=150, cy=100, r=70; let dots=""; for(let x=40;x<=300;x+=40) for(let y=24;y<=180;y+=40) dots+=`<circle class="axh" cx="${x}" cy="${y}" r="1.6"/>`;
    return G(1, dots + `<circle class="cv" cx="${cx}" cy="${cy}" r="${r}" fill="none"/>` + W([cx,cy],[cx+r,cy]) + T(cx+r/2,cy-6,"r = 0.1 m","lbi","middle") + T(300,190,"B（紙面に垂直）","lb","end") + Dot(cx,cy-r,"pt3"))
      + G(2, A(cx,cy-r,cx,cy-r+34,"vecr") + T(cx+8,cy-r+30,"evB（中心向き）","ans") + A(cx,cy-r,cx-40,cy-r,"vec") + T(cx-44,cy-r-6,"v","lbi","end"))
      + G(3, T(cx,cy+r+18,"v ≒ 1.8 × 10⁷ m/s","ans","middle"));
  }};

// 平行導線の力（r-force）
Z["r-force"] = { h: 190,
  s: ["2本の導線（0.2 m 離れている）に<b>逆向き</b>の電流 10 A と 20 A。",
      "F = μ₀I₁I₂/(2πr) = 2 × 10⁻⁷ × 10 × 20 ÷ 0.2 = <b>2 × 10⁻⁴ N</b>（1 m あたり）。",
      "逆向きの電流は<b>斥力</b>（同じ向きなら引力）。電荷（同符号で反発）と逆なので注意。"],
  d(){ return G(1, `<path class="pl2" d="M110 20v150M230 20v150"/>` + A(98,120,98,60,"vec") + T(92,92,"10 A","lbi","end") + A(242,60,242,120,"vec") + T(248,92,"20 A","lbi") + Dim(110,178,230,178,"","lb") + T(170,172,"0.2 m","lb","middle"))
      + G(2, T(170,40,"2 × 10⁻⁴ N","ans","middle"))
      + G(3, A(110,80,64,80,"vecr") + A(230,80,276,80,"vecr") + T(170,96,"斥力（はなれる）","ans","middle"));
  }};

/* ================= 電子回路・オペアンプ ================= */
// 反転加算回路（k-adder・r-adder・k-opv・r-opv）
// ins=[[入力ラベル, 抵抗ラベル, 電流ラベル]]
function adderFig(ins, rf, sum, out, s){
  return { h: 190, s,
    d(){ const ys = ins.length===3 ? [50,80,110] : [80,110];
      let c = W([150,ys[0]],[150,110]) + W([150,110],[190,110]) + W([190,130],[176,130],[176,150]) + Gnd(176,154) + Op(190,120)
        + W([170,110],[170,30],[262,30],[262,120]) + W([236,120],[300,120]) + Dot(170,110) + Dot(262,120) + Rh(216,30,`Rf ${rf}`);
      ins.forEach(([v,r],i)=>{ c += W([44,ys[i]],[150,ys[i]]) + Rh(100,ys[i],r) + T(40,ys[i]+4,v,"lbi","end") + Dot(44,ys[i]); });
      return G(1, c + T(304,124,"Vout","lbi"))
        + G(2, T(170,126,"0 V","ans","middle") + ins.map(([,,a],i)=>A(118,ys[i],144,ys[i],"vecr")+T(124,ys[i]-6,a,"ans")).join(""))
        + G(3, A(196,40,236,40,"vecr") + T(216,54,sum,"ans","middle") + T(300,140,out,"ans","end"));
    }};
}
Z["k-adder"] = adderFig([["6 V","1 kΩ","6 mA"],["3 V","1 kΩ","3 mA"],["1 V","1 kΩ","1 mA"]],"= ?","10 mA","Rf = 1 kΩ",
  ["反転加算回路。− 端子は<b>仮想接地（0 V）</b>なので、各入力の電流は 入力電圧 ÷ 1 kΩ で決まる。",
   "6 ÷ 1k = 6 mA、3 ÷ 1k = 3 mA、1 ÷ 1k = 1 mA。合計 <b>10 mA</b>。",
   "10 mA は全部 Rf を通る（オペアンプには流れ込まない）。出力 = −Rf × 10 mA = −10 V → <b>Rf = 1 kΩ</b>。"]);
Z["r-adder"] = adderFig([["4 V","1 kΩ","4 mA"],["2 V","1 kΩ","2 mA"],["2 V","1 kΩ","2 mA"]],"= ?","8 mA","Rf = 0.5 kΩ",
  ["反転加算回路。− 端子は<b>仮想接地（0 V）</b>なので、各入力の電流は 入力電圧 ÷ 1 kΩ で決まる。",
   "4 mA、2 mA、2 mA。合計 <b>8 mA</b>。",
   "8 mA が全部 Rf を通る：Rf × 8 mA = 4 V → <b>Rf = 0.5 kΩ</b>。"]);
Z["k-opv"] = adderFig([["V1 5 V","R1 2 Ω","2.5 A"],["V2 3 V","R2 3 Ω","1 A"]],"R3 6 Ω","3.5 A","VO = −21 V",
  ["R3 が帰還抵抗の<b>反転加算回路</b>。− 端子は仮想接地（0 V）。",
   "電流：5 ÷ 2 = 2.5 A、3 ÷ 3 = 1 A。合計 3.5 A。",
   "VO = −3.5 × 6 = <b>−21 V</b>（= −(6/2 × 5 + 6/3 × 3)）。入力と抵抗の組み合わせを取り違えると −19。"]);
Z["r-opv"] = adderFig([["V1 2 V","R1 2 Ω","1 A"],["V2 −3 V","R2 3 Ω","−1 A"]],"R3 6 Ω","0 A","VO = 0 V",
  ["R3 が帰還抵抗の<b>反転加算回路</b>。− 端子は仮想接地（0 V）。",
   "電流：2 ÷ 2 = 1 A、−3 ÷ 3 = −1 A。マイナスの入力もそのまま式に入れる。",
   "合計 0 A → VO = −(6 − 6) = <b>0 V</b>。"]);

// 非反転増幅（k-noninv・r-noninv）
function noninvFig(rf,ri,ratio,A_,last){
  return { h: 196,
    s: ["入力が <b>＋端子</b> → 非反転増幅回路。Rf は出力と − 端子の間、Ri は − 端子と接地の間。",
        "仮想短絡で − 端子も Vi になる。Ri に流れる電流 Vi/Ri が、そのまま Rf も流れる。",
        `出力は Ri と Rf の電圧の合計：Vo = Vi × (1 + Rf/Ri) = Vi × (1 + ${ratio}) = <b>${A_} 倍</b>。${last}`],
    d(){ const c = Op(170,100) + W([40,110],[170,110]) + W([150,90],[170,90]) + W([150,90],[150,172]) + Gnd(150,176) + Rv(150,140,`Ri ${ri}`,"",true)
        + W([150,90],[150,40],[250,40],[250,100]) + Rh(200,40,`Rf ${rf}`) + W([216,100],[300,100]) + Dot(150,90) + Dot(250,100) + T(36,114,"Vi","lbi","end") + T(304,104,"Vo","lbi");
      return G(1, c)
        + G(2, T(140,84,"= Vi","ans","end") + A(160,118,160,158,"vecr"))
        + G(3, Bar(196,150,120,20,[[1,"1","fl3"],[ratio,`${ratio}`,"fl"]]) + T(256,184,`Vo = ${A_} Vi`,"ans","middle"));
    }};
}
Z["k-noninv"] = noninvFig("4 kΩ","100 Ω",40,41,"「1 + 」を忘れた 40 に注意。");
Z["r-noninv"] = noninvFig("9900 Ω","100 Ω",99,100,"20 log₁₀100 = <b>40 dB</b>（電圧は 20 log）。");

// 積分回路（k-integ・r-integ）
function integFig(vi,C,Rk,t1){
  const CR = C*Rk/1000, slope = -vi/1000/CR, vo = slope*t1, ym = Math.max(Math.abs(slope)*(t1+1),Math.abs(vo))*1.1;
  const sg = slope<0, f = v=>String(+(+v).toFixed(3)).replace("-","−");
  return { h: 236,
    s: [`t = 0 で入力 vi に <b>${f(vi)} mV</b> を加え、そのまま一定（上のグラフ）。`,
        `CR = ${C} μF × ${Rk} kΩ = ${CR} s。直流入力なら vo = −vi·t / CR。<b>1秒に ${f(slope)} V ずつ</b>変わる直線になる。`,
        `t = ${t1} s：vo = −(${f(vi/1000)} × ${t1}) ÷ ${CR} = <b>${f(vo)} V</b>。反転型なので入力と符号が逆。`],
    d(){ const a = P({x:44,y:14,w:270,h:40},[0,t1+1],sg?[0,vi*1.5]:[vi*1.5,0]);
         const p = P({x:44,y:96,w:270,h:110},[0,t1+1],sg?[-ym,ym*0.1]:[-ym*0.1,ym]);
      const tk = Array.from({length:t1+1},(_,i)=>[i+1,String(i+1)]);
      return G(1, a.axes({xt:[], yt:[[0,"0"],[vi,f(vi)]], xl:"t [s]", yl:"vi [mV]"}) + a.pl([[0,0],[0,vi],[t1+1,vi]])
                + p.axes({xt:tk, yt:[[vo,f(vo)]], xl:"t [s]", yl:"vo [V]"}))
        + G(2, p.fn(t=>slope*t,0,t1+1) + T(p.X(t1*0.4)+(sg?6:-6), p.Y(slope*t1*0.4)-8, `傾き ${f(slope)} V/秒`, "lb", sg?"start":"end"))
        + G(3, `<path class="gd3" d="M${p.X(t1)} ${p.Y(0)}V${p.Y(vo)}H${p.X(0)}"/>` + p.dot(t1,vo,"pt3") + T(p.X(t1)+8, p.Y(vo)+4, `${f(vo)} V`, "ans"));
    }};
}
Z["k-integ"] = integFig(20,2,10,3);
Z["r-integ"] = integFig(-10,5,10,5);

// 2段増幅と dB（k-amps・r-amps）
function ampsFig(vi,vo,a1,d1,d2,a2){
  return { h: 170,
    s: [`全体の増幅度 = ${vo} ÷ ${vi} = 1000 倍 → 20 log1000 = <b>60 dB</b>。`,
        `増幅器1：${a1} 倍 → 20 log${a1} = <b>${d1} dB</b>。`,
        `dB は<b>足し算</b>なので、増幅器2 = 60 − ${d1} = <b>${d2} dB</b>（${a2} 倍）。倍率なら掛け算（${a1} × ${a2} = 1000）。`],
    d(){ const c = W([30,50],[310,50]) + Box(80,30,80,40,`増幅器1 ×${a1}`) + Box(190,30,80,40,"増幅器2 ?") + T(30,40,`Vi ${vi}`,"lbi") + T(310,40,`Vo ${vo}`,"lbi","end");
      return G(1, c + Bar(30,100,280,24,[[60,"全体 60 dB","fl3"]]))
        + G(2, Bar(30,134,280,24,[[d1,`${d1} dB`,"fl2"],[d2,"","fl3"]]) + T(120,26,`${d1} dB`,"ok","middle"))
        + G(3, Bar(30+280*d1/60,134,280*d2/60,24,[[d2,`${d2} dB`,"fl"]]) + T(230,26,`${d2} dB`,"ans","middle"));
    }};
}
Z["k-amps"] = ampsFig("0.2 mV","0.2 V",10,20,40,100);
Z["r-amps"] = ampsFig("0.5 mV","0.5 V",20,26,34,50);

// 負帰還（r-fb）
Z["r-fb"] = { h: 176,
  s: ["出力 y の一部（β = 0.01 倍）を入力に戻して引き算する＝<b>負帰還</b>。",
      "全体の増幅率 = A ÷ (1 + Aβ)。Aβ = 1000 × 0.01 = <b>10</b>。",
      "1000 ÷ 11 ≒ <b>91</b>。A がとても大きいと 1/β = 100 に近づくが、ここでは少し小さい。"],
  d(){ const c = `<circle class="rz" cx="70" cy="60" r="12"/>` + T(70,64,"+","lbi","middle") + T(62,84,"−","lbi","middle") + W([20,60],[58,60]) + W([82,60],[120,60]) + Box(120,40,80,40,"A = 1000")
      + W([200,60],[320,60]) + W([260,60],[260,130],[200,130]) + Box(120,110,80,40,"β = 0.01") + W([120,130],[70,130],[70,72]) + A(296,60,316,60,"vec") + T(20,50,"x","lbi") + T(320,50,"y","lbi","end") + Dot(260,60);
    return G(1, c) + G(2, T(270,100,"Aβ = 10","ans")) + G(3, T(170,172,"y/x = 1000 ÷ 11 ≒ 91","ans","middle"));
  }};

// RC ローパスフィルタ（r-fc）
Z["r-fc"] = { h: 200,
  s: ["カットオフ周波数 fc = 1/(2πCR)。CR = 0.1 μF × 1 kΩ = 10⁻⁴ s。",
      "fc = 10⁴ ÷ 6.28 ≒ <b>1.6 kHz</b>。ここで出力が 1/√2 ≒ 0.7 倍（−3 dB）に下がる。",
      "1/CR = 10 kHz（2π を忘れた値）では、もう出力はかなり小さい。"],
  d(){ const p = P({x:44,y:16,w:270,h:140},[1,5],[0,1.1]); const g=lf=>1/Math.sqrt(1+(10**lf/1590)**2);
    return G(1, p.axes({xt:[[1,"10"],[2,"100"],[3,"1k"],[4,"10k"],[5,"100k"]], yt:[[0,"0"],[0.707,"0.7"],[1,"1"]], xl:"f [Hz]", yl:"出力 / 入力"}) + p.fn(g,1,5))
      + G(2, p.guide(Math.log10(1590),0.707,"gd3") + p.dot(Math.log10(1590),0.707,"pt3") + T(p.X(Math.log10(1590))+8,p.Y(0.707)-6,"fc ≒ 1.6 kHz","ans"))
      + G(3, p.dot(4,g(4),"pt0") + T(p.X(4)+8,p.Y(0.3),"10 kHz（×）","lb"));
  }};

// 二極管と負荷線（k-diodeiv・r-diodeiv）
function diodeIvFig(E,V,I,trap){
  const s = [ "二極管の電圧 V と電流 I の関係（問題の図と同じ曲線）。",
      `抵抗にも電圧がかかる：1 kΩ × I [mA] = I [V]。だから <b>V + I = ${E}</b>。これは ${E} V と ${E} mA を結ぶ直線（負荷線）。`,
      `曲線と直線が交わる点が実際の状態：V = ${V} V、<b>I = ${I} mA</b>（${V} + ${I} = ${E} で検算OK）。` ];
  if(trap) s.push("60 mA は「80 V が全部二極管にかかる」と考えた値。抵抗に 30 V 取られるので間違い。");
  return { h: 232, s,
    d(){ const p = P({x:44,y:14,w:270,h:180},[0,120],[0,60]);
      const iv = v => v<=40 ? 20*(v/40)**2 : 20+(v-40);
      let grid=""; [20,40,60,80,100,120].forEach(v=>grid+=`<path class="gd" d="M${p.X(v)} ${p.Y(0)}V${p.Y(60)}"/>`);
      [10,20,30,40,50,60].forEach(v=>grid+=`<path class="gd" d="M${p.X(0)} ${p.Y(v)}H${p.X(120)}"/>`);
      return G(1, grid + p.axes({xt:[[40,"40"],[80,"80"],[120,"120"]], yt:[[0,"0"],[20,"20"],[40,"40"],[60,"60"]], xl:"V [V]", yl:"I [mA]"}) + p.fn(iv,0,80))
        + G(2, p.pl([[E,0],[E-60,60]],"cvb") + T(p.X(E)+4, p.Y(0)-6, `${E} V`, "blu") + T(p.X(E-60)+4, p.Y(60)+12, `V + I = ${E}`, "blu"))
        + G(3, p.guide(V,I,"gd3") + p.dot(V,I,"pt3") + T(p.X(V)+8, p.Y(I)+16, `${I} mA`, "ans"))
        + (trap ? G(4, p.dot(80,60,"pt0") + T(p.X(80)+8, p.Y(60)+14, "60 mA は ×", "lb")) : "");
    }};
}
Z["k-diodeiv"] = diodeIvFig(80,50,30,true);
Z["r-diodeiv"] = diodeIvFig(100,60,40,false);

// ダイオードと電流波形（k-diode・r-diode）
function diodeWaveFig(posOn){
  const hi=1, lo=0.45;
  return { h: 214,
    s: ["入力は正弦波。半周期ごとに<b>ダイオードが ON か OFF か</b>を考える。",
        posOn ? "正の半周期：D が ON で R2 を短絡 → 電流は R1 だけで決まり、i = E/R1（<b>大きい</b>正の電流）。"
              : "正の半周期：D には逆向きの電圧 → OFF。電流は R1 → R2 を通り、i = E/(R1 + R2)（<b>小さい</b>正の電流）。",
        posOn ? "負の半周期：D は OFF → |i| = E/(R1 + R2)（<b>小さい</b>負の電流）。正が大きく負が小さい → <b>④</b>。"
              : "負の半周期：D が ON で R2 を短絡 → |i| = E/R1（<b>大きい</b>負の電流）。正は小さく負は大きい → <b>③</b>。"],
    d(){ const a = P({x:44,y:14,w:270,h:70},[0,2*PI],[-1.2,1.2]); const p = P({x:44,y:112,w:270,h:90},[0,2*PI],[-1.2,1.2]);
      const pa = posOn?hi:lo, na = posOn?lo:hi;
      return G(1, a.axes({xt:[], yt:[[0,"0"]], xl:"t", yl:"電源 e"}) + a.fn(Math.sin,0,2*PI))
        + G(2, p.axes({xt:[], yt:[[0,"0"]], xl:"t", yl:"i"}) + p.fn(t=>pa*Math.sin(t),0,PI,"cvb") + T(p.X(PI/2),p.Y(pa)-5,posOn?"ON：大":"OFF：小","blu","middle"))
        + G(3, p.fn(t=>na*Math.sin(t),PI,2*PI,"cvb") + T(p.X(3*PI/2),p.Y(-na)+14,posOn?"OFF：小":"ON：大","blu","middle"));
    }};
}
Z["k-diode"] = diodeWaveFig(false);
Z["r-diode"] = diodeWaveFig(true);

// 真空管回路の電位（k-tube・r-tube）
function tubeFig(E,drop,B,Imk,Rk){
  return { h: 206,
    s: ["A 点（陰極）を 0 V にして、電流と逆向きに回路をたどり、電位の上がり下がりを足していく。",
        `R での電圧降下 = ${Imk} mA × ${Rk} kΩ = <b>${drop} V</b>。A から R を通ると ${drop} V 下がる（−${drop} V）。`,
        `電池で ${E} V 上がる：B = −${drop} + ${E} = <b>+${B} V</b>。真空管そのものには ${B} V しかかかっていない。`],
    d(){ const p = P({x:60,y:16,w:240,h:170},[0,3],[-drop*1.15,E*0.75]);
      const xs=[0.4,1.4,2.4];
      return G(1, p.axes({xt:[], yt:[[0,"0"],[-drop,`−${drop}`],[B,`+${B}`]], xl:"", yl:"電位 [V]"}) + `<path class="cv" d="M${p.X(0.1)} ${p.Y(0)}H${p.X(0.7)}"/>` + T(p.X(0.4),p.Y(0)-8,"A","lbi","middle"))
        + G(2, A(p.X(0.7),p.Y(0),p.X(1.1),p.Y(-drop),"vecr") + `<path class="cv" d="M${p.X(1.1)} ${p.Y(-drop)}H${p.X(1.7)}"/>` + T(p.X(1.4),p.Y(-drop)+16,`R で −${drop} V`,"ans","middle"))
        + G(3, A(p.X(1.7),p.Y(-drop),p.X(2.1),p.Y(B),"vecr") + `<path class="cv" d="M${p.X(2.1)} ${p.Y(B)}H${p.X(2.8)}"/>` + T(p.X(2.45),p.Y(B)-8,`B = +${B} V`,"ans","middle") + T(p.X(1.95),p.Y(-drop/3),`電池 +${E}`,"lb"));
    }};
}
Z["k-tube"] = tubeFig(200,150,50,7.5,20);
Z["r-tube"] = tubeFig(300,180,120,6,30);

// 3/2 乗則（r-tube15）
Z["r-tube15"] = { h: 200,
  s: ["空間電荷制限領域では Ip = G·Vp<sup>3/2</sup>（3/2 乗則）。曲線は直線より速く増える。",
      "陽極電圧を 4 倍にすると、電流は 4<sup>3/2</sup> = (√4)³ = 2³ = <b>8 倍</b>。",
      "比例（点線）なら 4 倍。3/2 乗なので 4 より大きい 8 倍になる。"],
  d(){ const p = P({x:44,y:16,w:270,h:150},[0,4.5],[0,9.5]);
    return G(1, p.axes({xt:[[1,"1"],[4,"4"]], yt:[[1,"1"],[4,"4"],[8,"8"]], xl:"Vp（倍）", yl:"Ip（倍）"}) + p.fn(v=>v**1.5,0,4.4) + p.dot(1,1,"pt"))
      + G(2, p.guide(4,8,"gd3") + p.dot(4,8,"pt3") + T(p.X(4)-6,p.Y(8)-6,"8 倍","ans","end"))
      + G(3, p.fn(v=>v,0,4.4,"dsh") + T(p.X(4.4),p.Y(4.4)+14,"比例なら 4 倍","lb","end"));
  }};

// 半導体の抵抗率（r-sigma）
Z["r-sigma"] = { h: 150,
  s: ["導電率 σ = q × N × μ（電荷 × 電子の数 × 動きやすさ）。",
      "σ = 1.6 × 10⁻¹⁹ × 10²⁰ × 0.1 = <b>1.6 S/m</b>。",
      "抵抗率は逆数：ρ = 1 ÷ 1.6 ≒ <b>0.63 Ω·m</b>。電子が多いほど・動きやすいほど抵抗率は下がる。"],
  d(){ return G(1, Box(14,30,80,40,"q 1.6×10⁻¹⁹") + T(104,54,"×","lbi","middle") + Box(114,30,70,40,"N 10²⁰") + T(194,54,"×","lbi","middle") + Box(204,30,60,40,"μ 0.1"))
      + G(2, T(274,54,"=","lbi","middle") + Box(282,30,50,40,"σ 1.6","fl2 bs"))
      + G(3, A(307,74,307,100,"vecr") + Box(250,102,82,36,"ρ ≒ 0.63","fl bs","ans") + T(240,124,"逆数","lb","end"));
  }};

/* ================= 電源回路・変圧器 ================= */
// 降圧チョッパ（k-chop・r-chop1）
function chopFig(on,off,E,El,avgL,s){
  return { h: 190, s,
    d(){ const T0=on+off, p = P({x:44,y:20,w:270,h:130},[0,2*T0+0.2],[0,E*1.25]);
      const w = t0 => p.pl([[t0,0],[t0,E],[t0+on,E],[t0+on,0],[t0+T0,0]]);
      return G(1, p.axes({xt:[[on,El[0]],[T0,El[1]]], yt:[[0,"0"],[E,El[2]]], xl:"t", yl:"出力"}) + w(0) + w(T0) + T(p.X(on/2),p.Y(E)-6,"ON","lb","middle") + T(p.X(on+off/2),p.Y(0)-6,"OFF","lb","middle"))
        + G(2, Dim(p.X(0),p.Y(0)+30,p.X(T0),p.Y(0)+30,"周期","lb"))
        + G(3, p.hline(E*on/T0,"gd3") + T(p.X(2*T0+0.2),p.Y(E*on/T0)-6,avgL,"ans","end"));
    }};
}
Z["k-chop"] = chopFig(1,3,4,["t1","4t1","E"],"平均 E/4",
  ["S が直列・D が並列・L が後ろ → <b>降圧チョッパ</b>。出力は ON の間だけ E、OFF の間は 0。",
   "t2 = 3t1 なので、周期 = t1 + t2 = <b>4t1</b>。",
   "平均 = E × ON 時間 ÷ 周期 = E × t1 ÷ 4t1 = <b>E/4</b>。平均はデューティー比だけで決まる。"]);
Z["r-chop1"] = chopFig(2,3,100,["2","5 ms","100 V"],"平均 40 V",
  ["降圧チョッパ。ON の 2 ms は 100 V、OFF の 3 ms は 0。",
   "周期 = 2 + 3 = <b>5 ms</b>。",
   "平均 = 100 × 2 ÷ 5 = <b>40 V</b>。60 は OFF 時間で、67 は ON/OFF の比で計算したもの。分母は周期。"]);

// 昇圧コンバータ（r-chop2）
Z["r-chop2"] = { h: 150,
  s: ["ON 3 μs・OFF 1 μs → 周期 <b>4 μs</b>。",
      "昇圧形は 出力 = (周期 ÷ OFF 時間) × 入力。周期 ÷ OFF = 4 ÷ 1 = <b>4 倍</b>。",
      "12 V × 4 = <b>48 V</b>。降圧は「ON ÷ 周期」、昇圧は「周期 ÷ OFF」。"],
  d(){ return G(1, Bar(30,30,280,24,[[3,"ON 3 μs","fl3"],[1,"OFF 1","fl2"]]) + Dim(30,66,310,66,"周期 4 μs","lbi"))
      + G(2, T(170,100,"周期 ÷ OFF = 4 倍","ans","middle"))
      + G(3, Bar(30,112,70,24,[[1,"12 V","fl3"]]) + A(110,124,140,124,"vec") + Bar(150,112,160,24,[[1,"48 V","fl"]]));
  }};

// 周波数と鉄損（k-iron-low・k-iron-high）
function ironFig(low){
  return { h: 206,
    s: ["電圧が一定だと 最大磁束密度 Bm ∝ V/f。ヒステリシス損 ∝ f·Bm² ∝ <b>1/f</b>、渦電流損は f に<b>関係しない</b>。",
        `鉄損の大部分はヒステリシス損なので、鉄損は 1/f の形。周波数が${low?"下がる":"上がる"}と鉄損は<b>${low?"増加":"減少"}</b>。`,
        `銅損 = I²R。電流一定なら<b>${low?"変わらない":"変化しない"}</b>。答え：${low?"増加する・変わらない":"減少する・変化しない"}。`],
    d(){ const p = P({x:44,y:16,w:260,h:150},[0.4,2],[0,3]); const fe=f=>1/f+0.3;
      const f0=1, f1=low?0.6:1.6;
      return G(1, p.axes({xt:[[f0,"いま"]], yt:[], xl:"周波数 f", yl:"損失"}) + p.fn(fe,0.4,2) + T(p.X(2),p.Y(fe(2))-6,"鉄損","lbi","end") + p.hline(0.3,"dsh") + T(p.X(2),p.Y(0.3)-4,"渦電流損","lb","end"))
        + G(2, p.dot(f0,fe(f0)) + A(p.X(f0),p.Y(fe(f0)),p.X(f1),p.Y(fe(f1)),"vecr") + p.dot(f1,fe(f1),"pt3") + T(p.X(f1)+(low?8:-8),p.Y(fe(f1))-6,low?"増加":"減少","ans",low?"start":"end"))
        + G(3, p.hline(1.6,"cvb") + T(p.X(2),p.Y(1.6)-5,"銅損（電流一定）","blu","end"));
    }};
}
Z["k-iron-low"] = ironFig(true);
Z["k-iron-high"] = ironFig(false);

// 最大効率の負荷率（r-eff）
Z["r-eff"] = { h: 200,
  s: ["鉄損は負荷に関係なく一定（100 W の横線）。銅損は負荷率 x の<b>2乗</b>に比例（全負荷 x = 1 で 400 W）。",
      "効率が最大になるのは <b>鉄損 = 銅損</b> のとき。",
      "400x² = 100 → x² = 1/4 → <b>x = 0.5</b>。"],
  d(){ const p = P({x:50,y:16,w:260,h:150},[0,1.1],[0,450]);
    return G(1, p.axes({xt:[[0.5,"0.5"],[1,"1"]], yt:[[100,"100"],[400,"400"]], xl:"負荷率 x", yl:"損失 [W]"}) + p.hline(100,"cvb",0,1.1) + T(p.X(1.1),p.Y(100)-5,"鉄損","blu","end") + p.fn(x=>400*x*x,0,1.05) + T(p.X(1)-6,p.Y(400),"銅損","lbi","end"))
      + G(2, p.dot(0.5,100,"pt3") + T(p.X(0.5)-6,p.Y(100)-8,"等しい点","ans","end"))
      + G(3, p.guide(0.5,100,"gd3") + T(p.X(0.5),p.Y(0)+28,"x = 0.5","ans","middle"));
  }};

// 変圧器の効率（r-eff2）
Z["r-eff2"] = { h: 150,
  s: ["入力 = 出力 + 損失。損失は 鉄損 200 W + 銅損 300 W = 500 W。",
      "入力 = 9000 + 500 = <b>9500 W</b>。",
      "効率 = 出力 ÷ 入力 = 9000 ÷ 9500 ≒ <b>94.7 %</b>。分母は入力（出力 + 損失）。"],
  d(){ return G(1, Bar(20,40,300,28,[[9000,"出力 9000 W","fl2"],[500,"","fl"]]) + T(300,30,"損失 500","ans","middle"))
      + G(2, Dim(20,84,320,84,"入力 9500 W","lbi"))
      + G(3, T(170,128,"9000 ÷ 9500 ≒ 94.7 %","ans","middle"));
  }};

// 電圧変動率（r-reg）
Z["r-reg"] = { h: 140,
  s: ["無負荷のとき 104 V、定格（負荷あり）のとき 100 V。差は <b>4 V</b>。",
      "電圧変動率 = 差 ÷ <b>定格電圧</b> × 100。",
      "4 ÷ 100 × 100 = <b>4 %</b>。104 で割ると 3.8（×）。"],
  d(){ return G(1, Bar(20,30,300*104/110,24,[[100,"定格 100 V","fl3"],[4,"","fl"]]) + T(20+300*102/110,22,"+4","ans","middle"))
      + G(2, Bar(20,70,300*100/110,24,[[100,"分母は 100 V","fl2"]]))
      + G(3, T(170,124,"4 ÷ 100 = 4 %","ans","middle"));
  }};

// 理想変圧器（r-turns）
Z["r-turns"] = { h: 170,
  s: ["巻数比 N₁ : N₂ = 1 : 5。電圧は巻数に比例して 5 倍になる。",
      "理想変圧器は電力が同じ（V₁I₁ = V₂I₂）。電圧が 5 倍なら電流は <b>1/5</b>。",
      "二次 2 A なので、一次電流 = 2 × 5 = <b>10 A</b>。"],
  d(){ const coil=(x,n)=>{let s="";for(let i=0;i<n;i++)s+=`<path class="cv" d="M${x} ${40+i*20}a8 10 0 0 ${x<170?0:1} 0 20" fill="none"/>`;return s;};
    return G(1, coil(140,5) + coil(200,5) + `<path class="pl2" d="M166 36v108M174 36v108"/>` + T(130,30,"N₁ = 1","lbi","end") + T(210,30,"N₂ = 5","lbi") + W([140,40],[40,40]) + W([140,140],[40,140]) + W([200,40],[300,40]) + W([200,140],[300,140]))
      + G(2, A(240,40,280,40,"vec") + T(260,56,"I₂ = 2 A","lbi","middle"))
      + G(3, A(60,40,100,40,"vecr") + T(80,56,"I₁ = 10 A","ans","middle") + T(170,162,"電流は巻数に反比例","lb","middle"));
  }};

// 三相電力（r-3ph）
Z["r-3ph"] = { h: 170,
  s: ["Y 結線の1相分：相電圧 = 200 ÷ √3 ≒ 115.5 V、相電流 = 線電流 = 10 A、力率 0.8。",
      "1相の電力 = 115.5 × 10 × 0.8 ≒ <b>924 W</b>。",
      "3相で 924 × 3 ≒ 2770 W ≒ <b>2.8 kW</b>（= √3 × 200 × 10 × 0.8）。"],
  d(){ const o=[110,90], arm=(deg)=>[o[0]+60*Math.cos(deg*PI/180),o[1]-60*Math.sin(deg*PI/180)];
    const a=arm(90),b=arm(210),c=arm(330);
    return G(1, W(o,a)+W(o,b)+W(o,c)+Dot(...o)+Dot(...a)+Dot(...b)+Dot(...c) + T(a[0]+8,a[1]+4,"1相 115.5 V・10 A","lbi") + T(o[0],168,"線間 200 V","lb","middle"))
      + G(2, T(230,70,"1相 924 W","ans","middle"))
      + G(3, T(230,100,"× 3 ≒ 2.8 kW","ans","middle"));
  }};

// Δ → Y 変換（r-dy）
Z["r-dy"] = { h: 180,
  s: ["Δ 結線：三角形の各辺が 30 Ω。",
      "対称なら Δ → Y は <b>1/3 倍</b>：30 ÷ 3 = <b>10 Ω</b>。",
      "式で確認：30 × 30 ÷ (30 + 30 + 30) = 10 Ω。逆に Y → Δ は 3 倍。"],
  d(){ const p1=[170,20], p2=[70,160], p3=[270,160], o=[170,113];
    return G(1, W(p1,p2,p3,p1) + T(108,86,"30 Ω","lbi","end") + T(232,86,"30 Ω","lbi") + T(170,176,"30 Ω","lbi","middle") + Dot(...p1)+Dot(...p2)+Dot(...p3), 2)
      + G(2, `<path class="cvb" d="M${o[0]} ${o[1]}L${p1[0]} ${p1[1]}M${o[0]} ${o[1]}L${p2[0]} ${p2[1]}M${o[0]} ${o[1]}L${p3[0]} ${p3[1]}"/>` + T(178,70,"10 Ω","ans") + T(124,142,"10 Ω","ans","middle") + T(216,142,"10 Ω","ans","middle"))
      + G(3, "");
  }};

// Δ−Y 三相変圧器（r-3ptr）
Z["r-3ptr"] = { h: 140,
  s: ["一次は Δ 結線：相電圧 = 線間電圧 = <b>200 V</b>。",
      "巻線比 1 : 2 → 二次の相電圧 = 2 × 200 = <b>400 V</b>。",
      "二次は Y 結線：線間電圧 = √3 × 400 ≒ <b>693 V</b>。"],
  d(){ return G(1, Box(10,40,90,40,"一次 200 V") + T(55,30,"Δ：相 = 線","lb","middle"))
      + G(2, A(104,60,124,60,"vec") + T(114,52,"×2","lb","middle") + Box(128,40,90,40,"相 400 V"))
      + G(3, A(222,60,242,60,"vec") + T(232,52,"×√3","lb","middle") + Box(246,40,86,40,"線 693 V","fl bs","ans") + T(289,100,"Y：線 = √3 × 相","lb","middle"));
  }};

// コッククロフト・ウォルトン（r-cw）
Z["r-cw"] = { h: 190,
  s: ["二次電圧の最大値 Vp = 10 kV。コンデンサの段を重ねるごとに電圧が積み上がる。",
      "このプリントの式では、コンデンサ n 個で <b>n × Vp</b>。",
      "4 段なので 4 × 10 = <b>40 kV</b>（倍電圧回路＝2個なら 20 kV）。"],
  d(){ const p = P({x:50,y:16,w:260,h:140},[0,4.6],[0,45]); let s="";
    [1,2,3,4].forEach(n=>s+=`<rect class="${n===4?"fl":"fl3"} bs" x="${p.X(n-0.8)}" y="${p.Y(n*10)}" width="${R(p.X(0.6)-p.X(0))}" height="${R(p.Y(0)-p.Y(n*10))}"/>`+T(p.X(n-0.5),p.Y(0)+14,`C${"₁₂₃₄"[n-1]}まで`,"lb","middle"));
    return G(1, p.axes({xt:[], yt:[[10,"10"],[20,"20"],[40,"40"]], xl:"", yl:"[kV]"}) + `<rect class="fl3 bs" x="${p.X(0.2)}" y="${p.Y(10)}" width="${R(p.X(0.6)-p.X(0))}" height="${R(p.Y(0)-p.Y(10))}"/>` + T(p.X(0.5),p.Y(10)-6,"Vp","lb","middle"), 2)
      + G(2, s)
      + G(3, T(p.X(3.5),p.Y(40)-6,"40 kV","ans","middle"));
  }};

// 三相整流のリプル（r-ripple）
Z["r-ripple"] = { h: 200,
  s: ["12 ピーク形は山が 360° ÷ 12 = <b>30°</b> ごと。出力は山をつないだ形（実線）。",
      "谷は山の真ん中から ±15° の位置。谷の高さ = 最大値 × cos15° = <b>0.966</b>。",
      "リプル = (1 − 0.966) × 100 = <b>3.4 %</b>。6 ピーク（点線）は谷が cos30° = 0.866 → 13.4 %。"],
  d(){ const p = P({x:50,y:16,w:260,h:150},[0,120],[0.8,1.02]);
    const env=(step)=>t=>{ const k=Math.round(t/step); return Math.cos((t-k*step)*PI/180); };
    return G(1, p.axes({xt:[[30,"30°"],[60,"60°"],[90,"90°"],[120,"120°"]], yt:[[1,"1"],[0.966,"0.966"],[0.866,"0.866"]], xl:"", yl:"出力"}) + p.fn(env(30),0,120,"cv",240))
      + G(2, p.hline(0.966,"gd3") + p.dot(15,0.966,"pt3") + T(p.X(15),p.Y(0.966)+16,"谷 cos15°","ans","middle"))
      + G(3, p.fn(env(60),0,120,"dsh",240) + T(p.X(30),p.Y(0.866)-6,"6ピーク","lb","middle"));
  }};

// ブリッジ整流の電圧降下（r-bridge-v）
Z["r-bridge-v"] = { h: 140,
  s: ["二次電圧の最大値 10 V。",
      "ブリッジ整流では電流が<b>いつもダイオードを2個</b>通る：0.7 × 2 = 1.4 V 落ちる。",
      "負荷電圧の最大値 = 10 − 1.4 = <b>8.6 V</b>（半波なら 9.3 V）。"],
  d(){ return G(1, Bar(20,30,300,26,[[10,"二次 最大 10 V","fl3"]]))
      + G(2, Bar(20,74,300,26,[[0.7,"","fl2"],[8.6,"","fl3"],[0.7,"","fl2"]]) + T(30,116,"D 0.7","ok","middle") + T(310,116,"D 0.7","ok","middle"))
      + G(3, Bar(20+300*0.07,74,300*0.86,26,[[1,"負荷 8.6 V","fl"]]));
  }};

/* ================= 計測・安全・ディジタル ================= */
// 等電位化（r-epr）
Z["r-epr"] = { h: 166,
  s: ["2台の ME 機器の電位差は最大 10 mV。その間に人体（1 kΩ）がふれる。",
      "I = V ÷ R = 10 mV ÷ 1 kΩ = 10⁻⁵ A = <b>10 μA</b>。",
      "10 μA は CF 形の患者漏れ電流（正常時）の許容値と同じ。だから電位差を 10 mV 以下に抑える。"],
  d(){ return G(1, Box(20,40,80,50,"機器 1") + Box(240,40,80,50,"機器 2") + W([100,65],[140,65]) + W([200,65],[240,65]) + Rh(170,65,"人体 1 kΩ") + Dim(100,130,240,130,"電位差 10 mV","lbi"))
      + G(2, A(144,82,196,82,"vecr") + T(170,98,"10 μA","ans","middle"))
      + G(3, T(170,156,"CF 形の許容値 10 μA と一致","lb","middle"));
  }};

// 周波数と感知電流（r-perc）
Z["r-perc"] = { h: 200,
  s: ["商用周波数付近の最小感知電流は 1 mA。<b>1 kHz までは</b>ほぼ同じ。",
      "1 kHz を超えると、感じる電流は<b>周波数に比例</b>して大きくなる（感じにくくなる）。",
      "50 kHz は 1 kHz の 50 倍 → 1 mA × 50 = <b>50 mA</b>。"],
  d(){ const p = P({x:50,y:16,w:260,h:150},[1,5],[-0.3,2.3]); const g=lf=>lf<=3?0:lf-3;
    return G(1, p.axes({xt:[[1,"10"],[3,"1k"],[5,"100k"]], yt:[[0,"1"],[1,"10"],[2,"100"]], xl:"f [Hz]", yl:"感知電流 [mA]"}) + p.fn(g,1,3))
      + G(2, p.fn(g,3,5))
      + G(3, p.guide(Math.log10(50000),Math.log10(50),"gd3") + p.dot(Math.log10(50000),Math.log10(50),"pt3") + T(p.X(4.7)-6,p.Y(1.7)-6,"50 kHz → 50 mA","ans","end"));
  }};

// AD 変換の量子化（r-ad）
Z["r-ad"] = { h: 190,
  s: ["入力範囲 0〜5 V を階段に分けて数字にする。",
      "10 ビット → 2¹⁰ = <b>1024 段</b>。",
      "1段 = 5 V ÷ 1024 ≒ 0.00488 V ≒ <b>4.9 mV</b>（ビット数の 10 で割らない）。"],
  d(){ const p = P({x:50,y:16,w:260,h:140},[0,8],[0,8]); let st="M"+p.X(0)+" "+p.Y(0); for(let i=0;i<8;i++) st+=`V${p.Y(i)}H${p.X(i+1)}`;
    return G(1, p.axes({xt:[], yt:[[0,"0 V"],[8,"5 V"]], xl:"入力", yl:"出力"}) + p.fn(x=>x,0,8,"dsh"))
      + G(2, `<path class="cv" d="${st}"/>` + T(p.X(8),p.Y(2),"（実際は 1024 段）","lb","end"))
      + G(3, Dim(p.X(4.4),p.Y(4),p.X(4.4),p.Y(5),"","lb") + T(p.X(4.4)+8,p.Y(4.5)+4,"1段 ≒ 4.9 mV","ans"));
  }};

// 標本化定理（r-samp）
Z["r-samp"] = { h: 200,
  s: ["最高 1 kHz の信号は、1 周期 1 ms の波。",
      "サンプリング周波数は最高周波数の <b>2 倍以上</b> = 2 kHz → 周期 <b>0.5 ms 以下</b>（赤い点：1周期に2回）。",
      "1 ms ごと（白い点）だと毎回同じ位置しか取れず、波が消えてしまう。"],
  d(){ const p = P({x:50,y:16,w:260,h:150},[0,3],[-1.2,1.2]); const f=t=>Math.sin(2*PI*t+0.6);
    let r="",w=""; for(let t=0;t<=3.001;t+=0.5) r+=p.dot(t,f(t),"pt3"); for(let t=0;t<=3.001;t+=1) w+=p.dot(t,f(t)+0.0,"pt0");
    return G(1, p.axes({xt:[[0.5,"0.5"],[1,"1"],[2,"2"],[3,"3"]], yt:[[0,"0"]], xl:"t [ms]"}) + p.fn(f,0,3))
      + G(2, r + T(p.X(3),p.Y(1.1),"0.5 ms ごと","ans","end"))
      + G(3, w + p.hline(f(0),"dsh") + T(p.X(3),p.Y(f(0))+14,"1 ms ごと（×）","lb","end"));
  }};

/* ================= 新しい図の類題（n4〜n12） ================= */
// 減算回路（n4）
Z["n4"] = { h: 200,
  s: ["＋端子は V₂ = 1.5 V を 10 kΩ と 50 kΩ で分圧：1.5 × 50 ÷ 60 = <b>1.25 V</b>。",
      "仮想短絡で − 端子も 1.25 V。V₁ 側の 10 kΩ には (1.2 − 1.25) ÷ 10k = −5 μA（右から左へ 5 μA）。",
      "同じ 5 μA が 50 kΩ を流れる：Vo = 1.25 + 5 μA × 50 kΩ = <b>1.5 V</b>（= 5 × (1.5 − 1.2)）。"],
  d(){ const c = Op(170,100) + W([40,90],[170,90]) + Rh(100,90,"10 kΩ") + T(36,94,"V₁ 1.2","lbi","end")
      + W([40,130],[150,130],[150,110],[170,110]) + Rh(100,130,"10 kΩ","",true) + T(36,134,"V₂ 1.5","lbi","end")
      + W([150,130],[150,184]) + Rv(150,160,"50 kΩ","",true) + Gnd(150,188) + Dot(150,130)
      + W([150,90],[150,30],[260,30],[260,100]) + Rh(205,30,"50 kΩ") + W([216,100],[300,100]) + Dot(150,90) + Dot(260,100) + T(304,104,"Vo","lbi");
    return G(1, c + T(176,142,"+ 1.25 V","ans"))
      + G(2, T(176,66,"− 1.25 V","ans") + A(142,90,120,90,"vecr") + T(131,106,"5 μA","ans","middle"))
      + G(3, A(250,30,230,30,"vecr") + T(240,46,"5 μA","ans","middle") + T(300,120,"Vo = 1.5 V","ans","end"));
  }};

// 2段の反転増幅（n5）
Z["n5"] = { h: 150,
  s: ["1段目：反転増幅 −20/10 = <b>−2 倍</b> → 0.5 × (−2) = −1 V。",
      "2段目：反転増幅 −30/10 = <b>−3 倍</b> → (−1) × (−3) = <b>+3 V</b>。",
      "反転を2回通ると符号は元に戻る。全体は (−2) × (−3) = 6 倍。"],
  d(){ return G(1, T(14,64,"0.5 V","lbi") + W([50,60],[90,60]) + Box(90,40,80,40,"× (−2)") + W([170,60],[200,60]) + T(185,96,"−1 V","ans","middle"))
      + G(2, Box(200,40,80,40,"× (−3)") + W([280,60],[300,60]) + T(304,64,"+3 V","ans"))
      + G(3, T(170,130,"全体 6 倍（符号は元どおり）","lb","middle"));
  }};

// ツェナーダイオード（n6）
Z["n6"] = { h: 190,
  s: ["ツェナーが働くと、ツェナーと負荷（300 Ω）には一定の <b>9 V</b> がかかる。",
      "100 Ω の電圧 = 15 − 9 = 6 V → 全電流 = 6 ÷ 100 = <b>60 mA</b>。負荷電流 = 9 ÷ 300 = <b>30 mA</b>。",
      "ツェナー電流 = 60 − 30 = <b>30 mA</b>。"],
  d(){ const yt=40, yb=160;
    const c = W([40,yb],[40,yt],[300,yt],[300,yb],[40,yb]) + W([190,yt],[190,yb]) + Dot(190,yt) + Dot(190,yb)
      + Bv(40,100,"15 V") + Rh(110,yt,"100 Ω") + Dv(190,100,false) + T(178,104,"9 V","lbi","end") + Rv(300,100,"300 Ω",true);
    return G(1, c + T(245,yt-8,"9 V 一定","ans","middle"))
      + G(2, A(80,yt+12,140,yt+12,"vecr") + T(110,yt+26,"60 mA","ans","middle") + A(284,84,284,116,"vecr") + T(284,152,"30 mA","ans","middle"))
      + G(3, A(206,84,206,116,"vecr") + T(212,136,"30 mA","ans"));
  }};

// トランジスタ回路（n7）
Z["n7"] = { h: 200,
  s: ["ベース側：IB = (5 − 0.7) ÷ 43 kΩ = <b>0.1 mA</b>（ベース電流から先に出す）。",
      "コレクタ電流 IC = hFE × IB = 100 × 0.1 = <b>10 mA</b>。",
      "500 Ω の電圧降下 = 10 mA × 500 Ω = 5 V。VCE = 12 − 5 = <b>7 V</b>。"],
  d(){ return G(1, Box(20,30,120,50,"5 V − 0.7 V") + T(80,100,"÷ 43 kΩ","lb","middle") + T(80,120,"IB = 0.1 mA","ans","middle"))
      + G(2, A(150,115,190,115,"vec") + T(170,107,"×100","lb","middle") + Box(200,95,120,40,"IC = 10 mA","fl bs","ans"))
      + G(3, Bar(20,160,300,26,[[5,"500 Ω に 5 V","fl3"],[7,"VCE = 7 V","fl"]]) + T(170,152,"電源 12 V","lb","middle"));
  }};

// 半波整流平滑（n10）
Z["n10"] = { h: 200,
  s: ["二次電圧の実効値 = 100 × 1/10 = 10 V。最大値は 10 × √2 ≒ <b>14.1 V</b>。",
      "無負荷のコンデンサは<b>最大値まで</b>充電され、そのまま放電しない。",
      "ダイオードで 0.7 V 落ちるので Vo = 14.1 − 0.7 ≒ <b>13.4 V</b>。実効値 10 V のままや 9.3 V は誤り。"],
  d(){ const p = P({x:50,y:16,w:260,h:150},[0,3*PI],[-16,16]);
    return G(1, p.axes({xt:[], yt:[[14.1,"14.1"],[0,"0"],[-14.1,"−14.1"]], xl:"t", yl:"[V]"}) + p.fn(t=>14.1*Math.sin(t),0,3*PI,"cvm") + p.hline(10,"dsh") + T(p.X(3*PI),p.Y(10)+12,"実効値 10","lb","end"))
      + G(2, p.pl([[0,0]].concat(Array.from({length:21},(_,i)=>[i*PI/40,13.4*Math.sin(i*PI/40)])).concat([[3*PI,13.4]]),"cv"))
      + G(3, T(p.X(PI),p.Y(13.4)-6,"Vo ≒ 13.4 V","ans","middle"));
  }};

// Y 結線の電力（n12）
Z["n12"] = { h: 170,
  s: ["Y 結線では、負荷1相にかかるのは線間電圧の <b>1/√3</b>：200 ÷ 1.73 ≒ 115.5 V。",
      "相電流 = 115.5 ÷ 20 ≒ <b>5.77 A</b>（Y では線電流と同じ）。",
      "P = 3 × 115.5 × 5.77 ≒ <b>2.0 kW</b>（= 200² ÷ 20）。相電圧に 200 V を使うと 6.0 kW（×）。"],
  d(){ const o=[110,95], arm=(deg)=>[o[0]+60*Math.cos(deg*PI/180),o[1]-60*Math.sin(deg*PI/180)];
    const a=arm(90),b=arm(210),c=arm(330);
    return G(1, W(o,a)+W(o,b)+W(o,c)+Dot(...o)+Dot(...a)+Dot(...b)+Dot(...c) + Rr((o[0]+a[0])/2,(o[1]+a[1])/2,90,"20 Ω","",26,4) + T(o[0],168,"線間 200 V","lb","middle") + T(230,50,"1相 115.5 V","ans","middle"))
      + G(2, T(230,80,"5.77 A","ans","middle"))
      + G(3, T(230,110,"3 × 115.5 × 5.77","lb","middle") + T(230,130,"≒ 2.0 kW","ans","middle"));
  }};


/* ================= 過去問（国試）の計算問題 ================= */
// 計算の流れ図：rows=[[説明, 矢印の横の演算, 箱の中身]]。最後の箱が答え（赤）
function Flow(rows){
  const n=rows.length, bh=38, gap=24;
  return { h: 16+n*bh+(n-1)*gap, s: rows.map(r=>r[0]),
    d(){ let out=""; rows.forEach(([,op,box],i)=>{ const y=8+i*(bh+gap), last=i===n-1; let g="";
      if(i>0) g+=A(170,y-gap+2,170,y-2,"vec0")+(op?T(180,y-gap/2+5,op,"lb fo"):"");
      g+=Box(10,y,320,bh,"",last?"fl bs":"blk")+T(170,y+bh/2+5,box,last?"ans fx":"lbi fx","middle"); out+=G(i+1,g); }); return out; } };
}
// 表（マス目）：rows=[[文字…]]、hl={"行,列":"fl"|"fl2"}
function Grid(x,y,c,rows,hl={}){ let s="";
  rows.forEach((r,i)=>r.forEach((v,j)=>{ const k=hl[i+","+j]||"fl3"; s+=`<rect class="${k} bs" x="${R(x+j*c)}" y="${R(y+i*c)}" width="${c}" height="${c}"/>`+T(x+j*c+c/2,y+i*c+c/2+4,v,k==="fl"?"ans":"lbi","middle"); }));
  return s; }
// 2×2 の判定表（感度・特異度・陽性的中率）
function Table2(rows, cols, v, hl, s, foot){
  return { h: 176, s,
    d(){ const x0=110, y0=40, w=100, h=36;
      let g = cols.map((c,j)=>T(x0+j*w+w/2,y0-10,c,"lbi","middle")).join("") + rows.map((r,i)=>T(x0-8,y0+i*h+h/2+4,r,"lbi","end")).join("");
      const cell=(i,j,cls)=>`<rect class="${cls} bs" x="${x0+j*w}" y="${y0+i*h}" width="${w}" height="${h}"/>`+T(x0+j*w+w/2,y0+i*h+h/2+4,v[i][j],cls==="fl"?"ans":"lbi","middle");
      g += [0,1].map(i=>[0,1].map(j=>cell(i,j,"fl3")).join("")).join("");
      return G(1, g) + hl.map((cells,k)=>G(k+2, cells.map(([i,j,c])=>cell(i,j,c)).join("") + (foot[k]?T(170,y0+2*h+24+k*17,foot[k],"ans","middle"):""))).join("");
    }};
}
// 直角三角形：横 a・縦 b・斜辺（ラベル付き）
function RightTri(a,b,la,lb_,lc,s,k){
  return { h: 196, s,
    d(){ const o=[60,176], ax=o[0]+a*k, by=o[1]-b*k;
      return G(1, A(o[0],o[1],ax,o[1],"vec") + T((o[0]+ax)/2,o[1]+16,la,"lbi","middle"))
        + G(2, A(ax,o[1],ax,by,"vec") + T(ax+8,(o[1]+by)/2+4,lb_,"lbi"))
        + G(3, A(o[0],o[1],ax,by,"vecr") + T((o[0]+ax)/2-8,(o[1]+by)/2-6,lc,"ans","end"));
    }};
}
// CT 値と減弱係数の比（直線のグラフ）：pts=[[μ/μw, CT値, ラベル]]
function ctFig(pts, s){
  return { h: 210, s,
    d(){ const p = P({x:54,y:16,w:256,h:156},[0.9,1.25],[-120,260]);
      let g = G(1, p.axes({xt:[[1,"1.0"],[1.1,"1.1"],[1.2,"1.2"]], yt:[[0,"0"],[100,"100"],[200,"200"]], xl:"μ / μ水", yl:"CT 値 [HU]", x0:0}) + p.fn(r=>(r-1)*1000,0.9,1.25) + p.dot(1,0));
      pts.forEach(([r,ct,lab],i)=>{ g += G(i+2, p.guide(r,ct,"gd3") + p.dot(r,ct,"pt3") + T(p.X(r)-6,p.Y(ct)-6,lab,"ans","end")); });
      return g; }};
}
// 指数のグラフ（減衰・回復）共通
function expFig({xr, yr=[0,1.08], f, xl, yl, xt, yt, marks, s, h=206}){
  return { h, s,
    d(){ const p = P({x:54,y:16,w:256,h:h-56},xr,yr);
      let g = G(1, p.axes({xt, yt, xl, yl}) + p.fn(f,xr[0],xr[1]));
      marks.forEach((m,i)=>{ g += G(i+2, p.guide(m[0],m[1],m[3]||"gd3") + p.dot(m[0],m[1],m[3]==="gd2"?"pt":"pt3") + T(p.X(m[0])+(m[4]?m[4][0]:8),p.Y(m[1])+(m[4]?m[4][1]:-6),m[2],m[3]==="gd2"?"lbi":"ans",m[4]?m[4][2]:"start")); });
      return g; }};
}

Z["78-am-60"] = Flow([
  ["エネルギーを J に直す：0.025 eV × 1.6×10⁻¹⁹ = <b>4×10⁻²¹ J</b>。", "", "E = 4×10⁻²¹ J"],
  ["½mv² = E から v = √(2E/m)。2E ÷ m = 8×10⁻²¹ ÷ 1.7×10⁻²⁷ ≒ <b>4.7×10⁶</b>。", "2E ÷ m", "2E/m ≒ 4.7×10⁶"],
  ["最後に √ をとる：<b>v ≒ 2.2×10³ m/s</b>（秒速約 2.2 km）。√ を忘れると 4.7×10⁶（×）。", "√", "v ≒ 2.2×10³ m/s"]]);
Z["78-am-71"] = Flow([
  ["照射線量 X = 2.0×10⁻⁴ C/kg（空気 1 kg にできた電荷）。", "", "X = 2.0×10⁻⁴ C/kg"],
  ["イオン対1組に 34 eV → 電荷 1 C あたり <b>34 J</b>（W/e = 34 J/C、1.6×10⁻¹⁹ は打ち消しあう）。", "× W/e", "W/e = 34 J/C"],
  ["K = 2.0×10⁻⁴ × 34 = <b>6.8×10⁻³ Gy</b>（J/kg = Gy）。", "かける", "K = 6.8×10⁻³ Gy"]]);
Z["78-am-74"] = Flow([
  ["100 kV × 800 mA = 80,000 W = <b>80 kW</b>（kV × mA = W）。", "", "100 kV × 800 mA = 80 kW"],
  ["管電圧リプルが 10 % をこえるので <b>0.95</b> をかける。", "× 0.95", "リプル 12 % → × 0.95"],
  ["80 × 0.95 = <b>76.0 kW</b>。撮影時間 0.1 s はかけ算に使わない。", "", "76.0 kW"]]);
Z["78-pm-29"] = Flow([
  ["等価照射野（A/P 法）= 4 × 300 ÷ 80 = <b>15 cm</b>。平均の 20 cm にしない。", "", "等価照射野 15 × 15 cm²"],
  ["出力係数 = 22.00 ÷ 20.00 = <b>1.10</b>。", "表から", "出力係数 1.10"],
  ["10×10 の dmax：20 nC/100 MU × 5×10⁻² Gy/nC = <b>0.01 Gy/MU</b>。", "校正", "0.01 Gy/MU"],
  ["深さ 5 cm では 0.01 × 1.10 × 0.95（TMR）= <b>0.01045 Gy/MU</b>。", "× 1.10 × 0.95", "0.01045 Gy/MU"],
  ["MU = 2 ÷ 0.01045 ≒ <b>191</b>。", "2 Gy ÷", "MU ≒ 191"]]);
Z["78-pm-68"] = RightTri(4,8,"基準 2.4/60 = 0.04","指示値 5.1/64 ≒ 0.08","合成 ≒ 0.09",
  ["割り算の不確かさは<b>相対</b>不確かさで考える。基準：2.4 ÷ 60 = <b>0.040</b>（横の辺）。",
   "指示値：5.1 ÷ 64 ≒ <b>0.080</b>（縦の辺）。",
   "2乗して足してルート＝斜めの辺：√(0.040² + 0.080²) = √0.008 ≒ <b>0.09</b>。単純に足した 0.12 は×。"],17);
Z["78-pm-69"] = Flow([
  ["面積線量 ÷ 照射面積 = 160 ÷ 400 = <b>0.4 Gy</b>（皮膚の位置の空気カーマ）。", "", "160 Gy·cm² ÷ 400 cm² = 0.4 Gy"],
  ["後方散乱係数 1.4 と組織線量変換係数 1.06 をかける（どちらも 1 より大きい）。", "× 1.4 × 1.06", "0.4 × 1.4 × 1.06"],
  ["0.4 × 1.4 × 1.06 ≒ 0.59 → <b>約 0.6 Gy</b>。", "", "≒ 0.6 Gy"]]);
Z["77-am-63"] = Flow([
  ["1 cm³ の中の電子の数 = 密度 × アボガドロ数 × Z ÷ A。", "", "2.7 × 6.0×10²³ × 13 ÷ 27"],
  ["計算すると <b>7.8×10²³ 個/cm³</b>。", "", "電子 7.8×10²³ 個/cm³"],
  ["電子断面積 = μ ÷ 電子の数 = 1.0 ÷ 7.8×10²³ ≒ 1.3×10⁻²⁴ cm² = <b>1.3 b</b>。", "1.0 cm⁻¹ ÷", "1.3×10⁻²⁴ cm² = 1.3 b"]]);
Z["77-am-94"] = { h: 200,
  s: ["周期的にゆれる明るさのパターン。", "グラフから最大値 ≒ <b>3.3</b>、最小値 ≒ <b>2.7</b>。",
      "マイケルソンコントラスト = (最大 − 最小) ÷ (最大 + 最小) = 0.6 ÷ 6.0 = <b>0.1</b>。差だけの 0.6 や 最大÷最小 の 1.2 は×。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[0,4],[2.5,3.65]);
    return G(1, p.axes({xt:[], yt:[[2.7,"2.7"],[3,"3.0"],[3.3,"3.3"]]}) + p.fn(x=>3+0.3*Math.sin(2*PI*x),0,4))
      + G(2, p.hline(3.3,"gd3") + p.hline(2.7,"gdb") + T(p.X(4),p.Y(3.3)-5,"最大 3.3","ans","end") + T(p.X(4),p.Y(2.7)+13,"最小 2.7","blu","end"))
      + G(3, T(p.X(2),p.Y(3.5),"0.6 ÷ 6.0 = 0.1","ans","middle"));
  }};
Z["77-pm-30"] = Flow([
  ["基準の 1 MU あたりの線量は 1 cGy。", "", "1 cGy/MU"],
  ["照射野 20×20 の出力係数 1.2 と、深さ 5 cm の TMR 0.8 をかける：<b>0.96 cGy/MU</b>。", "× 1.2 × 0.8", "0.96 cGy/MU"],
  ["MU = 200 ÷ 0.96 ≒ <b>208</b>。", "200 cGy ÷", "MU ≒ 208"]]);
Z["77-pm-35"] = Flow([
  ["画素数 = 1,024 × 2,048 = 2,097,152 画素。", "", "1,024 × 2,048 画素"],
  ["16 bit = <b>2 byte</b>（8 bit = 1 byte）。", "× 2 byte", "4,194,304 byte"],
  ["1 MB = 1,024 × 1,024 byte → <b>4 MB</b>。", "÷ 1,048,576", "4 MB"]]);
Z["77-pm-93"] = Flow([
  ["出力画像の SNR = 20。DQE は <b>2乗</b>で比べる：20² = 400。", "", "SNR² = 400"],
  ["入射 X 線の SNR² は量子数そのもの（1,000）。", "÷ 1,000", "400 ÷ 1,000"],
  ["DQE = <b>0.4</b>。2乗を忘れた 0.02 は×。", "", "DQE = 0.4"]]);
Z["77-pm-94"] = expFig({ xr:[80,160], yr:[0,1.7], f:d=>(100/d)**2, xl:"距離 [cm]", yl:"線量（倍）",
  xt:[[100,"100"],[120,"120"],[150,"150"]], yt:[[0.69,"0.69"],[1,"1"]],
  marks:[[100,1,"100 cm を 1 とする","gd2"],[120,0.694,"(100/120)² ≒ 0.69"]],
  s:["X 線の強さは<b>距離の2乗に反比例</b>（逆2乗則）。離れるほど急に減る。",
     "100 cm のときを 1 とする。",
     "120 cm では (100 ÷ 120)² = 1 ÷ 1.44 ≒ <b>0.69 倍</b>。比のままの 0.83 や逆数の 1.44 は×。"] });
Z["77-pm-100"] = Flow([
  ["1時間あたり：0.14 × 200 ÷ 2² = <b>7 μSv/h</b>（距離は2乗で割る）。", "", "0.14 × 200 ÷ 2² = 7 μSv/h"],
  ["5 分 = 5/60 時間：7 × 5/60 ≒ <b>0.58 μSv</b>（1回）。", "× 5/60 h", "0.58 μSv / 回"],
  ["年 50 回：0.58 × 50 ≒ <b>30 μSv</b>。", "× 50 回", "≒ 30 μSv"]]);
Z["76-am-5"] = Flow([
  ["回転数 2.5 倍 × 焦点軌道直径 1.2 倍 = 3.0。", "", "2.5 × 1.2 = 3.0"],
  ["短時間許容負荷はこの<b>平方根</b>に比例。", "√", "√3.0"],
  ["√3.0 ≒ <b>1.7 倍</b>。√ を忘れた 3.0 は×。", "", "≒ 1.7 倍"]]);
Z["76-am-94"] = Table2(["信号あり","信号なし"],["「あり」と回答","「なし」と回答"],[["70","30"],["20","80"]],
  [[[0,0,"fl2"],[1,0,"fl"]],[[0,0,"fl"]]],
  ["表の見方：行が本当の状態、列が観察者の答え（各 100 枚）。",
   "「あり」と答えたのは 70（正解）+ 20（まちがい）= <b>90 枚</b>（左の列）。",
   "陽性的中率 = 70 ÷ 90 ≒ <b>0.78</b>。分母は「あり」と答えた数（感度なら分母は 100）。"],["「あり」と答えた 90","PPV = 70 ÷ 90 ≒ 0.78"]);
Z["76-pm-2"] = { h: 150,
  s: ["分配比 D = 50：同じ体積なら、有機相に 50、水相に 1 の割合で分かれる。",
      "水相に残る割合 = 1 ÷ (1 + 50) = <b>1/51</b>。",
      "100 MBq × 1/51 ≒ <b>2.0 MBq</b>。有機相へ移る 98 MBq と取りちがえない。"],
  d(){ return G(1, Bar(20,40,300,30,[[50,"有機相 50","fl3"],[1,"","fl"]]) + T(314,32,"水相 1","ans","middle"))
      + G(2, T(170,96,"水相に残る = 1/51","ans","middle"))
      + G(3, T(170,126,"100 × 1/51 ≒ 2.0 MBq","ans","middle"));
  }};
Z["76-pm-43"] = Flow([
  ["式を先に書く：深さ 10 cm の線量率 = 基準点の線量率 × 出力係数 × TMR。", "", "2.0 = 基準 × 1.1 × 0.8"],
  ["1.1 × 0.8 = 0.88 で<b>割る</b>。", "÷ 0.88", "基準 = 2.0 ÷ 0.88"],
  ["≒ <b>2.3 Gy/min</b>。かけてしまうと 1.8（×）。", "", "≒ 2.3 Gy/min"]]);
Z["76-pm-74"] = Flow([
  ["反応前：D + T = 2.014 + 3.016 = <b>5.030 Da</b>。", "", "前 5.030 Da"],
  ["反応後：⁴He + n = 4.002 + 1.009 = <b>5.011 Da</b>。前 − 後 = 0.019 Da（質量が減った）。", "前 − 後", "差 0.019 Da"],
  ["0.019 × 930 ≒ 17.7 → <b>約 18 MeV</b>（質量が減ればエネルギーが出る、Q > 0）。", "× 930 MeV", "Q ≒ 18 MeV"]]);
Z["76-pm-95"] = { h: 216,
  s: ["ROC 曲線：縦軸 TPF = 感度、横軸 FPF = <b>1 − 特異度</b>。",
      "感度 90 %（TPF = 0.9）の高さで曲線を見ると、FPF ≒ <b>0.3</b>。",
      "特異度 = 1 − 0.3 = <b>0.7（70 %）</b>。読んだ 0.3 をそのまま答えない。"],
  d(){ const p = P({x:54,y:16,w:200,h:170},[0,1],[0,1]); const k=Math.log(0.1)/Math.log(0.7);
    return G(1, p.axes({xt:[[0.3,"0.3"],[1,"1"]], yt:[[0.9,"0.9"],[1,"1"]], xl:"FPF", yl:"TPF"}) + p.fn(x=>1-(1-x)**k,0,1) + p.fn(x=>x,0,1,"dsh"))
      + G(2, p.guide(0.3,0.9,"gd3") + p.dot(0.3,0.9,"pt3"))
      + G(3, T(p.X(0.3)+10,p.Y(0.9)+20,"特異度 = 1 − 0.3 = 70 %","ans"));
  }};
Z["75-am-45"] = { h: 190,
  s: ["フィルタ F の中心を (3,3) に重ねる。F は中心 5、四すみ −1、ほかは 0（0 の所は計算に入らない）。",
      "中心：5 × 5 = <b>25</b>。",
      "四すみ：−(4 + 2 + 10 + 7) = <b>−23</b>。合計 25 − 23 = <b>2</b>。"],
  d(){ return G(1, T(70,24,"画像（(3,3) のまわり）","lb","middle") + Grid(16,32,36,[["4","·","2"],["·","5","·"],["10","·","7"]]) + T(250,24,"フィルタ F","lb","middle") + Grid(196,32,36,[["−1","0","−1"],["0","5","0"],["−1","0","−1"]]))
      + G(2, Grid(52,68,36,[["5"]],{"0,0":"fl2"}) + Grid(232,68,36,[["5"]],{"0,0":"fl2"}) + T(170,164,"5 × 5 = 25","ok","middle"))
      + G(3, Grid(16,32,36,[["4"]],{"0,0":"fl"}) + Grid(88,32,36,[["2"]],{"0,0":"fl"}) + Grid(16,104,36,[["10"]],{"0,0":"fl"}) + Grid(88,104,36,[["7"]],{"0,0":"fl"}) + T(170,184,"25 − 23 = 2","ans","middle"));
  }};
Z["75-am-70"] = Flow([
  ["バラバラの部品の合計：陽子 + 中性子 + 電子 = 1.0073 + 1.0087 + 0.0005 = <b>2.0165 u</b>（中性の原子なので電子も足す）。", "", "部品の合計 2.0165 u"],
  ["くっついた重水素は 2.0141 u。差（質量欠損）= <b>0.0024 u</b>。", "− 2.0141 u", "質量欠損 0.0024 u"],
  ["0.0024 × 931.5 ≒ <b>2.2 MeV</b>。", "× 931.5 MeV", "≒ 2.2 MeV"]]);
Z["75-am-77"] = Flow([
  ["R₃ と R₄ の並列：30 × 15 ÷ 45 = <b>10 Ω</b>。", "", "R₃ ∥ R₄ = 10 Ω"],
  ["R₂（10 Ω）と直列で 20 Ω。この枝に 120 V → 電流 120 ÷ 20 = <b>6 A</b>。", "+ R₂", "枝 20 Ω → 6 A"],
  ["並列部分の電圧 = 6 × 10 = <b>60 V</b>。", "× 10 Ω", "並列部分 60 V"],
  ["R₃ の電流 = 60 ÷ 30 = <b>2 A</b>。枝全体の 6 A を答えない。", "÷ 30 Ω", "I = 2 A"]]);
Z["75-pm-23"] = Flow([
  ["ピクセルサイズ = FOV ÷ マトリクス数。TR・TE・加算回数は関係ない（ひっかけ）。", "", "FOV 25 cm = 250 mm"],
  ["250 mm ÷ 256 ≒ 0.98 mm。", "÷ 256", "250 ÷ 256 ≒ 0.98"],
  ["<b>約 1 mm</b>。", "", "≒ 1 mm"]]);
Z["75-pm-72"] = { h: 150,
  s: ["入ってきた光子のエネルギーは 75 keV。",
      "そのうち K 殻の結合エネルギー <b>69.5 keV</b> は電子をはがすのに使われる。",
      "残りが光電子の運動エネルギー：75 − 69.5 = <b>5.5 keV</b>。"],
  d(){ return G(1, Bar(20,30,300,30,[[75,"光子 75 keV","fl3"]]))
      + G(2, Bar(20,84,300,30,[[69.5,"結合エネルギー 69.5","fl3"],[5.5,"","fl"]]))
      + G(3, T(300,134,"光電子 5.5 keV","ans","middle"));
  }};
Z["75-pm-94"] = { h: 150,
  s: ["白と黒の<b>1組で1周期</b>（1 cycle）。", "12.8 mm の中に白黒の組が <b>8 つ</b>。",
      "空間周波数 = 8 ÷ 12.8 mm ≒ <b>0.6 cycles/mm</b>。線を別々に数えた 16 本（約 1.2）は×。"],
  d(){ let st=""; for(let i=0;i<8;i++) st+=`<rect class="nd" x="${R(30+i*35)}" y="30" width="17.5" height="60"/>`;
    return G(1, st + `<rect class="bs" x="30" y="30" width="280" height="60" fill="none"/>` + Dim(30,40+60+10,65,100+10,"1 組","lb"))
      + G(2, Dim(30,124,310,124,"12.8 mm に 8 組","lbi"))
      + G(3, T(170,146,"8 ÷ 12.8 ≒ 0.6 cycles/mm","ans","middle"));
  }};
Z["75-pm-99"] = Flow([
  ["防護衣の外（頭頸部 Ha）と最大の部位（Hm）は <b>5 mSv</b>、中（胸 Hb・腹 Hc）は <b>1 mSv</b>。", "", "Ha = 5、Hb = Hc = 1、Hm = 5"],
  ["係数をかける：0.08×5 + 0.44×1 + 0.45×1 + 0.03×5。", "係数", "0.40 + 0.44 + 0.45 + 0.15"],
  ["合計 <b>1.44 mSv</b>。", "", "1.44 mSv"]]);
Z["74-am-9"] = { h: 212,
  s: ["焦点を a → b に 10 cm 動かすと、点 T の像は 1 cm ずれた（模式図、たて方向は拡大）。",
      "相似の三角形：像の移動 : 焦点の移動 = h : (100 − h)（h は受像器から T までの高さ）。",
      "1 : 10 = h : (100 − h) → 100 − h = 10h → h = 100 ÷ 11 ≒ <b>9.1 cm</b>。"],
  d(){ const fa=[110,24], fb=[230,24], t=[170,146], yb=186;
    const ex=(f)=>[t[0]+(t[0]-f[0])*(yb-t[1])/(t[1]-f[1]), yb];
    const ia=ex(fa), ib=ex(fb);
    return G(1, `<path class="pl2" d="M40 ${yb}H300"/>` + Dot(...fa) + Dot(...fb) + T(fa[0],fa[1]-8,"a","lbi","middle") + T(fb[0],fb[1]-8,"b","lbi","middle") + Dim(fa[0],fa[1]+12,fb[0],fb[1]+12,"10 cm","lb")
              + W(fa,ia) + W(fb,ib) + Dot(...t,"pt3") + T(t[0]+8,t[1]-4,"T","ans") + T(306,yb+4,"受像器","lb"))
      + G(2, Dim(t[0]+40,t[1],t[0]+40,yb,"h","ans",6) + Dim(ia[0],yb+14,ib[0],yb+14,"","lb") + T(t[0],yb+24,"1 cm","lb","middle") + T(36,96,"100 − h","lb"))
      + G(3, T(250,120,"h ≒ 9.1 cm","ans"));
  }};
Z["74-am-43"] = Flow([
  ["対向2門・均等 → 1門あたり <b>100 cGy</b>。", "", "1門 100 cGy"],
  ["1 MU あたりの線量：1.00 × 0.84 × 1.05 × 0.75 = <b>0.6615 cGy</b>（くさび係数もかける）。", "÷", "1.00 × 0.84 × 1.05 × 0.75"],
  ["100 ÷ 0.6615 ≒ 151 → <b>約 150 MU</b>。", "", "≒ 150 MU"]]);
Z["74-am-70"] = Flow([
  ["1 MV の電位差で加速 → 運動エネルギー <b>1 MeV</b>。", "", "E = 1 MeV"],
  ["電子の静止エネルギー E₀ = <b>0.511 MeV</b>。", "÷ 0.511", "1 ÷ 0.511"],
  ["E/E₀ ≒ <b>2.0</b>。逆に割った 0.5 は×。", "", "≒ 2.0"]]);
Z["74-am-72"] = Flow([
  ["電子線の飛程の目安は MeV ÷ 2 [g/cm²]：12 ÷ 2 = <b>6 g/cm²</b>。", "", "12 MeV ÷ 2 = 6 g/cm²"],
  ["水以外は密度で割って cm に直す。", "÷ 2.7 g/cm³", "6 ÷ 2.7"],
  ["≒ <b>2.2 cm</b>。", "", "≒ 2.2 cm"]]);
Z["74-am-77"] = { h: 206,
  s: ["空間電荷制限領域：電流 ∝ 電圧の <b>3/2 乗</b>。25 V のとき 100 mA。",
      "電圧の比 = 9/25。3/2 乗は √ をとってから3乗：(3/5)³ = <b>0.216</b>。",
      "100 × 0.216 = <b>21.6 mA</b>。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[0,30],[0,115]);
    return G(1, p.axes({xt:[[9,"9"],[25,"25"]], yt:[[21.6,"21.6"],[100,"100"]], xl:"陽極電圧 [V]", yl:"陽極電流 [mA]"}) + p.fn(v=>100*(v/25)**1.5,0,29) + p.guide(25,100,"gd2") + p.dot(25,100))
      + G(2, T(p.X(14),p.Y(70),"× (9/25)^(3/2) = 0.216","lb"))
      + G(3, p.guide(9,21.6,"gd3") + p.dot(9,21.6,"pt3") + T(p.X(9)+8,p.Y(21.6)+14,"21.6 mA","ans"));
  }};
Z["74-am-93"] = { h: 212,
  s: ["焦点 0.3 mm、焦点〜受像器 100 cm。血管は受像器から 20 cm → 焦点〜血管 <b>80 cm</b>（模式図）。",
      "焦点の両端から血管のふちを通る線が、受像器でずれた幅が半影。",
      "半影 = 0.3 mm × 20 ÷ 80 = 0.075 mm = <b>75 μm</b>。分母を 100 にした 60 は×。"],
  d(){ const f1=[150,20], f2=[190,20], o=[170,140], yb=186;
    const ex=(f)=>[o[0]+(o[0]-f[0])*(yb-o[1])/(o[1]-f[1]), yb];
    const e1=ex(f1), e2=ex(f2);
    return G(1, `<path class="pl2" d="M60 ${yb}H280M${f1[0]} ${f1[1]}H${f2[0]}"/>` + T(170,14,"焦点 0.3 mm","lbi","middle") + Dot(...o,"pt3") + T(o[0]+8,o[1]-2,"血管","ans")
              + Dim(60,f1[1],60,o[1],"80 cm","lb",6) + Dim(60,o[1],60,yb,"20 cm","lb",6))
      + G(2, W(f1,e1) + W(f2,e2) + `<path class="pl2 hl" d="M${R(e2[0])} ${yb}H${R(e1[0])}"/>` + T(170,yb+18,"半影","ans","middle"))
      + G(3, T(230,100,"0.3 × 20/80","lb") + T(230,118,"= 75 μm","ans"));
  }};
Z["74-am-94"] = { h: 206,
  s: ["入力：平均 10、振幅 3 の正弦波（2 cycles/mm）。",
      "MTF = 0.4 は<b>振幅</b>が何割残るか。出力の振幅 = 3 × 0.4 = <b>1.2</b>。",
      "平均値 10 は変わらない（平均に MTF をかけた 4 は×）。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[0,1.5],[6,14]);
    return G(1, p.axes({xt:[[0.5,"0.5"],[1,"1"],[1.5,"1.5 mm"]], yt:[[7,"7"],[10,"10"],[13,"13"]], xl:"", yl:"", x0:6}) + p.fn(x=>10+3*Math.sin(4*PI*x),0,1.5,"cvm") + T(p.X(0.125),p.Y(13)-6,"入力 振幅 3","lb","middle"))
      + G(2, p.fn(x=>10+1.2*Math.sin(4*PI*x),0,1.5,"cvb") + T(p.X(0.625)+30,p.Y(11.2)-4,"出力 振幅 1.2","blu"))
      + G(3, p.hline(10,"gd3") + T(p.X(1.5),p.Y(10)-5,"平均 10","ans","end"));
  }};
Z["74-am-98"] = Flow([
  ["正味の計数率 = 1,200,100 − 100 = 1,200,000 cpm = <b>20,000 cps</b>（÷ 60）。", "", "20,000 cps"],
  ["ろ紙の放射能 = 20,000 ÷ (計数効率 0.4 × 線源効率 0.2) = <b>250,000 Bq</b>。", "÷ (0.4 × 0.2)", "250,000 Bq"],
  ["表面汚染密度 = 250,000 ÷ (ふき取り効率 0.1 × 100 cm²) = 25,000 Bq/cm²。", "÷ (0.1 × 100 cm²)", "25,000 Bq/cm²"],
  ["= <b>25 kBq/cm²（2.5×10）</b>。", "", "2.5×10 kBq/cm²"]]);
Z["74-pm-48"] = Flow([
  ["1,024 階調 = 2¹⁰ = 10 bit。1 byte（8 bit）に入らないので <b>2 byte</b> で保存。", "", "1 画素 = 2 byte"],
  ["2,048 × 2,048 × 2 byte ≒ 840 万 byte。", "× 2,048 × 2,048", "8,388,608 byte"],
  ["≒ <b>8 MB</b>。", "", "≒ 8 MB"]]);
Z["74-pm-81"] = Flow([
  ["cpm を cps に直す：15,000 ÷ 60 = <b>250 cps</b>。", "", "250 cps"],
  ["数え落としの割合 = 計数率 × 分解時間（200 μs = 200×10⁻⁶ s）。", "× 200×10⁻⁶ s", "250 × 200×10⁻⁶"],
  ["= 0.05 = <b>5 %</b>。", "", "5 %"]]);
Z["74-pm-99"] = Flow([
  ["正味 = 3,620 − 20 = 3,600 cpm = <b>60 cps</b>。", "", "60 cps"],
  ["機器効率 × 線源効率 × 面積 = 0.4 × 0.5 × 15 = <b>3</b>。", "÷ 3", "60 ÷ (0.4 × 0.5 × 15)"],
  ["= <b>20 Bq/cm²（2.0×10）</b>。", "", "20 Bq/cm²"]]);
Z["73-am-48"] = { h: 206,
  s: ["基準は 360 cm（RE = 1）。線量は距離の2乗に反比例。",
      "log RE = 0.6 = 0.3 + 0.3 = log 4 → <b>RE = 4</b>（線量 4 倍）。",
      "4 倍にするには距離を 1/√4 = 1/2 に：360 ÷ 2 = <b>180 cm</b>。1/4 にした 90 cm は×。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[100,400],[0,6]);
    return G(1, p.axes({xt:[[180,"180"],[360,"360"]], yt:[[1,"1"],[4,"4"]], xl:"距離 [cm]", yl:"RE"}) + p.fn(d=>(360/d)**2,147,400) + p.dot(360,1) + T(p.X(360),p.Y(1)-8,"基準","lb","middle"))
      + G(2, p.hline(4,"gdb") + T(p.X(400),p.Y(4)-5,"RE = 4","blu","end"))
      + G(3, p.guide(180,4,"gd3") + p.dot(180,4,"pt3") + T(p.X(180)+8,p.Y(4)+16,"180 cm","ans"));
  }};
Z["73-am-80"] = Flow([
  ["2 秒間に 10¹⁶ 個が 1 m² を通過。", "", "10¹⁶ 個"],
  ["フルエンス = 面積で割る：10¹⁶ m⁻²。フルエンス率 = さらに時間で割る。", "÷ 1 m² ÷ 2 s", "10¹⁶ ÷ 1 ÷ 2"],
  ["= <b>5×10¹⁵ m⁻²·s⁻¹</b>。時間で割り忘れた 10¹⁶ は×。", "", "5×10¹⁵ m⁻²·s⁻¹"]]);
Z["73-am-96"] = Flow([
  ["線源1個・30 cm：0.0126 × 11.0 ÷ 0.3² ≒ <b>1.54 μSv/h</b>（0.3² = 0.09 で割る）。", "", "1.54 μSv/h"],
  ["線源は 5 個：1.54 × 5 ≒ <b>7.7 μSv/h</b>。", "× 5 個", "7.7 μSv/h"],
  ["30 分 = 0.5 h：7.7 × 0.5 ≒ <b>3.85 μSv</b>。", "× 0.5 h", "≒ 3.85 μSv"]]);
Z["73-pm-11"] = { h: 206,
  s: ["充電電圧 80 kV から、電気を出すぶんだけ電圧が下がる（ΔV = Q/C）。",
      "ΔV = 10 mAs ÷ 0.5 μF = 10×10⁻³ ÷ 0.5×10⁻⁶ = <b>20 kV</b>（1 mAs で 2 kV ずつ）。",
      "80 − 20 = <b>60 kV</b> で切る（波尾切断）。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[0,12],[0,90]);
    return G(1, p.axes({xt:[[10,"10"]], yt:[[60,"60"],[80,"80"]], xl:"放出 [mAs]", yl:"管電圧 [kV]"}) + p.dot(0,80))
      + G(2, p.fn(q=>80-2*q,0,12))
      + G(3, p.guide(10,60,"gd3") + p.dot(10,60,"pt3") + T(p.X(10)+8,p.Y(60)-6,"60 kV","ans"));
  }};
Z["73-pm-39"] = Flow([
  ["80 % の線量域に 300 cGy → 最大線量点では 300 ÷ 0.8 = <b>375 cGy</b> が必要。", "", "最大点 375 cGy"],
  ["1 MU あたり：出力係数 0.900 × モニタ校正値 1.02。", "÷ (0.900 × 1.02)", "375 ÷ 0.918"],
  ["≒ 408 → <b>約 400 MU</b>。", "", "≒ 400 MU"]]);
Z["73-pm-49"] = { h: 206,
  s: ["もとの波は 8 cycles/mm（0.5 mm で 4 回）。",
      "0.1 mm ごとに標本化 → 標本化周波数 10、<b>ナイキスト 5</b> cycles/mm。8 はこれをこえる。",
      "点をつなぐと 10 − 8 = <b>2 cycles/mm</b> の波に見える（エリアシング）。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[0,0.5],[-1.3,1.3]); let dots=""; for(let k=0;k<=5;k++) dots+=p.dot(k*0.1,Math.sin(2*PI*8*k*0.1),"pt3");
    return G(1, p.axes({xt:[[0.1,"0.1"],[0.2,"0.2"],[0.3,"0.3"],[0.4,"0.4"],[0.5,"0.5 mm"]], yt:[[0,"0"]], xl:""}) + p.fn(x=>Math.sin(2*PI*8*x),0,0.5,"cvm",300))
      + G(2, dots)
      + G(3, p.fn(x=>-Math.sin(2*PI*2*x),0,0.5,"cvb",200) + T(p.X(0.36),p.Y(1.15),"2 cycles/mm に見える","blu","middle"));
  }};
Z["73-pm-72"] = Flow([
  ["511 keV の光子なので E/511 = <b>1</b>。", "", "E/511 = 1"],
  ["90° なら cos90° = 0：分母 = 1 + 1 × (1 − 0) = <b>2</b>。", "1 + 1 × (1 − cos90°)", "分母 = 2"],
  ["E' = 511 ÷ 2 ≒ <b>256 keV</b>（180° なら ÷ 3）。", "511 ÷", "≒ 256 keV"]]);
Z["73-pm-73"] = Flow([
  ["8 MeV の α 線は核子1個あたり 8 ÷ 4 = 2 MeV → 2 MeV の陽子と<b>同じ速さ</b>。", "", "速さは同じ"],
  ["阻止能 ∝ 電荷² ÷ 速さ²。電荷：α は 2、陽子は 1。", "電荷²", "2² : 1²"],
  ["Sα/Sp = <b>4</b>。", "", "4"]]);
Z["73-pm-74"] = Flow([
  ["波長 = 速さ ÷ 周波数。", "", "1,500 m/s ÷ 5×10⁶ Hz"],
  ["= 3×10⁻⁴ m。", "", "3×10⁻⁴ m"],
  ["= <b>0.3 mm</b>（1 MHz で 1.5 mm → 5 MHz で 1.5 ÷ 5）。", "× 1,000", "0.3 mm"]]);
Z["73-pm-80"] = Flow([
  ["放射線の計数はポアソン分布：標準偏差 = √（カウント数）。", "", "N = 100 カウント"],
  ["√100 を計算。", "√", "√100"],
  ["標準偏差 = <b>10</b>。", "", "10"]]);
Z["73-pm-95"] = { h: 150,
  s: ["つながったシステムの MTF は<b>かけ算</b>：0.7 × 0.7 × MTF₃ = 0.2。",
      "0.7 × 0.7 = <b>0.49</b>。",
      "MTF₃ = 0.2 ÷ 0.49 ≒ <b>0.4</b>。"],
  d(){ return G(1, W([20,50],[320,50]) + Box(30,30,70,40,"系1 0.7") + Box(130,30,70,40,"系2 0.7") + Box(230,30,70,40,"系3 ?") + T(170,100,"全体 0.2","lbi","middle"))
      + G(2, T(115,20,"0.49","ok","middle"))
      + G(3, Box(230,30,70,40,"≒ 0.4","fl bs","ans") + T(170,130,"0.2 ÷ 0.49 ≒ 0.41","ans","middle"));
  }};
Z["72-am-9"] = Flow([
  ["100 ppm = 1×10⁻⁴ = Δf/f。ドプラの式 Δf/f = 2v·cosθ/c。", "", "Δf/f = 1×10⁻⁴"],
  ["v = (Δf/f) × c ÷ (2 cosθ) = 1×10⁻⁴ × 1,500 ÷ (2 × 0.5)。", "× c ÷ 2cosθ", "1×10⁻⁴ × 1,500 ÷ 1"],
  ["= 0.15 m/s = <b>15 cm/s</b>。", "", "15 cm/s"]]);
Z["72-am-75"] = Flow([
  ["σ = n·e·μ を n について解く：n = σ ÷ (e·μ)。", "", "n = σ ÷ (e·μ)"],
  ["e·μ = 1.6×10⁻¹⁹ × 0.36 = 5.76×10⁻²⁰。", "", "e·μ = 5.76×10⁻²⁰"],
  ["n = 100 ÷ 5.76×10⁻²⁰ ≒ <b>1.7×10²¹ m⁻³</b>。", "10² ÷", "≒ 1.7×10²¹ m⁻³"]]);
Z["72-am-76"] = RightTri(100,157,"R = 100 Ω","XL = 2πfL ≒ 157 Ω","Z ≒ 186 Ω",
  ["抵抗 R = 100 Ω（横）。", "コイルのリアクタンス XL = 2π × 50 × 0.5 ≒ <b>157 Ω</b>（縦）。",
   "Z = √(100² + 157²) ≒ 186 Ω → I = 100 ÷ 186 ≒ 0.54 A → 抵抗の電圧 = 0.54 × 100 ≒ <b>55 V</b>。単純に足すのは×。"],0.85);
Z["72-pm-4"] = expFig({ xr:[0,40], f:t=>1-0.5**(t/10), xl:"照射時間 [分]", yl:"飽和に対する割合",
  xt:[[10,"10"],[20,"20"],[30,"30"]], yt:[[0.5,"0.5"],[0.75,"0.75"],[1,"1"]],
  marks:[[10,0.5,"10 分：1 − 1/2 = 0.5","gd3",[8,14,"start"]],[20,0.75,"20 分：1 − 1/4 = 0.75","gd3",[8,14,"start"]]],
  s:["生成放射能は飽和値に近づくように増える（照射時間に比例しない）。",
     "半減期 1 回分（10 分）：1 − 1/2 = <b>0.5</b>。",
     "2 回分（20 分）：1 − 1/4 = <b>0.75</b>。比 = 0.75 ÷ 0.5 = <b>1.5</b>。2 倍にはならない。"] });
Z["72-pm-9"] = ctFig([[1.01,10,"10 HU → 1.010"],[1.085,85,"85 HU → 1.085"]],
  ["CT 値 = (μ − μ水) ÷ μ水 × 1000 → μ = μ水 × (1 + CT値/1000)。",
   "CT 値 10 HU → μB = <b>1.010</b> μ水。",
   "CT 値 85 HU → μA = <b>1.085</b> μ水。比 = 1.085 ÷ 1.010 ≒ <b>1.07</b>（CT 値どうしを割った 8.5 は×）。"]);
Z["72-pm-47"] = { h: 176,
  s: ["座標 (1,1) のまわり 3×3 の値：合計 36。",
      "平均値フィルタでぼかした値 = 36 ÷ 9 = <b>4</b>。",
      "出力 = 元の値 + 1 × (元の値 − ぼかし) = 1 + (1 − 4) = <b>−2</b>。"],
  d(){ return G(1, Grid(30,20,40,[["1","6","7"],["5","1","0"],["5","8","3"]],{"1,1":"fl2"}) + T(90,152,"合計 36","lbi","middle"))
      + G(2, T(240,60,"ぼかし = 36 ÷ 9 = 4","lbi","middle"))
      + G(3, T(240,100,"1 + (1 − 4) = −2","ans","middle"));
  }};
Z["72-pm-75"] = Flow([
  ["② 側：R₂ と R₃ は短絡され R₁ だけ → R₁ = 60 ÷ 3.0 = <b>20 Ω</b>。", "", "R₁ = 20 Ω"],
  ["開放：R₁ + R₂ = 60 ÷ 1.0 = 60 Ω → <b>R₂ = 40 Ω</b>。", "開放", "R₂ = 40 Ω"],
  ["① 側：R₁ + (R₂ ∥ R₃) = 60 ÷ 1.8 ≒ 33.3 Ω → 並列部分 ≒ 13.3 Ω。", "① 側", "R₂ ∥ R₃ ≒ 13.3 Ω"],
  ["1/R₃ = 1/13.3 − 1/40 ≒ 0.05 → <b>R₃ = 20 Ω</b>。", "", "R₃ = 20 Ω"]]);
Z["72-pm-78"] = Flow([
  ["抵抗 R = V² ÷ P = 100² ÷ 400 = <b>25 Ω</b>（抵抗は変わらない）。", "", "R = 25 Ω"],
  ["200 V では P = 200² ÷ 25 = <b>1,600 W</b>（電圧 2 倍で電力 4 倍）。", "200 V", "1.6 kW"],
  ["8 時間：1.6 × 8 = <b>12.8 kW·h</b>。", "× 8 h", "12.8 kW·h"]]);
Z["72-pm-88"] = { h: 206,
  s: ["もとは 100 mA × 0.5 s = <b>50 mAs</b>（SID 100 cm）。",
      "必要な mAs は距離の2乗に比例：1.5² = 2.25 倍 → <b>112.5 mAs</b>。",
      "112.5 ÷ 150 mA = <b>0.75 s</b>。2乗を忘れると 0.5（×）。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[80,160],[0,130]);
    return G(1, p.axes({xt:[[100,"100"],[150,"150"]], yt:[[50,"50"],[112.5,"112.5"]], xl:"SID [cm]", yl:"必要な mAs"}) + p.guide(100,50,"gd2") + p.dot(100,50))
      + G(2, p.fn(d=>50*(d/100)**2,80,160) + p.guide(150,112.5,"gd3") + p.dot(150,112.5,"pt3"))
      + G(3, T(p.X(150)-8,p.Y(112.5)-8,"÷ 150 mA = 0.75 s","ans","end"));
  }};
Z["71-am-9"] = Flow([
  ["三相 12 ピークは電圧がほぼ平ら → 係数ほぼ 1。1,000 mA = <b>1 A</b>。", "", "1,000 mA = 1 A"],
  ["kV × A = kW。", "100 kV ×", "100 kV × 1 A"],
  ["= <b>100 kW</b>。", "", "100 kW"]]);
Z["71-am-71"] = expFig({ xr:[0,3], f:x=>Math.exp(-0.994*x), xl:"鉛の厚さ [cm]", yl:"残る割合",
  xt:[[1.01,"1.01"],[2,"2"],[3,"3"]], yt:[[0.37,"0.37"],[1,"1"]],
  marks:[[1.006,0.37,"平均自由行程 1/μ ≒ 1.01 cm","gd3",[6,-26,"start"]]],
  s:["線減弱係数 μ = 質量減弱係数 × 密度 = 0.088 × 11.3 ≒ <b>0.994 cm⁻¹</b>。光子は e<sup>−μx</sup> で減る。",
     "平均自由行程 = 1/μ = 1 ÷ 0.994 ≒ <b>1.01 cm</b>（残りが 1/e ≒ 37 % になる厚さ）。半価層（0.693/μ）と区別する。"] });
Z["71-am-76"] = Flow([
  ["加速電圧を 2 倍にする。", "", "V × 2"],
  ["½mv² = qV → 速さ v ∝ √V なので速さは <b>√2 倍</b>。", "v ∝ √V", "v × √2"],
  ["ローレンツ力 F = qvB は速さに比例 → F₂/F₁ = <b>√2</b>。", "F = qvB", "F × √2"]]);
Z["71-am-77"] = { h: 190,
  s: ["コッククロフト・ウォルトン回路：コンデンサと整流器で電圧を段々に積み上げる。",
      "1段目の C₁ だけは <b>V</b>。それより上の C₂・C₃・C₄ は <b>2V</b> ずつ。",
      "C₄ の両端の電位差 = <b>2V</b>（大地からの電位と区別する）。"],
  d(){ const p = P({x:60,y:16,w:250,h:130},[0,4.4],[0,2.4]); let s=""; ["C₁","C₂","C₃","C₄"].forEach((c,i)=>{ const v=i?2:1; s+=`<rect class="${i===3?"fl":"fl3"} bs" x="${p.X(i+0.2)}" y="${p.Y(v)}" width="${R(p.X(0.7)-p.X(0))}" height="${R(p.Y(0)-p.Y(v))}"/>`+T(p.X(i+0.55),p.Y(0)+14,c,"lb","middle")+T(p.X(i+0.55),p.Y(v)-6,i?"2V":"V",i===3?"ans":"lbi","middle"); });
    return G(1, p.axes({xt:[], yt:[], xl:"", yl:"両端の電位差"})) + G(2, s) + G(3, T(p.X(3.55),p.Y(2)-22,"C₄ = 2V","ans","middle"));
  }};
Z["71-am-93"] = Flow([
  ["全光子数 N のうち 50 % が散乱。役に立つ信号（一次線）は <b>N/2</b>。比べる相手は一次線だけのときの SN 比 √(N/2)。", "", "散乱なし：SN 比 √(N/2)"],
  ["散乱ありでは雑音が全部の光子で決まる：SN 比 = (N/2) ÷ √N。", "", "散乱あり：(N/2) ÷ √N"],
  ["比 = 1/√2 ≒ 0.71 → 失う割合 ≒ <b>30 %</b>。", "比べる", "損失 ≒ 30 %"]]);
Z["71-pm-2"] = { h: 150,
  s: ["全放射能 = 60 + 30 + 10 = <b>100 kBq</b>。",
      "放射性核種純度は「核種」だけを見る（化学形は問わない）：¹³¹I⁻ 60 + ¹³¹IO₂⁻ 10 = <b>70 kBq</b>。",
      "70 ÷ 100 = <b>70 %</b>。"],
  d(){ return G(1, Bar(20,40,300,30,[[60,"¹³¹I⁻ 60","fl3"],[10,"¹³¹IO₂⁻","fl3"],[30,"Na¹²³I 30","fl3"]]) + Dim(20,86,320,86,"全体 100 kBq","lb"))
      + G(2, Bar(20,40,210,30,[[60,"¹³¹I⁻ 60","fl2"],[10,"¹³¹IO₂⁻","fl2"]]))
      + G(3, T(125,124,"¹³¹I は 70 % ","ans","middle"));
  }};
Z["71-pm-7"] = Flow([
  ["ピッチ係数 = 1回転の寝台移動 ÷ ビーム幅 → 移動 = ビーム幅 × ピッチ。", "", "ビーム幅 40 mm"],
  ["ピッチ 0.8 をかける。", "× 0.8", "40 × 0.8"],
  ["= <b>32 mm</b>。割った 50 は×。", "", "32 mm"]]);
Z["71-pm-20"] = Flow([
  ["3 T での ¹H の共鳴周波数 = 42.6 × 3 ≒ <b>128 MHz</b>。", "", "128 MHz"],
  ["脂肪と水の化学シフトは約 3.5 ppm（3.5×10⁻⁶）。", "× 3.5×10⁻⁶", "128×10⁶ × 3.5×10⁻⁶"],
  ["≒ <b>447 Hz</b>（1.5 T なら約 224 Hz）。", "", "≒ 447 Hz"]]);
Z["71-pm-37"] = Flow([
  ["対向2門・均等 → 1門あたり <b>100 cGy</b>。", "", "1門 100 cGy"],
  ["1 MU あたり：1.01 × 1.017 × 0.872 ≒ <b>0.896 cGy</b>。", "÷ 0.896", "100 ÷ 0.896"],
  ["≒ <b>112 MU</b>。200 cGy のままの 223 は×。", "", "≒ 112 MU"]]);
Z["71-pm-74"] = ctFig([[1.1,100,"水の 1.1 倍 → 100 HU"]],
  ["CT 値 = (μ ÷ μ水 − 1) × 1000。水は 0。",
   "水の 1.1 倍なら (1.1 − 1) × 1000 = <b>100</b>。1000 をかけ忘れると 0.1（×）。"]);
Z["71-pm-76"] = expFig({ xr:[0,8], yr:[0,11], f:t=>10*Math.exp(-t/2), xl:"t [ms]", yl:"I [mA]",
  xt:[[2,"2"],[4.6,"4.6"]], yt:[[1,"1"],[10,"10"]],
  marks:[[0,10,"はじめ 10 V ÷ 1 kΩ = 10 mA","gd2",[14,4,"start"]],[4.6,1,"4.6 ms で 1/10（1 mA）"]],
  s:["電流は I = (V/R) e<sup>−t/RC</sup> で減る。",
     "最初の電流 = 10 V ÷ 1 kΩ = <b>10 mA</b>。",
     "4.6 ms で 1/10：t/RC = ln10 = 2.3 → RC = 4.6 ÷ 2.3 = 2 ms → C = 2 ms ÷ 1 kΩ = <b>2 μF</b>。"] });
Z["71-pm-99"] = Flow([
  ["X 線の放射線加重係数は 1：等価線量 = <b>2.0 mSv</b>。", "", "等価線量 2.0 mSv"],
  ["乳房の組織加重係数（ICRP 2007）= <b>0.12</b>。", "× 0.12", "2.0 × 0.12"],
  ["実効線量 = <b>0.24 mSv</b>。", "", "0.24 mSv"]]);
Z["70-am-5"] = Flow([
  ["軌道半径を 20 % 大きく → 1.2 倍。", "", "半径 × 1.2"],
  ["短時間許容負荷は半径の<b>平方根</b>にほぼ比例：√1.2 ≒ 1.095。", "√", "√1.2 ≒ 1.095"],
  ["約 <b>10 %</b> 増える（小さな増え方は √ でほぼ半分）。", "", "≒ 10 % 増"]]);
Z["70-am-11"] = ctFig([[1.05,50,"50 HU → 1.05"]],
  ["CT 値 = (μa − μw) ÷ μw × 1000 → μa/μw = 1 + CT値/1000。",
   "1 + 50/1000 = <b>1.05</b>。"]);
Z["70-am-15"] = Flow([
  ["TR 4 s × 位相エンコード 256 × 加算 2 = <b>2,048 s</b>（周波数エンコード・TE・FOV はひっかけ）。", "", "4 × 256 × 2 = 2,048"],
  ["エコートレイン 32 × パラレル 4 = <b>128</b> で割る。", "÷ (32 × 4)", "2,048 ÷ 128"],
  ["= <b>16 s</b>。", "", "16 s"]]);
Z["70-am-38"] = Flow([
  ["接線照射は2門 → 1門 <b>100 cGy</b>。", "", "1門 100 cGy"],
  ["1 MU あたり：1.02 × 1.02 × 0.92 × 0.80 ≒ <b>0.766 cGy</b>（ウェッジ係数もかける）。", "÷ 0.766", "100 ÷ 0.766"],
  ["≒ <b>131 MU</b>。", "", "≒ 131 MU"]]);
Z["70-am-74"] = RightTri(4,3,"√(1 − 0.8²) = 0.6","","",
  ["γ = 1/√(1 − (v/c)²)。v/c = 0.8 を代入する。",
   "1 − 0.64 = 0.36 → √0.36 = <b>0.6</b>（3:4:5 の三角形：斜辺 1・0.8・0.6）。",
   "γ = 1 ÷ 0.6 ≒ <b>1.67</b>（全エネルギーが静止エネルギーの 1.67 倍）。"],40);
Z["70-am-74"].d = function(){ const o=[60,176], k=40, ax=o[0]+4*k, by=o[1]-3*k;
  return G(1, A(o[0],o[1],ax,by,"vec") + T((o[0]+ax)/2-8,(o[1]+by)/2-6,"斜辺 1（光速）","lbi","end") + A(o[0],o[1],ax,o[1],"vecm") + T((o[0]+ax)/2,o[1]+16,"v/c = 0.8","lb","middle"))
    + G(2, A(ax,o[1],ax,by,"vecr") + T(ax+8,(o[1]+by)/2+4,"√(1 − 0.64) = 0.6","ans"))
    + G(3, T(ax+8,(o[1]+by)/2+30,"γ = 1 ÷ 0.6 ≒ 1.67","ans"));
};
Z["70-am-76"] = Flow([
  ["磁束の変化 = 0.040 − 0.055 = <b>−0.015 Wb</b>（差を使う）。", "", "ΔΦ = −0.015 Wb"],
  ["1 秒あたり：−0.015 ÷ 0.01 = <b>−1.5 Wb/s</b>。", "÷ 0.01 s", "−1.5 Wb/s"],
  ["V = −N × ΔΦ/Δt = −100 × (−1.5) = <b>150 V</b>（減るときは＋）。", "× (−100)", "150 V"]]);
Z["70-am-80"] = Flow([
  ["1 回の測定の標準偏差は √x̄。", "", "1回：√x̄"],
  ["N 回の平均をとると、ばらつきは √N で割られて小さくなる。", "÷ √N", "√x̄ ÷ √N"],
  ["= <b>√(x̄/N)</b>（標準誤差）。", "", "√(x̄/N)"]]);
Z["70-am-94"] = Table2(["癌 100人","癌でない 9,900人"],["陽性","陰性"],[["98","2"],["495","9,405"]],
  [[[0,0,"fl"],[1,0,"fl2"]],[[0,0,"fl"]]],
  ["1万人で考える：罹患率 1 % → 癌の人 100 人、癌でない人 9,900 人。",
   "陽性になるのは 癌 100 × 98 % = <b>98 人</b>、癌でない 9,900 × 5 % = <b>495 人</b>。陽性は合計 593 人。",
   "陽性のうち本当に癌 = 98 ÷ 593 ≒ <b>17 %</b>。罹患率が低いと陽性でも確率は低い。"],["陽性 98 + 495 = 593 人","98 ÷ 593 ≒ 17 %"]);
Z["70-pm-5"] = Flow([
  ["電流は巻数比の倍：0.5 A × 500 = <b>250 A</b>。", "", "0.5 A × 500 = 250 A"],
  ["単相2ピーク（全波整流）：平均値 → 実効値で波形率 <b>1.11</b> をかける。", "× 1.11", "250 × 1.11"],
  ["≒ <b>280 A</b>。", "", "≒ 280 A"]]);
Z["70-pm-28"] = Flow([
  ["投与量 ÷ 体重 = 150 MBq ÷ 50 kg = 3 MBq/kg = <b>3 kBq/mL</b>（密度 1）。", "", "3 kBq/mL"],
  ["画像は投与時刻に減衰補正ずみなので、そのまま割る。", "9 ÷", "9 ÷ 3"],
  ["SUV = <b>3.0</b>。", "", "SUV = 3.0"]]);
Z["70-pm-66"] = Flow([
  ["総線量 = 2 Gy × 25 回 = <b>50 Gy</b>。", "", "総線量 50 Gy"],
  ["かっこの中は1回線量：1 + 2 ÷ 10 = <b>1.2</b>。", "× (1 + 2/10)", "50 × 1.2"],
  ["BED = <b>60 Gy</b>。総線量を入れた 300 は×。", "", "BED = 60 Gy"]]);
Z["70-pm-72"] = expFig({ xr:[0,20], f:x=>Math.exp(-0.1*x), xl:"水の厚さ [cm]", yl:"透過率",
  xt:[[10,"10"],[20,"20"]], yt:[[0.37,"0.37"],[1,"1"]],
  marks:[[10,0.368,"μx = 1 → e⁻¹ ≒ 0.37"]],
  s:["グラフから 0.45 MeV の質量減弱係数 ≒ 0.1 cm²/g。水の密度 1 → μ = <b>0.1 cm⁻¹</b>。透過率 = e<sup>−μx</sup>。",
     "10 cm：e<sup>−0.1×10</sup> = e<sup>−1</sup> = 1 ÷ 2.7 ≒ <b>0.37</b>。"] });
Z["70-pm-76"] = Flow([
  ["L = 1 ÷ ((2πf)² × C)。2πf = 2 × 3.14 × 50,000 ≒ 3.14×10⁵ → 2乗 ≒ <b>9.9×10¹⁰</b>。", "", "(2πf)² ≒ 9.9×10¹⁰"],
  ["C = 1,000 pF = 10⁻⁹ F をかける：9.9×10¹⁰ × 10⁻⁹ ≒ 99。", "× 10⁻⁹ F", "≒ 99"],
  ["L = 1 ÷ 99 ≒ <b>1×10⁻² H</b>。", "1 ÷", "1×10⁻² H"]]);
Z["70-pm-77"] = Flow([
  ["20 dB = 20 log10 → <b>10 倍</b>。", "", "20 dB = 10 倍"],
  ["反転増幅の倍率 = R ÷ 5 kΩ。", "R ÷ 5 kΩ = 10", "R = 5 kΩ × 10"],
  ["R = <b>50 kΩ</b>。", "", "50 kΩ"]]);
Z["69-am-9"] = Flow([
  ["1 回転（0.5 s）の寝台移動 = 8 cm/s × 0.5 s = <b>40 mm</b>。", "", "移動 40 mm"],
  ["ビーム幅 = 0.625 mm × 64 列 = <b>40 mm</b>。", "", "ビーム幅 40 mm"],
  ["ビームピッチ = 40 ÷ 40 = <b>1</b>。", "÷", "ピッチ 1"]]);
Z["69-am-45"] = { h: 150,
  s: ["2進数を右から<b>4桁ずつ</b>区切る：1010 | 1001。",
      "1010 = 8 + 2 = 10 → <b>A</b>（10〜15 は A〜F）。",
      "1001 = 8 + 1 = <b>9</b>。答え <b>A9</b>。"],
  d(){ const b="10101001".split("");
    return G(1, Grid(30,30,35,[b]) + `<path class="gd3" d="M170 20V86"/>`)
      + G(2, Grid(30,30,35,[b.slice(0,4)],{"0,0":"fl","0,1":"fl","0,2":"fl","0,3":"fl"}) + T(100,112,"→ A","ans","middle"))
      + G(3, Grid(170,30,35,[b.slice(4)],{"0,0":"fl2","0,1":"fl2","0,2":"fl2","0,3":"fl2"}) + T(240,112,"→ 9","ok","middle") + T(170,140,"A9","ans","middle"));
  }};
Z["69-am-72"] = { h: 150,
  s: ["電子対生成では、まず電子と陽電子の静止エネルギー 0.511 × 2 = <b>1.022 MeV</b> が使われる。",
      "残りが運動エネルギー（合計 5 MeV）。",
      "光子のエネルギー = 1.022 + 5 ≒ <b>6 MeV</b>。0.511 だけ足した 5.5 は×。"],
  d(){ return G(1, Bar(20,40,300*1.022/6.022,30,[[1,"","fl3"]]) + T(20+300*0.17/2,30,"1.022","lbi","middle"))
      + G(2, Bar(20+300*1.022/6.022,40,300*5/6.022,30,[[1,"運動エネルギー 5 MeV","fl2"]]))
      + G(3, Dim(20,90,320,90,"光子 ≒ 6 MeV","ans"));
  }};
Z["69-am-73"] = Flow([
  ["同じ速さなら1核子あたりのエネルギーが同じ。α 線 10 MeV ÷ 4 = <b>2.5 MeV/核子</b>。", "", "2.5 MeV / 核子"],
  ["同じ速さの飛程 ∝ 質量 ÷ 電荷²：α は 4 ÷ 2² = 1、陽子は 1 ÷ 1² = 1 で同じ。", "質量 ÷ 電荷²", "α も陽子も 1"],
  ["陽子 <b>2.5 MeV</b>。", "", "2.5 MeV"]]);
Z["69-am-75"] = Flow([
  ["n は 1 m あたりの巻数：100 cm⁻¹ = <b>10⁴ m⁻¹</b>。", "", "n = 10⁴ m⁻¹"],
  ["B = μ₀ n I = 4π×10⁻⁷ × 10⁴ × 10。", "μ₀ × n × I", "4π×10⁻⁷ × 10⁴ × 10"],
  ["= <b>4π×10⁻² T</b>。cm のままの 4π×10⁻⁴ は×。", "", "4π×10⁻² T"]]);
Z["69-am-77"] = Flow([
  ["2次電圧 = 6,000 V ÷ 30 = <b>200 V</b>。", "", "200 V"],
  ["損失なし：容量 30 kVA = 2次電圧 × 2次電流。", "30,000 VA ÷", "30,000 ÷ 200"],
  ["2次電流 = <b>150 A</b>。", "", "150 A"]]);
Z["69-am-82"] = { h: 206,
  s: ["2点（900 ch → 500 keV、1,900 ch → 1,000 keV）を通る直線で考える。",
      "1,000 ch で 500 keV 増える → <b>1 ch = 0.5 keV</b>。",
      "1,300 ch は 900 から 400 ch 上：500 + 400 × 0.5 = <b>700 keV</b>。0 から比例させた 722（点線）は×。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[0,2100],[0,1150]);
    return G(1, p.axes({xt:[[900,"900"],[1300,"1300"],[1900,"1900"]], yt:[[500,"500"],[700,"700"],[1000,"1000"]], xl:"チャネル", yl:"keV"}) + p.dot(900,500) + p.dot(1900,1000))
      + G(2, p.fn(c=>0.5*c+50,0,2100))
      + G(3, p.guide(1300,700,"gd3") + p.dot(1300,700,"pt3") + T(p.X(1300)+8,p.Y(700)+16,"700 keV","ans") + p.fn(c=>c*500/900,0,2000,"dsh"));
  }};
Z["69-pm-8"] = ctFig([[1.2,200,"水の 1.2 倍 → 200 HU"]],
  ["CT 値 = (μ ÷ μ水 − 1) × 1000。水は 0。",
   "水の 1.2 倍なら (1.2 − 1) × 1000 = <b>200 HU</b>。"]);
Z["69-pm-13"] = Flow([
  ["血流速度 v = c × Δf ÷ (2 × f₀ × cosθ)（2 は行きと帰り）。", "", "v = c·Δf ÷ (2f₀ cosθ)"],
  ["1,500 × 1,000 ÷ (2 × 5×10⁶ × 0.5)。", "代入", "1.5×10⁶ ÷ 5×10⁶"],
  ["= 0.3 m/s = <b>30 cm/s</b>。", "", "30 cm/s"]]);
Z["69-pm-30"] = Flow([
  ["1.5 倍拡大 → 実際に写る範囲 = 51 ÷ 1.5 = <b>34 cm</b>。", "", "34 cm"],
  ["1 ピクセル = 34 ÷ 64 ≒ <b>0.53 cm</b>。", "÷ 64", "0.53 cm"],
  ["ナイキスト周波数 = 1 ÷ (2 × 0.53) ≒ <b>0.94 cycles/cm</b>。", "1 ÷ (2 × 画素)", "≒ 0.94 cycles/cm"]]);
Z["69-pm-40"] = Flow([
  ["100 MU で 102 cGy → <b>1 MU = 1.02 cGy</b>。", "", "1.02 cGy/MU"],
  ["200 MU × 1.02 × TPR 0.80 × OPF 0.98。", "× 200 × 0.80 × 0.98", "200 × 1.02 × 0.80 × 0.98"],
  ["≒ <b>160 cGy</b>。100 MU のままの 80 は×。", "", "≒ 160 cGy"]]);
function netFig(ans){
  return Flow([
    ["1 Gbps = 1 秒に 10⁹ ビット。バイトに直すと 8 で割って <b>125 M バイト/秒</b>。", "", "125 MB/s"],
    ["1 枚 4 M バイトで割る。", "÷ 4 MB", "125 ÷ 4 = 31.25"],
    [`最大 <b>${ans} 枚</b>。`, "", `${ans} 枚`]]);
}
Z["69-pm-46"] = netFig(30);
Z["67-am-47"] = netFig(31);
function densFig(t1,d1,t2,d2,sum,s){
  return { h: 160, s,
    d(){ const k=300/3.2;
      return G(1, Bar(20,30,d1*k,26,[[1,`${t1} → ${d1}`,"fl3"]]))
        + G(2, Bar(20+d1*k,30,d2*k,26,[[1,`${t2} → ${d2}`,"fl2"]]))
        + G(3, Dim(20,74,20+sum*k,74,`合計 ${sum}`,"ans") + T(170,120,"重ねると透過率はかけ算、濃度は足し算","lb","middle"));
    }};
}
Z["69-pm-47"] = densFig("50 %",0.3,"5 %",1.3,1.6,
  ["濃度 D = log₁₀(1 ÷ 透過率)。50 % → log2 = <b>0.3</b>。",
   "5 % → log20 = 1 + 0.3 = <b>1.3</b>。",
   "重ねると濃度は足し算：0.3 + 1.3 = <b>1.6</b>（透過率 0.5 × 0.05 = 0.025 → log40 でも同じ）。"]);
Z["68-am-46"] = densFig("5 %",1.3,"2 %",1.7,3.0,
  ["5 % → 濃度 log20 ≒ <b>1.3</b>。",
   "2 % → 濃度 log50 ≒ <b>1.7</b>。",
   "足して <b>3.0</b>（透過率 0.05 × 0.02 = 0.001 → log1000 = 3.0）。"]);
Z["69-pm-74"] = expFig({ xr:[0,450], f:t=>Math.exp(-t/144.3), xl:"t [ms]", yl:"横磁化",
  xt:[[100,"100"],[144,"144"],[300,"300"]], yt:[[0.37,"0.37"],[0.5,"0.5"],[1,"1"]],
  marks:[[100,0.5,"100 ms で 50 %","gd2"],[144.3,0.368,"T₂ ≒ 144 ms（37 %）"]],
  s:["横磁化は e<sup>−t/T₂</sup> で減る。",
     "半分になる時間が 100 ms：100 ÷ T₂ = ln2 = 0.693。",
     "T₂ = 100 ÷ 0.693 ≒ <b>144 ms</b>。T₂ は 37 %（e⁻¹）まで減る時間で、半分の時間とはちがう。"] });
Z["68-pm-74"] = expFig({ xr:[0,1300], f:t=>1-Math.exp(-t/433), xl:"t [ms]", yl:"縦磁化",
  xt:[[300,"300"],[433,"433"],[1000,"1000"]], yt:[[0.5,"0.5"],[0.63,"0.63"],[1,"1"]],
  marks:[[300,0.5,"300 ms で 50 %","gd2",[8,14,"start"]],[433,0.632,"T₁ ≒ 433 ms（63 %）"]],
  s:["縦磁化は 1 − e<sup>−t/T₁</sup> で回復する。",
     "50 % に戻る時間が 300 ms：300 ÷ T₁ = ln2 = 0.693。",
     "T₁ = 300 ÷ 0.693 ≒ <b>433 ms</b>。T₁ は 63 % まで回復する時間。"] });
Z["69-pm-77"] = { h: 170,
  s: ["1 Ω の抵抗 5 個を並列につなぐ。", "同じ抵抗 n 個の並列は R ÷ n（電流の通り道が 5 本に増える）。", "1 ÷ 5 = <b>0.2 Ω</b>（直列なら 5 Ω）。"],
  d(){ let s=W([60,20],[60,140]) + W([280,20],[280,140]) + W([20,80],[60,80]) + W([280,80],[320,80]);
    [20,50,80,110,140].forEach(y=>{ s+=W([60,y],[280,y]) + Rh(170,y,"") + Dot(60,y) + Dot(280,y); });
    return G(1, s + T(170,10,"1 Ω × 5","lb","middle")) + G(2, T(170,162,"通り道 5 本","lb","middle")) + G(3, T(320,70,"0.2 Ω","ans","end"));
  }};
Z["69-pm-81"] = Flow([
  ["秒あたりに直す：1.2×10⁶ ÷ 600 s = <b>2,000 cps</b>。", "", "n = 2,000 cps"],
  ["nτ = 2,000 × 100×10⁻⁶ = 0.2 → n₀ = n ÷ (1 − nτ) = 2,000 ÷ 0.8。", "÷ (1 − 0.2)", "2,000 ÷ 0.8"],
  ["= 2,500 cps = <b>1.5×10⁵ cpm</b>。", "× 60", "1.5×10⁵ cpm"]]);
Z["69-pm-95"] = Table2(["信号あり 100","雑音のみ 100"],["「あり」","「なし」"],[["80","20"],["10","90"]],
  [[[0,0,"fl"]],[[1,1,"fl2"]]],
  ["誤って「なし」が 20 枚、誤って「あり」が 10 枚。正しく答えたのは 80 枚と 90 枚。",
   "感度 = 信号ありを「あり」と言えた割合 = 80 ÷ 100 = <b>80 %</b>。",
   "特異度 = 雑音のみを「なし」と言えた割合 = 90 ÷ 100 = <b>90 %</b>。"],["感度 80 %","特異度 90 %"]);
Z["68-am-73"] = Flow([
  ["放射損失 = 衝突損失 となる臨界エネルギー ≒ 800 ÷ Z [MeV]。", "", "≒ 800 ÷ Z"],
  ["鉛は Z = 82。", "Z = 82", "800 ÷ 82"],
  ["≒ <b>10 MeV</b>。重い物質ほど低いエネルギーから制動放射が多い。", "", "≒ 10 MeV"]]);
Z["68-pm-47"] = { h: 200,
  s: ["(3,3) を中心に 3×3 をとり、フィルタ F と同じ位置どうしをかけて足す。",
      "行ごとに：2行目 −1 + 0 + 2 = <b>1</b>、3行目 −4 + 0 + 4 = <b>0</b>、4行目 −2 + 0 + 3 = <b>1</b>。",
      "合計 1 + 0 + 1 = <b>2</b>。左右を逆に重ねると −2（×）。"],
  d(){ return G(1, T(70,18,"画像 A（(3,3) のまわり）","lb","middle") + Grid(16,26,36,[["1","1","2"],["2","2","2"],["2","2","3"]],{"1,1":"fl2"}) + T(250,18,"フィルタ F","lb","middle") + Grid(196,26,36,[["−1","0","1"],["−2","0","2"],["−1","0","1"]]))
      + G(2, T(170,156,"1 + 0 + 1","lbi","middle"))
      + G(3, T(170,184,"= 2","ans","middle"));
  }};
Z["68-pm-76"] = Flow([
  ["たまった電荷 Q = CV = 100×10⁻⁶ × 4.8 = <b>4.8×10⁻⁴ C</b>。これが全部抵抗を流れる。", "", "Q = 4.8×10⁻⁴ C"],
  ["電子1個は 1.6×10⁻¹⁹ C。", "÷ 1.6×10⁻¹⁹", "4.8×10⁻⁴ ÷ 1.6×10⁻¹⁹"],
  ["= <b>3×10¹⁵ 個</b>。", "", "3×10¹⁵ 個"]]);
Z["68-pm-81"] = Flow([
  ["試料 800 ÷ 5 = 160 cpm、BG 400 ÷ 10 = 40 cpm。", "", "160 cpm と 40 cpm"],
  ["正味 = 160 − 40 = <b>120 cpm</b>。", "引く", "正味 120 cpm"],
  ["σ = √(160/5 + 40/10) = √36 = 6 → <b>120 ± 6</b>（引き算でも分散は足す）。", "", "120 ± 6"]]);
Z["68-pm-87"] = Flow([
  ["w/v% = 100 mL あたりの g。200 w/v% = 100 mL に 200 g = <b>1 mL に 2 g</b>。", "", "1 mL に 2 g"],
  ["3,000 mL 作る。", "× 3,000 mL", "2 × 3,000"],
  ["= <b>6,000 g</b>。", "", "6,000 g"]]);
Z["68-pm-100"] = Flow([
  ["実効線量率定数 × 放射能 = 0.0576 × 1,500 = 86.4。", "", "86.4（1 m の値）"],
  ["2 m なので距離の2乗 4 で割る：<b>21.6 μSv/h</b>。", "÷ 2²", "21.6 μSv/h"],
  ["1 時間で <b>21.6 μSv</b>。", "× 1 h", "21.6 μSv"]]);
Z["67-am-49"] = Flow([
  ["(2,3) を中心に 3×3。周りの 8 つは重み 1：2 + 6 + 3 + 9 + 7 + 4 + 5 + 1 = <b>37</b>。", "", "周り 37"],
  ["真ん中は重み 2：4 × 2 = 8 → 合計 <b>45</b>。", "+ 4 × 2", "45"],
  ["重みの合計 10 で割る：<b>4.5</b>（9 で割る・割り忘れの 45 は×）。", "÷ 10", "4.5"]]);
Z["67-am-69"] = Flow([
  ["E = 0.511×10⁶ eV × 1.6×10⁻¹⁹ = <b>8.2×10⁻¹⁴ J</b>。", "", "E = 8.2×10⁻¹⁴ J"],
  ["λ = hc ÷ E = 6.6×10⁻³⁴ × 3.0×10⁸ ÷ 8.2×10⁻¹⁴。", "hc ÷ E", "1.98×10⁻²⁵ ÷ 8.2×10⁻¹⁴"],
  ["≒ <b>2.4×10⁻¹² m</b>（λ[nm] ≒ 1.24 ÷ E[keV] でも出せる）。", "", "2.4×10⁻¹² m"]]);
Z["67-am-81"] = Flow([
  ["電荷の作りやすさ：W 値 空気 34 eV ÷ Si 3.6 eV ≒ <b>10 倍</b>。", "", "W 値の比 ≒ 10 倍"],
  ["密度：Si 2.33 ÷ 空気 0.0012 ≒ <b>2,000 倍</b>。", "× 密度の比", "10 × 2,000"],
  ["感度比 ≒ <b>20,000</b>。", "", "≒ 20,000"]]);
Z["67-am-92"] = { h: 176,
  s: ["手順 (6) の画像：左の列 3・7、右の列 3・7。",
      "手順 (7) では左の列に <b>−1</b>、右の列に <b>＋1</b> を足す。",
      "a = 2、b = 4、c = 6、d = <b>8</b>。"],
  d(){ return G(1, T(80,22,"(6)","lb","middle") + Grid(40,30,40,[["3","3"],["7","7"]]))
      + G(2, T(170,80,"−1 / ＋1","ans","middle") + A(136,70,196,70,"vec"))
      + G(3, T(260,22,"(7)","lb","middle") + Grid(220,30,40,[["a 2","b 4"],["c 6","d 8"]],{"0,0":"fl","0,1":"fl","1,0":"fl","1,1":"fl"}) + T(170,156,"列の合計が投影データと合うか確かめる","lb","middle"));
  }};
Z["67-am-97"] = expFig({ xr:[0,170], f:t=>0.5**(t/74), xl:"日数", yl:"残る割合",
  xt:[[74,"74"],[117,"117"],[148,"148"]], yt:[[0.25,"1/4"],[0.333,"1/3"],[0.5,"1/2"],[1,"1"]],
  marks:[[74,0.5,"74 日で 1/2","gd2",[-6,13,"end"]],[148,0.25,"","gd2"],[117,0.333,"1/3 は約 117 日","gd3",[8,-14,"start"]]],
  s:["¹⁹²Ir は 74 日ごとに半分になる。",
     "74 日たつと 1/2 になる。",
     "148 日で 1/4。1/3 はこの 2 つの間にある。",
     "t = 74 × ln3 ÷ ln2 = 74 × 1.099 ÷ 0.693 ≒ 117 日 → いちばん近いのは <b>120 日</b>。"] });
Z["67-pm-6"] = Flow([
  ["100 kV × 800 mA = <b>80 kW</b>。", "", "80 kW"],
  ["リプル 30 % の装置は <b>0.74</b> をかける（リプルが大きいほど係数は小さい）。", "× 0.74", "80 × 0.74"],
  ["= <b>59.2 kW</b>。", "", "59.2 kW"]]);
Z["67-pm-38"] = Flow([
  ["3 Gy を A : P = 2 : 1 に分ける：A <b>200 cGy</b>、P <b>100 cGy</b>。", "", "A 200 cGy、P 100 cGy"],
  ["1 MU あたり = 1 cGy × TMR 0.5 = 0.5 cGy。", "÷ 0.5", "200 ÷ 0.5、100 ÷ 0.5"],
  ["A = <b>400 MU</b>、P = <b>200 MU</b>。TMR で割り忘れると 200・100（×）。", "", "A 400 ― P 200"]]);
Z["67-pm-81"] = Flow([
  ["計数率の標準偏差 = √(計数率 ÷ 測定時間)：√(400 ÷ t) = 10。", "", "√(400 ÷ t) = 10"],
  ["両辺を2乗：400 ÷ t = 100。", "2乗", "400 ÷ t = 100"],
  ["t = <b>4 分</b>。", "", "4 分"]]);
Z["67-pm-83"] = { h: 214,
  s: ["アルミ板による減弱曲線（透過率）。",
      "透過率 0.5 になる厚さ = 第1半価層 ≒ <b>5 mm</b>。",
      "0.25 になるのは約 15 mm → 第2半価層 = 15 − 5 = <b>10 mm</b>。均等度 = 5 ÷ 10 = <b>0.5</b>（15 で割った 0.33 は×）。"],
  d(){ const p = P({x:54,y:16,w:256,h:160},[0,25],[0,1.05]); const f=x=>Math.exp(-0.251*x**0.631);
    return G(1, p.axes({xt:[[5,"5"],[15,"15"],[25,"25"]], yt:[[0.25,"0.25"],[0.5,"0.5"],[1,"1"]], xl:"Al [mm]", yl:"透過率"}) + p.fn(f,0,25))
      + G(2, p.guide(5,0.5,"gd3") + p.dot(5,0.5,"pt3") + T(p.X(5)+8,p.Y(0.5)-6,"第1半価層 5 mm","ans"))
      + G(3, p.guide(15,0.25,"gdb") + p.dot(15,0.25,"pt") + Dim(p.X(5),p.Y(0)+26,p.X(15),p.Y(0)+26,"第2半価層 10 mm","blu"));
  }};
Z["67-pm-86"] = { h: 206,
  s: ["半影 = 焦点サイズ × (拡大率 − 1)。",
      "2 倍で 0.1 mm → 焦点サイズ × 1 = 0.1 → 焦点 <b>0.1 mm</b>。",
      "3 倍なら 0.1 × (3 − 1) = <b>0.2 mm</b>。比例の 0.15 や −1 を忘れた 0.3 は×。"],
  d(){ const p = P({x:54,y:16,w:256,h:150},[1,3.6],[0,0.3]);
    return G(1, p.axes({xt:[[1,"1"],[2,"2"],[3,"3"]], yt:[[0.1,"0.1"],[0.2,"0.2"]], xl:"拡大率", yl:"半影 [mm]"}) + p.fn(m=>0.1*(m-1),1,3.5))
      + G(2, p.guide(2,0.1,"gd2") + p.dot(2,0.1) + T(p.X(2)+8,p.Y(0.1)+14,"2 倍 → 0.1","lbi"))
      + G(3, p.guide(3,0.2,"gd3") + p.dot(3,0.2,"pt3") + T(p.X(3)-8,p.Y(0.2)-6,"3 倍 → 0.2 mm","ans","end"));
  }};

/* ---------- 過去問と同じ問題（同じ図を使う） ---------- */
const ALIAS = {
  "78-am-65":"k-isrc","78-am-66":"k-power33","78-am-67":"k-integ","77-am-65":"k-phase",
  "76-am-75":"k-capac","76-pm-77":"k-cap3d",
  "75-pm-75":"k-ind","75-pm-76":"k-tube","75-pm-77":"k-z","75-pm-78":"k-noninv",
  "74-am-76":"k-ab","74-pm-75":"k-amps","74-pm-76":"k-sp","74-pm-77":"k-capd",
  "73-pm-75":"k-power8","73-pm-77":"k-mult","73-pm-78":"k-opv","68-am-76":"k-vava",
  "75-am-8":"78-am-74"
};
window.ZUKAI_ALIAS = ALIAS;

// ほかのページ用の図（houka/zukai-houka.js など）から部品を使えるように公開
window.ZUKAI_H = {P, T, L, A, G, R, Bar, Dim, Grid, Flow, expFig};

/* ---------- 表示部品 ---------- */
// 解説の箱 host の中に図解を入れる。問題に図解がなければ何もしない。
const CSS = `.zk{--zk-ink:var(--ink);--zk-muted:var(--muted,var(--sub));--zk-rule:var(--rule,var(--line));--zk-red:var(--red,var(--ng));--zk-red-soft:var(--red-soft,var(--ng-soft));--zk-ok:var(--ok);--zk-ok-soft:var(--ok-soft);--zk-blue:var(--focus,var(--accent));--zk-chip:var(--chip,var(--paper));--zk-sheet:var(--sheet);--zk-font:var(--f-body);--zk-num:var(--f-num);color:var(--zk-ink);text-align:left;line-height:1.7}
.zk{border:1px solid var(--zk-rule);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px;background:var(--zk-sheet)}
.zk-h{display:flex;justify-content:space-between;align-items:baseline}
.zk-ttl{font-size:.8rem;font-weight:700;letter-spacing:.12em}
.zk-n{font-family:var(--zk-num);font-size:.75rem;color:var(--zk-muted)}
.zk-svg{display:block;width:100%;max-width:520px;height:auto;margin:0 auto;overflow:visible}
.zk .zk-t{margin:0;white-space:normal;min-height:5.1em;font-size:.92rem}
.zk-b{display:flex;gap:8px;justify-content:flex-end}
.zk-btn{font:inherit;font-size:.85rem;font-weight:700;border:1px solid var(--zk-rule);background:var(--zk-chip);color:var(--zk-ink);border-radius:999px;padding:4px 16px;cursor:pointer}
.zk-btn.pri{border-color:var(--zk-ink)}
.zk-btn:disabled{opacity:.4;cursor:default}
.zk-btn:focus-visible{outline:2px solid var(--zk-blue);outline-offset:2px}
.zk [data-s]{opacity:0;transition:opacity .2s}
.zk [data-s].on{opacity:1}
.zk [data-s].on.dim{opacity:.3}
.zk path{fill:none}
.zk .ax{stroke:var(--zk-muted);stroke-width:1}
.zk .axh{fill:var(--zk-muted)}
.zk .gd{stroke:var(--zk-rule);stroke-width:1}
.zk .gd2{stroke:var(--zk-muted);stroke-dasharray:3 3}
.zk .gd3{stroke:var(--zk-red);stroke-dasharray:4 3;stroke-width:1.5}
.zk .dsh{stroke:var(--zk-muted);stroke-dasharray:4 4;stroke-width:1.2}
.zk .cv{stroke:var(--zk-ink);stroke-width:2;stroke-linejoin:round}
.zk .cvm{stroke:var(--zk-muted);stroke-width:1.5}
.zk .cvb{stroke:var(--zk-blue);stroke-width:2}
.zk .cvo{stroke:var(--zk-ok);stroke-width:1.5}
.zk .fl{fill:var(--zk-red-soft)} .zk .fl2{fill:var(--zk-ok-soft)}
.zk .pt{fill:var(--zk-ink)} .zk .pt3{fill:var(--zk-red)} .zk .pt0{fill:var(--zk-sheet);stroke:var(--zk-muted);stroke-width:1.5}
.zk text{font-family:var(--zk-font);font-size:11px;fill:var(--zk-muted)}
.zk .lbi{fill:var(--zk-ink);font-weight:500}
.zk .lb2{font-size:10px}
.zk .ans{fill:var(--zk-red);font-weight:700;font-size:12px}
.zk .fx{font-size:14px} .zk .fo{font-size:12px}
.zk .ok{fill:var(--zk-ok);font-weight:700}
.zk .blu{fill:var(--zk-blue);font-weight:700}
.zk .vec path,.zk .vecm path,.zk .vecr path,.zk .vec0 path{stroke-width:2}
.zk .vec path{stroke:var(--zk-ink)} .zk .vec .hd{fill:var(--zk-ink);stroke:none}
.zk .vecm path{stroke:var(--zk-muted)} .zk .vecm .hd{fill:var(--zk-muted);stroke:none}
.zk .vecr path{stroke:var(--zk-red)} .zk .vecr .hd{fill:var(--zk-red);stroke:none}
.zk .vec0 path{stroke:var(--zk-muted);stroke-width:1} .zk .vec0 .hd{fill:var(--zk-muted);stroke:none}
.zk .wr{stroke:var(--zk-ink);stroke-width:1.5;stroke-linejoin:round}
.zk .nd{fill:var(--zk-ink)}
.zk .rz{fill:var(--zk-sheet);stroke:var(--zk-ink);stroke-width:1.5}
.zk .rz.hl{fill:var(--zk-red-soft);stroke:var(--zk-red)}
.zk .gap{fill:var(--zk-sheet)}
.zk .pl{stroke:var(--zk-ink);stroke-width:1.5}
.zk .pl2{stroke:var(--zk-ink);stroke-width:3}
.zk .pl.hl{stroke:var(--zk-red)}
.zk .dio{fill:var(--zk-sheet);stroke:var(--zk-ink);stroke-width:1.5}
.zk .op{fill:var(--zk-sheet);stroke:var(--zk-ink);stroke-width:1.5}
.zk .blk{fill:var(--zk-chip);stroke:var(--zk-rule);stroke-width:1}
.zk .fl3{fill:var(--zk-chip)}
.zk .bs{stroke:var(--zk-rule);stroke-width:1}
.zk .gdb{stroke:var(--zk-blue);stroke-dasharray:4 3;stroke-width:1.5}
.zk .plt{fill:var(--zk-chip);stroke:var(--zk-ink);stroke-width:1.5}
.zk sup{font-size:.7em}`;
function addCss(){ if(document.getElementById("zk-css")) return; const st=document.createElement("style"); st.id="zk-css"; st.textContent=CSS; document.head.appendChild(st); }
window.ZukaiMount = function(host, id){
  const z = Z[ALIAS[id]||id]; if(!host || !z) return;
  addCss();
  const n = z.s.length; let cur = 1;
  const box = document.createElement("div"); box.className = "zk";
  box.innerHTML = `<div class="zk-h"><span class="zk-ttl">図解</span><span class="zk-n"></span></div>
    <svg class="zk-svg" viewBox="0 0 340 ${z.h}" role="img" aria-label="解説の図">${z.d()}</svg>
    <p class="zk-t" aria-live="polite"></p>
    <div class="zk-b"><button type="button" class="zk-btn" data-d="-1">← 戻る</button><button type="button" class="zk-btn pri" data-d="1">次へ →</button></div>`;
  const layers = [...box.querySelectorAll("[data-s]")];
  const prev = box.querySelector('[data-d="-1"]'), next = box.querySelector('[data-d="1"]');
  function draw(){
    layers.forEach(g=>{ const s=+g.dataset.s, dm=+g.dataset.dim||99;
      g.classList.toggle("on", s<=cur); g.classList.toggle("dim", cur>=dm); g.classList.toggle("now", s===cur); });
    box.querySelector(".zk-n").textContent = `手順 ${cur} / ${n}`;
    box.querySelector(".zk-t").innerHTML = z.s[cur-1];
    prev.disabled = cur===1; next.textContent = cur===n ? "最初から ↺" : "次へ →";
  }
  prev.onclick = ()=>{ if(cur>1){cur--;draw()} };
  next.onclick = ()=>{ cur = cur===n ? 1 : cur+1; draw(); };
  draw();
  host.insertBefore(box, host.children[1] || null);   // 「解説」見出しのすぐ下
};
})();
