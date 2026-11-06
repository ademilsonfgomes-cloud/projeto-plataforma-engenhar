// V108.6 — LINHA DA PAREDE VIVA (vetor nítido em qualquer zoom, como no AutoCAD) e PEGADORES (grips) na parede selecionada:
// quadradinho da ponta = esticar/encurtar (encaixa no eixo das outras paredes; Shift solta da direção da parede),
// quadradinho do meio = mover a parede para o lado (as paredes que chegam acompanham). Ctrl+Z desfaz.
(function(){
'use strict';
const N=Number,cv=$('plan'),wrap=$('planWrap');if(!cv||!wrap)return;
const NS='http://www.w3.org/2000/svg';
const sv=document.createElementNS(NS,'svg');sv.id='wl108';sv.setAttribute('aria-hidden','true');
{const t=$('txt93');if(t)wrap.insertBefore(sv,t);else wrap.append(sv);}
const on=()=>!!window.fino108?.on;window.wl108on=on;
const pg=()=>N($('page')?.value)||1;
const colMode=()=>{try{return localStorage.getItem('color71')||'conf';}catch{return 'conf';}};
const okLoc=l=>l==='Externa'||l==='Interna'||l==='Mista';
function colorOf(w){if(colMode()==='pos'){const l=w.location;return l==='Externa'?'#1f5bff':l==='Interna'?'#00b84a':l==='Mista'?'#a64dff':'#ff2b2b';}return w.confirmed?'#00c040':'#ff8a00';}
const scale=()=>{const r=cv.getBoundingClientRect();return r.width&&cv.width?r.width/cv.width:1;};
const o=()=>cv.planOrigin25||{x:0,y:0};
const kOf=w=>{try{return window.walltool56.kOf(w);}catch{const[a,b]=w.line;return Math.hypot(b.x-a.x,b.y-a.y)/N(w.length)||1;}};
let drag=null,hot=null;
function segs(w){const[a,b]=w.line,L=Math.hypot(b.x-a.x,b.y-a.y)||1,k=N(w.planScale)||(typeof pxCm!=='undefined'&&pxCm)||L/N(w.length),u={x:(b.x-a.x)/L,y:(b.y-a.y)/L};const cuts=(w.openings||[]).map(q=>[N(q.start)*k,(N(q.start)+N(q.width))*k]).filter(c=>c[1]>c[0]).sort((p,q)=>p[0]-q[0]);
 const out=[];let s=0;for(const[c0,c1]of cuts){if(c0>s)out.push([s,Math.min(c0,L)]);s=Math.max(s,c1);}if(s<L)out.push([s,L]);return out.map(([s0,s1])=>[{x:a.x+u.x*s0,y:a.y+u.y*s0},{x:a.x+u.x*s1,y:a.y+u.y*s1}]);}
// V115 — PAREDE COM ESPESSURA: duas faces + hachura (como no CAD), com o eixo opcional.
// Modo: 'eixo' (só o eixo), 'faces' (faces + hachura) ou 'ambos' (faces + hachura + eixo traço-ponto).
const LS109=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch{}return null;};
let modo109=['eixo','faces','ambos'].includes(LS109('parede109'))?LS109('parede109'):'ambos';
window.parede109={get:()=>modo109,set:m=>{if(!['eixo','faces','ambos'].includes(m))return;modo109=m;LS109('parede109',m);try{render();}catch{}}};
// cantos em L: cada ponta avança meia espessura da outra parede, para o canto fechar
let extKey='',extMap=new Map();
function extensoes(){const key=state.walls.map(w=>w.line?w.line.map(q=>q.x+','+q.y).join(';')+'|'+w.width:'').join('/');if(key===extKey)return extMap;extKey=key;extMap=new Map();
 let qs=[];try{qs=window.JunctionEngine?.detect(state.walls)||[];}catch{}
 for(const q of qs){if(q.type!=='L')continue;for(const[me,ot,e]of [[q.a,q.b,q.ae],[q.b,q.a,q.be]]){if(e<0)continue;const v=extMap.get(me.i)||[0,0];v[e]=Math.max(v[e],N(ot.w.width)/2||7);extMap.set(me.i,v);}}
 return extMap;}
function corpo(w,i){const[a,b]=w.line,L=Math.hypot(b.x-a.x,b.y-a.y)||1,k=N(w.planScale)||(typeof pxCm!=='undefined'&&pxCm)||L/N(w.length),u={x:(b.x-a.x)/L,y:(b.y-a.y)/L},n={x:-u.y,y:u.x},hw=(N(w.width)||14)/2*k;
 const e=extensoes().get(i)||[0,0],s0=-e[0]*k,s1=L+e[1]*k;
 const cuts=(w.openings||[]).map(q=>[N(q.start)*k,(N(q.start)+N(q.width))*k]).filter(c=>c[1]>c[0]).sort((p,q)=>p[0]-q[0]);
 const tr=[];let s=s0;for(const[c0,c1]of cuts){if(c0>s)tr.push([s,Math.min(c0,s1)]);s=Math.max(s,c1);}if(s<s1)tr.push([s,s1]);
 return tr.map(([x0,x1])=>{const P=(t,h)=>({x:a.x+u.x*t+n.x*h,y:a.y+u.y*t+n.y*h});return [P(x0,-hw),P(x1,-hw),P(x1,hw),P(x0,hw)];});}
function render(){if(!on()||typeof image==='undefined'||!image){sv.innerHTML='';sv.style.display='none';return;}sv.style.display='';
 sv.style.left=cv.offsetLeft+'px';sv.style.top=cv.offsetTop+'px';sv.style.width=cv.style.width;sv.style.height=cv.style.height;sv.setAttribute('viewBox','0 0 '+cv.width+' '+cv.height);
 const O=o(),sc=scale(),p=pg(),sel=window.sel85?.()??-1,pos=colMode()==='pos';let h='';const X=q=>(q.x-O.x).toFixed(2),Y=q=>(q.y-O.y).toFixed(2);
 if(modo109!=='eixo'){const th=window.bg88?.THEMES?.[window.bg88?.get?.().theme],bg=th?.bg||'#ffffff',sp=(5/sc).toFixed(2),cores=new Set();let st='',fi='',ha='';
  state.walls.forEach((w,i)=>{if(!w.line||N(w.page||1)!==p)return;const c=colorOf(w);cores.add(c);const id='h109'+c.replace('#','');
   for(const Q of corpo(w,i)){const pts=Q.map(q=>X(q)+','+Y(q)).join(' ');
    st+='<polygon points="'+pts+'" fill="none" stroke="'+c+'" stroke-width="'+(i===sel?3.4:2.4)+'" vector-effect="non-scaling-stroke" stroke-linejoin="miter"/>';
    fi+='<polygon points="'+pts+'" fill="#000"/>';ha+='<polygon points="'+pts+'" fill="url(#'+id+')"/>';}});
  // contorno da união: traço grosso por baixo, corpo opaco por cima (só sobra a metade de fora do traço)
  // V116 — o desenho de fundo (PDF/DXF) continua visível: a parte de dentro das paredes é escondida por MÁSCARA
  // (some só o traço interno), sem preenchimento opaco; a hachura é transparente.
  h+='<defs>'+[...cores].map(c=>'<pattern id="h109'+c.replace('#','')+'" patternUnits="userSpaceOnUse" width="'+sp+'" height="'+sp+'" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="'+sp+'" stroke="'+c+'" stroke-opacity=".32" stroke-width="'+(1/sc).toFixed(2)+'"/></pattern>').join('')+
   '<mask id="m109" maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="300000" height="300000"><rect x="-100000" y="-100000" width="300000" height="300000" fill="#fff"/>'+fi+'</mask></defs><g mask="url(#m109)">'+st+'</g>'+ha;}
 state.walls.forEach((w,i)=>{if(!w.line||N(w.page||1)!==p)return;if(modo109==='faces'&&i!==sel)return;const c=colorOf(w),dash=modo109!=='eixo'&&i!==sel?' stroke-dasharray="12 3 2 3" stroke-opacity=".8"':pos&&!okLoc(w.location)?' stroke-dasharray="6 4"':'';
  for(const[a,b]of segs(w))h+='<line x1="'+X(a)+'" y1="'+Y(a)+'" x2="'+X(b)+'" y2="'+Y(b)+'" stroke="'+c+'" stroke-width="'+(i===sel?2.2:modo109==='eixo'?1.25:.7)+'" vector-effect="non-scaling-stroke" stroke-linecap="square"'+dash+'/>';});
 // pegadores
 const W=state.walls[sel];if(W?.line&&N(W.page||1)===p&&!document.body.classList.contains('tool56')){const[a,b]=W.line,m={x:(a.x+b.x)/2,y:(a.y+b.y)/2},g=9/sc;
  [['0',a],['m',m],['1',b]].forEach(([k,q])=>{const isHot=hot===k;h+='<rect class="g108" data-g="'+k+'" x="'+(q.x-O.x-g/2).toFixed(2)+'" y="'+(q.y-O.y-g/2).toFixed(2)+'" width="'+g.toFixed(2)+'" height="'+g.toFixed(2)+'" fill="'+(isHot?'#ff2b2b':'#2b6cff')+'" stroke="#fff" stroke-width="1" vector-effect="non-scaling-stroke"/>';});}
 if(drag?.ghost){const[a,b]=drag.ghost;h+='<line x1="'+X(a)+'" y1="'+Y(a)+'" x2="'+X(b)+'" y2="'+Y(b)+'" stroke="#ff2b2b" stroke-width="1.5" stroke-dasharray="8 5" vector-effect="non-scaling-stroke"/>';}
 if(drag?.snapP){const q=drag.snapP,g=12/sc;h+='<rect x="'+(q.x-O.x-g/2)+'" y="'+(q.y-O.y-g/2)+'" width="'+g+'" height="'+g+'" fill="none" stroke="#16a34a" stroke-width="2" vector-effect="non-scaling-stroke"/>';}
 sv.innerHTML=h;}
window.wl108={render,on};
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{render();}catch(e){console.error('V108.6 linhas',e);}return r;};}

