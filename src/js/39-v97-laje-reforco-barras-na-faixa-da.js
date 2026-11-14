// V97 — Laje: REFORÇO (barras na faixa da parede de cima), VIGA (seção, barras de cima e de baixo, estribos) e ABERTURA na laje
// (escada, alçapão, shaft). Marca início → fim (Enter), como no CAD; aparece na planta, na planta de lajes da prancha e no detalhe.
// Detalhamento para conferência: o dimensionamento é do projetista.
(function(){
'use strict';
const N=Number,L7=()=>window.loads77;if(!L7()?.editCtx)return;
const S=()=>L7().S();const f1=(v,d=1)=>(Number.isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const DIAS=[5,6.3,8,10,12.5,16],KG={5:.154,6.3:.245,8:.395,10:.617,12.5:.963,16:1.578};
const dTxt=d=>'Ø'+f1(d);
const SECS=[[15,20],[15,30],[15,40],[15,50],[20,30],[20,40],[20,50]];
const DEF={kind:'ref',ref:{n:3,d:10,b:14},viga:{b:15,h:40,ni:3,di:10,ns:2,ds:8,de:5,s:15},hole:{use:'Escada'},c:2.5,sl:2};
function cfg(){const s=S();s.el97cfg??=JSON.parse(JSON.stringify(DEF));const c=s.el97cfg;for(const k in DEF)if(c[k]===undefined)c[k]=JSON.parse(JSON.stringify(DEF[k]));return c;}
// quantas barras cabem numa camada: cobrimento + estribo dos dois lados, espaçamento livre ≥ max(2 cm, φ, 1,2·dmáx)
function fit(b,d,c,de){const dc=d/10,free=b-2*(c+(de||0)/10),sl=Math.max(N(cfg().sl)||2,dc);return Math.max(0,Math.floor((free+sl)/(dc+sl)));}
function fitTxt(n,b,d,c,de){const k=fit(b,d,c,de);if(!k)return {ok:false,t:'Não cabe nenhuma barra '+dTxt(d)+' em '+f1(b,0)+' cm.'};if(n<=k)return {ok:true,t:'Cabem até '+k+' barras '+dTxt(d)+' por camada em '+f1(b,0)+' cm.'};if(n<=2*k)return {ok:true,two:true,t:'Cabem '+k+' por camada: '+n+' barras ficam em 2 camadas.'};return {ok:false,t:'Não cabe: no máximo '+(2*k)+' barras '+dTxt(d)+' (2 camadas de '+k+') em '+f1(b,0)+' cm.'};}

// ---------- geometria
const pg=()=>num($('page').value)||1;
const W=it=>(it.pts||[]).map(Q=>window.world74(N(it.page),Q));
// V99 — paredes que apoiam a laje do elemento
let sCache=null;function suppI(it){const key=L7().itemKey(it),tgt=it.tgt||'piso',ck=key+'|'+tgt;if(!sCache){sCache=new Map();setTimeout(()=>{sCache=null;},0);}if(sCache.has(ck))return sCache.get(ck);let I=[];try{const LV=L7().levels(),i=LV.findIndex(l=>l.key===key);if(i>=0)I=(tgt==='cob'?LV[i]:LV[i-1])?.I||[];}catch{}sCache.set(ck,I);return I;}
// V99 — apoio automático nas pontas: parede perpendicular = apoia na espessura toda (até a face de fora);
// parede em continuidade (alinhada) = entra 30 cm sobre a parede
function ends(it,I){const P=W(it);if(it.kind!=='beam'||P.length<2)return P;I=I||suppI(it);if(!I.length)return P;const out=[P[0],P[1]];
 for(const e of [0,1]){const E=P[e],F=P[1-e],l=Math.hypot(E.x-F.x,E.y-F.y)||1,uo={x:(E.x-F.x)/l,y:(E.y-F.y)/l};let best=null;
  for(const x of I){const A=x.g.A,B=x.g.B,uw={x:x.g.u[0],y:x.g.u[1]},nw={x:-uw.y,y:uw.x},cr=Math.abs(uo.x*uw.y-uo.y*uw.x),t=x.t;
   if(cr>.7){const den=uo.x*nw.x+uo.y*nw.y;if(Math.abs(den)<1e-6)continue;const d=((A.x-E.x)*nw.x+(A.y-E.y)*nw.y)/den;if(d<-t/2-3||d>t/2+30)continue;const X={x:E.x+uo.x*d,y:E.y+uo.y*d},mu=(X.x-A.x)*uw.x+(X.y-A.y)*uw.y;if(mu<-t/2-2||mu>x.L+t/2+2)continue;
    const D=d+t/2;if(!best||best.k>0||Math.abs(d)<best.ad)best={k:0,ad:Math.abs(d),Q:{x:E.x+uo.x*D,y:E.y+uo.y*D}};}
   else if(cr<.15){const off=Math.abs((E.x-A.x)*nw.x+(E.y-A.y)*nw.y);if(off>t/2+3)continue;const sA=(A.x-E.x)*uo.x+(A.y-E.y)*uo.y,sB=(B.x-E.x)*uo.x+(B.y-E.y)*uo.y,hi=Math.max(sA,sB),lo=Math.min(sA,sB);if(hi<5||lo>30)continue;
    const D=Math.min(hi,Math.max(0,lo)+30);if(!best)best={k:1,ad:Math.max(0,lo),Q:{x:E.x+uo.x*D,y:E.y+uo.y*D}};}}
  if(best)out[e]=best.Q;}
 return out;}
window.beamEnds97=ends;
const lenOf=it=>{const P=it.kind==='beam'?ends(it):W(it);return P.length>=2?Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y):0;};
// V99 — numeração automática: de cima para baixo, da esquerda para a direita (V, R e A separados, por laje)
function renum(only){const G=new Map();for(const it of S().items){if(it.kind!=='beam'&&it.kind!=='hole')continue;const pre=it.kind==='hole'?'A':it.sub==='viga'?'V':'R';if(only&&!only[pre])continue;const k=L7().itemKey(it)+'|'+(it.tgt||'piso')+'|'+(it.rep102||0)+'|'+pre;if(!G.has(k))G.set(k,[]);G.get(k).push(it);}
 for(const[k,list]of G){const pre=k.split('|').pop(),m=it=>{const P=W(it),n=P.length||1;return {x:P.reduce((a,q)=>a+q.x,0)/n,y:P.reduce((a,q)=>a+q.y,0)/n};};
  list.map(it=>({it,c:m(it)})).sort((a,b)=>Math.abs(a.c.y-b.c.y)>25?b.c.y-a.c.y:a.c.x-b.c.x).forEach((q,i)=>{q.it.name=pre+(i+1);});}}
window.renum97=renum;
const gancho=d=>Math.max(10,d);// cm (≈ 10φ)
function bars(it){const L=lenOf(it),o={L,rows:[]};if(it.kind!=='beam')return o;
 if(it.sub==='ref'){const r=it.ref,C=L+2*gancho(r.d);o.rows.push({pos:'Inferior',n:r.n,d:r.d,C});}
 else{const v=it.viga,C1=L+2*gancho(v.di),C2=L+2*gancho(v.ds),c=N(it.c)||2.5,ne=Math.floor(L/N(v.s))+1,Ce=2*(v.b-2*c)+2*(v.h-2*c)+2*Math.max(5,v.de);
  o.rows.push({pos:'Inferior',n:v.ni,d:v.di,C:C1},{pos:'Superior',n:v.ns,d:v.ds,C:C2},{pos:'Estribo',n:ne,d:v.de,C:Ce,s:v.s});}
 for(const r of o.rows){r.tot=r.n*r.C/100;r.kg=r.tot*(KG[r.d]||0);}o.kg=o.rows.reduce((s,r)=>s+r.kg,0);return o;}
function descr(it){if(it.kind==='hole')return (it.name||'A')+' · Abertura · '+(it.use||'');const v=it.viga,r=it.ref;
 return it.sub==='ref'?(it.name||'R')+' · Reforço '+r.n+' '+dTxt(r.d)+' (faixa '+f1(r.b,0)+' cm)':(it.name||'V')+' · Viga '+f1(v.b,0)+'×'+f1(v.h,0)+' · inf. '+v.ni+' '+dTxt(v.di)+' · sup. '+v.ns+' '+dTxt(v.ds)+' · estr. '+dTxt(v.de)+' c/'+f1(v.s,0);}

// ---------- lista do nível em trabalho
function ctxE(){try{return L7().editCtx();}catch{return null;}}
function mine(){const e=ctxE();if(!e)return [];return S().items.filter(it=>(it.kind==='beam'||it.kind==='hole')&&L7().vis(it,e)&&(it.tgt||'piso')===e.tgt);}
function nextName(pre){const e=ctxE(),used=new Set(S().items.filter(it=>(it.kind==='beam'||it.kind==='hole')&&L7().itemKey(it)===e?.key).map(it=>it.name));let k=1;while(used.has(pre+k))k++;return pre+k;}
const newId=()=>'el-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);

// ---------- ferramenta
let tool=null,pts=[],hover=null,typed='',raf=0,sel=null;
function snapP(P){try{return L7().snapPt(P);}catch{return P;}}
function ortho(P){if(!pts.length||P.snap)return P;const a=pts.at(-1),tol=14/(zoom||1);if(Math.abs(P.x-a.x)<tol)return {x:a.x,y:P.y};if(Math.abs(P.y-a.y)<tol)return {x:P.x,y:a.y};return P;}
function rawPoint(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
// V120 — abertura na laje: retângulo (2 cantos), polígono livre (vértice a vértice) ou circular (centro + raio)
const forma=()=>cfg().hole?.forma||'ret';
function areaPx(P){let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p.x*q.y-q.x*p.y;}return Math.abs(a)/2;}
function cruza(P){const n=P.length,o=(p,q,r)=>Math.sign((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x)),sg=(a,b,c,d)=>o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){if(j===i+1||(i===0&&j===n-1))continue;if(sg(P[i],P[(i+1)%n],P[j],P[(j+1)%n]))return true;}return false;}
function circulo(c,r,n=32){return Array.from({length:n},(_,i)=>({x:c.x+r*Math.cos(2*Math.PI*i/n),y:c.y+r*Math.sin(2*Math.PI*i/n)}));}
function centro(P){let A=0,x=0,y=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length],f=p.x*q.y-q.x*p.y;A+=f;x+=(p.x+q.x)*f;y+=(p.y+q.y)*f;}if(Math.abs(A)<1e-9)return {x:P.reduce((s,p)=>s+p.x,0)/P.length,y:P.reduce((s,p)=>s+p.y,0)/P.length};return {x:x/(3*A),y:y/(3*A)};}
function validaPol(P){if(P.length<3)return 'marque pelo menos 3 pontos';if(cruza(P))return 'os lados se cruzam — refaça o contorno';const k=pxPerCm();if(areaPx(P)/(k*k)<100)return 'abertura muito pequena (menos de 100 cm²)';return '';}
const perto=(P,Q)=>Math.hypot(P.x-Q.x,P.y-Q.y)<=10/(zoom||1);
function fromPg(it,P){return N(it.page)===pg()?{x:P.x,y:P.y}:window.toPage74(N(it.page),window.world74(pg(),P));}
function toPgP(it,P){return N(it.page)===pg()?P:window.toPage74(pg(),window.world74(N(it.page),P));}
function msgHole(){const f=forma();msg97(f==='pol'?'Abertura (polígono): clique nos vértices (encaixa no DXF, paredes e vigas; Shift = ângulo livre). Feche clicando no 1º ponto, Enter ou dois cliques. Backspace desfaz o último ponto; Esc cancela.':f==='circ'?'Abertura circular: clique no centro e depois na borda (ou digite o diâmetro em cm e Enter). Esc solta a ferramenta.':'Abertura (retângulo): clique em dois cantos opostos (encaixa nos vértices). Esc solta a ferramenta.');}
function fechaPol(){const err=validaPol(pts);if(err){msg97('⚠ Não dá para fechar: '+err+'. Backspace desfaz o último ponto; Esc cancela.');drawPlan();return;}finish(pts);}
function start(kind){const e=ctxE();if(!e){alert('Escolha um nível de laje.');return;}if(e.ground){msg97('Este é o piso (sem laje). Vá para um nível de laje (▲) para lançar reforço, viga ou abertura.');return;}
 try{(window.stopAll108||window.cancelTool56)?.();}catch{}try{mode='';}catch{}cfg().kind=kind;tool=kind;pts=[];hover=null;typed='';document.body.classList.add('tool56','el97on');
 if(kind==='hole'){msgHole();drawPlan();return;}msg97((kind==='ref'?'Reforço':'Viga')+': clique no início, depois no fim (ou digite o comprimento em cm e Enter). Encaixa nos vértices das paredes. Esc solta a ferramenta.');drawPlan();}
