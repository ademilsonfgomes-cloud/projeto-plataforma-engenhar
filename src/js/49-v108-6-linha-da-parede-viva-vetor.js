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
function render(){if(!on()||typeof image==='undefined'||!image){sv.innerHTML='';sv.style.display='none';return;}sv.style.display='';
 sv.style.left=cv.offsetLeft+'px';sv.style.top=cv.offsetTop+'px';sv.style.width=cv.style.width;sv.style.height=cv.style.height;sv.setAttribute('viewBox','0 0 '+cv.width+' '+cv.height);
 const O=o(),sc=scale(),p=pg(),sel=window.sel85?.()??-1,pos=colMode()==='pos';let h='';const X=q=>(q.x-O.x).toFixed(2),Y=q=>(q.y-O.y).toFixed(2);
 state.walls.forEach((w,i)=>{if(!w.line||N(w.page||1)!==p)return;const c=colorOf(w),dash=pos&&!okLoc(w.location)?' stroke-dasharray="6 4"':'';
  for(const[a,b]of segs(w))h+='<line x1="'+X(a)+'" y1="'+Y(a)+'" x2="'+X(b)+'" y2="'+Y(b)+'" stroke="'+c+'" stroke-width="'+(i===sel?2.2:1.25)+'" vector-effect="non-scaling-stroke" stroke-linecap="square"'+dash+'/>';});
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
