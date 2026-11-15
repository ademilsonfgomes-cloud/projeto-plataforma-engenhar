// V91 — armaduras editadas dentro do "Editar elevação" (ambiente isolado): ver, selecionar, mudar bitola/quantidade,
// incluir vertical e horizontal com prévia, arrastar reforço manual, unir/separar, excluir — sem janelas, Ctrl+Z desfaz.
(function(){
'use strict';
const N=Number,DIAS=[8,10,12.5],fd=d=>N(d).toFixed(1).replace('.',','),f1=v=>(Math.round(N(v)*10)/10).toLocaleString('pt-BR');
const box=$('ed86');if(!box)return;
const ED=()=>window.ed86?._E?.();
let on=false,tool='sel',sel=null,ghost=null,hfirst=null,drag=null,pan=null,listT=null;
const data=()=>{const e=ED();return e?state.steel?.[e.i]:null;};
function G(){const e=ED();return {e,i:e.i,H:e.rows.length*e.step,L:e.L,step:e.step,m:state.results[e.i],w:e.w};}
const svgEl=()=>box.querySelector('#ed86svg');
function toCm(ev){const s=svgEl(),pt=s.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;return pt.matrixTransform(s.getScreenCTM().inverse());}
const rowOf=(g,y)=>Math.max(1,Math.min(g.e.rows.length,Math.floor((g.H-y)/g.step)+1));
const yRow=(g,row)=>g.H-((row-1)*g.step+g.step*.71);
const keyOf=(kind,b)=>kind==='v'?b.overrideKey:b.key;
// ---------- desenho do aço por cima dos blocos
function paint(){const s=svgEl();if(!s||!ED())return;s.querySelector('#st91g')?.remove();const d=data();if(!d)return;const g=G(),NS='http://www.w3.org/2000/svg';
 let h='';const isSel=(k,idx)=>sel&&sel.kind===k&&sel.idx===idx;
 d.points.forEach((p,idx)=>{const man=!!p.manual53,col=isSel('v',idx)?'#e67e22':man?'#0b5fd0':'#0f2f4f',yb=g.H+10,yt=yb-N(p.length);
  h+=`<g class="b91" data-k="v" data-i="${idx}">`;for(let n=0;n<p.quantity;n++){const dx=(n-(p.quantity-1)/2)*1.6;h+=`<line x1="${p.t+dx}" y1="${yt}" x2="${p.t+dx}" y2="${yb}" stroke="${col}" stroke-width="${isSel('v',idx)?1.6:1}"/>`;}
  h+=`<line x1="${p.t}" y1="${yt}" x2="${p.t}" y2="${yb}" stroke="transparent" stroke-width="7"/><text x="${p.t}" y="${yb+7}" font-size="5" text-anchor="middle" fill="${col}" font-weight="700">${esc(p.n||'')}</text></g>`;});
 d.horizontals.forEach(b=>{const idx=b.editIndex,man=!!b.manual53,col=isSel('h',idx)?'#e67e22':man?'#0b5fd0':'#0f2f4f',y=g.H-(N(b.y)+N(b.height)*.75),a=N(b.start)+2.5,z=a+N(b.length);
  h+=`<g class="b91" data-k="h" data-i="${idx}">`;for(let n=0;n<b.quantity;n++)h+=`<line x1="${a}" y1="${y+(n-(b.quantity-1)/2)*1.4}" x2="${z}" y2="${y+(n-(b.quantity-1)/2)*1.4}" stroke="${col}" stroke-width="${isSel('h',idx)?1.6:1}"/>`;
  h+=`<line x1="${a}" y1="${y}" x2="${z}" y2="${y}" stroke="transparent" stroke-width="7"/><text x="${a+1}" y="${y-2}" font-size="4.6" fill="${col}" font-weight="700">${esc(b.n||'')}${b.label83?' · '+b.label83.toUpperCase():''}</text></g>`;});
 if(ghost)h+=ghost;
 const el=document.createElementNS(NS,'g');el.id='st91g';el.setAttribute('opacity',on?'1':'.55');if(!on)el.setAttribute('pointer-events','none');el.innerHTML=h;s.append(el);}
new MutationObserver(()=>{const s=svgEl();if(s&&ED()&&!s.querySelector('#st91g'))paint();}).observe(box,{childList:true,subtree:true});
// ---------- gravar e atualizar (aço, relação de aço, lista de elevações)
function commit(text){state.steel=buildSteel();paint();if(text)say(text);
 clearTimeout(listT);listT=setTimeout(()=>{try{const e=ED();steelEditing19={wall:e?e.i:0};const sx=scrollX,sy=scrollY;renderResults({reports:state.junctionReports||[]},state.results);scrollTo(sx,sy);paint();}catch(er){console.error('V91 lista',er);}},700);}
const hist=[];function snap91(){hist.push(JSON.stringify({a:state.steelManual53||[],b:state.steelRemoved53||{},c:state.steelOverrides||{},d:state.steelMerges23||[]}));if(hist.length>80)hist.shift();}
function undo91(){const h=hist.pop();if(!h){say('Nada para desfazer na armadura.');return;}const o=JSON.parse(h);state.steelManual53=o.a;state.steelRemoved53=o.b;state.steelOverrides=o.c;state.steelMerges23=o.d;sel=null;hidePop();commit('Desfeito (Ctrl+Z) · '+hist.length+' passo(s) ainda disponível(is).');}
function say(t,warn){const m=box.querySelector('#ed86msg');if(m){m.textContent=t||'';m.className=warn?'w86':'';}}
function nInfo(diameter,length){let tot=0,n='';for(const d of state.steel||[]){if(!d)continue;for(const x of [...(d.points||[]),...(d.horizontals||[])])if(Math.abs(N(x.diameter)-N(diameter))<.01&&Math.abs(N(x.length)-N(length))<.05){tot+=N(x.quantity)||1;n=x.n;}}return {n,tot};}
// ---------- novo reforço
function addManual(s){snap91();const g=G();const before=nInfo(s.diameter,s.length);s.id='man-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);s.wall=g.w.uid;s.note=s.note||'';state.steelManual53??=[];state.steelManual53.push(s);
 commit();const after=nInfo(s.diameter,s.length);const where=s.kind==='vertical'?'vertical a '+f1(s.t)+' cm':'horizontal na fiada '+s.row+', de '+f1(s.start)+' a '+f1(s.start+s.length)+' cm';
 say('Reforço '+where+': '+(before.tot>0?'somado ao '+after.n+' (mesma bitola Ø'+fd(s.diameter)+' e comprimento '+f1(s.length)+' cm) — agora '+after.tot+' barra(s).':after.n+' novo · Ø'+fd(s.diameter)+' C='+f1(s.length)+' cm.')+' Já está na relação de aço.');}
const defDia=k=>{const v=N(box.querySelector('#st91dia')?.value);return DIAS.includes(v)?v:steelDiameter(k==='vertical'?'vertical':'horizontal');};
// ---------- prévia
function setGhost(ev){const g=G(),P=toCm(ev);ghost=null;
 if(tool==='vert'){const t=Math.round(P.x*2)/2,yb=g.H+10,yt=yb-(N(g.m.H)+10);ghost=`<line x1="${t}" y1="${yt}" x2="${t}" y2="${yb}" stroke="#0b5fd0" stroke-width="1.2" stroke-dasharray="4 2.5" pointer-events="none"/><rect x="${t+2}" y="${P.y-9}" width="46" height="8" rx="1.5" fill="#fff" stroke="#0b5fd0" stroke-width=".4" pointer-events="none"/><text x="${t+4}" y="${P.y-3.2}" font-size="5" fill="#0b5fd0" pointer-events="none">vertical · ${f1(t)} cm</text>`;}
 if(tool==='horiz'){const row=hfirst?hfirst.row:rowOf(g,P.y),y=yRow(g,row),a=hfirst?Math.min(hfirst.t,P.x):P.x,z=hfirst?Math.max(hfirst.t,P.x):P.x;ghost=`<line x1="${a}" y1="${y}" x2="${Math.max(z,a+.5)}" y2="${y}" stroke="#0b5fd0" stroke-width="1.4" stroke-dasharray="4 2.5" pointer-events="none"/><circle cx="${hfirst?hfirst.t:P.x}" cy="${y}" r="1.6" fill="#0b5fd0" pointer-events="none"/><text x="${a}" y="${y-3}" font-size="5" fill="#0b5fd0" pointer-events="none">fiada ${row}${hfirst?' · '+f1(Math.round((z-a)*2)/2)+' cm':' · clique no começo'}</text>`;}
 paint();}
// ---------- seleção e painel pequeno
const pop=document.createElement('div');pop.id='st91pop';pop.hidden=true;
function barOf(k,idx){const d=data();if(!d)return null;return k==='v'?d.points[idx]:d.horizontals.find(b=>b.editIndex===idx);}
function manOf(b){return b?.manual53?(state.steelManual53||[]).find(x=>x.id===b.manual53):null;}
function showPop(ev){const b=barOf(sel.kind,sel.idx);if(!b){pop.hidden=true;return;}const man=manOf(b),key=keyOf(sel.kind,b),ov=state.steelOverrides?.[key]||{};
 const dia=man?N(man.diameter):N(ov.diameter||b.diameter),qt=man?N(man.quantity):N(ov.quantity||b.quantity||1);
 pop.innerHTML=`<div class="h">${esc(b.n||'')} · ${sel.kind==='v'?'vertical':esc(b.label83||b.kind||'horizontal')}${man?' · manual':''}<button type="button" data-a="x">✕</button></div>
 <div class="r"><span>Bitola</span>${DIAS.map(v=>`<button type="button" data-a="d" data-v="${v}" class="${Math.abs(v-dia)<.01?'on':''}">Ø${fd(v)}</button>`).join('')}</div>
 <div class="r"><span>Barras</span><button type="button" data-a="q" data-v="-1">−</button><b>${qt}</b><button type="button" data-a="q" data-v="1">+</button></div>
 ${man?`<div class="r"><span>Comprimento</span><input type="number" min="10" max="2000" step="1" value="${Math.round(N(man.length))}" data-a="len"> cm</div><div class="r"><span>${sel.kind==='v'?'Posição':'Início'}</span><input type="number" step="0.5" value="${sel.kind==='v'?N(man.t):N(man.start)}" data-a="pos"> cm${sel.kind==='h'?` · fiada <input type="number" min="1" max="${G().e.rows.length}" step="1" value="${man.row}" data-a="row" style="width:52px">`:''}</div>`:''}
 <div class="r">${!man&&state.steelOverrides?.[key]?'<button type="button" data-a="auto" class="sec">Voltar ao automático</button>':''}${b.merged23?'<button type="button" data-a="split" class="sec">✂ Separar união</button>':''}<button type="button" data-a="del" class="del">🗑 Excluir</button></div>
 <div class="ft">${man?'Arraste o ferro azul para mover. ':''}Delete exclui · Ctrl+Z desfaz.</div>`;
 pop.hidden=false;if(ev){const R=box.getBoundingClientRect();pop.style.left=Math.min(R.width-300,Math.max(8,ev.clientX-R.left+14))+'px';pop.style.top=Math.min(R.height-230,Math.max(60,ev.clientY-R.top+14))+'px';}}
function hidePop(){pop.hidden=true;}
function edit(f,text){const b=barOf(sel.kind,sel.idx);if(!b)return;snap91();const man=manOf(b);if(man){f(man,true);}else{const key=keyOf(sel.kind,b);state.steelOverrides??={};const cur={diameter:N(b.diameter),quantity:N(b.quantity||1),...(state.steelOverrides[key]||{})};f(cur,false);cur.quantity=Math.max(1,Math.min(20,cur.quantity));state.steelOverrides[key]=cur;}
 if(man)man.quantity=Math.max(1,Math.min(20,N(man.quantity)));commit();reselect(b);const nb=barOf(sel?.kind,sel?.idx);if(nb)say((text||'Alterado')+': '+nb.n+' · '+nb.quantity+' Ø'+fd(nb.diameter)+' · C='+f1(nb.length)+' cm (relação de aço atualizada).');showPop();}
// depois de recalcular, os índices podem mudar: acha a mesma barra
function reselect(b){const d=data();if(!d||!sel)return;if(sel.kind==='v'){const k=d.points.findIndex(p=>(b.manual53&&p.manual53===b.manual53)||(!b.manual53&&p.overrideKey===b.overrideKey));sel=k>=0?{kind:'v',idx:k}:null;}else{const q=d.horizontals.find(x=>(b.manual53&&x.manual53===b.manual53)||(!b.manual53&&x.key===b.key));sel=q?{kind:'h',idx:q.editIndex}:null;}paint();}
function delSel(){const b=barOf(sel?.kind,sel?.idx);if(!b)return;snap91();const man=manOf(b);
 if(man){state.steelManual53=(state.steelManual53||[]).filter(x=>x.id!==man.id);}else{state.steelRemoved53??={};state.steelRemoved53[keyOf(sel.kind,b)]=true;}
 sel=null;hidePop();commit('Ferro '+(b.n||'')+' excluído'+(man?'':' (o automático pode voltar em “Restaurar aço excluído”)')+'. Ctrl+Z desfaz.');}
pop.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||b.tagName==='INPUT')return;e.stopPropagation();const a=b.dataset.a,v=N(b.dataset.v);
 if(a==='x'){hidePop();sel=null;paint();return;}if(a==='d')edit(c=>{c.diameter=v;},'Bitola');if(a==='q')edit(c=>{c.quantity=N(c.quantity)+v;},'Quantidade');if(a==='del')delSel();
 if(a==='auto'){snap91();const bb=barOf(sel.kind,sel.idx);delete state.steelOverrides?.[keyOf(sel.kind,bb)];commit();reselect(bb);showPop();say('Voltou ao automático.');}
 if(a==='split'){snap91();const bb=barOf(sel.kind,sel.idx);if(bb?.merged23){state.steelMerges23=(state.steelMerges23||[]).filter(m=>m.id!==bb.merged23);sel=null;hidePop();commit('União desfeita.');}}});