function stop(){tool=null;pts=[];hover=null;typed='';document.body.classList.remove('tool56','el97on');msg97('');try{drawPlan();}catch{}}
function msg97(t){let p=$('el97bar');if(!p){p=document.createElement('div');p.id='el97bar';p.className='walltool56 noPrint';$('planStatus').after(p);}p.textContent=t||'';p.style.display=t?'flex':'none';}
function finish(list){const e=ctxE(),c=cfg(),k=tool;const it={id:newId(),page:e.pg,tgt:e.tgt,g:0,q:0};if(e.key!==L7().keyOfPage(e.pg))it.slab92=e.key;if(L7().isOwn(e.key,e.tgt,e.rj))it.rep102=e.rj;
 if(k==='hole'){const f=forma();it.kind='hole';it.forma=f;if(f==='pol'){it.pts=list.map(p=>({x:p.x,y:p.y}));}else if(f==='circ'){const[a,b]=list,r=Math.hypot(b.x-a.x,b.y-a.y);if(r/pxPerCm()<2.5){pts=[];drawPlan();return;}it.circ={c:{x:a.x,y:a.y},r};it.pts=circulo(a,r);}else{const[a,b]=list;if(Math.abs(b.x-a.x)<1e-6||Math.abs(b.y-a.y)<1e-6){pts=[];drawPlan();return;}it.pts=[{x:a.x,y:a.y},{x:b.x,y:a.y},{x:b.x,y:b.y},{x:a.x,y:b.y}];}it.use=c.hole.use;it.name=nextName('A');}
 else{it.kind='beam';it.sub=k;it.pts=list.slice(0,2).map(p=>({x:p.x,y:p.y}));it.c=c.c;if(k==='ref'){it.ref={...c.ref};it.name=nextName('R');}else{it.viga={...c.viga};it.name=nextName('V');}}
 if(it.kind==='beam'&&lenOf(it)<5){pts=[];return;}
 S().items.push(it);if(it.kind==='beam')apoiar(it);renum();L7().touch();pts=[];typed='';try{window.undo58?.push?.();}catch{}drawPlan();
 msg97('✔ '+descr(it)+(it.kind==='beam'?' · L = '+f1(lenOf(it),0)+' cm':' · '+f1(areaPx(it.pts)/pxPerCm()**2/1e4,2)+' m²')+'. Continue marcando o próximo (mesmas características) ou Esc para soltar.');if($('el97')&&!$('el97').hidden)render();}
document.addEventListener('click',e=>{const c=$('plan');if(e.target!==c)return;
 if(tool){e.stopImmediatePropagation();e.preventDefault();const P0=snapP(rawPoint(e)),P=e.shiftKey?P0:ortho(P0);
  if(tool==='hole'&&forma()==='pol'){if(pts.length>=3&&perto(P0,pts[0])){fechaPol();return;}if(pts.length&&perto(P,pts.at(-1)))return;pts.push(P);drawPlan();return;}
  if(tool==='hole'&&forma()==='circ'){pts.push(P0);if(pts.length>=2)finish(pts);else drawPlan();return;}
  pts.push(P);if(pts.length>=2)finish(pts);else drawPlan();return;}
 if(document.body.classList.contains('tool56')||document.body.classList.contains('brush97')||(typeof mode!=='undefined'&&mode))return;
 if(!S().cfg.show)return;const it=hit(rawPoint(e));if(it){e.stopImmediatePropagation();e.preventDefault();sel=it.id;open(it);drawPlan();}},true);
