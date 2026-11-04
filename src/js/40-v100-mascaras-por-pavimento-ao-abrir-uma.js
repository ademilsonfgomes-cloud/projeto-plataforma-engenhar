// V100 — máscaras por pavimento: ao abrir uma planta, ela é atribuída a um pavimento (da base ao topo dele);
// "Máscara de referência" mostra a máscara de outro pavimento só para consulta; "Alinhar com o de baixo" (como o MOVE do CAD).
(function(){
'use strict';
const N=Number,L68=()=>window.level68;if(!L68()||typeof addPlant36!=='function')return;
const fm=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(2).replace('.',',');
const valK=k=>N(String(k).split('|')[0])||0,labK=k=>String(k).split('|')[1]||'';
const pgs=()=>{try{return pages36;}catch{return [];}};
function msg(t){const s=$('planStatus');if(s)s.textContent=t;}
function levelRow(pg){state.levels53??=[];let l=state.levels53.find(l=>String(l.page)===String(pg));if(!l){l={id:'lvl-'+pg+'-'+Date.now().toString(36),text:'0,00',page:String(pg),rep:1};state.levels53.push(l);}return l;}
function topSuggest(){let top=0;try{const LV=window.loads77?.levels?.()||[],t=N(window.opt3d74?.t)||10;for(const l of LV)top=Math.max(top,valK(l.key)+(Math.max(1,N(l.rep)||1)*((N(l.H)||280)+t))/100);}catch{}return top;}

// ---------- 1. janelinha ao abrir uma máscara
const box=document.createElement('div');box.id='mk100';box.className='noPrint';box.hidden=true;document.body.append(box);
function chooser(src){const pages=(src?.pages||[]).map(p=>N(p.id??p));if(!pages.length)return;
 const others=[...new Set(pgs().filter(p=>!pages.includes(N(p.id))).map(p=>L68().keyOf(p.id)))].sort((a,b)=>valK(a)-valK(b));
 const sug=topSuggest(),isDxf=src.type==='dxf';
 box.innerHTML='<div class="h100"><b>Esta máscara é de qual pavimento?</b><span>'+esc(src.name||'')+'</span></div><div class="b100">'+
  '<label class="o100"><input type="radio" name="mk100" value="new" checked> <b>Novo pavimento</b></label><div class="n100"><label>Cota da base (m)<input id="mk100v" type="text" value="'+sug.toFixed(2).replace('.',',')+'"></label><label>Nome<input id="mk100n" type="text" value="Pavimento '+(others.length+1)+'"></label></div>'+
  (others.length?'<p class="s100">ou junto com um pavimento que já existe (mesma cota — as duas máscaras viram um pavimento só):</p>'+others.map(k=>'<label class="o100"><input type="radio" name="mk100" value="'+esc(k)+'"> '+esc(L68().nameOf(k))+'</label>').join(''):'')+
  (isDxf?'<label class="c100"><input id="mk100o" type="checkbox" checked> Usar o 0,0 do AutoCAD como origem (as plantas desenhadas no mesmo sistema de coordenadas já ficam alinhadas)</label>':'<p class="s100">PDF: depois marque o ⌖ Ponto de origem ou use ⤢ Alinhar com o de baixo.</p>')+
  '<p class="w100" id="mk100w"></p><div class="a100"><button type="button" id="mk100ok">✔ Confirmar</button></div></div>';
 box.hidden=false;const w=$('mk100w');
 const chk=()=>{const v=box.querySelector('input[name=mk100]:checked')?.value;w.textContent=v&&v!=='new'?'Atenção: esta máscara vai ficar no mesmo pavimento de '+L68().nameOf(v)+'. Só faça isso se for o mesmo andar.':'';};
 box.querySelectorAll('input[name=mk100]').forEach(r=>r.onchange=chk);
 $('mk100ok').onclick=async()=>{const v=box.querySelector('input[name=mk100]:checked')?.value;let text,rep=1;
  if(v==='new'){const z=N(String($('mk100v').value).replace(',','.'));if(!Number.isFinite(z)){w.textContent='Informe a cota em metros (ex.: 26,30).';return;}const nm=String($('mk100n').value||'').trim()||'Pavimento';
   text=z.toFixed(2).replace('.',',')+' '+nm;const k=z.toFixed(3)+'|'+nm;if(others.includes(k)){w.textContent='Já existe um pavimento com essa cota e esse nome. Mude o nome ou escolha-o na lista.';return;}}
  else{const row=(state.levels53||[]).find(l=>L68().keyOf(N(l.page))===v);text=row?.text||(valK(v).toFixed(2).replace('.',',')+' '+labK(v));rep=N(row?.rep)||1;}
  for(const pg of pages){const l=levelRow(pg);l.text=text;l.rep=rep;}
  if(isDxf&&$('mk100o')?.checked){for(const pg of pages)window.dxf00Page74?.(pg);
   // as outras plantas DXF sem origem própria também passam a usar o 0,0 (senão não alinham)
   for(const p of pgs())if(!pages.includes(N(p.id))&&p.source?.type==='dxf'&&!state.origins74?.[p.id])window.dxf00Page74?.(p.id);}
  box.hidden=true;try{window.editLevel53&&state.levels53.length&&window.editLevel53(state.levels53.findIndex(l=>String(l.page)===String(pages[0])),'text',text);}catch(e){console.error(e);}
  try{window.loads77?.touch?.();}catch{}try{window.invalidate3D74?.();}catch{}
  const key=L68().keyOf(pages[0]);try{await L68().switchTo(key,true);}catch(e){console.error(e);}try{const E=window.lvl92?.entries?.()||[];const e=E.find(x=>x.empty&&x.wallKey===key)||E.find(x=>x.wallKey===key&&!x.id.startsWith('l|'));if(e)await window.lvl92.go(e.id,true);}catch{}
  msg('Máscara '+(src.name||'')+' atribuída a '+L68().nameOf(key)+'. As paredes que você propuser ou desenhar sobre ela ficam nesse pavimento.');try{drawPlan();}catch{}};}
{const ap=addPlant36;addPlant36=async function(file,stored){const n0=(window.plants36||plants36).length;const r=await ap.apply(this,arguments);try{if(!stored&&!window.mk100skip&&plants36.length>n0&&plants36.length>1){const src=plants36[plants36.length-1];setTimeout(()=>chooser(src),350);}}catch(e){console.error('V100 máscara',e);}return r;};}

// ---------- 2. máscara de referência (só para ver)
const cache=new Map();
{const rp=renderPage;renderPage=async function(...a){const r=await rp.apply(this,a);try{const pg=N($('page').value);if(typeof image!=='undefined'&&image)cache.set(pg,image);}catch{}return r;};}
let ref=0;const refSel=document.createElement('select');refSel.id='mk100ref';refSel.title='Máscara de referência: mostra a máscara de outro pavimento por cima, só para consulta (não muda as paredes)';
function fillRef(){const cur=N($('page').value);const html='<option value="0">Máscara: só a do nível</option>'+pgs().filter(p=>N(p.id)!==cur).map(p=>'<option value="'+p.id+'">Ver também: '+esc(p.name)+(p.local>1?' p.'+p.local:'')+' · '+esc(L68().nameOf(L68().keyOf(p.id)))+'</option>').join('');if(refSel.__h!==html){refSel.innerHTML=html;refSel.__h=html;}if(ref&&(ref===cur||!pgs().some(p=>N(p.id)===ref)))ref=0;refSel.value=String(ref);refSel.style.display=pgs().length>1?'':'none';}
refSel.onchange=()=>{ref=N(refSel.value)||0;const p=pgs().find(p=>N(p.id)===ref);if(ref&&!(p?.source?.type==='dxf'&&p.source.canvas)&&!cache.has(ref))msg('Máscara de PDF ainda não carregada: abra o nível dela uma vez e volte — depois ela aparece aqui como referência.');try{drawPlan();}catch{}};
{const host=$('lvlHost85');if(host)host.append(refSel);}
function refImg(pg){const p=pgs().find(p=>N(p.id)===pg);if(p?.source?.type==='dxf'&&p.source.canvas)return p.source.canvas;return cache.get(pg)||null;}
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{fillRef();if(ref&&typeof image!=='undefined'&&image)drawRef();}catch(e){console.error('V100 referência',e);}return r;};}
function drawRef(){const img=refImg(ref);if(!img||!window.world74||!window.toPage74)return;const cur=N($('page').value),c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0};
 const M=Q=>window.toPage74(cur,window.world74(ref,Q)),P0=M({x:0,y:0}),P1=M({x:1000,y:0}),P2=M({x:0,y:1000});if(![P0,P1,P2].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)))return;
 ctx.save();ctx.setTransform((P1.x-P0.x)/1000,(P1.y-P0.y)/1000,(P2.x-P0.x)/1000,(P2.y-P0.y)/1000,P0.x-o.x,P0.y-o.y);ctx.globalAlpha=.3;ctx.drawImage(img,0,0);ctx.restore();
 (window.hud88||[]).push?.({t:'Máscara de referência: '+(pgs().find(p=>N(p.id)===ref)?.name||'')+' (só para ver)',c:'#7c3aed'});}