pop.addEventListener('change',e=>{const a=e.target.dataset.a,v=N(e.target.value);if(!['len','pos','row'].includes(a)||!Number.isFinite(v))return;
 edit((c,man)=>{if(!man)return;if(a==='len')c.length=Math.max(10,Math.min(2000,Math.round(v)));if(a==='pos'){if(sel.kind==='v')c.t=Math.round(v*2)/2;else c.start=Math.round(v*2)/2;}if(a==='row')c.row=Math.max(1,Math.min(G().e.rows.length,Math.round(v)));},a==='len'?'Comprimento':'Posição');});
pop.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.target.dispatchEvent(new Event('change',{bubbles:true}));}e.stopPropagation();});
// ---------- mouse (só no modo Armadura; os blocos ficam quietos)
const hitBar=t=>{const g=t.closest?.('#st91g .b91');return g?{kind:g.dataset.k,idx:N(g.dataset.i)}:null;};
box.addEventListener('pointerdown',ev=>{if(!on||!ED()||!ev.target.closest?.('#ed86svg')||ev.button!==0)return;ev.stopPropagation();ev.preventDefault();const g=G(),P=toCm(ev);
 if(tool==='vert'){addManual({kind:'vertical',t:Math.round(P.x*2)/2,length:Math.round(N(g.m.H)+10),diameter:defDia('vertical'),quantity:1});return;}
 if(tool==='horiz'){if(!hfirst){hfirst={t:Math.round(P.x*2)/2,row:rowOf(g,P.y)};setGhost(ev);say('Agora clique onde a barra termina (fiada '+hfirst.row+'). Esc cancela.');return;}
  const a=Math.min(hfirst.t,Math.round(P.x*2)/2),z=Math.max(hfirst.t,Math.round(P.x*2)/2),row=hfirst.row;hfirst=null;ghost=null;if(z-a<10){say('Barra muito curta: clique no começo e no fim (mínimo 10 cm).',true);paint();return;}
  addManual({kind:'horizontal',start:a,row,length:Math.round(z-a),diameter:defDia('horizontal'),quantity:1});return;}
 const h=hitBar(ev.target);
 if(tool==='unir'){if(!h||h.kind!=='h'){say('Unir: clique em dois ferros horizontais da mesma fiada.',true);return;}if(!sel||sel.kind!=='h'){sel=h;paint();say('1º ferro marcado ('+(barOf('h',h.idx)?.n||'')+'). Agora clique no 2º.');return;}
  if(sel.idx===h.idx){sel=null;paint();return;}snap91();const ok=window.steel83?.unite?.(G().i,sel.idx,h.idx);sel=null;state.steel=buildSteel();paint();if(ok!==false)commit('Ferros unidos numa barra só.');else say('Não foi possível unir: os dois precisam estar na mesma fiada e sem vão vazio entre eles.',true);return;}
 if(h){sel=h;paint();showPop(ev);const b=barOf(h.kind,h.idx);if(manOf(b))drag={h,b,x0:P.x,y0:P.y,moved:false,id:ev.pointerId};return;}
 sel=null;hidePop();paint();const cv=box.querySelector('.cv86');pan={cv,x:ev.clientX,y:ev.clientY,l:cv.scrollLeft,t:cv.scrollTop,on:false};},true);
