// V65 — lista fixa de aberturas na seção 3 e ferramentas da planta numa coluna à esquerda (área de trabalho maior)
(function(){
'use strict';
const N=v=>Number(v);const f1=v=>N(v).toLocaleString('pt-BR',{maximumFractionDigits:1});
const isDoor=o=>o.type==='Porta'||(o.type!=='Janela'&&!(N(o.bottom)>0));
// ---------- A. Aberturas sempre visíveis na seção 3
function listOpenings(){const tableWrap=$('walls')?.closest('.scroll');if(!tableWrap)return;let box=$('openList62');
 if(!box){box=document.createElement('div');box.id='openList62';box.className='openList62';tableWrap.after(box);}
 try{window.ensureTags58?.();}catch{}
 const rows=[];state.walls.forEach((w,wi)=>(w.openings||[]).forEach((o,oi)=>rows.push({w,wi,o,oi})));
 rows.sort((a,b)=>{const ta=String(a.o.tag58||''),tb=String(b.o.tag58||'');return ta[0]===tb[0]?(N(ta.slice(1))||0)-(N(tb.slice(1))||0):ta<tb?1:-1;});
 const ok=rows.filter(r=>r.o.confirmed58).length;
 box.innerHTML='<h3>Aberturas <span class="note">'+rows.length+' cadastrada(s) · '+ok+' conferida(s)</span></h3>'+(rows.length?'<div class="scroll"><table><thead><tr><th>Nº</th><th>Parede</th><th>Tipo</th><th>Início (cm)</th><th>Largura (cm)</th><th>Peitoril (cm)</th><th>Altura (cm)</th><th>Conferida</th><th></th></tr></thead><tbody>'+rows.map(r=>'<tr class="'+(isDoor(r.o)?'door62':'win62')+'"><td><b>'+esc(r.o.tag58||'—')+'</b></td><td>Parede '+(r.wi+1)+'</td><td>'+(isDoor(r.o)?'Porta':'Janela')+'</td><td>'+f1(r.o.start)+'</td><td>'+f1(r.o.width)+'</td><td>'+f1(r.o.real73?r.o.real73.bottom:(N(r.o.bottom)||0))+'</td><td>'+f1(r.o.real73?r.o.real73.height:r.o.height)+(r.o.real73?' <span class="note" title="Fora das fiadas: vão de alvenaria até a fiada, complemento hachurado">(vão '+f1(r.o.real73.mod.height)+')</span>':'')+'</td><td><input type="checkbox" data-c62="'+r.wi+','+r.oi+'" '+(r.o.confirmed58?'checked':'')+'></td><td class="act62"><button type="button" class="secondary" data-e62="'+r.wi+','+r.oi+'">Editar</button><button type="button" class="secondary" data-v62="'+r.wi+','+r.oi+'">Ver na planta</button><button type="button" class="danger" data-x62="'+r.wi+','+r.oi+'">Excluir</button></td></tr>').join('')+'</tbody></table></div>':'<p class="note">Nenhuma abertura cadastrada ainda. Clique dentro de um vão na planta ou use “Procurar portas e janelas de novo”.</p>');
 const at=s=>{const[a,b]=s.split(',').map(Number);return {w:state.walls[a],oi:b};};
 box.querySelectorAll('[data-c62]').forEach(c=>c.onchange=()=>{const{w,oi}=at(c.dataset.c62);if(w?.openings?.[oi]){w.openings[oi].confirmed58=c.checked;const h=box.querySelector('h3 .note');const all=state.walls.flatMap(x=>x.openings||[]);if(h)h.textContent=all.length+' cadastrada(s) · '+all.filter(o=>o.confirmed58).length+' conferida(s)';try{drawPlan();}catch{}}});
 box.querySelectorAll('[data-e62]').forEach(b=>b.onclick=()=>{const{w,oi}=at(b.dataset.e62);const r=b.getBoundingClientRect();window.openReg54?.(w,oi,r.left-260,r.top-40);});
 box.querySelectorAll('[data-x62]').forEach(b=>b.onclick=()=>{const{w,oi}=at(b.dataset.x62);const o=w?.openings?.[oi];if(!o||!confirm('Excluir '+(o.tag58||'a abertura')+' da Parede '+(state.walls.indexOf(w)+1)+'?'))return;w.openings.splice(oi,1);renderWalls();invalidate();drawPlan();});
 box.querySelectorAll('[data-v62]').forEach(b=>b.onclick=()=>{const{w,oi}=at(b.dataset.v62);const o=w?.openings?.[oi];if(!o||!w.line)return;const c=$('plan'),wr=$('planWrap'),[A,B]=w.line,t=(N(o.start)+N(o.width)/2)/N(w.length),P={x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t},og=c.planOrigin25||{x:0,y:0},r=c.getBoundingClientRect();
  if(String(w.page||1)!==String($('page').value)){$('planStatus').textContent='Essa abertura está na planta da página '+(w.page||1)+'. Troque a página para vê-la.';return;}
  wr.scrollLeft=c.offsetLeft+(P.x-og.x)*r.width/c.width-wr.clientWidth/2;wr.scrollTop=c.offsetTop+(P.y-og.y)*r.height/c.height-wr.clientHeight/2;wr.scrollIntoView({behavior:'smooth',block:'center'});flash={w,o,until:Date.now()+2500};drawPlan();setTimeout(()=>drawPlan(),2600);});}
let flash=null;
const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);if(flash&&Date.now()<flash.until&&image&&flash.w.line){const c=$('plan'),ctx=c.getContext('2d'),og=c.planOrigin25||{x:0,y:0},[A,B]=flash.w.line,L=N(flash.w.length),p=s=>({x:A.x+(B.x-A.x)*s/L,y:A.y+(B.y-A.y)*s/L}),p0=p(N(flash.o.start)),p1=p(N(flash.o.start)+N(flash.o.width));ctx.save();ctx.setTransform(1,0,0,1,-og.x,-og.y);ctx.strokeStyle='rgba(242,183,5,.85)';ctx.lineWidth=14;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);ctx.stroke();ctx.restore();}return r;};
const rw=renderWalls;renderWalls=function(...a){const r=rw.apply(this,a);try{listOpenings();}catch(e){console.error(e);}return r;};
const iv=invalidate;invalidate=function(...a){const r=iv.apply(this,a);try{listOpenings();}catch(e){console.error(e);}return r;};
window.listOpenings62=listOpenings;