document.addEventListener('dblclick',e=>{if(tool==='hole'&&forma()==='pol'&&e.target===$('plan')&&pts.length>=3){e.preventDefault();e.stopImmediatePropagation();fechaPol();}},true);
document.addEventListener('mousemove',e=>{if(!tool||e.target!==$('plan'))return;const H0=snapP(rawPoint(e));hover=e.shiftKey||(tool==='hole'&&forma()==='circ')?H0:ortho(H0);if(!raf)raf=requestAnimationFrame(()=>{raf=0;drawPlan();});});
document.addEventListener('keydown',e=>{if(e.target?.closest?.('input,textarea,select'))return;
 if(!tool){if(e.key==='Escape'&&!box.hidden){box.hidden=true;editing=null;sel=null;drawPlan();e.preventDefault();return;}if((e.key==='Delete'||e.key==='Backspace')&&sel){const it=S().items.find(x=>x.id===sel);if(it){del(it);e.preventDefault();}}return;}
 if(e.key==='Escape'){stop();e.preventDefault();return;}
 if(pts.length&&(tool!=='hole'||forma()==='circ')&&/^[0-9]$|^[.,]$/.test(e.key)){typed+=e.key===','?'.':e.key;e.preventDefault();drawPlan();return;}
 if(e.key==='Backspace'&&typed){typed=typed.slice(0,-1);e.preventDefault();drawPlan();return;}
 if(tool==='hole'&&forma()==='pol'){if(e.key==='Backspace'&&pts.length){pts.pop();e.preventDefault();msgHole();drawPlan();return;}if(e.key==='Enter'){e.preventDefault();fechaPol();return;}}
 if(tool==='hole'&&forma()==='circ'&&e.key==='Enter'&&pts.length){e.preventDefault();const a=pts[0],D=N(typed);if(D>0){const r=D/2*pxPerCm();typed='';finish([a,{x:a.x+r,y:a.y}]);}else if(hover){typed='';finish([a,hover]);}return;}
 if(e.key==='Enter'&&pts.length&&hover){const a=pts[0],dx=hover.x-a.x,dy=hover.y-a.y,d=Math.hypot(dx,dy)||1;let L=N(typed);if(L>0){const k=pxPerCm();pts.push({x:a.x+dx/d*L*k,y:a.y+dy/d*L*k});}else pts.push(hover);typed='';finish(pts);e.preventDefault();}});
function pxPerCm(){const P=pg(),a=window.toPage74(P,{x:0,y:0}),b=window.toPage74(P,{x:100,y:0});return Math.hypot(b.x-a.x,b.y-a.y)/100||1;}
function toPg(it){const p=pg();if(it.kind==='beam')return ends(it).map(E=>window.toPage74(p,E));return (it.pts||[]).map(Q=>N(it.page)===p?Q:window.toPage74(p,window.world74(N(it.page),Q)));}
function segD(P,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/l));return Math.hypot(P.x-a.x-t*dx,P.y-a.y-t*dy);}
function hit(P){const tol=9/(zoom||1),k=pxPerCm();let best=null,bd=Infinity;for(const it of mine()){const Q=toPg(it);let d=Infinity;
  if(it.kind==='beam'){const w=(it.sub==='ref'?it.ref.b:it.viga.b)*k/2;d=Math.max(0,segD(P,Q[0],Q[1])-w);}else{for(let i=0;i<Q.length;i++)d=Math.min(d,segD(P,Q[i],Q[(i+1)%Q.length]));}
  if(d<=tol&&d<bd){bd=d;best=it;}}return best;}
function del(it){const i=S().items.indexOf(it);if(i<0)return;S().items.splice(i,1);renum();L7().touch();sel=null;try{window.undo58?.push?.();}catch{}$('el97')&&($('el97').hidden=true);drawPlan();msg97('');$('planStatus').textContent=(it.name||'Elemento')+' apagado (Ctrl+Z desfaz).';}

// V120 — alças da abertura selecionada: vértices (retângulo mantém os ângulos retos); círculo: centro e borda
const eixos=Q=>Q.length===4&&Q.every((q,i)=>{const r=Q[(i+1)%4];return Math.abs(q.x-r.x)<1e-6||Math.abs(q.y-r.y)<1e-6;});
function alcas(it){if(it.kind==='beam'){const Q=toPg(it);return Q.length>=2?[Q[0],{x:(Q[0].x+Q[1].x)/2,y:(Q[0].y+Q[1].y)/2},Q[1]]:Q;}if(it.forma==='circ'&&it.circ){const c=it.circ.c;return [toPgP(it,c),toPgP(it,{x:c.x+it.circ.r,y:c.y})];}return toPg(it);}
// V122 — apoio gravado: a ponta que chega na parede passa a atravessar até a face de fora (mesma regra do cálculo, V99)
function apoiar(it){if(it.kind!=='beam')return false;try{const P=ends(it);if(P.length<2)return false;const novo=P.map(Q=>window.toPage74(N(it.page),Q)),mud=novo.some((q,i)=>Math.hypot(q.x-it.pts[i].x,q.y-it.pts[i].y)>.01);if(mud)it.pts=novo;return mud;}catch(e){console.error('V122 apoio',e);return false;}}
window.apoiarViga122=apoiar;
let arr97=null;
document.addEventListener('pointerdown',e=>{if(tool||e.button!==0||e.target!==$('plan')||!sel)return;const it=S().items.find(x=>x.id===sel);if(!it||(it.kind!=='hole'&&it.kind!=='beam'))return;
 const P=rawPoint(e),i=alcas(it).findIndex(q=>perto(P,q));if(i<0)return;arr97={it,i,antes:JSON.stringify({pts:it.pts,circ:it.circ}),moveu:false,ult:P};e.stopImmediatePropagation();e.preventDefault();},true);
document.addEventListener('pointermove',e=>{if(!arr97)return;const {it,i}=arr97,P0=snapP(rawPoint(e)),P=fromPg(it,P0);arr97.moveu=true;
 if(it.kind==='beam'){if(i===1){const U=fromPg(it,arr97.ult),dx=P.x-U.x,dy=P.y-U.y;it.pts=it.pts.map(q=>({x:q.x+dx,y:q.y+dy}));arr97.ult=P0;}else{const Q=it.pts.slice();Q[i===0?0:1]={x:P.x,y:P.y};it.pts=Q;}}
 else if(it.forma==='circ'&&it.circ){if(i===0)it.circ.c={x:P.x,y:P.y};else it.circ.r=Math.max(2.5*pxPerCm(),Math.hypot(P.x-it.circ.c.x,P.y-it.circ.c.y));it.pts=circulo(it.circ.c,it.circ.r);}
 else if(it.forma==='ret'||(!it.forma&&eixos(it.pts))){const Q=it.pts.map(q=>({...q})),old=Q[i];for(const j of [(i+1)%4,(i+3)%4]){if(Math.abs(Q[j].y-old.y)<1e-6)Q[j]={x:Q[j].x,y:P.y};else Q[j]={x:P.x,y:Q[j].y};}Q[i]={x:P.x,y:P.y};it.pts=Q;}
 else{const Q=it.pts.slice();Q[i]={x:P.x,y:P.y};it.pts=Q;}
 e.stopImmediatePropagation();if(!raf)raf=requestAnimationFrame(()=>{raf=0;drawPlan();});},true);