box.addEventListener('pointermove',ev=>{if(!on||!ED())return;
 if(pan){const dx=ev.clientX-pan.x,dy=ev.clientY-pan.y;if(!pan.on&&Math.hypot(dx,dy)>4){pan.on=true;pan.cv.style.cursor='grabbing';}if(pan.on){pan.cv.scrollLeft=pan.l-dx;pan.cv.scrollTop=pan.t-dy;}return;}
 if(drag){const P=toCm(ev),dx=P.x-drag.x0,dy=P.y-drag.y0;if(!drag.moved&&Math.hypot(dx,dy)<1.5)return;drag.moved=true;const g=svgEl()?.querySelector(`#st91g .b91[data-k="${drag.h.kind}"][data-i="${drag.h.idx}"]`);if(g)g.setAttribute('transform',`translate(${dx},${drag.h.kind==='h'?Math.round(dy/G().step)*G().step:0})`);drag.dx=dx;drag.dy=dy;return;}
 if(ev.target.closest?.('#ed86svg')&&(tool==='vert'||tool==='horiz'))setGhost(ev);
 const cv=box.querySelector('.cv86');if(cv)cv.style.cursor=tool==='sel'&&!hitBar(ev.target)?'grab':tool==='sel'?'pointer':'crosshair';},true);
