// V107 — organizar as pranchas (como no Eberick): você escolhe os quadros de cada folha (mover para a folha nº…),
// e “Organizar esta folha” arruma os quadros em linhas, na ordem da numeração (1, 2, 3…), pulando para o próximo que couber
// quando um não cabe na sobra da linha. “Organizar e completar” ainda puxa quadros da folha seguinte para os espaços vazios.
(function(){
'use strict';
if(typeof plotPositionFree33!=='function'||typeof previewPlot26!=='function')return;
const GAP=3;
// ordem = a da montagem das pranchas (cargas → cada pavimento: fiadas → paredes 1, 2, 3… → lajes…)
const cmp=(a,b)=>(a.ord107??1e9)-(b.ord107??1e9)||String(a.title||'').localeCompare(String(b.title||''),'pt',{numeric:true});
const lvOf=q=>q.lv77??q.lv103??null;
function stamp(){let k=0;for(const s of plotSheets26)for(const q of s.items)if(q.ord107==null)q.ord107=k++;else k=Math.max(k,q.ord107+1);}
// V107.2 — guarda a organização das folhas (no projeto) e, ao Montar / atualizar, mantém cada quadro que não mudou
// no mesmo lugar; só os quadros novos ou que mudaram de tamanho são encaixados (no espaço livre mais próximo da folha
// em que deveriam estar, ou numa folha nova logo depois).
const LS107=()=>{try{const S=window.loads77?.S?.();if(S)return S;}catch{}return (state.plot107s??={});};
const keysOf=items=>{const c=new Map();return items.map(q=>{const t=String(q.title||'');const n=(c.get(t)||0)+1;c.set(t,n);return t+'#'+n;});};
let fresh107=false,restoring=false;
function saveLayout(){if(restoring||!plotSheets26.length)return;const all=plotSheets26.flatMap((s,i)=>s.items.map(q=>({q,i})));const ks=keysOf(all.map(o=>o.q));
 LS107().plot107={fmt:(()=>{try{const s=plotSettings26();return s.format+'|'+s.orientation;}catch{return '';}})(),n:plotSheets26.length,items:all.map((o,j)=>({k:ks[j],s:o.i,x:o.q.x,y:o.q.y,w:o.q.w,h:o.q.h}))};}
function restoreLayout(){const L=LS107().plot107;if(fresh107||!L?.items?.length)return 0;let fmt='';try{const s=plotSettings26();fmt=s.format+'|'+s.orientation;}catch{}if(L.fmt&&L.fmt!==fmt)return 0;
 const all=plotSheets26.flatMap(s=>s.items),ks=keysOf(all),old=new Map(L.items.map(o=>[o.k,o]));let kept=0;
 const sheets=Array.from({length:Math.max(L.n||0,1)},()=>({items:[]})),pending=[];
 all.forEach((q,j)=>{const o=old.get(ks[j]);if(o&&Math.abs(o.w-q.w)<.6&&Math.abs(o.h-q.h)<.6&&sheets[o.s]&&plotPositionFree33(sheets[o.s],q,o.x,o.y)){q.x=o.x;q.y=o.y;sheets[o.s].items.push(q);kept++;}else pending.push({q,o,j});});
 if(!kept)return 0;
 // quadros novos ou alterados: tentam a folha onde estavam (ou a do quadro anterior na ordem) e as seguintes
 const sheetOfJ=j=>{for(let t=j-1;t>=0;t--){const q=all[t];const i=sheets.findIndex(S=>S.items.includes(q));if(i>=0)return i;}return 0;};
 for(const {q,o,j} of pending){let start=o&&sheets[o.s]?o.s:sheetOfJ(j),done=false;
  for(let i=start;i<sheets.length&&!done;i++){const P=nearestFree(sheets[i],q,o&&i===o.s?o.x:10,o&&i===o.s?o.y:10);if(P){q.x=P.x;q.y=P.y;sheets[i].items.push(q);done=true;}}
  if(!done){const S={items:[]};const P=nearestFree(S,q,10,10)||{x:10,y:10};q.x=P.x;q.y=P.y;S.items.push(q);sheets.splice(Math.min(sheets.length,start+1),0,S);}}
 restoring=true;try{plotSheets26=sheets.filter(S=>S.items.length);}finally{restoring=false;}return {kept,moved:pending.length};}
{const b0=buildPlot26;buildPlot26=function(...a){let r;restoring=true;try{r=b0.apply(this,a);}finally{restoring=false;}try{let k=0;for(const s of plotSheets26)for(const q of s.items)q.ord107=k++;
  const R=restoreLayout();fresh107=false;if(R){previewPlot26();try{refreshPlotMove33();}catch{}$('plotStatus26').textContent='Pranchas atualizadas mantendo a sua organização: '+R.kept+' quadro(s) no mesmo lugar'+(R.moved?', '+R.moved+' novo(s)/alterado(s) encaixado(s) no espaço livre':'')+'. Para montar do zero: ↺ Montar do zero.';}
  else saveLayout();}catch(e){console.error('V107.2 organização',e);}return r;};}
{const p0=previewPlot26;previewPlot26=function(...a){const r=p0.apply(this,a);try{saveLayout();}catch{}return r;};}
function fromScratch(){if(!confirm('Montar as pranchas do zero? A organização atual das folhas será descartada.'))return;fresh107=true;delete LS107().plot107;buildPlot26();}
function curSheet(){if(selectedPlot33&&plotSheets26[selectedPlot33.si])return selectedPlot33.si;
 const vs=[...document.querySelectorAll('#plotPreview26 .plotViewport26')];let best=0,bv=-1;vs.forEach((v,i)=>{const r=v.getBoundingClientRect(),vis=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top));if(vis>bv){bv=vis;best=i;}});return best;}