document.addEventListener('pointerup',e=>{if(!arr97)return;const a=arr97;arr97=null;e.stopImmediatePropagation();if(!a.moveu)return;const it=a.it;
 const k=pxPerCm();if(it.kind==='beam'){apoiar(it);if(lenOf(it)<5){const o=JSON.parse(a.antes);it.pts=o.pts;msg97('⚠ A viga ficaria curta demais: voltou como estava.');drawPlan();return;}L7().touch();try{window.undo58?.push?.();}catch{}drawPlan();msg97('✔ '+(it.name||'Viga')+' · L = '+f1(lenOf(it),0)+' cm. Ponta que chega na parede atravessa até a face de fora (apoio na espessura toda). Ctrl+Z desfaz.');if($('el97')&&!$('el97').hidden)render();return;}
 if(it.forma!=='circ'&&(cruza(it.pts)||areaPx(it.pts)/k/k<100)){const o=JSON.parse(a.antes);it.pts=o.pts;if(o.circ)it.circ=o.circ;msg97('⚠ Assim os lados se cruzariam (ou a abertura sumiria): o vértice voltou.');drawPlan();return;}
 L7().touch();try{window.undo58?.push?.();}catch{}drawPlan();msg97('✔ '+(it.name||'Abertura')+' ajustada · '+f1(areaPx(it.pts)/k/k/1e4,2)+' m². Ctrl+Z desfaz.');if($('el97')&&!$('el97').hidden)render();},true);

// V125 — UNIR VIGAS (com a ferramenta Unir das paredes): clique numa viga e depois na outra.
//  • alinhadas (mesma direção e eixo): viram UMA viga, de ponta a ponta (mesma seção; folga até 50 cm)
//  • em ângulo: as duas vão até o ponto de encontro dos eixos (até 1 m das pontas)
let unir125=[];
function unirVigas(A,B){const k=pxPerCm();if(A===B)return {ok:false,t:'Clique em duas vigas diferentes.'};if(A.sub!==B.sub)return {ok:false,t:'Não dá para unir '+(A.sub==='ref'?'reforço':'viga')+' com '+(B.sub==='ref'?'reforço':'viga')+'.'};
 const P=toPg(A),Q=toPg(B),uA=(()=>{const l=Math.hypot(P[1].x-P[0].x,P[1].y-P[0].y)||1;return {x:(P[1].x-P[0].x)/l,y:(P[1].y-P[0].y)/l};})(),uB=(()=>{const l=Math.hypot(Q[1].x-Q[0].x,Q[1].y-Q[0].y)||1;return {x:(Q[1].x-Q[0].x)/l,y:(Q[1].y-Q[0].y)/l};})(),cr=Math.abs(uA.x*uB.y-uA.y*uB.x);
 const sec=it=>it.sub==='ref'?[it.ref.b]:[it.viga.b,it.viga.h],bw=it=>(it.sub==='ref'?it.ref.b:it.viga.b);
 if(cr<0.02){// paralelas
  const off=Math.max(...Q.map(q=>Math.abs((q.x-P[0].x)*-uA.y+(q.y-P[0].y)*uA.x)))/k;if(off>Math.max(bw(A),bw(B))/2)return {ok:false,t:'As vigas são paralelas, mas não estão no mesmo eixo ('+f1(off,1)+' cm de distância). Não dá para unir.'};
  if(JSON.stringify(sec(A))!==JSON.stringify(sec(B)))return {ok:false,t:'Seções diferentes ('+sec(A).join('×')+' e '+sec(B).join('×')+'): ajuste uma delas antes de unir.'};
  const t=q=>(q.x-P[0].x)*uA.x+(q.y-P[0].y)*uA.y,tA=[t(P[0]),t(P[1])],tB=Q.map(t),gap=Math.max(0,Math.min(...tB)-Math.max(...tA),Math.min(...tA)-Math.max(...tB))/k;if(gap>50)return {ok:false,t:'As vigas estão a '+f1(gap,0)+' cm uma da outra (máx. 50 cm para unir). Estique uma delas ou lance uma viga nova.'};
  const lo=Math.min(...tA,...tB),hi=Math.max(...tA,...tB),E0={x:P[0].x+uA.x*lo,y:P[0].y+uA.y*lo},E1={x:P[0].x+uA.x*hi,y:P[0].y+uA.y*hi};
  A.pts=[fromPg(A,E0),fromPg(A,E1)];const i=S().items.indexOf(B);if(i>=0)S().items.splice(i,1);apoiar(A);
  return {ok:true,t:'✔ '+(A.name||'Viga')+' e '+(B.name||'viga')+' viraram uma viga só · L = '+f1(lenOf(A),0)+' cm.'};}
 // em ângulo: encontro dos eixos
 const den=uA.x*uB.y-uA.y*uB.x,s=((Q[0].x-P[0].x)*uB.y-(Q[0].y-P[0].y)*uB.x)/den,X={x:P[0].x+uA.x*s,y:P[0].y+uA.y*s};
 const mais=(R)=>Math.hypot(R[0].x-X.x,R[0].y-X.y)<=Math.hypot(R[1].x-X.x,R[1].y-X.y)?0:1,ea=mais(P),eb=mais(Q),da=Math.hypot(P[ea].x-X.x,P[ea].y-X.y)/k,db=Math.hypot(Q[eb].x-X.x,Q[eb].y-X.y)/k;
 if(da>100||db>100)return {ok:false,t:'O encontro dos eixos fica longe das pontas ('+f1(Math.max(da,db),0)+' cm; máx. 100 cm). Não dá para unir.'};
 const pa=A.pts.slice(),pb=B.pts.slice();pa[ea]=fromPg(A,X);pb[eb]=fromPg(B,X);A.pts=pa;B.pts=pb;
 if(lenOf(A)<5||lenOf(B)<5)return {ok:false,t:'Uma das vigas ficaria curta demais.'};
 return {ok:true,t:'✔ '+(A.name||'Viga')+' e '+(B.name||'viga')+' unidas no encontro dos eixos (L = '+f1(lenOf(A),0)+' e '+f1(lenOf(B),0)+' cm).'};}
document.addEventListener('click',e=>{if(window.ferr56!=='join'||e.target!==$('plan')||tool)return;let it=null;try{if(!S().cfg.show)return;it=hit(rawPoint(e));}catch{return;}if(!it||it.kind!=='beam'){if(unir125.length){unir125=[];sel=null;drawPlan();}return;}
 e.stopImmediatePropagation();e.preventDefault();unir125.push(it);sel=it.id;drawPlan();
 if(unir125.length<2){$('planStatus').textContent='Unir: '+(it.name||'viga')+' marcada. Agora clique na outra viga.';return;}
 const [A,B]=unir125;unir125=[];const antes=JSON.stringify(S().items);const r=unirVigas(A,B);
 if(!r.ok){S().items.splice(0,S().items.length,...JSON.parse(antes));$('planStatus').textContent='⚠ '+r.t;sel=null;drawPlan();return;}
 renum();L7().touch();try{window.undo58?.push?.();}catch{}sel=A.id;drawPlan();$('planStatus').textContent=r.t+' Ctrl+Z desfaz.';},true);
window.unirVigas125=unirVigas;