box.addEventListener('pointerup',ev=>{if(!on)return;if(pan){pan.cv.style.cursor='grab';pan=null;return;}if(!drag)return;const D=drag;drag=null;if(!D.moved)return;const man=manOf(D.b);if(!man)return;
snap91();if(D.h.kind==='v')man.t=Math.round((N(man.t)+D.dx)*2)/2;else{man.start=Math.round((N(man.start)+D.dx)*2)/2;const dr=-Math.round(D.dy/G().step);man.row=Math.max(1,Math.min(G().e.rows.length,N(man.row)+dr));}
 commit();reselect(D.b);showPop();say('Reforço '+(D.b.n||'')+' movido para '+(D.h.kind==='v'?f1(man.t)+' cm':'fiada '+man.row+', início '+f1(man.start)+' cm')+'.');},true);
for(const t of ['click','dblclick','contextmenu'])box.addEventListener(t,ev=>{if(on&&ev.target.closest?.('#ed86svg')){ev.stopPropagation();ev.preventDefault();}},true);
// ---------- teclado (antes do editor de blocos)
function key(e){if(!on)return false;if(e.target.closest?.('#st91pop input'))return false;
 if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopImmediatePropagation();undo91();return true;}
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();if(sel)delSel();return true;}
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(hfirst){hfirst=null;ghost=null;paint();say('Barra cancelada.');return true;}if(!pop.hidden||sel){hidePop();sel=null;paint();return true;}if(tool!=='sel'){setTool('sel');return true;}setOn(false);return true;}
 if(e.key==='v'||e.key==='V'){if(e.ctrlKey||e.metaKey||e.altKey)return false;setTool('vert');return true;}if(e.key==='h'||e.key==='H'){if(e.ctrlKey||e.metaKey||e.altKey)return false;setTool('horiz');return true;}
 return false;}