// ---------- arrastar pegadores
const toPage=e=>{const r=cv.getBoundingClientRect(),O=o();return {x:(e.clientX-r.left)*cv.width/r.width+O.x,y:(e.clientY-r.top)*cv.height/r.height+O.y};};
function snapEnd(W,idx,P,free){const[a,b]=W.line,F=W.line[1-idx],L=Math.hypot(b.x-a.x,b.y-a.y)||1,u={x:(b.x-a.x)/L,y:(b.y-a.y)/L},tol=10/scale(),p=pg();
 let Q=free?{...P}:(()=>{const t=(P.x-F.x)*u.x+(P.y-F.y)*u.y;return {x:F.x+u.x*t,y:F.y+u.y*t};})();let best=null;
 for(const w of state.walls){if(w===W||!w.line||N(w.page||1)!==p)continue;const[c,d]=w.line,l2=Math.hypot(d.x-c.x,d.y-c.y)||1,v={x:(d.x-c.x)/l2,y:(d.y-c.y)/l2};
  for(const E of [c,d]){const dd=Math.hypot(E.x-Q.x,E.y-Q.y);if(dd<tol&&(!best||dd<best.d))best={d:dd,P:{...E}};}
  const den=u.x*v.y-u.y*v.x;if(!free&&Math.abs(den)>.2){const t=((c.x-F.x)*v.y-(c.y-F.y)*v.x)/den,X={x:F.x+u.x*t,y:F.y+u.y*t},mu=(X.x-c.x)*v.x+(X.y-c.y)*v.y;if(mu>-tol&&mu<l2+tol){const dd=Math.hypot(X.x-Q.x,X.y-Q.y);if(dd<tol&&(!best||dd<best.d))best={d:dd,P:X};}}}
 if($('snap')?.checked===false)best=null;// 🧲 Encaixe desligado (F3): sem captura
 return best?{P:best.P,snap:true}:{P:Q,snap:false};}
