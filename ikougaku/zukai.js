// 図解（段階表示）: 解説エリアの中で「次へ」で1手順ずつ進む SVG 図。
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

/* ---------- 積分回路（k-integ） ---------- */
Z["k-integ"] = { h: 236,
  s: ["t = 0 で入力 vi に <b>20 mV</b> を加え、そのまま一定（上のグラフ）。",
      "CR = 2 μF × 10 kΩ = 0.02 s。直流入力なら vo = −vi·t / CR。20 mV ÷ 0.02 s ＝ <b>1秒に 1 V ずつ</b>下がる直線になる。",
      "t = 3 s：vo = −0.02 × 3 ÷ 0.02 = <b>−3 V</b>。反転型（入力が − 端子側）なので符号はマイナス。"],
  d(){ const a = P({x:44,y:14,w:270,h:40},[0,4],[0,30]);
       const p = P({x:44,y:96,w:270,h:110},[0,4],[-4.4,0.4]);
    return G(1, a.axes({xt:[], yt:[[0,"0"],[20,"20"]], xl:"t [s]", yl:"vi [mV]"}) + a.pl([[0,0],[0,20],[4,20]])
              + p.axes({xt:[[1,"1"],[2,"2"],[3,"3"],[4,"4"]], yt:[[-1,"−1"],[-2,"−2"],[-3,"−3"],[-4,"−4"]], xl:"t [s]", yl:"vo [V]"}))
         + G(2, p.fn(t=>-t,0,4) + T(p.X(1.2)+6, p.Y(-1.2)-4, "傾き −1 V/秒", "lb"))
         + G(3, `<path class="gd3" d="M${p.X(3)} ${p.Y(0)}V${p.Y(-3)}H${p.X(0)}"/>` + p.dot(3,-3,"pt3") + T(p.X(3)+8, p.Y(-3)+4, "−3 V", "ans"));
  }};

