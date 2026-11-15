// V108.1 — ✥ MOVER parede (como o MOVE do CAD): digite a distância, clique na parede e depois do lado para onde ela vai.
// Sem distância digitada, vale a distância até o clique. As paredes que chegam nela acompanham (encontros continuam fechados),
// e as pontas dela continuam nos eixos das paredes onde encostavam. Portas e janelas ficam no mesmo lugar da parede.
(function(){
'use strict';
const T56=()=>window.walltool56;if(!T56())return;
const N=Number;
let tool=null,last='';
const pageNo=()=>N($('page').value)||1;
const nm=w=>'Parede '+(state.walls.indexOf(w)+1);
function bar(html){let p=$('mv108');if(!p){p=document.createElement('div');p.id='mv108';p.className='walltool56 noPrint';$('planStatus').after(p);}p.innerHTML=html||'';p.style.display=html?'flex':'none';return p;}
function start(){if(typeof image==='undefined'||!image){alert('Carregue a planta primeiro.');return;}try{(window.stopAll108||window.cancelTool56)?.();}catch{}try{mode='';}catch{}
 tool={W:null,hover:null};document.body.classList.add('tool56','mv108on');ask();drawPlan();}
function ask(){const p=bar('<b>✥ Mover</b><label>Distância <input id="mv108d" type="number" min="0" step="0.5" value="'+last+'" style="width:80px"> cm</label><span id="mv108t">'+(tool?.W?nm(tool.W)+' selecionada: clique do lado para onde ela vai.':'Digite a distância e clique PERTO da parede, do lado para onde ela vai (um clique por parede, como no CYPECAD).')+'</span><button type="button" class="secondary" id="mv108x">Cancelar (Esc)</button>');
 $('mv108x').onclick=stop;const i=$('mv108d');i.oninput=()=>{last=i.value;drawPlan();};i.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();i.blur();}if(e.key==='Escape')stop();};setTimeout(()=>{try{if(!tool?.W)i.focus();i.select();}catch{}},0);}
function stop(){tool=null;document.body.classList.remove('tool56','mv108on');bar('');try{drawPlan();}catch{}}
const dist=()=>{const v=N(String($('mv108d')?.value||last).replace(',','.'));return v>0?v:0;};
function geom(W){const[a,b]=W.line,L=Math.hypot(b.x-a.x,b.y-a.y)||1,u={x:(b.x-a.x)/L,y:(b.y-a.y)/L};return {a,b,L,u,n:{x:-u.y,y:u.x},k:T56().kOf(W)};}
function side(W,P){const g=geom(W);return {s:Math.sign((P.x-g.a.x)*g.n.x+(P.y-g.a.y)*g.n.y)||1,d:Math.abs((P.x-g.a.x)*g.n.x+(P.y-g.a.y)*g.n.y)/g.k};}
function inter(P,v,Q,w){const den=v.x*w.y-v.y*w.x;if(Math.abs(den)<1e-9)return null;const t=((Q.x-P.x)*w.y-(Q.y-P.y)*w.x)/den;return {x:P.x+v.x*t,y:P.y+v.y*t};}
function segDist(P,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/l));return Math.hypot(P.x-a.x-t*dx,P.y-a.y-t*dy);}
function move(W,cm,s){const g=geom(W),D={x:g.n.x*s*cm*g.k,y:g.n.y*s*cm*g.k},reach=N(W.width||14)*g.k*1.2,page=N(W.page||1);
 const others=state.walls.filter(w=>w!==W&&w.line&&N(w.page||1)===page);const changed=[];
 const nA={x:g.a.x+D.x,y:g.a.y+D.y};
 // paredes que chegam nela: a ponta vai para o novo eixo, andando sobre a própria parede
 const ends=[];for(const w of others){const h=geom(w);if(Math.abs(h.u.x*g.u.y-h.u.y*g.u.x)<.2)continue;
  w.line.forEach((p,idx)=>{const off=Math.abs((p.x-g.a.x)*g.n.x+(p.y-g.a.y)*g.n.y),al=(p.x-g.a.x)*g.u.x+(p.y-g.a.y)*g.u.y;if(off<=reach&&al>=-reach&&al<=g.L+reach)ends.push({w,idx,h});});}
 // pontas dela: continuam no eixo da parede onde encostavam
 const own=[0,1].map(idx=>{const p=W.line[idx];let best=null;for(const w of others){const h=geom(w);if(Math.abs(h.u.x*g.u.y-h.u.y*g.u.x)<.2)continue;if(ends.some(e=>e.w===w))continue;const d=segDist(p,h.a,h.b);if(d<=reach&&(!best||d<best.d))best={d,h};}return best;});
 W.line=W.line.map(p=>({x:p.x+D.x,y:p.y+D.y}));
 own.forEach((b,idx)=>{if(!b)return;const P=inter(nA,g.u,b.h.a,b.h.u);if(P&&Math.hypot(P.x-W.line[idx].x,P.y-W.line[idx].y)>.01)T56().setEnd(W,idx,P,g.k);});
 for(const e of ends){const P=inter(e.h.a,e.h.u,nA,g.u);if(!P)continue;const q=e.w.line[e.idx];if(Math.hypot(P.x-q.x,P.y-q.y)<.01)continue;T56().setEnd(e.w,e.idx,P,e.h.k);if(!changed.includes(nm(e.w)))changed.push(nm(e.w));}
 for(const w of [W,...ends.map(e=>e.w)]){try{delete w.locked76;}catch{}}
 const hz=Math.abs(g.u.x)>=Math.abs(g.u.y),dir=hz?((g.n.y*s>0)?'para baixo':'para cima'):((g.n.x*s>0)?'para a direita':'para a esquerda');
 return nm(W)+' movida '+fmt(cm)+' cm '+dir+(changed.length?'; encontros ajustados com '+changed.join(', '):'')+'. Ctrl+Z desfaz.';}