let raf=0;const redraw=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;try{drawPlan();}catch{}});};
sv.addEventListener('pointerdown',e=>{const g=e.target.closest?.('.g108');if(!g)return;e.preventDefault();e.stopPropagation();const i=window.sel85?.()??-1,W=state.walls[i];if(!W)return;
 hot=g.dataset.g;drag={W,k:hot,start:toPage(e),line:W.line.map(q=>({...q}))};try{sv.setPointerCapture(e.pointerId);}catch{}render();});
sv.addEventListener('pointermove',e=>{if(!drag)return;e.preventDefault();const P=toPage(e),W=drag.W;
 if(drag.k==='m'){const[a,b]=drag.line,L=Math.hypot(b.x-a.x,b.y-a.y)||1,n={x:-(b.y-a.y)/L,y:(b.x-a.x)/L},d=(P.x-drag.start.x)*n.x+(P.y-drag.start.y)*n.y,k=kOf(W),cm=Math.round(d/k);drag.cm=cm;
  const D={x:n.x*cm*k,y:n.y*cm*k};drag.ghost=[{x:a.x+D.x,y:a.y+D.y},{x:b.x+D.x,y:b.y+D.y}];$('planStatus').textContent='Mover '+('Parede '+(state.walls.indexOf(W)+1))+': '+Math.abs(cm)+' cm — solte para confirmar (Esc cancela).';}
 else{const idx=N(drag.k),r=snapEnd(W,idx,P,e.shiftKey);drag.snapP=r.snap?r.P:null;try{window.walltool56.setEnd(W,idx,r.P,kOf(W));}catch{W.line[idx]=r.P;}$('planStatus').textContent='Parede '+(state.walls.indexOf(W)+1)+': '+W.length+' cm'+(r.snap?' · encaixada':'')+' (Shift = livre, Esc cancela).';}
 redraw();});
