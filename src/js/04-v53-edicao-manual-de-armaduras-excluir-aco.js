// V53 — edição manual de armaduras: excluir aço automático, adicionar reforço manual e arrastar.
(function(){
'use strict';
const OUT53=1000,DIAMETERS=[8,10,12.5],dia=v=>Number(v).toFixed(1).replace('.',',');
let addMode53=null,editing53=null;

function wallData53(i){return state.steel?.[i];}
function stepOf53(m){return Number(m?.step)||((Number(state.blocks.find(b=>b.active!==false&&b.type!=='Canaleta')?.height)||19)+num($('jv').value));}
function planXY53(w,t){if(!w.line)return {x:null,y:null};const[p,q]=w.line,len=Math.hypot(q.x-p.x,q.y-p.y),scale=Number(w.planScale)||len/Number(w.length);return {x:p.x+(q.x-p.x)/len*t*scale,y:p.y+(q.y-p.y)/len*t*scale};}

// ---------- montagem: remove excluídos, inclui manuais e renumera as posições N
const buildSteelBase53=buildSteel;
buildSteel=function(){const data=buildSteelBase53();state.steelRemoved53??={};state.steelManual53??=[];const removed=state.steelRemoved53;
 for(const d of data){const w=state.walls[d.i],m=state.results?.[d.i];d.removedKeys53=[];
  d.horizontals=d.horizontals.filter(b=>{if(removed[b.key]){if(!d.removedKeys53.includes(b.key))d.removedKeys53.push(b.key);return false;}return true;});
  d.points=d.points.filter(p=>{if(removed[p.overrideKey]){if(!d.removedKeys53.includes(p.overrideKey))d.removedKeys53.push(p.overrideKey);return false;}return true;});
  if(!w||!m?.rows?.length)continue;const step=stepOf53(m),L=Number(m.L)||Number(w.length);
  state.steelManual53.filter(s=>s.wall===w.uid).forEach((s,k)=>{const diameter=DIAMETERS.includes(Number(s.diameter))?Number(s.diameter):10,quantity=Math.max(1,Math.min(20,Math.round(Number(s.quantity)||1))),length=Math.max(1,Number(s.length)||1);
   if(s.kind==='vertical'){const t=Math.max(-OUT53,Math.min(L+OUT53,Number(s.t)||0)),xy=planXY53(w,t);d.points.push({t,...xy,owner:d.i,type:'Reforço manual',key:'manual|'+s.id,overrideKey:'manual|'+s.id,manual53:s.id,diameter,quantity,length,note:s.note||''});}
   else{const row=Math.max(1,Math.min(m.rows.length,Math.round(Number(s.row)||1))),r=m.rows[row-1],h=Number(r.pieces.find(p=>!p.fill)?.height)||step-num($('jv').value),x0=Math.max(-OUT53,Math.min(L+OUT53,Number(s.start)||0));
    d.horizontals.push({start:x0-2.5,end:x0+length+2.5,y:(row-1)*step,height:h,row,kind:'Reforço manual',length,quantity,diameter,layer:'manual',key:'manual|'+s.id,editIndex:100000+k,manual53:s.id,note:s.note||''});}});
 }
 // renumeração única (mesma regra do V25: bitola + comprimento)
 const marks=new Map();let next=1;const mark=(diameter,length)=>{const key=diameter+'|'+Number(length).toFixed(4);if(!marks.has(key))marks.set(key,'N'+next++);return marks.get(key);};
 for(const d of data){d.groups=[];for(const b of d.horizontals){b.n=mark(b.diameter,b.length);let g=d.groups.find(g=>g.n===b.n);if(!g){g={n:b.n,diameter:b.diameter,length:b.length,quantity:0,kinds:new Set()};d.groups.push(g);}g.quantity+=b.quantity;g.kinds.add(b.kind);}d.horizontal=d.groups[0]?.n||'';
  d.verticalGroups=[];for(const p of d.points){p.n=mark(p.diameter,p.length);let g=d.verticalGroups.find(g=>g.n===p.n);if(!g){g={n:p.n,diameter:p.diameter,length:p.length,quantity:0,ownedQuantity:0};d.verticalGroups.push(g);}g.quantity+=p.quantity;if(p.owner===d.i)g.ownedQuantity+=p.quantity;}
  d.vertical=d.points.find(p=>!p.manual53)?.n||d.points[0]?.n||'';d.quantity=d.points.reduce((n,p)=>n+p.quantity,0);d.cutQuantity=d.points.filter(p=>p.owner===d.i).reduce((n,p)=>n+p.quantity,0);d.shared=d.points.filter(p=>p.owner!==d.i).map(p=>p.n+' (Parede '+(p.owner+1)+')');}
 return data;};

// ---------- desenho: barras manuais com alça de arrasto; o desenho automático segue o padrão anterior
const steelWallBase53=steelWall;
steelWall=function(w,m,which,from,pad,k){const i=state.walls.indexOf(w),d=wallData53(i);if(!d)return steelWallBase53(w,m,which,from,pad,k);
 const P=d.points,Hs=d.horizontals;d.points=P.filter(p=>!p.manual53);d.horizontals=Hs.filter(b=>!b.manual53);let out;try{out=steelWallBase53(w,m,which,from,pad,k);}finally{d.points=P;d.horizontals=Hs;}
 const map=`data-man53-pad="${pad}" data-man53-k="${k}" data-man53-from="${from}" data-man53-h="${m.H}" data-man53-wall="${i}" data-man53-view="${which}"`;
 if(which==='elevation')out+=`<g data-wallmap53="${i}" ${map}></g>`;
 const baseCount=Hs.filter(b=>!b.manual53).length;let hi=0;
 for(const b of Hs.filter(b=>b.manual53)){if(which!=='elevation')continue;const a=pad+(b.start+2.5-from)*k,z=a+b.length*k,yy=pad+(m.H-b.y-b.height*.75)*k,dy=11.5+(baseCount+hi++)*6;
  out+=`<g data-man53="${b.manual53}" ${map} class="man53" style="cursor:grab" ondblclick="event.stopPropagation();openManualSteel53(${i},'${b.manual53}')"><title>Reforço manual ${esc(b.n)} — arraste para mover; dois cliques para editar ou excluir</title>`;
  for(let n=0;n<b.quantity;n++)out+=`<line x1="${a}" y1="${yy+(n-(b.quantity-1)/2)*.6}" x2="${z}" y2="${yy+(n-(b.quantity-1)/2)*.6}" stroke="#0b5fd0" stroke-width=".55"/>`;
  out+=`<line x1="${a}" y1="${yy}" x2="${z}" y2="${yy}" stroke="transparent" stroke-width="3" data-hit="true"/><line x1="${a}" y1="${dy}" x2="${z}" y2="${dy}" stroke="#111" stroke-width=".35"/><text x="${a+1}" y="${dy-1.5}" font-size="2.1" fill="#0b5fd0">${esc(b.n)} · ${b.quantity} Ø${dia(b.diameter)} · C=${fmt(b.length)} cm · reforço manual${b.note?' · '+esc(b.note):''}</text></g>`;}
 let vi89=0;for(const p of P.filter(p=>p.manual53)){const x=pad+(p.t-from)*k;
  if(which==='elevation'){const yb=pad+(m.H+10)*k,yt=yb-p.length*k,ty=pad+m.H*k+10+(vi89++)*3.2;out+=`<g data-man53="${p.manual53}" ${map} class="man53" style="cursor:grab" ondblclick="event.stopPropagation();openManualSteel53(${i},'${p.manual53}')"><title>Reforço manual ${esc(p.n)} — arraste para mover; dois cliques para editar ou excluir</title>`;
   for(let n=0;n<p.quantity;n++){const dx=(n-(p.quantity-1)/2)*.65;out+=`<line x1="${x+dx}" y1="${yt}" x2="${x+dx}" y2="${yb}" stroke="#0b5fd0" stroke-width=".55"/>`;}
   out+=`<line x1="${x}" y1="${yt}" x2="${x}" y2="${yb}" stroke="transparent" stroke-width="3" data-hit="true"/>`+steelArrow(x,yb,x+1,ty,p.n)+`<text x="${x+1}" y="${ty+2.6}" font-size="2" fill="#0b5fd0">${esc(p.n)} · ${p.quantity} Ø${dia(p.diameter)} · C=${fmt(p.length)} · manual</text></g>`;}
  else{const y=pad+Number(w.width)*k/2;out+=`<g data-man53="${p.manual53}" ${map}>`;for(let n=0;n<p.quantity;n++)out+=`<circle cx="${x+(n-(p.quantity-1)/2)*.65}" cy="${y}" r=".2" data-steel-dot37="true" fill="#111"/>`;out+=steelArrow(x,y,x+1,pad-3,p.n)+'</g>';}}
 return out;};

// ---------- reforço fora da parede: alarga a área do desenho sem mudar as cotas
function extent53(w,m){const i=state.walls.indexOf(w),d=wallData53(i);if(!d||!m?.rows?.length)return {l:0,r:0};const ps=m.rows.flatMap(r=>r.pieces),from=m.manual?Math.min(m.drawFrom??0,...ps.map(p=>p.x)):m.drawFrom??0,to=m.manual?Math.max(m.drawTo??m.L,...ps.map(p=>p.x+p.length+p.joint)):m.drawTo??m.L;
 const xs=[...d.points.filter(p=>p.manual53).map(p=>p.t),...d.horizontals.filter(b=>b.manual53).flatMap(b=>[b.start+2.5,b.start+2.5+b.length])];if(!xs.length)return {l:0,r:0};return {l:Math.max(0,from-Math.min(...xs)),r:Math.max(0,Math.max(...xs)-to)};}
const svgWallBase53=svgWall;
svgWall=function(w,m,which){let html=svgWallBase53(w,m,which);const e=extent53(w,m);if(!(e.l>.01||e.r>.01))return html;const k=10/Math.max(1,num($('scale').value)),L=e.l>.01?e.l*k+6:0,R=e.r>.01?e.r*k+6:0;
 const match=html.match(/viewBox="([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)"/);if(!match)return html;const a=match.slice(1).map(Number),width=a[2]+L+R;
 return html.replace(match[0],`viewBox="${a[0]-L} ${a[1]} ${width} ${a[3]}"`).replace(/width="[\d.e+-]+mm"/,`width="${width}mm"`).replace(/style="width:[\d.e+-]+mm;/,`style="width:${width}mm;`);};
const wallDrawingWidthBase53=wallDrawingWidth21;
wallDrawingWidth21=function(w,m,which){const base=wallDrawingWidthBase53(w,m,which),e=extent53(w,m),k=10/Math.max(1,num($('scale').value));return base+(e.l>.01?e.l*k+6:0)+(e.r>.01?e.r*k+6:0);};

// ---------- editor automático: botão para excluir; manuais abrem o editor próprio
const openSteelEditorBase53=openSteelEditor;
openSteelEditor=function(wall,kind,index){const d=wallData53(wall),p=kind==='vertical'?d?.points[index]:d?.horizontals.find(b=>b.editIndex===index);if(p?.manual53){openManualSteel53(wall,p.manual53);return;}
 openSteelEditorBase53(wall,kind,index);const ed=$('steelEditor');if(!ed.open||!steelEditing19)return;const b=document.createElement('button');b.textContent='Excluir este aço';b.className='danger53';b.onclick=()=>{const shared=kind==='vertical'&&p&&p.owner!==wall?' Este vertical é de um encontro e sai também da Parede '+(p.owner+1)+'.':'';if(!confirm('Excluir '+(p?.n||'este aço')+' da Parede '+(wall+1)+'?'+shared+' Você pode restaurar depois em “Restaurar aços excluídos”.'))return;state.steelRemoved53??={};state.steelRemoved53[steelEditing19.key]=true;refreshSteel19();};ed.append(b);};

// ---------- diálogo do reforço manual
function options53(v){return DIAMETERS.map(d=>`<option value="${d}" ${Number(v)===d?'selected':''}>Ø${dia(d)} mm</option>`).join('');}
window.openManualSteel53=function(wall,id,preset){const w=state.walls[wall],m=state.results?.[wall];if(!w||!m?.rows?.length)return;state.steelManual53??=[];const s=id?state.steelManual53.find(x=>x.id===id):null;if(id&&!s)return;
 const v=s||preset||{kind:'vertical',t:Number(m.L)/2,row:1,start:0,length:Number(m.H)+10,diameter:steelDiameter('vertical'),quantity:1};editing53={wall,id:s?.id||null};const rows=m.rows.length;
 const ed=$('steelEditor');ed.innerHTML=`<h3 id="steelEditorTitle21">${s?'Editar':'Adicionar'} reforço manual · Parede ${wall+1}</h3><p class="note">A posição é medida desde a origem da parede (cm). O reforço pode ficar fora da parede, para ligação com pilar, viga ou outro elemento: use valor negativo para antes do início e valor maior que o comprimento (${fmt(m.L)} cm) para depois do fim. Depois de criado, arraste o reforço na elevação para ajustar a posição; dois cliques reabrem esta janela.</p>
 <div class="row"><label>Tipo<select id="man53Kind" onchange="manualKind53()"><option value="vertical" ${v.kind==='vertical'?'selected':''}>Vertical (graute)</option><option value="horizontal" ${v.kind==='horizontal'?'selected':''}>Horizontal (canaleta / verga / contraverga)</option></select></label>
 <label>Bitola<select id="man53Diameter">${options53(v.diameter)}</select></label><label>Quantidade de barras<input id="man53Quantity" type="number" min="1" max="20" step="1" value="${v.quantity||1}"></label><label>Comprimento da barra (cm)<input id="man53Length" type="number" min="1" step="1" value="${Math.round(Number(v.length)||100)}"></label></div>
 <div class="row"><label data-man53-only="vertical">Posição do vertical (cm)<input id="man53T" type="number" step="0.5" value="${Math.round((Number(v.t)||0)*2)/2}"></label>
 <label data-man53-only="horizontal">Início da barra (cm)<input id="man53Start" type="number" step="0.5" value="${Number(v.start)||0}"></label><label data-man53-only="horizontal">Fiada (1 a ${rows})<input id="man53Row" type="number" min="1" max="${rows}" step="1" value="${v.row||1}"></label>
 <label>Observação (opcional)<input id="man53Note" type="text" maxlength="40" value="${esc(v.note||'')}" placeholder="ex.: reforço da janela"></label></div><p id="steelEditorError21" role="alert" style="color:#a22"></p>
 <button onclick="saveManualSteel53()">${s?'Salvar':'Adicionar'}</button> ${s?'<button class="danger53" onclick="deleteManualSteel53()">Excluir reforço</button> ':''}<button onclick="closeSteelEditor21()">Cancelar</button>`;manualKind53();ed.classList.remove('hidden');if(!ed.open)ed.showModal();};
window.manualKind53=function(){const kind=$('man53Kind').value;document.querySelectorAll('[data-man53-only]').forEach(e=>e.style.display=e.dataset.man53Only===kind?'':'none');};
window.saveManualSteel53=function(){if(!editing53)return;const{wall,id}=editing53,w=state.walls[wall],m=state.results?.[wall],kind=$('man53Kind').value,q=Number($('man53Quantity').value),len=Number($('man53Length').value),err=$('steelEditorError21');
 if(!Number.isInteger(q)||q<1||q>20){err.textContent='Quantidade: número inteiro de 1 a 20.';return;}if(!(len>0&&len<=2000)){err.textContent='Comprimento: informe um valor positivo em cm (até 2000).';return;}
 const s={id:id||('man-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)),wall:w.uid,kind,diameter:Number($('man53Diameter').value),quantity:q,length:Math.round(len),note:$('man53Note').value.trim()};
 if(kind==='vertical'){const t=Number($('man53T').value);if(!(t>=-OUT53&&t<=Number(m.L)+OUT53)){err.textContent='Posição muito distante da parede (aceito de −'+fmt(OUT53)+' a '+fmt(Number(m.L)+OUT53)+' cm).';return;}s.t=Math.round(t*2)/2;}
 else{const start=Number($('man53Start').value),row=Number($('man53Row').value);if(!Number.isFinite(start)||start<-OUT53||start>Number(m.L)+OUT53){err.textContent='Início muito distante da parede (aceito de −'+fmt(OUT53)+' a '+fmt(Number(m.L)+OUT53)+' cm).';return;}if(!Number.isInteger(row)||row<1||row>m.rows.length){err.textContent='Fiada de 1 a '+m.rows.length+'.';return;}s.start=Math.round(start*2)/2;s.row=row;}
 state.steelManual53??=[];const before=marks89();const k=state.steelManual53.findIndex(x=>x.id===s.id);if(k>=0)state.steelManual53[k]=s;else state.steelManual53.push(s);steelEditing19={wall};refreshSteel19();setTimeout(()=>after89(wall,s,before,k<0),60);};
function marks89(){const c=new Map();for(const d of state.steel||[]){if(!d)continue;for(const p of d.points||[])c.set(N89(p.diameter,p.length),(c.get(N89(p.diameter,p.length))||0)+p.quantity);for(const b of d.horizontals||[])c.set(N89(b.diameter,b.length),(c.get(N89(b.diameter,b.length))||0)+b.quantity);}return c;}
function N89(d,l){return Number(d)+'|'+Math.round(Number(l)*10)/10;}
function after89(wall,s,before,isNew){try{const d=wallData53(wall),it=[...(d?.points||[]),...(d?.horizontals||[])].find(x=>x.manual53===s.id);if(!it)return;const key=N89(it.diameter,it.length),tot=[...marks89().entries()].find(([k])=>k===key)?.[1]||it.quantity,had=before.get(key)||0;
 const where=s.kind==='vertical'?'a '+fmt(s.t)+' cm do início':'na fiada '+s.row+', de '+fmt(s.start)+' a '+fmt(s.start+s.length)+' cm';
 const txt=(isNew?'Reforço criado':'Reforço alterado')+' na Parede '+(wall+1)+', '+where+': '+(had>0&&isNew?'somado ao '+it.n+' que já existia (mesma bitola Ø'+dia(it.diameter)+' e comprimento '+fmt(it.length)+' cm) — '+it.n+' agora com '+tot+' barra(s).':it.n+(isNew?' novo':'')+' · '+tot+' barra(s) Ø'+dia(it.diameter)+' C='+fmt(it.length)+' cm.')+' Já está na relação de aço.';showStatus(txt);
 const g=document.querySelector('#wall-result-'+wall+' g[data-man53="'+s.id+'"][data-man53-view="elevation"]');if(g){g.scrollIntoView({block:'center',behavior:'smooth'});g.classList.add('flash89');setTimeout(()=>g.classList.remove('flash89'),2600);}}catch(e){console.error(e);}}
window.deleteManualSteel53=function(){if(!editing53?.id)return;showStatus('Reforço manual excluído (Ctrl+Z desfaz).');state.steelManual53=(state.steelManual53||[]).filter(x=>x.id!==editing53.id);steelEditing19={wall:editing53.wall};refreshSteel19();};
window.restoreRemoved53=function(wall){const d=wallData53(wall);for(const key of d?.removedKeys53||[])delete state.steelRemoved53[key];steelEditing19={wall};refreshSteel19();};

// ---------- modo "clicar para posicionar"
function preset53(wall,t,z){const w=state.walls[wall],m=state.results[wall],step=stepOf53(m),bearing=num($('openingBearing').value)||30;
 const ops=(w.openings||[]).map(o=>({start:Number(o.start),width:Number(o.width),bottom:Number(o.bottom),height:Number(o.height)}));
 const oh=ops.find(o=>t>=o.start-5&&t<=o.start+o.width+5&&(z>=o.bottom+o.height-5&&z<=o.bottom+o.height+step*1.5||o.bottom>0&&z<=o.bottom+5&&z>=o.bottom-step*1.5));
 const o=oh||ops.find(o=>Math.abs(t-o.start)<=12||Math.abs(t-o.start-o.width)<=12);
 if(oh){const above=z>=o.bottom+o.height/2||o.bottom<=0,row=above?Math.min(m.rows.length,Math.round((o.bottom+o.height)/step)+1):Math.max(1,Math.round(o.bottom/step));const start=Math.max(0,o.start-bearing),end=Math.min(Number(m.L),o.start+o.width+bearing);return {kind:'horizontal',start,row,length:Math.round(end-start),diameter:steelDiameter(),quantity:1,note:above?'reforço de verga':'reforço de contraverga'};}
 if(o){const jamb=Math.abs(t-o.start)<Math.abs(t-o.start-o.width)?o.start-10:o.start+o.width+10;return {kind:'vertical',t:Math.max(0,Math.min(Number(m.L),Math.round(jamb*2)/2)),length:Number(m.H)+10,diameter:steelDiameter('vertical'),quantity:1,note:'reforço da abertura'};}
 return {kind:'vertical',t:Math.round(t*2)/2,length:Number(m.H)+10,diameter:steelDiameter('vertical'),quantity:1,row:Math.max(1,Math.min(m.rows.length,Math.floor(z/step)+1)),start:Math.round(t)};}
function localPoint53(el,clientX,clientY){const svg=el.ownerSVGElement||el.closest('svg');const pt=svg.createSVGPoint();pt.x=clientX;pt.y=clientY;return pt.matrixTransform(el.getScreenCTM().inverse());}
window.startAddSteel53=function(wall){addMode53={wall};document.body.classList.add('addSteel53');showStatus('Clique na elevação da Parede '+(wall+1)+' onde quer o reforço. Perto de uma janela ou porta, o programa já sugere verga, contraverga ou vertical da ombreira. Esc cancela.');$('wall-result-'+wall)?.querySelector('[data-wallmap53]')?.closest('svg')?.scrollIntoView({block:'center',behavior:'smooth'});};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&addMode53){addMode53=null;document.body.classList.remove('addSteel53');showStatus('Inclusão de reforço cancelada.');}});
document.addEventListener('click',e=>{if(!addMode53)return;const svg=e.target.closest?.('#output svg');const map=svg?.querySelector(`[data-wallmap53="${addMode53.wall}"]`);if(!map)return;e.preventDefault();e.stopPropagation();
 const sp=localPoint53(map,e.clientX,e.clientY),pad=Number(map.dataset.man53Pad),k=Number(map.dataset.man53K),from=Number(map.dataset.man53From),H=Number(map.dataset.man53H),t=(sp.x-pad)/k+from,z=H-(sp.y-pad)/k,wall=addMode53.wall;
 const lp=addMode53.last89,useLast=lp&&Math.hypot(lp.x-e.clientX,lp.y-e.clientY)<5;addMode53=null;document.body.classList.remove('addSteel53');openManualSteel53(wall,null,useLast?lp.v:preset53(wall,t,z));},true);

// ---------- V89: prévia do reforço sob o cursor (mostra onde o aço vai ficar antes do clique)
let ghost89=null;const gclear89=()=>{ghost89?.remove();ghost89=null;};
document.addEventListener('pointermove',e=>{if(!addMode53){if(ghost89)gclear89();return;}const svg=e.target.closest?.('#output svg');const map=svg?.querySelector(`[data-wallmap53="${addMode53.wall}"]`);if(!map){gclear89();return;}
 const sp=localPoint53(map,e.clientX,e.clientY),pad=Number(map.dataset.man53Pad),k=Number(map.dataset.man53K),from=Number(map.dataset.man53From),H=Number(map.dataset.man53H),t=(sp.x-pad)/k+from,z=H-(sp.y-pad)/k;let v;try{v=preset53(addMode53.wall,t,z);}catch{return;}
 addMode53.last89={v,x:e.clientX,y:e.clientY};const NS='http://www.w3.org/2000/svg';if(!ghost89||ghost89.ownerSVGElement!==map.ownerSVGElement){gclear89();ghost89=document.createElementNS(NS,'g');ghost89.setAttribute('pointer-events','none');map.parentNode.append(ghost89);}
 const m=state.results?.[addMode53.wall],step=stepOf53(m);let h='';
 if(v.kind==='vertical'){const x=pad+(v.t-from)*k,yb=pad+(H+10)*k,yt=yb-Number(v.length)*k;h=`<line x1="${x}" y1="${yt}" x2="${x}" y2="${yb}" stroke="#0b5fd0" stroke-width=".7" stroke-dasharray="2 1.2"/><rect x="${x+1}" y="${sp.y-4.2}" width="${(v.note?40:22)}" height="3.6" rx=".6" fill="#fff" stroke="#0b5fd0" stroke-width=".2"/><text x="${x+1.8}" y="${sp.y-1.6}" font-size="2.2" fill="#0b5fd0">vertical · ${fmt(v.t)} cm${v.note?' · '+v.note:''}</text>`;}
 else{const a=pad+(v.start-from)*k,b=a+Number(v.length)*k,yy=pad+(H-(v.row-1)*step-step*.45)*k;h=`<line x1="${a}" y1="${yy}" x2="${b}" y2="${yy}" stroke="#0b5fd0" stroke-width=".7" stroke-dasharray="2 1.2"/><rect x="${a}" y="${yy-5.2}" width="44" height="3.6" rx=".6" fill="#fff" stroke="#0b5fd0" stroke-width=".2"/><text x="${a+.8}" y="${yy-2.6}" font-size="2.2" fill="#0b5fd0">${v.note||'horizontal'} · fiada ${v.row} · ${fmt(v.length)} cm</text>`;}
 ghost89.innerHTML=h;},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape')gclear89();});
document.addEventListener('click',()=>{if(!addMode53)gclear89();});
{const st=document.createElement('style');st.textContent='@keyframes flash89{0%,100%{opacity:1}50%{opacity:.25}}g.flash89 line{stroke:#0b5fd0!important;stroke-width:1.1!important}g.flash89{animation:flash89 .65s ease-in-out 4}body.addSteel53 #output svg{cursor:crosshair}';document.head.append(st);}

// ---------- arrastar reforço manual
let drag53=null;
document.addEventListener('pointerdown',e=>{const g=e.target.closest?.('#output g[data-man53][data-man53-view="elevation"]');if(!g||e.button!==0)return;const s=(state.steelManual53||[]).find(x=>x.id===g.dataset.man53);if(!s)return;e.preventDefault();
 const p=localPoint53(g,e.clientX,e.clientY);drag53={g,s,x0:p.x,y0:p.y,k:Number(g.dataset.man53K),moved:false};g.style.cursor='grabbing';g.setPointerCapture?.(e.pointerId);});
document.addEventListener('pointermove',e=>{if(!drag53)return;const p=localPoint53(drag53.g,e.clientX,e.clientY),dx=p.x-drag53.x0,dy=drag53.s.kind==='horizontal'?p.y-drag53.y0:0;if(Math.abs(dx)+Math.abs(dy)>.3)drag53.moved=true;drag53.g.setAttribute('transform',`translate(${dx},${dy})`);drag53.dx=dx;drag53.dy=dy;});
document.addEventListener('pointerup',e=>{if(!drag53)return;const{g,s,k,moved}=drag53,dx=drag53.dx||0,dy=drag53.dy||0;drag53=null;g.style.cursor='grab';if(!moved){g.removeAttribute('transform');return;}
 const wall=Number(g.dataset.man53Wall),m=state.results?.[wall];if(!m){g.removeAttribute('transform');return;}const L=Number(m.L),step=stepOf53(m);
 if(s.kind==='vertical')s.t=Math.max(-OUT53,Math.min(L+OUT53,Math.round((Number(s.t)+dx/k)*2)/2));else{s.start=Math.max(-OUT53,Math.min(L+OUT53,Math.round((Number(s.start)+dx/k)*2)/2));s.row=Math.max(1,Math.min(m.rows.length,Math.round(Number(s.row)-dy/k/step)));}
 steelEditing19={wall};refreshSteel19();showStatus('Reforço manual movido: '+(s.kind==='vertical'?'posição '+fmt(s.t)+' cm':'início '+fmt(s.start)+' cm, fiada '+s.row)+'. Dois cliques para editar bitola, quantidade e comprimento.');});

// ---------- barra de ferramentas por parede
const renderResultsBase53=renderResults;
renderResults=function(...args){const r=renderResultsBase53(...args);for(const [i,w]of state.walls.entries()){const art=$('wall-result-'+i),d=wallData53(i);if(!art||!d||!state.results?.[i]?.rows?.length||art.querySelector('.steelTools53'))continue;const manual=(state.steelManual53||[]).filter(s=>s.wall===w.uid).length,removed=d.removedKeys53?.length||0;
 const bar=document.createElement('div');bar.className='steelTools53 noPrint';bar.innerHTML=`<b>Armaduras da Parede ${i+1}:</b> <button type="button" onclick="startAddSteel53(${i})">＋ Adicionar reforço</button>${removed?` <button type="button" class="secondary" onclick="restoreRemoved53(${i})">Restaurar ${removed} aço(s) excluído(s)</button>`:''} <span class="note">Dois cliques numa barra: editar ou excluir. Reforço manual: arraste para mover.${manual?' '+manual+' reforço(s) manual(is) nesta parede.':''}</span>`;
 const h=art.querySelector('h3');(h?h.nextSibling:art.firstChild)?art.insertBefore(bar,h?h.nextSibling:art.firstChild):art.append(bar);}return r;};

const css=document.createElement('style');css.textContent='.steelTools53{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0 10px;padding:8px 10px;background:#eef5fb;border:1px solid #c9dbea;border-radius:6px}.steelTools53 .note{margin:0}button.danger53{background:#a8322d;color:#fff;border-color:#a8322d}body.addSteel53 #output svg{cursor:crosshair}#output g.man53:hover line:not([data-hit]){stroke:#087dcc}';document.head.append(css);
})();