// ---------- desenho na planta
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{if(image&&(S().cfg.show||tool))draw();}catch(e){console.error('V97 planta',e);}return r;};}
function draw(){const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},z=(window.zoom88?.fitZ?.()||zoom||1),k=pxPerCm();ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);const fz=15.12;ctx.font='bold '+fz+'px Arial';
 window.__txtFixed=true;try{
 for(const it of mine()){const Q=toPg(it),on=it.id===sel;
  if(it.kind==='hole'){const poly=()=>{ctx.beginPath();Q.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();};ctx.fillStyle='rgba(255,255,255,.75)';ctx.strokeStyle=on?'#d1462f':'#333';ctx.lineWidth=(on?3:2)/z;poly();ctx.fill();ctx.stroke();
   // X da abertura recortado pelo contorno (vale para qualquer formato)
   {const xs=Q.map(q=>q.x),ys=Q.map(q=>q.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);ctx.save();poly();ctx.clip();ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.moveTo(x1,y0);ctx.lineTo(x0,y1);ctx.lineWidth=1/z;ctx.stroke();ctx.restore();}
   const C=centro(Q);ctx.fillStyle='#222';ctx.textAlign='center';ctx.fillText(it.name+' · '+(it.use||'Abertura'),C.x,C.y-4/z);ctx.textAlign='left';
   if(on){const g=6/z;ctx.fillStyle='#fff';ctx.strokeStyle='#d1462f';ctx.lineWidth=1.6/z;for(const q of alcas(it))  {ctx.fillRect(q.x-g,q.y-g,2*g,2*g);ctx.strokeRect(q.x-g,q.y-g,2*g,2*g);}}
   continue;}
  const[a,b]=Q,dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,ref=it.sub==='ref',bw=(ref?it.ref.b:it.viga.b)*k/2,col=on?'#d1462f':ref?'#c2410c':'#1d4ed8';
  if(ref){ctx.strokeStyle=col;ctx.lineWidth=(on?4:2.6)/z;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}else{ctx.fillStyle='rgba(29,78,216,.12)';ctx.beginPath();ctx.moveTo(a.x+nx*bw,a.y+ny*bw);ctx.lineTo(b.x+nx*bw,b.y+ny*bw);ctx.lineTo(b.x-nx*bw,b.y-ny*bw);ctx.lineTo(a.x-nx*bw,a.y-ny*bw);ctx.closePath();ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=(on?2.6:1.8)/z;ctx.setLineDash(ref?[]:[8/z,4/z]);for(const sg of [1,-1]){ctx.beginPath();ctx.moveTo(a.x+nx*bw*sg,a.y+ny*bw*sg);ctx.lineTo(b.x+nx*bw*sg,b.y+ny*bw*sg);ctx.stroke();}ctx.setLineDash([]);
  }
  let ang=Math.atan2(dy,dx);if(ang>Math.PI/2)ang-=Math.PI;if(ang<-Math.PI/2)ang+=Math.PI;const mx=(a.x+b.x)/2,my=(a.y+b.y)/2,off=(ref?0:bw)+8/z;ctx.save();ctx.translate(mx-Math.sin(ang)*off,my+Math.cos(ang)*off*-1);ctx.rotate(ang);ctx.fillStyle=col;ctx.textAlign='center';
  ctx.fillText(ref?it.name+' · '+it.ref.n+' '+dTxt(it.ref.d):it.name+' '+f1(it.viga.b,0)+'×'+f1(it.viga.h,0)+' · '+it.viga.ni+dTxt(it.viga.di)+' inf · '+it.viga.ns+dTxt(it.viga.ds)+' sup · '+dTxt(it.viga.de)+' c/'+f1(it.viga.s,0),0,0);ctx.restore();ctx.textAlign='left';}
 {const sb=mine().find(x=>x.id===sel&&x.kind==='beam');if(sb&&!tool){const g=6/z;ctx.fillStyle='#fff';ctx.strokeStyle='#d1462f';ctx.lineWidth=1.6/z;alcas(sb).forEach((q,j)=>{if(j===1){ctx.beginPath();ctx.arc(q.x,q.y,g,0,2*Math.PI);ctx.fill();ctx.stroke();}else{ctx.fillRect(q.x-g,q.y-g,2*g,2*g);ctx.strokeRect(q.x-g,q.y-g,2*g,2*g);}});}}
 if(tool){const P=[...pts,...(hover?[hover]:[])];ctx.strokeStyle=tool==='ref'?'#c2410c':tool==='viga'?'#1d4ed8':'#333';ctx.lineWidth=2/z;ctx.setLineDash([6/z,4/z]);
  if(P.length>=2){ctx.beginPath();if(tool==='hole'&&forma()==='pol'){P.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();if(P.length>=3){ctx.beginPath();ctx.moveTo(P.at(-1).x,P.at(-1).y);ctx.lineTo(P[0].x,P[0].y);ctx.globalAlpha=.45;ctx.stroke();ctx.globalAlpha=1;}ctx.beginPath();}else if(tool==='hole'&&forma()==='circ'){const[a,b]=P,r=typed&&N(typed)>0?N(typed)/2*pxPerCm():Math.hypot(b.x-a.x,b.y-a.y);ctx.arc(a.x,a.y,r,0,2*Math.PI);}else if(tool==='hole'){const[a,b]=P;ctx.rect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y));}else{ctx.moveTo(P[0].x,P[0].y);ctx.lineTo(P[1].x,P[1].y);}ctx.stroke();}ctx.setLineDash([]);
  if(tool==='hole'&&forma()==='pol'&&pts.length){const g=5/z;ctx.fillStyle='#333';for(const q of pts)ctx.fillRect(q.x-g/2,q.y-g/2,g,g);if(pts.length>=3){ctx.strokeStyle='#16a34a';ctx.lineWidth=2/z;ctx.strokeRect(pts[0].x-7/z,pts[0].y-7/z,14/z,14/z);}}
  if(hover){ctx.fillStyle=hover.snap?'#16a34a':'#555';const s=(hover.snap?9:5)/z;ctx.fillRect(hover.x-s/2,hover.y-s/2,s,s);
   if(pts.length&&tool!=='hole'){const a=pts[0],L=Math.hypot(hover.x-a.x,hover.y-a.y)/pxPerCm();ctx.fillStyle='#111';ctx.fillText(typed?typed+' cm ↵':f1(L,0)+' cm',hover.x+10/z,hover.y-10/z);}
   if(pts.length&&tool==='hole'){const a=pts[0],k=pxPerCm();ctx.fillStyle='#111';let t;const f=forma();
    if(f==='pol'){const b=pts.at(-1),P2=[...pts,hover];t=f1(Math.hypot(hover.x-b.x,hover.y-b.y)/k,0)+' cm'+(P2.length>=3?' · área '+f1(areaPx(P2)/k/k/1e4,2)+' m²':'');}
    else if(f==='circ'){t='Ø '+(typed?typed+' cm ↵':f1(2*Math.hypot(hover.x-a.x,hover.y-a.y)/k,0)+' cm');}
    else t=f1(Math.abs(hover.x-a.x)/k,0)+' × '+f1(Math.abs(hover.y-a.y)/k,0)+' cm';ctx.fillText(t,hover.x+10/z,hover.y-10/z);}}}
 }finally{window.__txtFixed=false;}ctx.restore();}

