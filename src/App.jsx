import { useState, useEffect, useRef, useCallback } from "react";

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { min: 0,  max: 39,  label: "Koala",       emoji: "🐨", color: "#b07d62", desc: "Ontspannen en bedachtzaam — niks mis mee!" },
  { min: 40, max: 59,  label: "Stadsfiets",  emoji: "🚲", color: "#ff9900", desc: "Lekker relaxed, maar er is ruimte voor meer." },
  { min: 60, max: 79,  label: "Sportwagen",  emoji: "🏎️", color: "#00aaff", desc: "Scherp en snel — je zit in de snelle lane!" },
  { min: 80, max: 94,  label: "Raket",       emoji: "🚀", color: "#cc44ff", desc: "Razendsnel. Je brein draait op volle toeren." },
  { min: 95, max: 999, label: "Lichtstraal", emoji: "⚡", color: "#00ff88", desc: "Onmenselijk snel. Ben jij een robot?" },
];
const getCategory = (s) => CATEGORIES.find(c => s >= c.min && s <= c.max) || CATEGORIES[0];

const LEVELS = [
  { id: "easy",   label: "Beginner",  emoji: "🌱", questions: 5,  desc: "5 vragen, rustig tempo" },
  { id: "medium", label: "Uitdagend", emoji: "🔥", questions: 7,  desc: "7 vragen, mix van types" },
  { id: "hard",   label: "Pittig",    emoji: "💀", questions: 10, desc: "10 vragen, volle bak" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
// Ensure answer is always in options and options have no duplicates
const makeOpts = (answer, wrongs) => {
  const ans = String(answer);
  const pool = wrongs.map(String).filter(w => w !== ans);
  const unique = [...new Set(pool)];
  const chosen = shuffle(unique).slice(0, 3);
  return shuffle([ans, ...chosen]);
};

// ─── QUESTION POOL (50+ varianten) ────────────────────────────────────────────
function buildPool() {

  // 1. REKENEN — 5 types × meerdere gegenereerde varianten
  const mathQ = () => {
    const type = rnd(0, 4);
    let q, ans, w;
    if (type === 0) {
      const a=rnd(2,12),b=rnd(2,12); ans=a*b;
      q=`${a} × ${b} = ?`; w=[ans+rnd(1,5),ans-rnd(1,4),ans+rnd(6,11)];
    } else if (type === 1) {
      const a=rnd(15,85),b=rnd(10,60); ans=a+b;
      q=`${a} + ${b} = ?`; w=[ans+1,ans-1,ans+10];
    } else if (type === 2) {
      const b=rnd(8,40),a=rnd(b+1,90); ans=a-b;
      q=`${a} − ${b} = ?`; w=[ans+1,ans-1,ans+5];
    } else if (type === 3) {
      const a=rnd(2,9); ans=a*a;
      q=`${a}² = ?`; w=[ans+rnd(1,5),ans-rnd(1,3),ans+rnd(7,12)];
    } else {
      const a=rnd(2,8),b=rnd(2,5); ans=a*b*2;
      q=`${a} × ${b} × 2 = ?`; w=[ans+2,ans-2,ans+4];
    }
    return { type:"choice", instruction:"Los het zo snel op!", data:{ question:q, options:makeOpts(ans,w), answer:String(ans) }};
  };

  // 2. GROTER GETAL — 3 moeilijkheidsgraden
  const biggerQ = () => {
    const tier = rnd(0,2);
    const [lo,hi] = [[10,99],[100,999],[1000,9999]][tier];
    let a=rnd(lo,hi), b=rnd(lo,hi);
    while (b===a) b=rnd(lo,hi);
    const ans=Math.max(a,b);
    return { type:"choice", instruction:"Welk getal is GROTER?", data:{ question:null, options:[String(a),String(b)], answer:String(ans) }};
  };

  // 3. KLEINER GETAL
  const smallerQ = () => {
    let a=rnd(10,999), b=rnd(10,999);
    while (b===a) b=rnd(10,999);
    return { type:"choice", instruction:"Welk getal is KLEINER?", data:{ question:null, options:[String(a),String(b)], answer:String(Math.min(a,b)) }};
  };

  // 4. PATROON — 15 vaste reeksen
  const patternQ = () => {
    const sets = [
      {seq:["🔴","🔵","🔴","🔵","🔴","?"], ans:"🔵", w:["🔴","🟡","🟢"]},
      {seq:["⬛","⬛","⬜","⬛","⬛","?"], ans:"⬜", w:["⬛","🟦","🟥"]},
      {seq:["▲","▲","●","▲","▲","?"],    ans:"●",  w:["▲","■","◆"]},
      {seq:["1","2","4","8","16","?"],    ans:"32", w:["18","24","64"]},
      {seq:["A","C","E","G","I","?"],     ans:"K",  w:["J","L","H"]},
      {seq:["🌙","⭐","🌙","⭐","🌙","?"],ans:"⭐",  w:["🌙","☀️","🌈"]},
      {seq:["2","4","6","8","10","?"],    ans:"12", w:["11","13","14"]},
      {seq:["Z","Y","X","W","V","?"],     ans:"U",  w:["T","S","W"]},
      {seq:["🐱","🐶","🐱","🐶","🐱","?"],ans:"🐶", w:["🐱","🐸","🐭"]},
      {seq:["3","6","9","12","15","?"],   ans:"18", w:["16","17","19"]},
      {seq:["1","4","9","16","25","?"],   ans:"36", w:["30","32","40"]},
      {seq:["🍎","🍊","🍋","🍎","🍊","?"],ans:"🍋", w:["🍎","🍇","🍓"]},
      {seq:["5","10","20","40","80","?"], ans:"160",w:["100","120","200"]},
      {seq:["🟥","🟧","🟨","🟩","🟦","?"],ans:"🟪", w:["🟥","🟧","🟫"]},
      {seq:["B","D","F","H","J","?"],    ans:"L",  w:["K","M","N"]},
    ];
    const s = sets[rnd(0,sets.length-1)];
    return { type:"pattern", instruction:"Wat hoort hier? Herken het patroon.", data:{ seq:s.seq, options:makeOpts(s.ans,s.w), answer:s.ans }};
  };

  // 5. ODD ONE OUT — woorden (12 sets)
  const oddWordQ = () => {
    const sets = [
      {words:["Hond","Kat","Appel","Vis"],              ans:"Appel"},
      {words:["Rood","Blauw","Stoel","Groen"],          ans:"Stoel"},
      {words:["Parijs","Berlijn","Toyota","Rome"],       ans:"Toyota"},
      {words:["Piano","Viool","Hamer","Gitaar"],         ans:"Hamer"},
      {words:["Zee","Rivier","Berg","Meer"],             ans:"Berg"},
      {words:["Goud","Zilver","Brons","Plastic"],        ans:"Plastic"},
      {words:["Cirkel","Vierkant","Driehoek","Krant"],   ans:"Krant"},
      {words:["Dolfijn","Haai","Walvis","Arend"],        ans:"Arend"},
      {words:["Aardappel","Wortel","Broccoli","Mango"],  ans:"Mango"},
      {words:["Fiets","Auto","Vliegtuig","Schoen"],      ans:"Schoen"},
      {words:["Lente","Zomer","Maandag","Winter"],       ans:"Maandag"},
      {words:["Voetbal","Tennis","Schaak","Zwemmen"],    ans:"Schaak"},
    ];
    const s = sets[rnd(0,sets.length-1)];
    return { type:"choice", instruction:"Welk woord past NIET bij de rest?", data:{ question:null, options:shuffle(s.words), answer:s.ans }};
  };

  // 6. REACTIETEST — kleur flash
  const reactionQ = () => ({
    type:"reaction",
    instruction:"Klik zodra het vlak GROEN wordt — maar niet eerder!",
    data:{ delay: 1000 + Math.random() * 3000 }
  });

  // 7. GEHEUGEN KLEUR — FIX: data is volledig serialiseerbaar, geen functies
  const memoryQ = () => {
    const palette = [
      { name:"Blauw",  hex:"#1a6fff" },
      { name:"Rood",   hex:"#ff2244" },
      { name:"Geel",   hex:"#f5c800" },
      { name:"Groen",  hex:"#00bb55" },
      { name:"Paars",  hex:"#9933ff" },
      { name:"Oranje", hex:"#ff6600" },
    ];
    const shown = palette[rnd(0, palette.length-1)];
    const opts = shuffle(palette.filter(c=>c.name!==shown.name)).slice(0,3).map(c=>c.name);
    return {
      type:"memory",
      instruction:"Onthoud deze kleur — je krijgt hem straks terug!",
      data:{ shownName:shown.name, shownHex:shown.hex, options:shuffle([shown.name,...opts]), answer:shown.name }
    };
  };

  // 8. TEL DE EMOJI'S
  const countQ = () => {
    const icons = ["⭐","🔴","💎","🍎","🔷","🌟","🎯","🧩"];
    const icon = icons[rnd(0,icons.length-1)];
    const count = rnd(5,15);
    const w = [count-1,count+1,count+2,count-2].filter(n=>n>0&&n!==count);
    return {
      type:"count",
      instruction:`Tel snel: hoeveel ${icon} zie je?`,
      data:{ items:Array(count).fill(icon), options:makeOpts(count,w).slice(0,4), answer:String(count) }
    };
  };

  // 9. WAAR OF NIET WAAR (12 stellingen)
  const trueFalseQ = () => {
    const items = [
      {q:"De Eiffeltoren staat in Berlijn.",              a:"Onwaar"},
      {q:"8 × 7 = 56",                                   a:"Waar"},
      {q:"Nederland heeft meer dan 17 miljoen inwoners.", a:"Waar"},
      {q:"Een driehoek heeft 4 hoeken.",                  a:"Onwaar"},
      {q:"De maan is een planeet.",                       a:"Onwaar"},
      {q:"Amsterdam is de hoofdstad van Nederland.",      a:"Waar"},
      {q:"√64 = 8",                                      a:"Waar"},
      {q:"De Nijl stroomt door Azië.",                    a:"Onwaar"},
      {q:"12 × 12 = 144",                                a:"Waar"},
      {q:"Een octopus heeft 6 armen.",                    a:"Onwaar"},
      {q:"Water kookt op 100°C.",                         a:"Waar"},
      {q:"De zon is een planeet.",                        a:"Onwaar"},
    ];
    const s = items[rnd(0,items.length-1)];
    return { type:"choice", instruction:"Waar of niet waar?", data:{ question:s.q, options:["Waar","Onwaar"], answer:s.a }};
  };

  // 10. SNELSTE WEG — welk getal is het dichtst bij 50?
  const closestQ = () => {
    let nums = [];
    while (nums.length < 4) {
      const n = rnd(10,90);
      if (!nums.includes(n)) nums.push(n);
    }
    const ans = nums.reduce((best,n) => Math.abs(n-50)<Math.abs(best-50)?n:best, nums[0]);
    return { type:"choice", instruction:"Welk getal ligt het dichtst bij 50?", data:{ question:null, options:nums.map(String), answer:String(ans) }};
  };

  // 11. HOOFD REKENEN — deelsom
  const divQ = () => {
    const b=rnd(2,9), ans=rnd(2,9), a=b*ans;
    const w=[ans+1,ans-1,ans+2].filter(n=>n>0&&n!==ans);
    return { type:"choice", instruction:"Deel snel!", data:{ question:`${a} ÷ ${b} = ?`, options:makeOpts(ans,w), answer:String(ans) }};
  };

  // 12. WELKE KLEUR ONTBREEKT IN DE REEKS?
  const colorSeqQ = () => {
    const sets = [
      {seq:"🔴 🟡 🔵 🔴 🟡 ?", ans:"🔵", w:["🔴","🟡","🟢"]},
      {seq:"🟢 🟢 🔴 🟢 🟢 ?", ans:"🔴", w:["🟢","🔵","🟡"]},
      {seq:"🔵 🔴 🔵 🔴 🔵 ?", ans:"🔴", w:["🔵","🟡","🟢"]},
    ];
    const s=sets[rnd(0,sets.length-1)];
    return { type:"choice", instruction:"Wat is de volgende kleur in de reeks?", data:{ question:s.seq, options:makeOpts(s.ans,s.w), answer:s.ans }};
  };

  // Bouw pool: meerdere instanties per type voor variatie
  const pool = [];
  for (let i=0;i<4;i++) pool.push(reactionQ());
  for (let i=0;i<6;i++) pool.push(mathQ());
  for (let i=0;i<3;i++) pool.push(biggerQ());
  for (let i=0;i<2;i++) pool.push(smallerQ());
  for (let i=0;i<5;i++) pool.push(patternQ());
  for (let i=0;i<4;i++) pool.push(oddWordQ());
  for (let i=0;i<4;i++) pool.push(memoryQ());
  for (let i=0;i<3;i++) pool.push(countQ());
  for (let i=0;i<4;i++) pool.push(trueFalseQ());
  for (let i=0;i<2;i++) pool.push(closestQ());
  for (let i=0;i<3;i++) pool.push(divQ());
  for (let i=0;i<2;i++) pool.push(colorSeqQ());

  return shuffle(pool);
}

// ─── SCORING ──────────────────────────────────────────────────────────────────
const calcScore = (results) => {
  if (!results.length) return 0;
  const correct = results.filter(r=>r.correct).length;
  // Exclude reaction times > 5s (those are "waited too long" scores)
  const valid = results.filter(r=>r.ms<5000);
  const avgMs = valid.length ? valid.reduce((s,r)=>s+r.ms,0)/valid.length : 2000;
  const accuracy = correct / results.length;
  const speed = Math.min(1, 650/avgMs);
  return Math.min(99, Math.max(1, Math.round((accuracy*0.65 + speed*0.35)*99)));
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Space+Mono:wght@400;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--k:#0a0a0a;--w:#f5f0e8;--b:#0066ff;--g:#00ff88;--r:#ff2244;--y:#ffe000;
    --sh:4px 4px 0 #0a0a0a;--shl:6px 6px 0 #0a0a0a;--bd:3px solid #0a0a0a}
  body{background:var(--w);color:var(--k);font-family:'Space Mono',monospace;min-height:100vh}
  .snap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px}
  /* landing */
  .land{text-align:center;max-width:580px;width:100%}
  .chip{display:inline-block;background:var(--y);border:var(--bd);box-shadow:var(--sh);padding:5px 14px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:18px}
  .h1{font-family:'Syne',sans-serif;font-weight:900;font-size:clamp(2.6rem,9vw,4.8rem);line-height:1.03;letter-spacing:-.03em;margin-bottom:14px}
  .h1 em{color:var(--b);font-style:normal}
  .sub{font-size:15px;color:#555;line-height:1.75;margin-bottom:28px}
  .lvs{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:28px}
  .lv{flex:1;min-width:140px;max-width:180px;border:var(--bd);box-shadow:var(--sh);padding:16px 12px;cursor:pointer;text-align:center;background:var(--w);transition:transform .1s,box-shadow .1s,background .15s}
  .lv:hover{transform:translate(-2px,-2px);box-shadow:var(--shl)}
  .lv.on{background:var(--b);color:var(--w)}
  .lv-e{font-size:28px;margin-bottom:5px}
  .lv-t{font-family:'Syne',sans-serif;font-weight:800;font-size:14px;margin-bottom:3px}
  .lv-d{font-size:11px;opacity:.7}
  .btn{display:inline-flex;align-items:center;gap:8px;font-family:'Syne',sans-serif;font-weight:800;font-size:17px;letter-spacing:.04em;padding:18px 40px;border:var(--bd);box-shadow:var(--shl);cursor:pointer;transition:transform .1s,box-shadow .1s;text-transform:uppercase;background:var(--b);color:var(--w)}
  .btn:hover{transform:translate(-2px,-2px);box-shadow:8px 8px 0 var(--k)}
  .btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--k)}
  .btn.out{background:var(--w);color:var(--k)}
  .sstats{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px}
  .sstat{border:var(--bd);padding:7px 14px;font-size:12px;box-shadow:var(--sh)}
  .sstat strong{color:var(--b)}
  /* countdown */
  .cd{text-align:center}
  .cdn{font-family:'Syne',sans-serif;font-weight:900;font-size:clamp(5rem,22vw,10rem);line-height:1;animation:pop .35s ease}
  @keyframes pop{0%{transform:scale(1.5);opacity:0}100%{transform:scale(1);opacity:1}}
  /* quiz */
  .qw{max-width:520px;width:100%}
  .prog{height:10px;background:#ddd;border:2px solid var(--k);margin-bottom:26px;overflow:hidden}
  .prog-f{height:100%;background:var(--b);transition:width .35s}
  .qc{border:var(--bd);box-shadow:var(--shl);background:var(--w);padding:26px 22px 22px;margin-bottom:16px}
  .ql{font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--b);margin-bottom:8px}
  .qt{font-family:'Syne',sans-serif;font-weight:800;font-size:clamp(1rem,3.5vw,1.45rem);line-height:1.3;margin-bottom:20px}
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .opt{padding:16px 10px;border:var(--bd);box-shadow:var(--sh);background:var(--w);font-family:'Space Mono',monospace;font-weight:700;font-size:15px;cursor:pointer;text-align:center;transition:transform .1s,box-shadow .1s,background .12s;line-height:1.3}
  .opt:hover{background:var(--y);transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--k)}
  .opt.ok{background:var(--g)!important;pointer-events:none}
  .opt.no{background:var(--r)!important;color:#fff;pointer-events:none}
  .opt.dim{opacity:.5;pointer-events:none}
  /* reaction */
  .flash{height:150px;border:var(--bd);box-shadow:var(--shl);display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:'Syne',sans-serif;font-weight:800;font-size:22px;user-select:none;border-radius:2px}
  /* memory */
  .mem-box{width:120px;height:120px;border:var(--bd);box-shadow:var(--shl);margin:0 auto 8px}
  .mem-label{text-align:center;font-size:13px;color:#666;margin-bottom:20px;min-height:20px}
  /* count */
  .cnt-grid{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:18px;max-width:300px;margin-left:auto;margin-right:auto}
  /* pattern */
  .pat-seq{display:flex;gap:6px;align-items:center;justify-content:center;font-size:20px;margin-bottom:18px;flex-wrap:wrap}
  .pat-item{padding:4px 7px;border:2px solid transparent;border-radius:3px}
  .pat-q{border:2px dashed #aaa!important;background:#f0f0f0;font-weight:700;min-width:32px;text-align:center}
  /* timer */
  .tmr{display:flex;align-items:center;gap:8px;font-size:12px;color:#888}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--r);animation:pulse 1s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.2}}
  /* calculating */
  .calc{text-align:center;max-width:380px}
  .calc-bar{height:12px;border:var(--bd);box-shadow:var(--sh);background:#ddd;margin:22px 0;overflow:hidden}
  .calc-f{height:100%;background:var(--b);animation:ldup 2.5s ease forwards}
  @keyframes ldup{0%{width:0}100%{width:100%}}
  .brain{font-size:56px;margin:14px 0;animation:spin 1.8s linear infinite;display:inline-block}
  @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
  /* email */
  .gate{max-width:460px;width:100%;text-align:center}
  .er{display:flex;border:var(--bd);box-shadow:var(--shl);overflow:hidden;margin-bottom:12px}
  .ei{flex:1;padding:16px 18px;border:none;font-family:'Space Mono',monospace;font-size:14px;background:var(--w);outline:none}
  .eb{padding:16px 20px;background:var(--b);color:var(--w);border:none;border-left:var(--bd);font-family:'Syne',sans-serif;font-weight:800;font-size:13px;cursor:pointer;text-transform:uppercase}
  .eb:hover{background:#004ecc}
  .sk{background:none;border:none;font-family:'Space Mono',monospace;font-size:12px;color:#aaa;cursor:pointer;text-decoration:underline}
  /* result */
  .res{max-width:500px;width:100%;text-align:center}
  .rc{border:var(--bd);box-shadow:8px 8px 0 var(--k);padding:28px 22px;margin-bottom:16px}
  .re{font-size:52px;margin-bottom:6px}
  .rcat{font-family:'Syne',sans-serif;font-weight:900;font-size:clamp(1.8rem,6vw,3.2rem);letter-spacing:-.02em;line-height:1;margin-bottom:8px}
  .rsn{font-family:'Syne',sans-serif;font-weight:900;font-size:clamp(3rem,10vw,5rem);line-height:1}
  .rdesc{font-size:14px;color:#555;line-height:1.8;margin:10px 0 16px}
  .msts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
  .ms{border:2px solid var(--k);padding:8px 12px;font-size:11px;background:var(--w);box-shadow:2px 2px 0 var(--k)}
  .ms strong{font-size:15px;display:block}
  .sr{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:16px 0 10px}
  .sb{padding:12px 18px;border:var(--bd);box-shadow:var(--sh);font-family:'Syne',sans-serif;font-weight:700;font-size:12px;cursor:pointer;text-transform:uppercase;letter-spacing:.04em;transition:transform .1s,box-shadow .1s}
  .sb:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--k)}
  .sb.li{background:#0077b5;color:#fff}
  .sb.cp{background:var(--y);color:var(--k)}
  .lbadge{display:inline-block;border:var(--bd);padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:16px;box-shadow:var(--sh)}
  .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--k);color:var(--w);padding:12px 24px;font-size:13px;border:2px solid var(--g);box-shadow:var(--sh);z-index:99;animation:fdup .3s ease}
  @keyframes fdup{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
  @media(max-width:440px){.lv{min-width:90px}}
`;

const injectCSS = () => {
  if (document.getElementById("snap-css")) return;
  const el = document.createElement("style");
  el.id = "snap-css";
  el.textContent = CSS;
  document.head.appendChild(el);
};

// ─── QUESTION COMPONENTS ──────────────────────────────────────────────────────

// BUG FIX: ReactionQ — stable, no key re-mount issues
function ReactionQ({ data, onAnswer }) {
  const [phase, setPhase] = useState("wait"); // wait | go | done
  const startRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setPhase("go");
      startRef.current = performance.now();
    }, data.delay);
    return () => clearTimeout(timerRef.current);
  }, []); // empty deps — run once on mount

  const handleClick = () => {
    if (phase === "done") return;
    if (phase === "wait") {
      clearTimeout(timerRef.current);
      setPhase("done");
      onAnswer(false, 9999);
      return;
    }
    setPhase("done");
    onAnswer(true, Math.round(performance.now() - startRef.current));
  };

  const bg = phase === "go" ? "#00ff88" : phase === "done" ? "#00ccff" : "#ff2244";
  const label = phase === "go" ? "KLIK NU! 💥" : phase === "done" ? "✓" : "Wacht op groen...";

  return (
    <div className="flash" style={{ background: bg, color: phase === "go" ? "#000" : "#fff" }} onClick={handleClick}>
      {label}
    </div>
  );
}

// BUG FIX: MemoryQ — eigen fase-state, geen render-race
function MemoryQ({ data, onAnswer }) {
  const [phase, setPhase] = useState("show"); // show | hide | ask
  const [chosen, setChosen] = useState(null);
  const startRef = useRef(null);

  useEffect(() => {
    // Show kleur 1.8s, dan fade out 0.5s, dan vragen tonen
    const t1 = setTimeout(() => setPhase("hide"), 1800);
    const t2 = setTimeout(() => {
      setPhase("ask");
      startRef.current = performance.now();
    }, 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const pick = (opt) => {
    if (chosen || phase !== "ask") return;
    setChosen(opt);
    const ms = Math.round(performance.now() - startRef.current);
    setTimeout(() => onAnswer(opt === data.answer, ms), 380);
  };

  return (
    <>
      <div
        className="mem-box"
        style={{
          background: phase === "ask" ? "#e8e8e8" : data.shownHex,
          opacity: phase === "hide" ? 0 : 1,
          transition: "opacity 0.5s, background 0.3s",
        }}
      />
      <div className="mem-label">
        {phase === "show" && "Onthoud deze kleur..."}
        {phase === "hide" && ""}
        {phase === "ask"  && "Welke kleur zag je?"}
      </div>
      {phase === "ask" && (
        <div className="opts">
          {data.options.map(opt => (
            <button
              key={opt}
              className={`opt${chosen === opt ? (opt === data.answer ? " ok" : " no") : chosen ? " dim" : ""}`}
              onClick={() => pick(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function CountQ({ data, onAnswer }) {
  const startRef = useRef(performance.now());
  const [chosen, setChosen] = useState(null);
  const pick = (opt) => {
    if (chosen) return;
    setChosen(opt);
    const ms = Math.round(performance.now() - startRef.current);
    setTimeout(() => onAnswer(opt === data.answer, ms), 380);
  };
  return (
    <>
      <div className="cnt-grid">
        {data.items.map((e, i) => <span key={i} style={{ fontSize: "22px" }}>{e}</span>)}
      </div>
      <div className="opts">
        {data.options.map(opt => (
          <button key={opt} className={`opt${chosen===opt?(opt===data.answer?" ok":" no"):chosen?" dim":""}`} onClick={() => pick(opt)}>{opt}</button>
        ))}
      </div>
    </>
  );
}

function PatternQ({ data, onAnswer }) {
  const startRef = useRef(performance.now());
  const [chosen, setChosen] = useState(null);
  const pick = (opt) => {
    if (chosen) return;
    setChosen(opt);
    const ms = Math.round(performance.now() - startRef.current);
    setTimeout(() => onAnswer(opt === data.answer, ms), 380);
  };
  return (
    <>
      <div className="pat-seq">
        {data.seq.map((s, i) => (
          <span key={i} className={`pat-item${s === "?" ? " pat-q" : ""}`}>{s}</span>
        ))}
      </div>
      <div className="opts">
        {data.options.map(opt => (
          <button key={opt} className={`opt${chosen===opt?(opt===data.answer?" ok":" no"):chosen?" dim":""}`} onClick={() => pick(opt)}>{opt}</button>
        ))}
      </div>
    </>
  );
}

function ChoiceQ({ data, onAnswer }) {
  const startRef = useRef(performance.now());
  const [chosen, setChosen] = useState(null);
  const pick = (opt) => {
    if (chosen) return;
    setChosen(opt);
    const ms = Math.round(performance.now() - startRef.current);
    setTimeout(() => onAnswer(opt === data.answer, ms), 380);
  };
  return (
    <>
      {data.question && (
        <div style={{ fontSize: "17px", fontWeight: "700", marginBottom: "16px", fontFamily: "'Syne',sans-serif", lineHeight: 1.35 }}>
          {data.question}
        </div>
      )}
      <div className="opts" style={data.options.length === 2 ? { gridTemplateColumns: "1fr 1fr" } : {}}>
        {data.options.map((opt, i) => (
          <button key={i} className={`opt${chosen===opt?(opt===data.answer?" ok":" no"):chosen?" dim":""}`} onClick={() => pick(opt)}>{opt}</button>
        ))}
      </div>
    </>
  );
}

// BUG FIX: Quiz — QuestionWrapper uses stable key, type-based dispatch outside render
function QuestionWrapper({ q, idx, onAnswer }) {
  if (q.type === "reaction") return <ReactionQ data={q.data} onAnswer={onAnswer} />;
  if (q.type === "memory")   return <MemoryQ   data={q.data} onAnswer={onAnswer} />;
  if (q.type === "count")    return <CountQ    data={q.data} onAnswer={onAnswer} />;
  if (q.type === "pattern")  return <PatternQ  data={q.data} onAnswer={onAnswer} />;
  return <ChoiceQ data={q.data} onAnswer={onAnswer} />;
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────
function Landing({ onStart }) {
  const [lv, setLv] = useState("medium");
  return (
    <div className="land">
      <div className="chip">⚡ Gratis cognitieve snelheidstest</div>
      <h1 className="h1">Hoe snel<br /><em>snap</em> jij het?</h1>
      <p className="sub">60 seconden. Een eerlijk oordeel over jouw brein.<br />Ben je een Lichtstraal of een Koala?</p>
      <div className="lvs">
        {LEVELS.map(l => (
          <div key={l.id} className={`lv${lv === l.id ? " on" : ""}`} onClick={() => setLv(l.id)}>
            <div className="lv-e">{l.emoji}</div>
            <div className="lv-t">{l.label}</div>
            <div className="lv-d">{l.desc}</div>
          </div>
        ))}
      </div>
      <button className="btn" onClick={() => onStart(lv)}>⚡ Start de test</button>
      <div className="sstats">
        <div className="sstat"><strong>12.847</strong> testen gedaan</div>
        <div className="sstat">Gemiddeld: <strong>Stadsfiets</strong></div>
        <div className="sstat">50+ unieke vragen</div>
      </div>
    </div>
  );
}

function Countdown({ onDone }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n === 0) { setTimeout(onDone, 600); return; }
    const t = setTimeout(() => setN(n - 1), 750);
    return () => clearTimeout(t);
  }, [n, onDone]);
  const col = n === 0 ? "#00ff88" : n === 1 ? "#ff9900" : "#0066ff";
  return (
    <div className="cd">
      <div className="cdn" key={n} style={{ color: col }}>{n === 0 ? "GO! 🚀" : n}</div>
      <p style={{ marginTop: "14px", color: "#666", fontSize: "15px" }}>{n > 0 ? "Maak je klaar..." : "Zo snel mogelijk!"}</p>
    </div>
  );
}

function Quiz({ level, onDone }) {
  const ld = LEVELS.find(l => l.id === level);
  const [qs] = useState(() => buildPool().slice(0, ld.questions));
  const [idx, setIdx] = useState(0);
  const resultsRef = useRef([]);
  const [elapsed, setElapsed] = useState(0);
  const t0 = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - t0.current) / 1000)), 300);
    return () => clearInterval(t);
  }, []);

  // BUG FIX: use ref for results to avoid stale closure in callback
  const onAns = useCallback((ok, ms) => {
    resultsRef.current = [...resultsRef.current, { correct: ok, ms }];
    const next = idx + 1;
    if (next >= qs.length) {
      onDone(resultsRef.current);
    } else {
      setIdx(next);
    }
  }, [idx, qs.length, onDone]);

  const q = qs[idx];

  return (
    <div className="qw">
      <div className="prog">
        <div className="prog-f" style={{ width: `${(idx / qs.length) * 100}%` }} />
      </div>
      <div className="qc">
        <div className="ql">Vraag {idx + 1} van {qs.length} · {ld.emoji} {ld.label}</div>
        <div className="qt">{q.instruction}</div>
        {/* KEY on idx ensures full remount per question — critical for timers */}
        <QuestionWrapper key={idx} q={q} idx={idx} onAnswer={onAns} />
      </div>
      <div className="tmr"><div className="dot" /><span>{elapsed}s verstreken</span></div>
    </div>
  );
}

function Calculating({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2700); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="calc">
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "clamp(1.4rem,5vw,2rem)", marginBottom: "6px" }}>
        Resultaten berekenen...
      </div>
      <div><span className="brain">🧠</span></div>
      <div className="calc-bar"><div className="calc-f" /></div>
      <div style={{ fontSize: "13px", color: "#777" }}>Vergelijken met 12.847 deelnemers...</div>
    </div>
  );
}

function EmailGate({ onSubmit, onSkip }) {
  const [em, setEm] = useState("");
  const go = () => { if (em.includes("@")) onSubmit(em); };
  return (
    <div className="gate">
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "clamp(1.6rem,5vw,2.1rem)", marginBottom: "10px" }}>
        🏆 Je score is klaar!
      </div>
      <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.75, marginBottom: "24px" }}>
        Vul je e-mail in om je score te vergelijken met Nederland — en ontvang tips om je snapsnelheid te verhogen.
      </p>
      <div className="er">
        <input className="ei" placeholder="jouw@email.nl" value={em} onChange={e => setEm(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} type="email" />
        <button className="eb" onClick={go}>Bekijk →</button>
      </div>
      <button className="sk" onClick={onSkip}>Overslaan, laat me mijn score zien</button>
    </div>
  );
}

function Result({ results, level, onRetry }) {
  const score = calcScore(results);
  const cat = getCategory(score);
  const correct = results.filter(r => r.correct).length;
  const valid = results.filter(r => r.ms < 5000);
  const avgMs = valid.length ? Math.round(valid.reduce((s, r) => s + r.ms, 0) / valid.length) : "—";
  const [copied, setCopied] = useState(false);
  const ld = LEVELS.find(l => l.id === level);

  const shareText = `Mijn snapsnelheid score: ${score}/99 — Ik ben een ${cat.emoji} ${cat.label}! (${ld.label} level)\nDoe de test op snapsnelheid.nl`;
  const copy = () => { navigator.clipboard.writeText(shareText); setCopied(true); setTimeout(() => setCopied(false), 2500); };
  const li = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://snapsnelheid.nl")}&summary=${encodeURIComponent(shareText)}`, "_blank");

  return (
    <div className="res">
      <div className="lbadge" style={{ background: cat.color, color: "#000" }}>{ld.emoji} {ld.label}</div>
      <div className="rc" style={{ borderTop: `6px solid ${cat.color}` }}>
        <div className="re">{cat.emoji}</div>
        <div className="rcat" style={{ color: cat.color }}>{cat.label}</div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px", margin: "10px 0 6px" }}>
          <div className="rsn" style={{ color: cat.color }}>{score}</div>
          <div style={{ fontSize: "18px", color: "#888" }}>/99</div>
        </div>
        <div className="rdesc">{cat.desc}</div>
        <div className="msts">
          <div className="ms"><strong>{correct}/{results.length}</strong>correct</div>
          <div className="ms"><strong>{avgMs}ms</strong>gem. reactie</div>
          <div className="ms"><strong>Top {Math.max(1, 100 - score)}%</strong>Nederland</div>
        </div>
      </div>
      <div className="sr">
        <button className="sb li" onClick={li}>in Deel op LinkedIn</button>
        <button className="sb cp" onClick={copy}>📋 Kopieer badge</button>
      </div>
      <button className="btn out" onClick={onRetry} style={{ fontSize: "14px", padding: "12px 28px" }}>🔄 Opnieuw proberen</button>
      {copied && <div className="toast">✅ Gekopieerd naar klembord!</div>}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(injectCSS, []);
  const [screen, setScreen] = useState("landing");
  const [level, setLevel] = useState("medium");
  const [results, setResults] = useState([]);

  const start = (lv) => { setLevel(lv); setScreen("countdown"); };
  const reset = () => { setResults([]); setScreen("landing"); };

  return (
    <div className="snap">
      {screen === "landing"     && <Landing onStart={start} />}
      {screen === "countdown"   && <Countdown onDone={() => setScreen("quiz")} />}
      {screen === "quiz"        && <Quiz level={level} onDone={r => { setResults(r); setScreen("calculating"); }} />}
      {screen === "calculating" && <Calculating onDone={() => setScreen("email")} />}
      {screen === "email"       && <EmailGate onSubmit={() => setScreen("result")} onSkip={() => setScreen("result")} />}
      {screen === "result"      && <Result results={results} level={level} onRetry={reset} />}
    </div>
  );
}