// arruma uma lista de quadros numa folha vazia; devolve {placed,rest}
function pack(list){const sheet={items:[]},rest=list.slice().sort(cmp);let y=10;
 while(rest.length){let x=10,rowH=0,any=false;
  for(let k=0;k<rest.length;){const q=rest[k];if(plotPositionFree33(sheet,q,x,y)){q.x=x;q.y=y;sheet.items.push(q);x+=q.w+GAP;rowH=Math.max(rowH,q.h);rest.splice(k,1);any=true;continue;}k++;}
  if(!any)break;
  // aproveita a sobra embaixo dos quadros baixos da linha (empilha o próximo que couber)
  for(const base of sheet.items.filter(q=>q.y===y&&q.h<rowH-GAP)){let yy=base.y+base.h+GAP;for(let k=0;k<rest.length;){const q=rest[k];if(q.w<=base.w+.01&&yy+q.h<=y+rowH+.01&&plotPositionFree33(sheet,q,base.x,yy)){q.x=base.x;q.y=yy;sheet.items.push(q);yy+=q.h+GAP;rest.splice(k,1);continue;}k++;}}
  y+=rowH+GAP;}
 return {placed:sheet.items,rest};}
function organize(si,fill){stamp();const S=plotSheets26[si];if(!S)return 0;let r=pack(S.items);S.items=r.placed;let moved=0;
 if(fill){// puxa da(s) folha(s) seguinte(s), na ordem, enquanto couber
  const lv=(()=>{const c=new Map();for(const q of S.items){const v=lvOf(q);c.set(v,(c.get(v)||0)+1);}return [...c].sort((x,y)=>y[1]-x[1])[0]?.[0];})();
  for(let t=si+1;t<plotSheets26.length;t++){const T=plotSheets26[t];let took=false;for(const q of T.items.slice().sort(cmp)){if(lv!=null&&lvOf(q)!=null&&lvOf(q)!==lv)break;const trial=pack([...S.items,q]);if(!trial.rest.length){S.items=trial.placed;T.items.splice(T.items.indexOf(q),1);moved++;took=true;}else break;}if(!took||T.items.length)break;}}
 if(r.rest.length){// o que não coube vai para o começo da folha seguinte
  let T=plotSheets26[si+1];if(!T){T={items:[]};plotSheets26.push(T);}const r2=pack([...r.rest,...T.items]);T.items=[...r2.placed];if(r2.rest.length){plotSheets26.splice(si+2,0,{items:r2.rest});organize(si+2,false);}}
 plotSheets26=plotSheets26.filter(s=>s.items.length);return moved;}