// ---------- janelinha
const box=document.createElement('div');box.id='el97';box.className='noPrint';box.hidden=true;document.body.append(box);
let editing=null;
function open(it){editing=it||null;if(it){cfg().kind=it.kind==='hole'?'hole':it.sub;}render();box.hidden=false;}
function opts(list,cur,fmt){return list.map(v=>'<option value="'+v+'"'+(N(v)===N(cur)?' selected':'')+'>'+(fmt?fmt(v):v)+'</option>').join('');}
const nOpts=(cur,max=10)=>opts(Array.from({length:max},(_,i)=>i+1),cur);
function render(){const c=cfg(),it=editing,k=it?(it.kind==='hole'?'hole':it.sub):c.kind,R=it?.ref||c.ref,V=it?.viga||c.viga,H=it||c.hole;const cc=N(it?.c??c.c)||2.5;
 let body='';
 if(k==='ref'){const f=fitTxt(R.n,R.b,R.d,cc,0);body='<div class="g97"><label>Barras<select data-r="n">'+nOpts(R.n,12)+'</select></label><label>Bitola<select data-r="d">'+opts([8,10,12.5],R.d,dTxt)+'</select></label><label>Largura da faixa (cm)<input data-r="b" type="number" step="1" value="'+R.b+'"></label></div>'+
  '<p class="'+(f.ok?'ok97':'bad97')+'">'+esc(f.t)+'</p><p class="n97">A faixa do reforço é a largura da parede de cima (14 cm na parede de 14). Cobrimento '+f1(cc)+' cm; espaçamento livre ≥ '+f1(N(c.sl)||2)+' cm e ≥ φ (NBR 6118).</p>';}
 else if(k==='viga'){const sec=V.custom?null:SECS.find(q=>q[0]===N(V.b)&&q[1]===N(V.h)),fi=fitTxt(V.ni,V.b,V.di,cc,V.de),fs=fitTxt(V.ns,V.b,V.ds,cc,V.de);
  body='<div class="g97"><label>Seção (cm)<select data-v="sec">'+SECS.map(q=>'<option value="'+q.join('x')+'"'+(sec===q?' selected':'')+'>'+q[0]+' × '+q[1]+'</option>').join('')+'<option value="o"'+(sec?'':' selected')+'>outra…</option></select></label>'+(sec?'':'<label>b (cm)<input data-v="b" type="number" step="1" value="'+V.b+'"></label><label>h (cm)<input data-v="h" type="number" step="1" value="'+V.h+'"></label>')+'</div>'+
   '<div class="g97"><label>Embaixo<select data-v="ni">'+nOpts(V.ni)+'</select></label><label>Bitola<select data-v="di">'+opts([8,10,12.5,16],V.di,dTxt)+'</select></label><label>Em cima<select data-v="ns">'+nOpts(V.ns)+'</select></label><label>Bitola<select data-v="ds">'+opts([6.3,8,10,12.5],V.ds,dTxt)+'</select></label></div>'+
   '<div class="g97"><label>Estribo<select data-v="de">'+opts([5,6.3,8],V.de,dTxt)+'</select></label><label>Espaçamento (cm)<select data-v="s">'+opts([7.5,10,12.5,15,20],V.s,v=>'c/ '+f1(N(v),N(v)%1?1:0))+'</select></label></div>'+
   '<p class="'+(fi.ok?'ok97':'bad97')+'">Embaixo: '+esc(fi.t)+'</p><p class="'+(fs.ok?'ok97':'bad97')+'">Em cima: '+esc(fs.t)+'</p>';}
 else{const fm=it?(it.forma||(it.pts?.length===4?'ret':'pol')):forma(),nomeF={ret:'Retângulo',pol:'Polígono',circ:'Circular'};body=(it?'<p class="n97"><b>'+nomeF[fm]+'</b> · área '+f1(areaPx(it.pts||[])/pxPerCm()**2/1e4,2)+' m² · arraste os quadradinhos dos vértices para ajustar'+(fm==='circ'?' (centro move; o da borda muda o raio)':'')+'.</p>':'<div class="seg97 f97">'+[['ret','▭ Retângulo'],['pol','⬠ Polígono'],['circ','◯ Circular']].map(([v,t])=>'<button type="button" data-f="'+v+'" class="'+(fm===v?'on97':'')+'">'+t+'</button>').join('')+'</div>')+'<div class="g97"><label>Uso<select data-h="use">'+['Escada','Alçapão','Shaft','Abertura'].map(u=>'<option'+(u===H.use?' selected':'')+'>'+u+'</option>').join('')+'</select></label></div><p class="n97">'+(it?'':fm==='pol'?'Clique nos vértices e feche no 1º ponto (Enter ou dois cliques). ':fm==='circ'?'Clique no centro e na borda, ou digite o diâmetro. ':'Clique em dois cantos opostos. ')+'A área da abertura sai da laje (sem peso próprio e sem carga).</p>';}
 const L=it?lenOf(it):0;
 box.innerHTML='<div class="h97"><b>'+(it?esc(descr(it).split(' · ')[0])+' · editar':'Reforço · Viga · Abertura na laje')+'</b><span>arraste por aqui</span><button type="button" class="x97" title="Fechar (Esc)">✕</button></div><div class="b97">'+
  (it?'':'<div class="seg97">'+[['ref','Reforço'],['viga','Viga'],['hole','Abertura']].map(([v,t])=>'<button type="button" data-k="'+v+'" class="'+(k===v?'on97':'')+'">'+t+'</button>').join('')+'</div>')+body+
  (it&&it.kind==='beam'?'<p class="n97">Comprimento: '+f1(L,0)+' cm · aço ≈ '+f1(bars(it).kg)+' kg</p>':'')+
  '<div class="a97">'+(it?'<button type="button" data-a="ok">✔ Confirmar</button><button type="button" data-a="del" class="secondary">🗑 Apagar</button>':'<button type="button" data-a="go">✏ Marcar na laje</button>')+'</div></div>';
 box.querySelector('.x97').onclick=()=>{box.hidden=true;editing=null;sel=null;drawPlan();};
 box.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{c.kind=b.dataset.k;render();if(tool)start(c.kind);});
 const tgtR=it?.ref||c.ref,tgtV=it?.viga||c.viga,tgtH=it||c.hole;
 box.querySelectorAll('[data-r]').forEach(i=>i.onchange=()=>{tgtR[i.dataset.r]=N(String(i.value).replace(',','.'))||tgtR[i.dataset.r];if(it)L7().touch();render();drawPlan();});
 box.querySelectorAll('[data-v]').forEach(i=>i.onchange=()=>{const f=i.dataset.v;if(f==='sec'){if(i.value!=='o'){const[b,h]=i.value.split('x').map(N);tgtV.b=b;tgtV.h=h;tgtV.custom=0;}else tgtV.custom=1;}else tgtV[f]=N(String(i.value).replace(',','.'))||tgtV[f];if(it)L7().touch();render();drawPlan();});
 box.querySelectorAll('[data-h]').forEach(i=>i.onchange=()=>{if(it)it.use=i.value;else c.hole.use=i.value;render();drawPlan();});
 box.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{c.hole.forma=b.dataset.f;if(tool==='hole'){pts=[];typed='';msgHole();}render();drawPlan();});
 box.querySelector('[data-a=go]')?.addEventListener('click',()=>start(c.kind));
 box.querySelector('[data-a=ok]')?.addEventListener('click',()=>{if(it){c.kind=it.kind==='hole'?'hole':it.sub;if(it.ref)c.ref={...it.ref};if(it.viga)c.viga={...it.viga};}box.hidden=true;editing=null;sel=null;L7().touch();try{window.undo58?.push?.();}catch{}drawPlan();});
 box.querySelector('[data-a=del]')?.addEventListener('click',()=>{if(it)del(it);editing=null;});
 drag();}
let dg=null;function drag(){const h=box.querySelector('.h97');h.onpointerdown=e=>{if(e.target.closest('button'))return;const r=box.getBoundingClientRect();dg={dx:e.clientX-r.left,dy:e.clientY-r.top};try{h.setPointerCapture(e.pointerId);}catch{}e.preventDefault();};h.onpointermove=e=>{if(!dg)return;box.style.left=Math.max(0,Math.min(innerWidth-120,e.clientX-dg.dx))+'px';box.style.top=Math.max(40,Math.min(innerHeight-60,e.clientY-dg.dy))+'px';box.style.right='auto';};h.onpointerup=()=>{dg=null;};}
const stopP=e=>e.stopPropagation();box.addEventListener('pointerdown',stopP);box.addEventListener('click',stopP);

// ---------- prancha: na planta de lajes + detalhe
// cota da posição: do eixo do reforço / viga até o eixo das paredes paralelas mais próximas (uma de cada lado)
function dimsOf(it,I){const P=ends(it,I);if(P.length<2||!I?.length)return [];const A=P[0],B=P[1],L=Math.hypot(B.x-A.x,B.y-A.y)||1,u={x:(B.x-A.x)/L,y:(B.y-A.y)/L},n={x:-u.y,y:u.x},best={p:null,m:null};
 for(const x of I){const a=x.g.A,b=x.g.B,uw={x:x.g.u[0],y:x.g.u[1]};if(Math.abs(u.x*uw.y-u.y*uw.x)>.08)continue;const d=((a.x+b.x)/2-A.x)*n.x+((a.y+b.y)/2-A.y)*n.y;if(Math.abs(d)<8)continue;
  const sa=(a.x-A.x)*u.x+(a.y-A.y)*u.y,sb=(b.x-A.x)*u.x+(b.y-A.y)*u.y,lo=Math.max(0,Math.min(sa,sb)),hi=Math.min(L,Math.max(sa,sb));if(hi-lo<10)continue;const k=d>0?'p':'m';if(!best[k]||Math.abs(d)<Math.abs(best[k].d))best[k]={d,lo,hi};}
 return ['p','m'].filter(k=>best[k]).map(k=>{const q=best[k],s0=q.lo+Math.min(60,(q.hi-q.lo)*.25),E={x:A.x+u.x*s0,y:A.y+u.y*s0};return {E,F:{x:E.x+n.x*q.d,y:E.y+n.y*q.d},v:Math.abs(q.d)};});}