/* ---------- パルスの平均値（k-pulse） ---------- */
Z["k-pulse"] = { h: 190,
  s: ["パルス1個の「面積」＝ 5 mA × 20 ms = <b>100</b>（mA·ms）。",
      "平均値 2 mA は、この面積を1周期 T に平らにならした高さ。2 × T = 100 → <b>T = 50 ms</b>。",
      "パルスは 50 ms ごとにくり返す。f = 1 ÷ 0.05 s = <b>20 Hz</b>（ms → s の変換を忘れずに）。"],
  d(){ const p = P({x:44,y:20,w:270,h:120},[0,150],[0,6]);
    const pulse = t0 => p.pl([[t0,0],[t0,5],[t0+20,5],[t0+20,0]]);
    return G(1, p.axes({xt:[[20,"20"],[50,"50"],[100,"100"]], yt:[[0,"0"],[2,"2"],[5,"5"]], xl:"t [ms]", yl:"i [mA]"})
              + `<rect class="fl" x="${p.X(0)}" y="${p.Y(5)}" width="${p.X(20)-p.X(0)}" height="${p.Y(0)-p.Y(5)}"/>` + pulse(0)
              + T(p.X(10), p.Y(2.5)+4, "100", "lbi", "middle"))
         + G(2, `<rect class="fl2" x="${p.X(0)}" y="${p.Y(2)}" width="${p.X(50)-p.X(0)}" height="${p.Y(0)-p.Y(2)}"/>`
              + pulse(0) + p.hline(2,"gd3",0,50) + T(p.X(23), p.Y(2)-6, "平均 2 mA", "lb")
              + A(p.X(25),p.Y(0)+30,p.X(0),p.Y(0)+30,"vec0") + A(p.X(25),p.Y(0)+30,p.X(50),p.Y(0)+30,"vec0")
              + T(p.X(25), p.Y(0)+44, "T = 50 ms", "ans", "middle"))
         + G(3, p.pl([[20,0],[50,0]]) + pulse(50) + p.pl([[70,0],[100,0]]) + pulse(100) + p.pl([[120,0],[150,0]])
              + T(p.X(150), p.Y(5.6), "f = 1/T = 20 Hz", "ans", "end"));
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

/* ---------- RLC 直列のインピーダンス（k-z） ---------- */
Z["k-z"] = { h: 196,
  s: ["抵抗 R = 40 Ω を横向きの矢印で描く（1 Ω = 2 目盛り分）。",
      "コイル XL = 60 Ω は上向き、コンデンサ XC = 30 Ω は下向き。向きが逆なので打ち消し合う。",
      "上下を差し引くと XL − XC = 60 − 30 = <b>30 Ω</b>（上向き）。",
      "斜めの辺が Z。Z = √(40² + 30²) = √2500 = <b>50 Ω</b>（3:4:5 の直角三角形）。"],
  d(){ const o={x:70,y:172}, k=2;
    const rx=o.x+40*k;
    return G(1, A(o.x,o.y,rx,o.y,"vec") + T((o.x+rx)/2, o.y+16, "R = 40 Ω", "lbi", "middle"))
         + G(2, A(rx,o.y,rx,o.y-60*k,"vec") + T(rx-8, o.y-60*k+12, "XL = 60 Ω", "lbi", "end")
              + A(rx+14,o.y-60*k,rx+14,o.y-30*k,"vecm") + T(rx+22, o.y-45*k+4, "XC = 30 Ω", "lb"), 3)
         + G(3, A(rx,o.y,rx,o.y-30*k,"vecr") + T(rx+10, o.y-15*k+4, "XL − XC = 30 Ω", "ans"))
         + G(4, A(o.x,o.y,rx,o.y-30*k,"vecr") + T((o.x+rx)/2-6, o.y-15*k-6, "Z = 50 Ω", "ans", "end"));
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

/* ---------- 二極管と負荷線（k-diodeiv） ---------- */
Z["k-diodeiv"] = { h: 232,
  s: ["二極管の電圧 V と電流 I の関係（問題の図と同じ曲線）。",
      "抵抗にも電圧がかかる：1 kΩ × I [mA] = I [V]。だから <b>V + I = 80</b>。これは 80 V と 80 mA を結ぶ直線（負荷線）。",
      "曲線と直線が交わる点が実際の状態：V = 50 V、<b>I = 30 mA</b>（50 + 30 = 80 で検算OK）。",
      "60 mA は「80 V が全部二極管にかかる」と考えた値。抵抗に 30 V 取られるので間違い。"],
  d(){ const p = P({x:44,y:14,w:270,h:180},[0,120],[0,60]);
    const iv = v => v<=40 ? 20*(v/40)**2 : 20+(v-40);
    let grid=""; [20,40,60,80,100,120].forEach(v=>grid+=`<path class="gd" d="M${p.X(v)} ${p.Y(0)}V${p.Y(60)}"/>`);
    [10,20,30,40,50,60].forEach(v=>grid+=`<path class="gd" d="M${p.X(0)} ${p.Y(v)}H${p.X(120)}"/>`);
    return G(1, grid + p.axes({xt:[[40,"40"],[80,"80"],[120,"120"]], yt:[[0,"0"],[20,"20"],[40,"40"],[60,"60"]], xl:"V [V]", yl:"I [mA]"})
              + p.fn(iv,0,80))
         + G(2, p.pl([[80,0],[20,60]],"cvb") + T(p.X(84), p.Y(0)-6, "80 V", "blu") + T(p.X(24), p.Y(60)+12, "V + I = 80", "blu"))
         + G(3, p.guide(50,30,"gd3") + p.dot(50,30,"pt3") + T(p.X(50)+8, p.Y(30)+16, "30 mA", "ans"))
         + G(4, p.dot(80,60,"pt0") + T(p.X(80)+8, p.Y(60)+14, "60 mA は ×", "lb"));
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

/* ---------- 表示部品 ---------- */
// 解説の箱 host の中に図解を入れる。問題に図解がなければ何もしない。
window.ZukaiMount = function(host, id){
  const z = Z[id]; if(!host || !z) return;
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