// ---------- B. Ferramentas da planta numa coluna à esquerda
function layout(){const wrap=$('planWrap');if(!wrap||$('work62'))return;const status=$('planStatus');
 const work=document.createElement('div');work.id='work62';work.className='work62';const side=document.createElement('aside');side.id='tools62';side.className='tools62 noPrint';const main=document.createElement('div');main.className='main62';
 wrap.before(work);work.append(main,side);let right=true;try{right=localStorage.getItem('tools62side')!=='left';}catch{}work.classList.toggle('left62',!right);if(status)main.append(status);main.append(wrap);const tool56=$('walltool56');if(tool56)status.after(tool56);
 const group=(title,ids,open=true)=>{const g=document.createElement('details');g.className='grp62';g.open=open;const s=document.createElement('summary');s.textContent=title;g.append(s);const body=document.createElement('div');body.className='grpBody62';for(const id of ids){const el=typeof id==='string'?$(id):id;if(!el)continue;const lab=el.closest('label');body.append(lab&&lab!==side&&!lab.contains(side)&&el.tagName!=='BUTTON'?lab:el);}g.append(body);side.append(g);return body;};
 group('Planta',['pdf','page','scaleBtn','reference']);
 group('Paredes',['detect','traceBtn','join56','axis56','extend56','cut56','deleteWall','undoDelete','numberWalls','classifyWalls24']);
 group('Aberturas',['rescan54','newvao54','openingBtn']);
 const vis=group('Vista',['zoomIn','zoomOut','cancel']);
 const fs=document.createElement('button');fs.type='button';fs.id='full62';fs.className='secondary';fs.textContent='⛶ Tela cheia';fs.title='Usa a tela inteira para a planta (clique de novo para voltar).';fs.onclick=()=>{const on=!work.classList.contains('full62');work.classList.toggle('full62',on);document.body.classList.toggle('full62on',on);fs.textContent=on?'⤡ Sair da tela cheia':'⛶ Tela cheia';};vis.append(fs);
 const sw=document.createElement('button');sw.type='button';sw.id='side62';sw.className='secondary';sw.textContent='⇄ Trocar lado das ferramentas';sw.onclick=()=>{const left=!work.classList.contains('left62');work.classList.toggle('left62',left);try{localStorage.setItem('tools62side',left?'left':'right');}catch{}};vis.append(sw);
 group('Ajustes',['detectWidth','snapRadius','minimum','maxCut23','allowCuts23','snap'],false);
 const ico={scaleBtn:'📏',detect:'▦',traceBtn:'✎',join56:'⌐',axis56:'↔',extend56:'⟷',cut56:'✂',deleteWall:'✖',undoDelete:'↶',numberWalls:'#',classifyWalls24:'◧',rescan54:'⌕',zoomIn:'⊕',zoomOut:'⊖',cancel:'⎋'};
 for(const[id,ic]of Object.entries(ico)){const b=$(id);if(b&&side.contains(b)){const i=document.createElement('span');i.className='ico62';i.textContent=ic;b.prepend(i);}}
 // esconde contêineres que ficaram vazios
 for(const sel of ['.plantWorkspaceTools37','.projectWork37','.plantActions37','.plantFields37','.actionGroups37','.parameterFields37']){document.querySelectorAll(sel).forEach(el=>{const has=[...el.querySelectorAll('button,input,select')].length;if(!has)el.style.display='none';});}
 document.querySelectorAll('.actionGroup37').forEach(g=>{if(!g.querySelector('button,input,select'))g.style.display='none';});
 // Enter repete a última ferramenta usada (como no CAD), até clicar em outra ferramenta
 let last62=null;const skip62=['zoomIn','zoomOut','full62','side62','cancel','undoDelete'];
 side.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!side.contains(b)||b.disabled||skip62.includes(b.id))return;if(last62&&last62!==b)last62.classList.remove('last62');last62=b;b.classList.add('last62');b.title=(b.title||'').replace(/ · Enter repete$/,'')+' · Enter repete';},true);
 const idle62=()=>!mode&&!document.body.classList.contains('tool56')&&!window.mark57on&&!document.body.classList.contains('newvao54')&&!document.querySelector('#pop54')&&!document.querySelector('dialog[open]');
 window.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||!last62)return;const t=e.target;if(t?.closest?.('input,select,textarea,[contenteditable="true"]'))return;if(t?.closest?.('button')&&!side.contains(t))return;if(!idle62()){if(t&&side.contains(t))e.preventDefault();return;}if(last62.disabled||!document.contains(last62))return;
  e.preventDefault();e.stopImmediatePropagation();last62.click();const st=$('planStatus');if(st&&!/Enter repete/.test(st.textContent))st.textContent+=' (Enter repete “'+last62.textContent.trim()+'”.)';},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&work.classList.contains('full62')&&!document.querySelector('#pop54')&&!document.body.classList.contains('tool56')){fs.click();}});}