function rawPoint(e){return T56().rawPoint(e);}
// V108.6 — como no CYPECAD: com a distância digitada, UM clique perto da parede move ela para o lado do clique; segue clicando nas outras
function nearW(P){const c=$('plan'),r=c.getBoundingClientRect(),sc=(r.width&&c.width)?r.width/c.width:1,tol=55/sc,p=N($('page')?.value)||1;let best=null,bd=tol;for(const w of state.walls){if(!w.line||N(w.page||1)!==p)continue;const d=segDist(P,w.line[0],w.line[1]);if(d<bd){bd=d;best=w;}}return best;}
function apply(W,P,cm){const sd=side(W,P);const msg=move(W,cm,sd.s);try{window.undo58?.push?.();}catch{}try{renderWalls();}catch{}try{invalidate();}catch{}tool.W=null;tool.hW=null;drawPlan();ask();$('mv108t').textContent='✔ '+msg+(dist()?' Clique perto da próxima parede (o lado do clique é o lado para onde ela vai) ou Esc.':' Clique na próxima parede ou Esc.');$('planStatus').textContent=msg;}
document.addEventListener('click',e=>{if(!tool||e.target!==$('plan'))return;e.stopImmediatePropagation();e.preventDefault();const P=rawPoint(e);
 if(!tool.W){const w=nearW(P);if(!w){$('mv108t').textContent='Nenhuma parede aqui. Clique perto da parede, do lado para onde ela vai.';return;}
  if(dist()>0){apply(w,P,dist());return;}
  tool.W=w;$('mv108t').textContent=nm(w)+' selecionada: clique onde ela deve ficar (sem distância digitada: vai até o clique).';drawPlan();return;}
 const W=tool.W,sd=side(W,P),cm=dist()||Math.round(sd.d);if(!(cm>0)){$('mv108t').textContent='Distância zero: digite a distância ou clique mais longe da parede.';return;}
 apply(W,P,cm);},true);
document.addEventListener('mousemove',e=>{if(!tool||e.target!==$('plan'))return;tool.hover=rawPoint(e);if(!tool.W)tool.hW=dist()>0?nearW(tool.hover):null;drawPlan();});
document.addEventListener('keydown',e=>{if(!tool)return;if(e.key==='Escape'){if(tool.W&&e.target?.id!=='mv108d'){tool.W=null;ask();drawPlan();}else stop();e.preventDefault();}});
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{if(tool?.W||tool?.hW)draw();}catch(er){console.error('V108.1 mover',er);}return r;};}
function draw(){const W=tool.W||tool.hW,c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},g=geom(W),z=(typeof zoom!=='undefined'?zoom:1)||1;ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);
 ctx.strokeStyle='#1769c2';ctx.globalAlpha=.55;ctx.lineWidth=N(W.width||14)*g.k;ctx.beginPath();ctx.moveTo(g.a.x,g.a.y);ctx.lineTo(g.b.x,g.b.y);ctx.stroke();ctx.globalAlpha=1;
 if(tool.hover){const sd=side(W,tool.hover),cm=dist()||Math.round(sd.d),D={x:g.n.x*sd.s*cm*g.k,y:g.n.y*sd.s*cm*g.k};ctx.strokeStyle='#d1462f';ctx.lineWidth=2/z;ctx.setLineDash([8/z,5/z]);ctx.beginPath();ctx.moveTo(g.a.x+D.x,g.a.y+D.y);ctx.lineTo(g.b.x+D.x,g.b.y+D.y);ctx.stroke();ctx.setLineDash([]);
  const m={x:(g.a.x+g.b.x)/2,y:(g.a.y+g.b.y)/2};ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x+D.x,m.y+D.y);ctx.stroke();ctx.fillStyle='#d1462f';ctx.font='bold '+(15/z)+'px Arial';ctx.fillText(fmt(cm)+' cm',m.x+D.x/2+6/z,m.y+D.y/2-6/z);}
 ctx.restore();}
const css=document.createElement('style');css.textContent='#mv108 label{display:flex!important;flex-direction:row!important;align-items:center;gap:6px;margin:0;font-weight:600}#mv108 input{width:80px!important;height:30px;padding:2px 6px;margin:0}body.mv108on #plan{cursor:crosshair}';document.head.append(css);
window.move108={start,stop,move};
})();