function done(t,si){selectedPlot33=null;previewPlot26();try{refreshPlotMove33();}catch{}$('plotStatus26').textContent=t;setTimeout(()=>{document.querySelectorAll('#plotPreview26 .plotViewport26')[Math.min(si,plotSheets26.length-1)]?.scrollIntoView({block:'start',behavior:'smooth'});},50);}
function orgThis(fill){if(!plotSheets26.length){$('plotStatus26').textContent='Monte as pranchas primeiro.';return;}const si=curSheet(),n0=plotSheets26.length,m=organize(si,fill);
 done('Folha '+(si+1)+' organizada na ordem da numeração'+(fill?(m?' e completada com '+m+' quadro(s) da folha seguinte':' (nenhum quadro seguinte do mesmo pavimento coube no espaço livre)'):'')+'. '+(plotSheets26.length!==n0?'Agora são '+plotSheets26.length+' folhas. ':'')+'Folhas e conteúdo do carimbo renumerados.',si);}
function orgAll(){if(!plotSheets26.length){$('plotStatus26').textContent='Monte as pranchas primeiro.';return;}const n0=plotSheets26.length,bak=plotSheets26.map(S=>({items:S.items.map(q=>({q,x:q.x,y:q.y}))}));for(let i=0;i<plotSheets26.length;i++)organize(i,true);
 if(plotSheets26.length>n0){plotSheets26=bak.map(S=>({items:S.items.map(o=>{o.q.x=o.x;o.q.y=o.y;return o.q;})}));done('Organizar todas aumentaria o número de folhas ('+n0+'): mantive como estava. Use ▦ Organizar esta folha nas folhas mais vazias.',0);return;}done('Todas as folhas organizadas e completadas: '+n0+' → '+plotSheets26.length+' folhas. Cada folha mantém a ordem da numeração sempre que cabe; cada pavimento continua começando numa folha nova.',0);}
// mover o quadro selecionado para a folha nº (vai para o primeiro espaço livre; depois use Organizar)
function moveTo(){const v=Math.round(Number($('org107n').value));if(!selectedPlot33){$('plotStatus26').textContent='Clique em um quadro para selecioná-lo.';return;}if(!(v>=1)){$('plotStatus26').textContent='Digite o número da folha.';return;}
 const {si,ii}=selectedPlot33,item=plotSheets26[si]?.items[ii];if(!item)return;let ti=v-1;if(ti>=plotSheets26.length){plotSheets26.push({items:[]});ti=plotSheets26.length-1;}if(ti===si)return;
 const T=plotSheets26[ti],r=pack([...T.items,item]);if(r.rest.includes(item)){$('plotStatus26').textContent='Não cabe na folha '+v+' nem reorganizando. Tire algum quadro de lá antes.';plotSheets26=plotSheets26.filter(s=>s.items.length);return;}
 plotSheets26[si].items.splice(ii,1);T.items=r.placed;for(const q of r.rest)if(q!==item){(plotSheets26[ti+1]??=(plotSheets26.push({items:[]}),plotSheets26[plotSheets26.length-1])).items.push(q);}
 plotSheets26=plotSheets26.filter(s=>s.items.length);done((item.title||'Quadro')+' movido para a folha '+v+' (folha reorganizada na ordem).',plotSheets26.indexOf(T));}