const css=document.createElement('style');css.textContent=`
.work62{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:14px;align-items:start;margin-top:8px}
.work62.left62{grid-template-columns:260px minmax(0,1fr)}.work62.left62 .tools62{order:-1}
.tools62{position:sticky;top:8px;display:flex;flex-direction:column;gap:10px;max-height:calc(100vh - 16px);overflow:auto;padding:12px;border:1px solid #cfdceb;border-radius:12px;background:linear-gradient(180deg,#f7fafd,#eef4fa);box-shadow:0 2px 10px rgba(16,46,75,.08)}
.grp62{background:#fff;border:1px solid #dde7f1;border-radius:10px;padding:8px 10px}
.grp62>summary{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#102e4b;cursor:pointer;padding:2px 0 6px;list-style:none;border-bottom:2px solid #e4edf6;margin-bottom:6px}
.grp62>summary::-webkit-details-marker{display:none}
.grp62>summary::before{content:'▾';color:#2f6fa8;margin-right:6px}.grp62:not([open])>summary::before{content:'▸'}.grp62:not([open])>summary{border-bottom:none;margin-bottom:0;padding-bottom:2px}
.grpBody62{display:flex;flex-direction:column;gap:6px}
.tools62 button{width:100%;text-align:left;font-size:14px;padding:9px 11px;margin:0;line-height:1.25;white-space:normal;border-radius:8px;display:flex;align-items:center;gap:8px}
.tools62 button:not(.secondary){box-shadow:0 1px 3px rgba(16,46,75,.18)}
.tools62 button.last62{outline:2px solid #f2b705;outline-offset:1px}.tools62 button.last62::after{content:'↵';margin-left:auto;font-weight:700;color:#b07d00}
.tools62 .ico62{display:inline-flex;justify-content:center;width:20px;flex:0 0 20px;font-size:15px;opacity:.85}
.tools62 label{display:flex;flex-direction:column;font-size:12.5px;font-weight:600;color:#2b4a66;gap:3px;margin:0}
.tools62 label input,.tools62 label select{width:100%;box-sizing:border-box;font-size:13.5px;padding:6px 8px}
.tools62 label:has(input[type=checkbox]){flex-direction:row;align-items:center;gap:8px;font-weight:500}
.tools62 label input[type=checkbox]{width:auto}
.tools62 input[type=file]{font-size:12px}
.main62{min-width:0}
.main62 #planWrap{max-height:none!important;height:calc(100vh - 110px);min-height:520px}
.main62 #planStatus{margin:0 0 6px}
.work62.full62{position:fixed;inset:0;z-index:4000;background:#fff;margin:0;padding:8px}
.work62.full62 #planWrap{height:calc(100vh - 70px)}
.work62.full62 .tools62{max-height:calc(100vh - 16px)}
body.full62on{overflow:hidden}
@media (max-width:900px){.work62,.work62.left62{grid-template-columns:1fr}.tools62{position:static;max-height:none}.tools62 .grpBody62{flex-direction:row;flex-wrap:wrap}.tools62 button{width:auto}}
.openList62{margin:14px 0 6px}.openList62 h3{margin:0 0 6px;font-size:16px;color:#174a78}.openList62 h3 .note{font-weight:400;font-size:13px;margin-left:8px}
.openList62 tr.door62 td:first-child b{color:#1d6b3a}.openList62 tr.win62 td:first-child b{color:#1769c2}
.openList62 td.act62{white-space:nowrap}.openList62 td.act62 button{padding:3px 8px;font-size:12px;margin-right:4px}
@media print{.openList62{display:none}}`;
document.head.append(css);
try{layout();}catch(e){console.error('layout V65',e);}
try{listOpenings();}catch(e){console.error(e);}
})();
