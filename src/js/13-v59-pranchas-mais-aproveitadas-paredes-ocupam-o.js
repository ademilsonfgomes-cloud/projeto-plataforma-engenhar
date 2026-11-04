// V59 — pranchas mais aproveitadas: paredes ocupam o espaço livre das folhas (inclusive junto das plantas de fiada)
// e cada parede pode ser montada em pé (fiadas abaixo da elevação) ou deitada (fiadas ao lado da elevação).
(function(){
'use strict';
const num59=v=>parseFloat(v)||0;
function sideVariant(it,scale){
 const box=document.createElement('div');box.innerHTML=it.html;const stack=box.querySelector('.plotWallStack28');if(!stack)return null;
 const kids=[...stack.children];const top=kids.find(k=>k.tagName==='DIV'&&k.style.display==='flex');const courses=kids.filter(k=>k.tagName==='DIV'&&k!==top&&/fiada/i.test(k.querySelector('h4')?.textContent||''));
 if(!top||!courses.length)return null;const tv=[...top.children];if(tv.length<1)return null;
 const sw=el=>num59(el.querySelector('svg')?.getAttribute('width'));
 const topW=tv.reduce((s,d)=>s+sw(d),0)+4*(tv.length-1),cW=Math.max(...courses.map(sw));
 courses.forEach((c,n)=>{c.style.marginTop=n?'1mm':'0';});
 const html='<div class="plotWallStack28 side59" style="display:flex;gap:4mm;align-items:flex-start">'+tv.map(d=>d.outerHTML).join('')+'<div class="side59courses">'+courses.map(c=>c.outerHTML).join('')+'</div></div>';
 const w=topW+4+cW+(it.w-Math.max(topW,cW))+.5;
 const h=measureHTML26('<div class="plotSheet26" style="outline:none"><div class="plotItem26" style="position:relative;width:100%"><h3 class="plotItemTitle26">'+esc(it.title)+'</h3><p class="drawingScale29">Escala 1:'+scale+'</p>'+html+'</div></div>',w)+1;
 return {w,h,html,contents27:it.contents27};}
const collect59=collectPlot26;
const SIDE59=false; // fiadas sempre embaixo da elevação (pedido do usuário)
collectPlot26=function(...a){const res=collect59.apply(this,a);try{for(const it of res.items){const m=(it.title||'').match(/^Parede (\d+)/);if(!m||it.lvl58)continue;const w=state.walls[Number(m[1])-1];if(!w||!window.levelTag53)continue;it.title+=levelTag53(w.page||1);it.lvl58=true;}}catch(e){console.error(e);}if(!SIDE59)return res;try{const scale=plotSettings26().scale;for(const it of res.items){if(!/^Parede \d+/.test(it.title||'')||!it.html||it.alt59)continue;const v=sideVariant(it,scale);if(v&&v.w*v.h<it.w*it.h*1.15)it.alt59=v;}}catch(e){console.error('pranchas V59',e);}return res;};
const basePack59=packPlot29;
function greedy59(items,width,height,pick){
 const gap=3,sheets=[];
 const isWall=q=>/^Parede /.test(q.title),isPlan=q=>/fiada · planta/.test(q.title);
 const order=[...items.filter(isPlan),...items.filter(isWall),...items.filter(q=>!isWall(q)&&!isPlan(q))];
 const fits=v=>v.w<=width+.01&&v.h<=height+.01;
 const free=(sh,x,y,w,h)=>x+w<=width+10+.01&&y+h<=height+10+.01&&!sh.items.some(i=>x<i.x+i.w+gap&&x+w+gap>i.x&&y<i.y+i.h+gap&&y+h+gap>i.y);
 const spot=(sh,w,h)=>{const ys=[...new Set([10,...sh.items.map(i=>i.y+i.h+gap)])].sort((p,q)=>p-q),xs=[...new Set([10,...sh.items.map(i=>i.x+i.w+gap)])].sort((p,q)=>p-q);for(const y of ys)for(const x of xs)if(free(sh,x,y,w,h))return {x,y};return null;};
 for(const q of order){const base={...q};delete base.alt59;const side=q.alt59?{...base,...q.alt59}:null;
  let vars=(pick==='stack'?[base]:pick==='side'?[side||base]:[base,side]).filter(v=>v&&fits(v));if(!vars.length)vars=[base,side].filter(v=>v&&fits(v));
  if(!vars.length)throw Error('Quadro maior que a área útil da folha.');
  let best=null;const sh=sheets.at(-1);
  if(sh)for(const v of vars){const s=spot(sh,v.w,v.h);if(!s)continue;const score=s.y*100000+s.x+(v.w*v.h)/1e6;if(!best||score<best.score)best={v,s,score};}
  if(best){sh.items.push({...best.v,x:best.s.x,y:best.s.y});continue;}
  const v=vars.slice().sort((p,r)=>p.h-r.h||p.w*p.h-r.w*r.h)[0];sheets.push({items:[{...v,x:10,y:10}]});}
 return sheets;}
packPlot29=function(items,width,height){
 const tries=[];for(const pick of ['mix','side','stack']){try{tries.push(greedy59(items,width,height,pick));}catch(e){}}
 try{tries.push(basePack59(items.map(q=>{const c={...q};delete c.alt59;return c;}),width,height));}catch(e){}
 if(!tries.length)return basePack59(items,width,height);
 // menos folhas; empate: última folha mais vazia (sobra espaço para o resto)
 const used=sh=>sh.items.reduce((s,i)=>s+i.w*i.h,0);
 tries.sort((a,b)=>a.length-b.length||used(a.at(-1))-used(b.at(-1)));
 return tries[0];};
const css=document.createElement('style');css.textContent='.side59courses{display:flex;flex-direction:column}';document.head.append(css);
})();