// botões
{const host=[...document.querySelectorAll('#plot26 button')].find(b=>/Mover para próxima folha/.test(b.textContent))?.parentElement;if(host&&!$('org107a')){const w=document.createElement('span');w.className='org107';
 w.innerHTML='<button type="button" id="org107a" title="Arruma os quadros da folha selecionada (ou a que está na tela) em linhas, na ordem da numeração; o que não couber vai para a folha seguinte">▦ Organizar esta folha</button><button type="button" id="org107b" class="secondary" title="Organiza e puxa quadros da folha seguinte para os espaços livres">▦⇣ Organizar e completar</button><button type="button" id="org107c" class="secondary" title="Organiza todas as folhas, da primeira à última, completando cada uma">▦ Organizar todas</button><button type="button" id="org107z" class="secondary" title="Descarta a organização das folhas e monta de novo como no começo">↺ Montar do zero</button><span class="org107m">Mover o quadro para a folha nº <input id="org107n" type="number" min="1" step="1"> <button type="button" id="org107d" class="secondary">Mover</button></span>';
 host.append(w);$('org107a').onclick=()=>orgThis(false);$('org107b').onclick=()=>orgThis(true);$('org107c').onclick=orgAll;$('org107z').onclick=fromScratch;$('org107d').onclick=moveTo;$('org107n').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();moveTo();}});}}
// V107.1 — barra flutuante (acompanha a rolagem das pranchas) com os botões de organizar e o zoom
{const fb=document.createElement('div');fb.id='org107f';fb.className='noPrint';fb.innerHTML='<b>Pranchas</b><button type="button" data-o="a">▦ Organizar esta folha</button><button type="button" data-o="b" class="secondary">▦⇣ Organizar e completar</button><button type="button" data-o="c" class="secondary">▦ Organizar todas</button><button type="button" data-o="z" class="secondary" title="Descarta a organização das folhas e monta de novo como no começo">↺ Montar do zero</button><span>Mover p/ folha nº <input type="number" min="1" step="1" id="org107fn"></span><button type="button" data-o="d" class="secondary">Mover</button><span>Zoom <select id="org107fz"><option value=".25">25%</option><option value=".4">40%</option><option value=".6">60%</option><option value="1">100%</option></select></span><em id="org107fs"></em>';document.body.append(fb);
 fb.addEventListener('click',e=>{const o=e.target.closest('[data-o]')?.dataset.o;if(!o)return;if(o==='a')orgThis(false);else if(o==='b')orgThis(true);else if(o==='c')orgAll();else if(o==='z')fromScratch();else if(o==='d'){$('org107n').value=$('org107fn').value;moveTo();}});
 $('org107fn').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('org107n').value=$('org107fn').value;moveTo();}});
 $('org107fz').onchange=()=>{const z=$('plotZoom26');if(z){z.value=$('org107fz').value;z.dispatchEvent(new Event('change',{bubbles:true}));try{previewPlot26();}catch{}}};
 const sync=()=>{const on=document.body.dataset.v85==='plot'&&plotSheets26.length>0;fb.style.display=on?'flex':'none';if(on){const z=$('plotZoom26');if(z&&$('org107fz').value!==z.value)$('org107fz').value=z.value;const q=selectedPlot33&&plotSheets26[selectedPlot33.si]?.items[selectedPlot33.ii];$('org107fs').textContent=q?'Selecionado: '+String(q.title||'').slice(0,40)+' · folha '+(selectedPlot33.si+1):'Clique num quadro para selecionar';}};
 setInterval(sync,500);}
