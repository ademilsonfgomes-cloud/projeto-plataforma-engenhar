// V101 — Nova parede como o LINE do AutoCAD (encaixe opcional, orto, comprimento digitado, Enter segue, Esc termina);
// 🧲 Encaixe (liga/desliga a captura de pontos, F3); 🔢 Renumerar (paredes, portas e janelas, vigas, reforços, aberturas da laje).
(function(){
'use strict';
const N=Number;
const msg=t=>{const s=$('planStatus');if(s)s.textContent=t;};
const pg=()=>num($('page').value)||1;
const snapOn=()=>$('snap')?.checked!==false;
function kPage(){if(typeof pxCm==='number'&&pxCm>0)return pxCm;const w=state.walls.find(w=>w.line&&N(w.page||1)===pg()&&N(w.planScale)>0);return w?N(w.planScale):0;}
function rawP(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}

// ---------- 1. Nova parede (LINE)
let T=null,shift=false;
document.addEventListener('keydown',e=>{if(e.key==='Shift')shift=true;});document.addEventListener('keyup',e=>{if(e.key==='Shift')shift=false;});window.addEventListener('blur',()=>{shift=false;});
function start(){if(typeof image==='undefined'||!image){msg('Abra a planta (Arquitetura → 📂 Abrir) antes de desenhar paredes.');return;}if(!(kPage()>0)){msg('Esta planta ainda não tem escala: Arquitetura → 📏 Calibrar escala (dois pontos de uma medida conhecida) e depois Nova parede.');return;}
 try{(window.stopAll108||window.cancelTool56)?.();}catch{}try{window.closePop54?.();}catch{}try{mode='';points=[];}catch{}
 T={pts:[],hover:null,typed:'',w:N(T?.w)||N($('detectWidth')?.value)||14};document.body.classList.add('tool56','wall101');help();drawPlan();}
function help(){msg('✏ Nova parede: clique no início do eixo'+(T?.pts.length?' — agora leve na direção e clique o fim, ou digite o comprimento (cm) + Enter. Cada ponto fecha uma parede e já começa a próxima. Esc termina esta sequência (outro Esc solta a ferramenta).':'. '+(snapOn()?'🧲 Encaixe ligado (quadradinho verde = vértice ou eixo de parede; longe deles o clique é livre).':'🧲 Encaixe desligado (F3 liga).')+' A linha trava na horizontal/vertical; Shift solta. Esc solta a ferramenta.'));}
function stop(){T=null;document.body.classList.remove('tool56','wall101');try{drawPlan();}catch{}}
function cands(){const p=pg(),out=[];try{for(const q of (typeof fixedPoints!=='undefined'&&fixedPoints)||[])out.push(q);}catch{}for(const w of state.walls)if(w.line&&N(w.page||1)===p)out.push(...w.line);if(T)out.push(...T.pts);return out;}
function ortho(P){if(!T?.pts.length||shift)return P;const a=T.pts.at(-1),dx=P.x-a.x,dy=P.y-a.y;return Math.abs(dx)>=Math.abs(dy)?{x:P.x,y:a.y}:{x:a.x,y:P.y};}
// V103.1 — encaixe exato: no vértice; ou no eixo da parede, cruzando a direção travada (a ponta cai exatamente no eixo, para o encontro T/L ser reconhecido)
function axes(){const p=pg(),out=[];for(const w of state.walls){if(!w.line||N(w.page||1)!==p)continue;const[a,c]=w.line,dx=c.x-a.x,dy=c.y-a.y,l=Math.hypot(dx,dy);if(l<1)continue;out.push({w,a,c,u:{x:dx/l,y:dy/l},l,hw:(N(w.width)||14)*kPage()/2});}return out;}
function cross(o,d,ax){const den=d.x*ax.u.y-d.y*ax.u.x;if(Math.abs(den)<.2)return null;const wx=ax.a.x-o.x,wy=ax.a.y-o.y,t=(wx*ax.u.y-wy*ax.u.x)/den,m=(wx*d.y-wy*d.x)/den;if(m<-ax.hw-2||m>ax.l+ax.hw+2)return null;return {x:o.x+d.x*t,y:o.y+d.y*t,t};}
function snapP(P){if(!T)return P;const tol=12/(zoom||1);
 if(snapOn()){let b=null,bd=tol;for(const q of cands()){const d=Math.hypot(q.x-P.x,q.y-P.y);if(d<bd){bd=d;b=q;}}if(b)return {x:b.x,y:b.y,snap:'v'};}
 const Q=ortho(P);if(!snapOn())return Q;const A=axes();
 if(T.pts.length){const a=T.pts.at(-1),dl=Math.hypot(Q.x-a.x,Q.y-a.y);if(dl>1){const d={x:(Q.x-a.x)/dl,y:(Q.y-a.y)/dl};let best=null,bd=tol*1.2;for(const ax of A){const X=cross(a,d,ax);if(!X||X.t<1)continue;const dd=Math.hypot(X.x-Q.x,X.y-Q.y);if(dd<bd){bd=dd;best=X;}}if(best)return {x:best.x,y:best.y,snap:'e'};}return Q;}
 let e=null,ed=tol;for(const ax of A){let t=Math.max(0,Math.min(ax.l,(P.x-ax.a.x)*ax.u.x+(P.y-ax.a.y)*ax.u.y));const X0={x:ax.a.x+ax.u.x*t,y:ax.a.y+ax.u.y*t},d=Math.hypot(X0.x-P.x,X0.y-P.y);if(d<ed){ed=d;
  // no módulo: a distância desde o início da parede vai para o múltiplo de meio bloco + junta mais próximo
  const k=kPage(),M=modulo()*k;if(M>0){const tm=Math.round(t/M)*M;if(tm>0&&tm<ax.l)t=tm;}e={x:ax.a.x+ax.u.x*t,y:ax.a.y+ax.u.y*t,mod:true};}}return e?{x:e.x,y:e.y,snap:'e'}:Q;}
function modulo(){try{const bs=(state.blocks||[]).filter(b=>b.active!==false&&b.type!=='Canaleta');const pr=bs.find(b=>(window.ModEngine?.roleOf?.(b,state.blocks)||b.role)==='Principal')||bs.sort((x,y)=>N(y.length)-N(x.length))[0];return pr?(N(pr.length)+(num($('jv')?.value)||1))/2:0;}catch{return 0;}}
// pontas: se estiverem dentro da espessura de uma parede que cruza, vão exatamente para o eixo dela
function fixEnds(a,P){const dl=Math.hypot(P.x-a.x,P.y-a.y);if(dl<1)return [a,P];const d={x:(P.x-a.x)/dl,y:(P.y-a.y)/dl},A=axes();const fix=(E,o,dir)=>{let best=null,bd=Infinity;for(const ax of A){const X=cross(o,dir,ax);if(!X)continue;const dd=Math.hypot(X.x-E.x,X.y-E.y);if(dd<=ax.hw+2&&dd<bd){bd=dd;best=X;}}return best?{x:best.x,y:best.y}:E;};
 return [fix(a,P,{x:-d.x,y:-d.y}),fix(P,a,d)];}
// parede por cima de outra (mesma linha) não é criada
function overlaps(a,P){const k=kPage(),dl=Math.hypot(P.x-a.x,P.y-a.y),u={x:(P.x-a.x)/dl,y:(P.y-a.y)/dl};for(const ax of axes()){if(Math.abs(u.x*ax.u.y-u.y*ax.u.x)>.05)continue;const off=Math.abs((a.x-ax.a.x)*ax.u.y-(a.y-ax.a.y)*ax.u.x);if(off>ax.hw)continue;const s0=(a.x-ax.a.x)*ax.u.x+(a.y-ax.a.y)*ax.u.y,s1=(P.x-ax.a.x)*ax.u.x+(P.y-ax.a.y)*ax.u.y,lo=Math.max(0,Math.min(s0,s1)),hi=Math.min(ax.l,Math.max(s0,s1));if(hi-lo>10*k)return ax.w;}return null;}
function place(P){if(!T)return;if(!T.pts.length){T.pts.push(P);help();drawPlan();return;}let a=T.pts.at(-1);const k=kPage();[a,P]=fixEnds(a,P);const ov=overlaps(a,P);if(ov){msg('Já existe a Parede '+(state.walls.indexOf(ov)+1)+' nesse lugar — parede por cima de outra não é criada. Escolha outro ponto ou Esc.');return;}T.pts[T.pts.length-1]=a;const L=Math.hypot(P.x-a.x,P.y-a.y)/k;if(L<10){msg('Parede muito curta ('+L.toFixed(0)+' cm). Leve o cursor mais longe ou digite o comprimento.');return;}
 addWall({line:[{x:a.x,y:a.y},{x:P.x,y:P.y}],page:pg(),length:Math.round(L*10)/10,width:T.w,confirmed:true,source:'Desenhada (Nova parede)'});
 // V104 — as paredes em que a nova encosta (T/L) são destravadas, para a próxima modulação refazer a amarração delas
 const un=[];{const nw=state.walls.at(-1);for(const ax of axes()){if(ax.w===nw)continue;for(const E of [a,P]){const t=Math.max(0,Math.min(ax.l,(E.x-ax.a.x)*ax.u.x+(E.y-ax.a.y)*ax.u.y)),d=Math.hypot(ax.a.x+ax.u.x*t-E.x,ax.a.y+ax.u.y*t-E.y);if(d<=ax.hw+2){if(ax.w.locked76){delete ax.w.locked76;}if(!un.includes(ax.w))un.push(ax.w);break;}}}}
 T.un=un;T.pts.push(P);
 msg('✔ Parede '+state.walls.length+' criada: '+(Math.round(L*10)/10).toString().replace('.',',')+' cm'+(T.un?.length?' — encontra a'+(T.un.length>1?'s':'')+' '+T.un.map(w=>'Parede '+(state.walls.indexOf(w)+1)).join(' e ')+' (vão ser refeitas ao gerar)':'')+'. Continue para a próxima (comprimento + Enter ou clique), Esc termina a sequência.');drawPlan();}
document.addEventListener('click',e=>{if(!T||e.target!==$('plan'))return;e.stopImmediatePropagation();e.preventDefault();place(snapP(rawP(e)));},true);
for(const ev of ['pointerdown','mousedown'])document.addEventListener(ev,e=>{if(T&&e.target===$('plan')&&e.button===0)e.stopImmediatePropagation();},true);
document.addEventListener('mousemove',e=>{if(!T||e.target!==$('plan'))return;T.hover=snapP(rawP(e));drawPlan();});
document.addEventListener('keydown',e=>{
 if(e.key==='F3'){e.preventDefault();toggleSnap();return;}
 if(!T||e.target?.closest?.('input,textarea,select'))return;
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(T.pts.length){T.pts=[];T.typed='';help();drawPlan();}else{stop();msg('Nova parede: ferramenta solta.');}return;}
 if(T.pts.length&&/^[0-9]$|^[.,]$/.test(e.key)){T.typed+=e.key===','?'.':e.key;e.preventDefault();drawPlan();return;}
 if(e.key==='Backspace'&&T.typed){T.typed=T.typed.slice(0,-1);e.preventDefault();drawPlan();return;}
 if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();const L=N(T.typed);T.typed='';if(L>0&&T.pts.length&&T.hover){const a=T.pts.at(-1),dx=T.hover.x-a.x,dy=T.hover.y-a.y,d=Math.hypot(dx,dy)||1,k=kPage();place({x:a.x+dx/d*L*k,y:a.y+dy/d*L*k});}else{T.pts=[];help();drawPlan();}}},true);
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{if(T&&typeof image!=='undefined'&&image)draw();}catch(er){console.error('V101 parede',er);}return r;};}
function draw(){const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},z=window.zoom88?.fitZ?.()||zoom||1,k=kPage();ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);
 const H=T.hover,a=T.pts.at(-1);
 if(a&&H){const L=Math.hypot(H.x-a.x,H.y-a.y),ux=(H.x-a.x)/(L||1),uy=(H.y-a.y)/(L||1),hw=T.w*k/2;ctx.fillStyle='rgba(23,74,120,.18)';ctx.beginPath();ctx.moveTo(a.x-uy*hw,a.y+ux*hw);ctx.lineTo(H.x-uy*hw,H.y+ux*hw);ctx.lineTo(H.x+uy*hw,H.y-ux*hw);ctx.lineTo(a.x+uy*hw,a.y-ux*hw);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#174a78';ctx.lineWidth=2/z;ctx.setLineDash([8/z,5/z]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(H.x,H.y);ctx.stroke();ctx.setLineDash([]);
  window.__txtFixed=true;try{ctx.font='bold 13px Arial';ctx.fillStyle='#102e4b';ctx.fillText(T.typed?T.typed.replace('.',',')+' cm ↵':(L/k).toFixed(0)+' cm',H.x+10/z,H.y-10/z);}finally{window.__txtFixed=false;}}
 for(const q of T.pts){ctx.fillStyle='#174a78';ctx.beginPath();ctx.arc(q.x,q.y,3.5/z,0,7);ctx.fill();}
 if(H){ctx.fillStyle=H.snap==='v'?'#16a34a':H.snap==='e'?'#0ea5e9':'#555';const s=(H.snap?10:6)/z;ctx.fillRect(H.x-s/2,H.y-s/2,s,s);}
 ctx.restore();}