// ---------- 3. alinhar com o de baixo (MOVE: ponto desta planta → mesmo ponto no fantasma de baixo)
let A=null;
function belowWalls(){const cur=L68().keyOf(N($('page').value)),v=valK(cur);const keys=L68().levelKeys().filter(k=>valK(k)<v-1e-6);const kb=keys.at(-1);if(!kb)return [];return L68().all().filter(w=>w.line&&L68().keyOf(N(w.page||1))===kb);}
function rawP(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
function snapList(stage){const pg=N($('page').value),out=[];if(stage===1){try{for(const q of (typeof fixedPoints!=='undefined'&&fixedPoints)||[])out.push(q);}catch{}for(const w of state.walls)if(w.line&&N(w.page||1)===pg)out.push(...w.line);}
 else for(const w of belowWalls())for(const Q of w.line)out.push(window.toPage74(pg,window.world74(N(w.page||1),Q)));return out;}
function snapP(P,stage){const tol=14/(zoom||1);let b=null,bd=tol;for(const q of snapList(stage)){const d=Math.hypot(q.x-P.x,q.y-P.y);if(d<bd){bd=d;b=q;}}return b?{x:b.x,y:b.y,snap:true}:P;}
function start(){if(typeof image==='undefined'||!image){msg('Carregue a planta primeiro.');return;}if(!belowWalls().length){msg('Não há pavimento com paredes abaixo deste para alinhar.');return;}
 try{(window.stopAll108||window.cancelTool56)?.();}catch{}A={stage:1,p1:null,hover:null};document.body.classList.add('tool56','al100');if(!document.body.classList.contains('ghost74'))$('ghost74btn')?.click();
 msg('⤢ Alinhar: 1) clique um ponto DESTA máscara (ex.: canto da escada ou do prédio — o quadradinho verde mostra o encaixe). Esc cancela.');drawPlan();}
function stop(t){A=null;document.body.classList.remove('tool56','al100');if(t)msg(t);try{drawPlan();}catch{}}
document.addEventListener('click',e=>{if(!A||e.target!==$('plan'))return;e.stopImmediatePropagation();e.preventDefault();const P=snapP(rawP(e),A.stage);
 if(A.stage===1){A.p1=P;A.stage=2;msg('⤢ Alinhar: 2) agora clique o MESMO ponto no fantasma de baixo (roxo tracejado). Esc cancela.');drawPlan();return;}
 const pg=N($('page').value),o=window.originOf74?.(pg)||state.origins74?.[pg]||{x:0,y:0},dx=A.p1.x-P.x,dy=A.p1.y-P.y;state.origins74??={};
 const n={...o,x:N(o.x)+dx,y:N(o.y)+dy,how:'align'};if(Number.isFinite(N(o.ax))){n.ax=N(o.ax)+dx;n.ay=N(o.ay)+dy;}state.origins74[pg]=n;
 try{window.loads77?.touch?.();}catch{}try{window.invalidate3D74?.();}catch{}stop('⤢ Máscara alinhada com o pavimento de baixo (deslocada '+(Math.hypot(dx,dy)/((typeof pxCm==='number'&&pxCm>0)?pxCm:1)).toFixed(0)+' cm). Confira no fantasma; Ctrl+Z desfaz.');},true);
document.addEventListener('mousemove',e=>{if(!A||e.target!==$('plan'))return;A.hover=snapP(rawP(e),A.stage);try{drawPlan();}catch{}});
document.addEventListener('keydown',e=>{if(A&&e.key==='Escape'){stop('Alinhar cancelado.');e.preventDefault();}});
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{if(A&&typeof image!=='undefined'&&image){const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},z=window.zoom88?.fitZ?.()||zoom||1;ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);
 if(A.p1){ctx.fillStyle='#d1462f';ctx.beginPath();ctx.arc(A.p1.x,A.p1.y,6/z,0,7);ctx.fill();}
 if(A.hover){ctx.fillStyle=A.hover.snap?'#16a34a':'#555';const s=(A.hover.snap?10:6)/z;ctx.fillRect(A.hover.x-s/2,A.hover.y-s/2,s,s);if(A.p1){ctx.strokeStyle='#d1462f';ctx.setLineDash([6/z,4/z]);ctx.lineWidth=1.5/z;ctx.beginPath();ctx.moveTo(A.p1.x,A.p1.y);ctx.lineTo(A.hover.x,A.hover.y);ctx.stroke();ctx.setLineDash([]);}}
 ctx.restore();}}catch(e){console.error('V100 alinhar',e);}return r;};}