// V107.1 — arrastar quadro: a tela rola sozinha perto da borda; se soltar num lugar ocupado, encaixa no espaço livre mais próximo
function nearestFree(sheet,item,x,y){let best=null,bd=Infinity;const step=5,[W,H]=sheetSize26();for(let r=0;r<=Math.max(W,H);r+=step){if(r>bd)break;for(let dx=-r;dx<=r;dx+=step)for(const dy of (Math.abs(dx)===r?Array.from({length:2*r/step+1},(_,i)=>-r+i*step):[-r,r])){const X=x+dx,Y=y+dy;if(plotPositionFree33(sheet,item,X,Y)){const d=Math.hypot(dx,dy);if(d<bd){bd=d;best={x:X,y:Y};}}}}return best;}
function scrollerOf(el){for(let e=el.parentElement;e;e=e.parentElement){const cs=getComputedStyle(e);if(/(auto|scroll)/.test(cs.overflowY)&&e.scrollHeight>e.clientHeight+2)return e;}return document.scrollingElement||document.documentElement;}
startPlotDrag26=function(e){if(e.button!==0)return;const n=e.currentTarget,sheetNode=n.closest('.plotSheet26'),si=Number(sheetNode.dataset.sheet),ii=Number(n.dataset.item),item=plotSheets26[si].items[ii];if(!item)return;
 const sc=scrollerOf(sheetNode),s0=sc.scrollTop,sx0=sc.scrollLeft,start={x:e.clientX,y:e.clientY,ix:item.x,iy:item.y},r0=sheetNode.getBoundingClientRect(),factor=r0.width/sheetSize26()[0],grabX=(e.clientX-r0.left)/factor-item.x,grabY=(e.clientY-r0.top)/factor-item.y;
 selectedPlot33={si,ii};try{$('plotSelection33').textContent=item.title+' · folha '+(si+1);}catch{}e.preventDefault();document.body.classList.add('drag107');try{getSelection().removeAllRanges();}catch{}n.setPointerCapture(e.pointerId);n.style.zIndex='50';n.style.outline='0.6mm dashed #1d4f86';
 let last={x:e.clientX,y:e.clientY},raf=0,live=true;
 const place=()=>{const dy=sc.scrollTop-s0,dx=sc.scrollLeft-sx0;n.style.left=(start.ix+(last.x-start.x+dx)/factor)+'mm';n.style.top=(start.iy+(last.y-start.y+dy)/factor)+'mm';};
 const tick=()=>{if(!live)return;const R=sc===document.scrollingElement||sc===document.documentElement?{top:0,bottom:innerHeight}:sc.getBoundingClientRect(),m=70;let v=0;if(last.y<R.top+m)v=-Math.ceil((R.top+m-last.y)/4);else if(last.y>R.bottom-m)v=Math.ceil((last.y-(R.bottom-m))/4);if(v){sc.scrollTop+=v;place();}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);
 const move=ev=>{last={x:ev.clientX,y:ev.clientY};place();};
 const end=ev=>{live=false;cancelAnimationFrame(raf);document.body.classList.remove('drag107');try{getSelection().removeAllRanges();}catch{}n.removeEventListener('pointermove',move);n.removeEventListener('pointerup',end);n.removeEventListener('pointercancel',end);n.style.zIndex='';n.style.outline='';let moved=false,snapped=false;
  if(ev.type!=='pointercancel'){let tgt=null,bo=0;for(const node of $('plotPreview26').querySelectorAll('.plotSheet26')){const r=node.getBoundingClientRect();const ov=Math.max(0,Math.min(r.bottom,ev.clientY+1)-Math.max(r.top,ev.clientY-1))*(ev.clientX>=r.left&&ev.clientX<=r.right?1:0);const d=ev.clientY<r.top?r.top-ev.clientY:ev.clientY>r.bottom?ev.clientY-r.bottom:0;const sc2=ov?1e9:-d;if(tgt==null||sc2>bo){bo=sc2;tgt=node;}}
   if(tgt){const r=tgt.getBoundingClientRect(),ti=Number(tgt.dataset.sheet),f=r.width/sheetSize26()[0],x=(ev.clientX-r.left)/f-grabX,y=(ev.clientY-r.top)/f-grabY;moved=movePlotItem33(si,ii,ti,x,y);
    if(!moved){const T=plotSheets26[ti],tmp={items:T.items.filter(q=>q!==item)},P=nearestFree(tmp,item,Math.round(x),Math.round(y));if(P){moved=movePlotItem33(si,ii,ti,P.x,P.y);snapped=moved;}}}}
  refreshPlotMove33();$('plotStatus26').textContent=moved?(snapped?'Encaixado no espaço livre mais próximo. ':'Posição atualizada. ')+'Identificação das folhas atualizada.':'Movimento desfeito: não há espaço livre para esse quadro nessa folha (use ▦ Organizar ou Mover p/ folha nº).';};
 n.addEventListener('pointermove',move);n.addEventListener('pointerup',end);n.addEventListener('pointercancel',end);};