// ---------- 2. 🧲 Encaixe
function toggleSnap(){const c=$('snap');if(!c)return;c.checked=!c.checked;try{c.dispatchEvent(new Event('change'));}catch{}msg('🧲 Encaixe '+(c.checked?'LIGADO: os cliques encaixam nos pontos do desenho e nas paredes.':'DESLIGADO: clique livre (F3 liga de novo).'));mark();if(T)help();}
function mark(){const on=snapOn();document.querySelectorAll('#rib85 .tl85[title="Encaixe"]').forEach(b=>b.classList.toggle('off85',!on));const t=$('snap101');if(t){t.classList.toggle('on101',on);t.title='🧲 Encaixe '+(on?'ligado':'desligado')+' (F3)';}}
window.snap101={toggle:toggleSnap,mark};
setInterval(mark,1500);

// ---------- 3. 🔢 Renumerar
const btn=document.createElement('button');btn.type='button';btn.id='renum101';btn.className='secondary noPrint';btn.textContent='🔢 Renumerar';btn.title='Renumerar elementos do nível: de cima para baixo, da esquerda para a direita';
{const g=$('generate');if(g)g.before(btn);}
const pop=document.createElement('div');pop.id='rn101';pop.className='noPrint';pop.hidden=true;document.body.append(pop);
const OPTS=[['paredes','Paredes (P1, P2… · horizontais e depois verticais)'],['vaos','Portas e janelas (P1… / J1…)'],['vigas','Vigas (V1, V2…)'],['ref','Reforços (R1, R2…)'],['ab','Aberturas na laje (A1, A2…)']];
btn.onclick=e=>{e.stopPropagation();if(!pop.hidden){pop.hidden=true;return;}const r=btn.getBoundingClientRect();
 pop.innerHTML='<div class="h101"><b>🔢 Renumerar</b><span>de cima para baixo, da esquerda para a direita · só este nível</span><button type="button" class="x101" title="Fechar">✕</button></div><div class="b101">'+OPTS.map(([k,t])=>'<label><input type="checkbox" data-k="'+k+'" checked> '+t+'</label>').join('')+'<label class="all101"><input type="checkbox" id="rnAll101" checked> Marcar todos</label><div class="a101"><button type="button" id="rnGo101">✔ Renumerar</button></div><p class="n101">Ctrl+Z desfaz.</p></div>';
 pop.style.left=Math.max(8,Math.min(innerWidth-340,r.left))+'px';pop.style.top=(r.bottom+6)+'px';pop.hidden=false;
 pop.querySelector('.x101').onclick=()=>{pop.hidden=true;};
 $('rnAll101').onchange=ev=>pop.querySelectorAll('[data-k]').forEach(c=>c.checked=ev.target.checked);
 $('rnGo101').onclick=()=>{const on=k=>pop.querySelector('[data-k="'+k+'"]')?.checked;const done=[];
  if(on('paredes')&&state.walls.length){try{$('numberWalls').onclick();done.push(state.walls.length+' paredes');}catch(er){console.error(er);}}
  if(on('vaos')){const n=renumOpenings();if(n)done.push(n+' portas/janelas');}
  if(on('vigas')||on('ref')||on('ab')){try{window.renum97?.({V:on('vigas'),R:on('ref'),A:on('ab')});window.loads77?.touch?.();done.push([on('vigas')&&'vigas',on('ref')&&'reforços',on('ab')&&'aberturas da laje'].filter(Boolean).join(', '));}catch(er){console.error(er);}}
  pop.hidden=true;try{renderWalls();drawPlan();}catch{}msg(done.length?'🔢 Renumerado: '+done.join(' · ')+' — de cima para baixo, da esquerda para a direita. Ctrl+Z desfaz.':'Nada para renumerar neste nível.');};};