function dimSVG(E,F,v,T,fs,r1){const e=T(E),f=T(F),dx=f[0]-e[0],dy=f[1]-e[1],l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,t=fs*.35,sl=(p)=>`M${r1(p[0]-(ux+uy)*t)} ${r1(p[1]-(uy-ux)*t)}L${r1(p[0]+(ux+uy)*t)} ${r1(p[1]+(uy-ux)*t)}`;
 let ang=Math.atan2(dy,dx)*180/Math.PI;if(ang>90)ang-=180;if(ang<=-90)ang+=180;const ra=ang*Math.PI/180,mx=(e[0]+f[0])/2+Math.sin(ra)*fs*.35,my=(e[1]+f[1])/2-Math.cos(ra)*fs*.35;
 return `<path d="M${r1(e[0])} ${r1(e[1])}L${r1(f[0])} ${r1(f[1])}${sl(e)}${sl(f)}" stroke="#333" stroke-width="${r1(fs*.06)}" fill="none"/><text x="${r1(mx)}" y="${r1(my)}" transform="rotate(${r1(ang)} ${r1(mx)} ${r1(my)})" font-size="${r1(fs*.75)}" text-anchor="middle" fill="#333">${f1(v,0)}</text>`;}
window.slabSvg97=function(its,T,fs,r1,labels,I){let s='';const taken=(labels||[]).slice();
 for(const it of its||[]){if(it.kind!=='beam'&&it.kind!=='hole')continue;const P=(it.kind==='beam'?ends(it,I):W(it)).map(T);
 if(it.kind==='hole'){const pts=P.map(p=>p.map(r1).join(',')).join(' '),xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),C=centro(P.map(p=>({x:p[0],y:p[1]}))),cid='hc'+String(it.id||it.name).replace(/[^\w-]/g,'');
  s+=`<clipPath id="${cid}"><polygon points="${pts}"/></clipPath><polygon points="${pts}" fill="#fff" stroke="#222" stroke-width="${r1(fs*.1)}"/><path clip-path="url(#${cid})" d="M${r1(x0)} ${r1(y0)}L${r1(x1)} ${r1(y1)}M${r1(x1)} ${r1(y0)}L${r1(x0)} ${r1(y1)}" stroke="#222" stroke-width="${r1(fs*.06)}"/><text x="${r1(C.x)}" y="${r1(C.y-fs*.4)}" font-size="${r1(fs*.9)}" text-anchor="middle" font-weight="700" fill="#222">${esc(it.name+' · '+(it.use||''))}</text>`;continue;}
 const ref=it.sub==='ref',bw=(ref?it.ref.b:it.viga.b)/2,[a,b]=P,dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,col=ref?'#c2410c':'#1d4ed8';
 const poly=[[a[0]+nx*bw,a[1]+ny*bw],[b[0]+nx*bw,b[1]+ny*bw],[b[0]-nx*bw,b[1]-ny*bw],[a[0]-nx*bw,a[1]-ny*bw]];
 s+=`<polygon points="${poly.map(p=>p.map(r1).join(',')).join(' ')}" fill="${ref?'#fde3d0':'#dbe6fb'}" stroke="${col}" stroke-width="${r1(fs*.09)}"${ref?'':` stroke-dasharray="${r1(fs*.5)} ${r1(fs*.25)}"`}/>`;
 for(const D of dimsOf(it,I))s+=dimSVG(D.E,D.F,D.v,T,fs,r1);
 // rótulo: no ponto da linha mais longe dos nomes das lajes e dos outros rótulos
 let ang=Math.atan2(dy,dx)*180/Math.PI;if(ang>90)ang-=180;if(ang<-90)ang+=180;const ra=ang*Math.PI/180,o=bw+fs*1.1;let bt=.5,bv=-1;
 for(const t of [.5,.42,.58,.35,.65,.3,.7]){const X=a[0]+dx*t+Math.sin(ra)*o,Y=a[1]+dy*t-Math.cos(ra)*o,m=taken.reduce((v,q)=>Math.min(v,Math.hypot(q[0]-X,q[1]-Y)),Infinity);if(m>bv+fs*.5){bv=m;bt=t;}}
 const tx=a[0]+dx*bt+Math.sin(ra)*o,ty=a[1]+dy*bt-Math.cos(ra)*o;taken.push([tx,ty]);
 s+=`<text x="${r1(tx)}" y="${r1(ty)}" transform="rotate(${r1(ang)} ${r1(tx)} ${r1(ty)})" font-size="${r1(fs*.9)}" text-anchor="middle" font-weight="700" fill="${col}">${esc(ref?it.name+' · '+it.ref.n+' '+dTxt(it.ref.d):it.name+' '+f1(it.viga.b,0)+'×'+f1(it.viga.h,0))}</text>`;}return s;};
// altura da laje no meio do reforço (TR8 = 12, maciça = h…)
const TRH={tr8:12,tr12:16,tr16:20,tr20:25};
function slabH(it,ctx){try{const P=W(it),M={x:(P[0].x+P[1].x)/2,y:(P[0].y+P[1].y)/2};let c=ctx.cell(M),cp=c>=0?ctx.comp[c]:-1;if(cp<0){for(const t of [.3,.7,.15,.85]){const Q={x:P[0].x+(P[1].x-P[0].x)*t,y:P[0].y+(P[1].y-P[0].y)*t};c=ctx.cell(Q);cp=c>=0?ctx.comp[c]:-1;if(cp>=0)break;}}const p=ctx.propOf(cp);return TRH[p.type]||N(p.h)||12;}catch{return 12;}}
function secSVG(it,hs){const ref=it.sub==='ref',b=ref?N(it.ref.b):N(it.viga.b),h=ref?(N(hs)||12):N(it.viga.h),c=N(it.c)||2.5,k=1.4,pl=9,pt=4,Wd=b*k+pl+36,Hd=h*k+pt+11,X=v=>pl+v*k,Y=v=>pt+v*k;let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${Hd}" width="${Wd}mm" height="${Hd}mm" font-family="Arial"><rect x="${X(0)}" y="${Y(0)}" width="${b*k}" height="${h*k}" fill="${ref?'#f3f4f6':'#eef2f7'}" stroke="#111" stroke-width=".35"/>`;
 const row=(n,d,y,de)=>{const r=Math.max(.5,d/20*k),x0=c+(de||0)/10+d/20,x1=b-x0;let o='';const per=Math.max(1,fit(b,d,c,de||0)),k2=Math.min(n,per);for(let i=0;i<k2;i++){const x=k2===1?b/2:x0+(x1-x0)*i/(k2-1);o+=`<circle cx="${X(x)}" cy="${y}" r="${r}" fill="#111"/>`;}if(n>per){const k3=n-per;for(let i=0;i<k3;i++){const x=k3===1?b/2:x0+(x1-x0)*i/(k3-1);o+=`<circle cx="${X(x)}" cy="${y+(y>Y(h/2)?-1:1)*(2*r+2*k)}" r="${r}" fill="#111"/>`;}}return o;};
 const BR=bars(it).rows,Ct=pos=>{const r=BR.find(q=>q.pos===pos);return r?' · C='+f1(r.C,0):'';};
 if(ref){s+=row(it.ref.n,it.ref.d,Y(h-c-it.ref.d/20));s+=`<text x="${X(b)+3}" y="${Y(h)-1}" font-size="2.4">${it.ref.n} ${dTxt(it.ref.d)}${Ct('Inferior')}</text>`;}
 else{const v=it.viga,e=v.de/10;s+=`<rect x="${X(c)}" y="${Y(c)}" width="${(b-2*c)*k}" height="${(h-2*c)*k}" fill="none" stroke="#111" stroke-width="${Math.max(.3,e*k*.6)}" rx="1"/>`;s+=row(v.ni,v.di,Y(h-c-e-v.di/20),v.de)+row(v.ns,v.ds,Y(c+e+v.ds/20),v.de);
  s+=`<text x="${X(b)+3}" y="${Y(c)+3}" font-size="2.4">${v.ns} ${dTxt(v.ds)}${Ct('Superior')}</text><text x="${X(b)+3}" y="${Y(h-c)}" font-size="2.4">${v.ni} ${dTxt(v.di)}${Ct('Inferior')}</text><text x="${X(b)+3}" y="${Y(h/2)+1}" font-size="2.2">${dTxt(v.de)} c/${f1(v.s,0)}</text>`;}
 // cotas: largura embaixo, altura à esquerda
 const t=.8,yb=Y(h)+4,xl=X(0)-4,tk=(x,y)=>`M${x-t} ${y+t}L${x+t} ${y-t}`;
 s+=`<path d="M${X(0)} ${yb}H${X(b)}${tk(X(0),yb)}${tk(X(b),yb)}M${X(0)} ${Y(h)+1}V${yb+1}M${X(b)} ${Y(h)+1}V${yb+1}" stroke="#333" stroke-width=".2" fill="none"/><text x="${X(b/2)}" y="${yb+3.4}" font-size="2.6" text-anchor="middle">${f1(b,0)}</text>`;
 s+=`<path d="M${xl} ${Y(0)}V${Y(h)}${tk(xl,Y(0))}${tk(xl,Y(h))}M${X(0)-1} ${Y(0)}H${xl-1}M${X(0)-1} ${Y(h)}H${xl-1}" stroke="#333" stroke-width=".2" fill="none"/><text x="${xl-1.2}" y="${Y(h/2)}" font-size="2.6" text-anchor="middle" transform="rotate(-90 ${xl-1.2} ${Y(h/2)})">${f1(h,0)}</text></svg>`;return s;}