// V107.2 — no ciclo das pranchas por andar, o resumo de blocos de cada andar do pavimento-tipo mostra o fbk DAQUELE andar
{const cp=collectPlot26;collectPlot26=function(...a){const d=cp.apply(this,a);try{if(!window.res96?.repAt)return d;const zOf=new Map(),jOf=new Map();
  for(const it of d.items){const m=String(it.title||'').match(/(\d+)º de (\d+) \(\+([\d.,]+) m\)/);if(m&&it.lv77!=null&&!zOf.has(it.lv77)){zOf.set(it.lv77,Number(m[3].replace(/\./g,'').replace(',','.')));jOf.set(it.lv77,m[1]+'º de '+m[2]);}}
  for(const it of d.items){if(!it.html||!/tg96p/.test(it.html)||!zOf.has(it.lv77))continue;const r=window.res96.repAt(zOf.get(it.lv77));if(!r||!(r.L.groups?.length>1))continue;const f=v=>Number(v).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1});
   it.html=it.html.replace(/ · fbk por andar<\/h3>/,' · fbk '+f(r.fbk)+' MPa</h3>').replace(/<p class="tg96p">[\s\S]*?<\/p>/,'<p class="tg96p"><b>Blocos fbk = '+f(r.fbk)+' MPa · graute fgk = '+Math.round(r.fgk)+' MPa ('+jOf.get(it.lv77)+')</b></p>');
   if(!/º de \d+/.test(it.title||''))it.title=String(it.title||'')+' — '+jOf.get(it.lv77);try{it.h=measureHTML26(it.html,it.w-4)+13;}catch{}}}catch(e){console.error('V107.2 fbk por andar',e);}return d;};}
window.org107={organize,orgAll,pack};
const css=document.createElement('style');css.textContent='.org107{display:inline-flex;flex-wrap:wrap;gap:6px;align-items:center;margin-left:8px}.org107 button{margin:0}.org107m{display:inline-flex;gap:5px;align-items:center;font-size:13px;margin-left:6px}.org107m input{width:60px;margin:0}';document.head.append(css);
document.head.append(Object.assign(document.createElement('style'),{textContent:'#org107f{position:fixed;left:50%;bottom:34px;transform:translateX(-50%);z-index:70;display:none;align-items:center;gap:6px;flex-wrap:wrap;max-width:calc(100vw - 40px);background:#fff;border:1px solid #b9c6d3;border-radius:10px;box-shadow:0 8px 24px rgba(16,46,75,.25);padding:6px 10px;font-size:12.5px}#org107f b{color:#174a78;margin-right:4px}#org107f button{margin:0;padding:5px 9px;font-size:12.5px}#org107f span{display:inline-flex;align-items:center;gap:4px}#org107f input{width:52px;margin:0;padding:3px 5px}#org107f select{margin:0;padding:3px 5px;width:auto}body.drag107,body.drag107 *{user-select:none!important;-webkit-user-select:none!important}#org107f em{color:#5b6d7f;font-style:normal;font-size:11.5px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'}));
})();