function end(cancel){if(!drag)return;const W=drag.W;
 if(cancel){if(drag.k!=='m'){W.line=drag.line;const[a,b]=W.line;W.length=Math.round(Math.hypot(b.x-a.x,b.y-a.y)/kOf(W));}drag=null;hot=null;drawPlan();$('planStatus').textContent='Cancelado.';return;}
 let msg='';if(drag.k==='m'){if(drag.cm){try{msg=window.move108.move(W,Math.abs(drag.cm),Math.sign(drag.cm));}catch(er){console.error(er);}}}
 else{delete W.locked76;msg='Parede '+(state.walls.indexOf(W)+1)+' esticada: '+W.length+' cm. Ctrl+Z desfaz.';}
 drag=null;hot=null;try{window.undo58?.push?.();}catch{}try{renderWalls();}catch{}try{invalidate();}catch{}drawPlan();if(msg)$('planStatus').textContent=msg;}
sv.addEventListener('pointerup',e=>{if(drag){e.preventDefault();end(false);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();e.stopImmediatePropagation();end(true);}},true);
const sync=()=>{if(sv.style.display==='none')return;const L=cv.offsetLeft+'px',T=cv.offsetTop+'px';if(sv.style.left!==L||sv.style.top!==T||sv.style.width!==cv.style.width){sv.style.left=L;sv.style.top=T;sv.style.width=cv.style.width;sv.style.height=cv.style.height;sv.setAttribute('viewBox','0 0 '+cv.width+' '+cv.height);}};try{new ResizeObserver(sync).observe(cv);new ResizeObserver(sync).observe(wrap);}catch{}
setInterval(()=>{try{if(on()&&image){sync();const s=window.sel85?.()??-1;if(s!==render.__s){render.__s=s;render();}}}catch{}},300);
const css=document.createElement('style');css.textContent='#wl108{position:absolute;pointer-events:none;z-index:2;overflow:visible}#wl108 .g108{pointer-events:all;cursor:move}';document.head.append(css);
})();