function slabGroups(){let R;try{R=L7().compute({});}catch{return [];}const LV=R.LV||[];if(!LV.length)return [];const top=LV.length-1,G=new Map();
 for(const it of S().items){if(it.kind!=='beam'&&it.kind!=='hole')continue;const key=L7().itemKey(it),tgt=it.tgt||'piso',idx=LV.findIndex(l=>l.key===key);if(idx<0)continue;const j=it.rep102||0,id=key+'|'+tgt+'|'+j;
  if(!G.has(id)){const sl=(R.slabs||[]).find(q=>j?q.own===j&&q.lvl===idx:tgt==='cob'?q.kind==='cob':tgt==='tipo'?q.kind==='tipo'&&!q.own:q.kind==='piso'&&q.lvl===idx&&!q.times);const base=tgt==='cob'?L7().roofName(LV[idx]):tgt==='tipo'?'Laje do tipo':L7().slabName(key);let nm=sl?.name||(base+(j?' — '+j+'º pavimento (laje própria)':''));if(!j&&tgt==='piso'){const rb=(R.slabs||[]).find(q=>q.sup===idx&&q.times&&!q.own);if(rb)nm+=' · '+rb.name;}G.set(id,{name:nm,lv:tgt==='cob'||tgt==='tipo'||j?idx:Math.max(0,idx-1),its:[],ctx:sl?.ctx||null});}G.get(id).its.push(it);}
 for(const g of G.values())g.its.sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt',{numeric:true}));return [...G.values()];}
function detailHTML(g){const bs=g.its.filter(i=>i.kind==='beam'),hs=g.its.filter(i=>i.kind==='hole');let h='';
 if(bs.length){h+='<div class="d97">'+bs.map(it=>'<div class="d97i"><b>'+(it.sub==='ref'?'Reforço '+esc(it.name):'Viga '+esc(it.name)+' '+f1(it.viga.b,0)+'x'+f1(it.viga.h,0))+'</b><br>'+secSVG(it,g.ctx?slabH(it,g.ctx):12)+'</div>').join('')+'</div>';
  const rows=[];let tot={};for(const it of bs){const B=bars(it);B.rows.forEach((r,i)=>{rows.push([i?'':it.name+(it.sub==='ref'?' (reforço)':' '+f1(it.viga.b,0)+'×'+f1(it.viga.h,0)),i?'':f1(B.L,0),r.pos+(r.s?' c/'+f1(r.s,0):''),r.n,dTxt(r.d),f1(r.C,0),f1(r.tot,2),f1(r.kg,1)]);tot[r.d]=(tot[r.d]||0)+r.kg;});}
  h+=plotTable26(['Elemento','L (cm)','Posição','Qtde.','Bitola','C unit. (cm)','Total (m)','Peso (kg)'],rows)+'<p>Aço CA-50 (CA-60 no Ø5,0). Comprimentos das barras = vão + ganchos de 10φ (mín. 10 cm) nas duas pontas; estribos fechados com ganchos. Peso total: '+Object.entries(tot).sort((a,b)=>a[0]-b[0]).map(([d,k])=>dTxt(N(d))+' '+f1(k,1)+' kg').join(' · ')+'. Detalhamento para conferência do projetista.</p>';}
 if(hs.length)h+='<h3>Aberturas na laje</h3>'+plotTable26(['Abertura','Uso','Dimensões (cm)'],hs.map(it=>{const P=W(it),xs=P.map(q=>q.x),ys=P.map(q=>q.y),dx=Math.max(...xs)-Math.min(...xs),dy=Math.max(...ys)-Math.min(...ys),fm=it.forma||(P.length===4?'ret':'pol');return [it.name,it.use||'',fm==='circ'?'Ø '+f1(dx,0):fm==='ret'?f1(dx,0)+' × '+f1(dy,0):'polígono de '+P.length+' lados · área '+f1(areaPx(P)/1e4,2)+' m² · total '+f1(dx,0)+' × '+f1(dy,0)];}))+'<p>Bordas das aberturas com reforço conforme o detalhe da laje.</p>';
 return h;}
{const cp=collectPlot26;collectPlot26=function(...a){const d=cp.apply(this,a);try{for(const g of slabGroups()){const html=detailHTML(g),Wd=Math.min(d.availW,260),h=measureHTML26(html,Wd-4)+13;if(h<=d.availH)d.items.push({title:'Vigas, reforços e aberturas · '+g.name,w:Wd,h,html,lv77:g.lv,el97:true});else if(Array.isArray(d.issues))d.issues.push('Vigas, reforços e aberturas · '+g.name+': o detalhamento não cabe numa folha — use folha maior ou escala menor.');}}catch(e){console.error('V97 prancha',e);}return d;};}
window.el97={open:()=>{editing=null;render();box.hidden=false;},start,stop,bars,fit,list:mine,secSVG,detailHTML,slabGroups};
const css=document.createElement('style');css.textContent=
 '#el97{position:fixed;top:130px;right:24px;width:360px;max-height:calc(100vh - 170px);overflow:auto;z-index:63;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 10px 28px rgba(16,46,75,.22);font-size:12.5px}#el97[hidden]{display:none}'+
 '#el97 .h97{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#eef3f8;border-bottom:1px solid #d5dee7;cursor:move;user-select:none}#el97 .h97 span{color:#8a9aaa;font-size:11px;flex:1}#el97 .x97{border:1px solid #e3b4ad;background:#fdecea;color:#b42318;font-size:15px;font-weight:700;line-height:1;cursor:pointer;margin:0;padding:3px 8px;border-radius:6px}#el97 .x97:hover{background:#b42318;color:#fff}'+
 '#el97 .b97{padding:8px 10px}#el97 .seg97{display:flex;gap:4px;margin-bottom:8px}#el97 .seg97 button{flex:1;margin:0;background:#eef3f8;color:#174a78;border:1px solid #c9d4df}#el97 .seg97 button.on97{background:#174a78;color:#fff}'+
 '#el97 .g97{display:flex;flex-wrap:wrap;gap:6px 10px;margin:4px 0}#el97 .g97 label{display:flex;flex-direction:column;font-size:11px;color:#40566b}#el97 .g97 select,#el97 .g97 input{margin:0;width:auto;min-width:70px;max-width:120px}'+
 '#el97 .ok97{color:#166534;margin:4px 0}#el97 .bad97{color:#b42318;font-weight:600;margin:4px 0}#el97 .n97{color:#5b6d7f;font-size:11px;margin:4px 0}#el97 .a97{display:flex;gap:6px;margin-top:8px}#el97 .a97 button{margin:0}'+
 'body.el97on #plan{cursor:crosshair}.d97{display:flex;flex-wrap:wrap;gap:4mm;margin:2mm 0}.d97i{font-size:3mm;text-align:center}';
document.head.append(css);
})();