window.align100={start,stop};window.mask100={chooser,ref:()=>ref,setRef:v=>{ref=N(v)||0;drawPlan();}};
const css=document.createElement('style');css.textContent=
 '#mk100{position:fixed;top:120px;left:50%;transform:translateX(-50%);width:440px;max-width:calc(100vw - 32px);z-index:70;background:#fff;border:1px solid #b9c6d3;border-radius:10px;box-shadow:0 14px 34px rgba(16,46,75,.28);font-size:13px}#mk100[hidden]{display:none}'+
 '#mk100 .h100{padding:9px 12px;background:#eef3f8;border-bottom:1px solid #d5dee7;border-radius:10px 10px 0 0}#mk100 .h100 span{display:block;color:#5b6d7f;font-size:11.5px}#mk100 .b100{padding:10px 12px}'+
 '#mk100 .o100{display:block;margin:5px 0}#mk100 .n100{display:flex;gap:10px;margin:4px 0 8px 22px}#mk100 .n100 label{display:flex;flex-direction:column;font-size:11.5px;color:#40566b}#mk100 .n100 input{margin:0;width:140px}'+
 '#mk100 .s100{color:#5b6d7f;font-size:12px;margin:8px 0 2px}#mk100 .c100{display:block;margin:10px 0 0;font-size:12.5px}#mk100 .w100{color:#a33a00;font-size:12px;min-height:1em;margin:6px 0}#mk100 .a100{display:flex;justify-content:flex-end}#mk100 .a100 button{margin:0}'+
 '#mk100 input[type=radio],#mk100 input[type=checkbox]{width:auto!important;display:inline-block!important;margin:0 6px 0 0!important;vertical-align:middle;min-height:0;padding:0}#mk100 .o100,#mk100 .c100{display:flex!important;align-items:flex-start;gap:4px;cursor:pointer}#mk100 .c100 input{margin-top:2px!important}'+
 '#mk100ref{max-width:230px;font-size:12px}body.al100 #plan{cursor:crosshair}';
document.head.append(css);
})();