// ---------- barra: Blocos | Armadura e ferramentas do aço
const HELP={sel:'Clique num ferro para mudar bitola e quantidade (ou excluir). Arraste o ferro azul (manual) para mover. Arraste o fundo para mover o desenho.',vert:'＋ Vertical: a linha tracejada mostra onde o ferro vai; clique para colocar. Continua ativo para colocar outros (Esc sai).',horiz:'＋ Horizontal: clique onde a barra começa e onde termina, na fiada desejada (Esc cancela).',unir:'⫘ Unir: clique em dois ferros horizontais da mesma fiada para virarem uma barra só.'};
function setTool(t){tool=t;hfirst=null;ghost=null;sel=null;hidePop();box.querySelectorAll('#st91bar [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===t));const hp=box.querySelector('#st91help');if(hp)hp.textContent=HELP[t];paint();}
function setOn(v){on=!!v;box.classList.toggle('steel91',on);box.querySelectorAll('.seg91 button').forEach(b=>b.classList.toggle('on',(b.dataset.v==='aco')===on));const sb=box.querySelector('#st91bar');if(sb)sb.hidden=!on;if(on){setTool('sel');say('Armadura: '+HELP.sel);}else{hfirst=null;ghost=null;sel=null;hidePop();paint();say('Blocos: clique, arraste e preencha os blocos.');}}
function mount(){const bar=box.querySelector('.bar86');if(!bar||bar.querySelector('.seg91'))return;const t=bar.querySelector('.d86');const seg=document.createElement('span');seg.className='seg91';seg.innerHTML='<button type="button" data-v="blk" class="on">🧱 Blocos</button><button type="button" data-v="aco">⫘ Armadura</button>';(t||bar.firstChild).after(seg);
 seg.onclick=e=>{const b=e.target.closest('button');if(b)setOn(b.dataset.v==='aco');};
 const sb=document.createElement('div');sb.id='st91bar';sb.hidden=true;sb.innerHTML='<button type="button" data-t="sel" class="on">↖ Selecionar</button><button type="button" data-t="vert">＋ Vertical <small>V</small></button><button type="button" data-t="horiz">＋ Horizontal <small>H</small></button><button type="button" data-t="unir">⫘ Unir</button><label>Bitola nova <select id="st91dia">'+DIAS.map(v=>'<option value="'+v+'"'+(v===10?' selected':'')+'>Ø'+fd(v)+'</option>').join('')+'</select></label><span id="st91help"></span>';
 sb.onclick=e=>{const b=e.target.closest('[data-t]');if(b)setTool(b.dataset.t);};box.querySelector('.st86')?.after(sb);box.append(pop);on=false;tool='sel';sel=null;hfirst=null;ghost=null;
 if(pending){pending=false;setOn(true);}}
let pending=false;
new MutationObserver(()=>{if(!box.hidden)mount();else if(on){on=false;box.classList.remove('steel91');}}).observe(box,{childList:true,attributes:true,attributeFilter:['hidden']});
window.st91={key,setOn,open:i=>{pending=true;window.ed86?.open(i);if(ED()&&box.querySelector('.seg91')){pending=false;setOn(true);}},on:()=>on,tool:()=>tool,paint};
// ---------- fora do editor: a lista de elevações só mostra (sem ferramentas de aço); botão leva ao editor
try{const rr=renderResults;renderResults=function(...a){const r=rr.apply(this,a);try{(state.results||[]).forEach((m,i)=>{if(!m?.rows?.length)return;const art=$('wall-result-'+i);if(!art||art.dataset.st91)return;art.dataset.st91='1';for(const p of art.querySelectorAll('p.note'))if(/Dois cliques na bolinha/.test(p.textContent))p.remove();const e=art.querySelector('.ed86btn');if(e)e.innerHTML='✏ Editar elevação <small>— blocos e armaduras desta parede (lá dentro: 🧱 Blocos ou ⫘ Armadura)</small>';});}catch{}return r;};}catch(e){console.error('V91',e);}
const css=document.createElement('style');css.textContent=
'#output .steelTools53,#output .manualPanel{display:none!important}#output g.man53,#output [data-steel-wall]{pointer-events:none}'+
'#ed86 .seg91{display:inline-flex;border:1px solid #2e5f8f;border-radius:7px;overflow:hidden}#ed86 .seg91 button{border:0!important;border-radius:0!important;background:#1c4670!important;padding:5px 11px!important}#ed86 .seg91 button.on{background:#e8930c!important;color:#1b1306!important;font-weight:700}'+
'#st91bar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:6px 12px;background:#eaf2fb;border-bottom:1px solid #c9d3de;font-size:12.5px;color:#102e4b}#st91bar[hidden]{display:none}#st91bar button{padding:5px 10px;border:1px solid #b9c9da;border-radius:6px;background:#fff;color:#102e4b;margin:0;cursor:pointer;font-size:12.5px}#st91bar button.on{background:#0b5fd0;color:#fff;border-color:#0b5fd0}#st91bar small{opacity:.6;font-size:10px;margin-left:3px}#st91bar label{display:flex;gap:5px;align-items:center;margin:0 6px}#st91bar select{padding:3px 6px;margin:0;width:auto}#st91help{color:#40566b;flex:1;min-width:240px}'+
'#st91pop{position:absolute;z-index:5;background:#fff;border:1px solid #b9c6d3;border-radius:8px;box-shadow:0 8px 24px rgba(16,46,75,.2);padding:8px 10px;width:290px;font-size:12.5px;color:#102e4b}#st91pop[hidden]{display:none}#st91pop .h{display:flex;justify-content:space-between;align-items:center;font-weight:700;margin-bottom:6px}#st91pop .h button{border:0;background:none;cursor:pointer;font-size:14px;padding:0 4px;margin:0;color:#40566b}'+
'#st91pop .r{display:flex;gap:5px;align-items:center;margin:5px 0;flex-wrap:wrap}#st91pop .r>span{min-width:76px;color:#40566b}#st91pop .r button{padding:3px 9px;border:1px solid #c9d7e6;border-radius:6px;background:#e8eff7;color:#102e4b;cursor:pointer;margin:0;font-size:12.5px}#st91pop .r button.on{background:#174a78;color:#fff}#st91pop .r button.del{background:#fdecea;border-color:#f3c2bc;color:#a3361f}#st91pop .r button.sec{background:#fff}#st91pop .r b{min-width:22px;text-align:center}#st91pop input{width:76px;padding:3px 5px;margin:0}#st91pop .ft{color:#5b6d7f;font-size:11px;margin-top:4px}'+
'#ed86.steel91 .pc86,#ed86.steel91 .gap86{opacity:.72}';document.head.append(css);
})();