document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target)&&e.target!==btn)pop.hidden=true;});
function renumOpenings(){const list=[];for(const w of state.walls){if(!w.line)continue;const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y)||1,L=N(w.length)||1;for(const o of w.openings||[]){const s=(N(o.start)+N(o.width)/2)/L;list.push({o,x:a.x+(b.x-a.x)*s,y:a.y+(b.y-a.y)*s,pg:N(w.page||1)});}}
 if(!list.length)return 0;const k=kPage()||1,band=40*k;list.sort((p,q)=>p.pg-q.pg||(Math.abs(p.y-q.y)>band?p.y-q.y:p.x-q.x));
 const isJ=o=>o.type==='Janela'||(o.type!=='Porta'&&N(o.bottom)>0);let nP=0,nJ=0;for(const it of list)it.o.tag58=isJ(it.o)?'J'+(++nJ):'P'+(++nP);
 try{const pr=window.props54raw?.get()||[];for(const p of pr)p.tag58=(p.type==='Janela'?'J'+(++nJ):'P'+(++nP));window.props54raw?.set(pr);}catch{}
 return list.length;}

const css=document.createElement('style');css.textContent=
 'body.wall101 #plan{cursor:crosshair}#renum101{margin:0 6px 0 0;white-space:nowrap}'+
 '#rn101{position:fixed;z-index:72;width:330px;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 12px 30px rgba(16,46,75,.25);font-size:13px}#rn101[hidden]{display:none}'+
 '#rn101 .h101{display:flex;flex-wrap:wrap;align-items:center;gap:2px 8px;padding:8px 10px;background:#eef3f8;border-bottom:1px solid #d5dee7;border-radius:9px 9px 0 0}#rn101 .h101 span{flex:1 1 100%;color:#5b6d7f;font-size:11.5px;order:3}#rn101 .h101 b{flex:1}'+
 '#rn101 .x101{border:1px solid #e3b4ad;background:#fdecea;color:#b42318;font-weight:700;padding:2px 8px;margin:0;border-radius:6px;cursor:pointer}#rn101 .b101{padding:8px 10px}#rn101 label{display:flex;align-items:center;gap:6px;margin:4px 0;cursor:pointer}'+
 '#rn101 input[type=checkbox]{width:auto!important;margin:0!important;display:inline-block!important}#rn101 .all101{border-top:1px solid #e3e9ef;padding-top:6px;margin-top:6px;font-weight:600}#rn101 .a101{display:flex;justify-content:flex-end;margin-top:8px}#rn101 .a101 button{margin:0}#rn101 .n101{color:#5b6d7f;font-size:11px;margin:6px 0 0}';
document.head.append(css);
window.wall101={start,stop,active:()=>!!T};
})();
