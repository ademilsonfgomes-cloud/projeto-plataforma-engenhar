// V72 — copiar planta/paredes para um novo nível, pavimento repetido nos quantitativos e conferência dos pontos verticais entre pavimentos.
(function(){
'use strict';
const N=v=>Number(v);const L68=()=>window.level68;
const parseL=t=>{const m=String(t??'').trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*(.*)$/);return m?{value:N(m[1].replace(',','.')),label:m[2].trim()}:{value:0,label:String(t||'')};};
const fmt2=v=>v.toFixed(2).replace('.',',');
const uid=()=>'wall-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
// ---------- 1. Copiar para novo nível
function addCopyPage(of,id,name){const p=pages36.find(q=>q.id===N(of));if(!p||pages36.some(q=>q.id===N(id)))return false;pages36.push({id:N(id),local:p.local,name,source:p.source});nextPage36=Math.max(nextPage36,N(id)+1);state.pageScales23??={};if(state.pageScales23[of]&&!state.pageScales23[id])state.pageScales23[id]=state.pageScales23[of];return true;}
window.copyLevel72=async function(srcId){srcId=N(srcId);const src=pages36.find(q=>q.id===srcId);if(!src){alert('Planta não encontrada.');return;}
 const all=L68()?.all?.()||state.walls,walls=all.filter(w=>N(w.page||1)===srcId);if(!walls.length&&!confirm('Esta planta ainda não tem paredes. Criar o novo nível mesmo assim?'))return;
 const row=(state.levels53||[]).find(l=>String(l.page)===String(srcId)),L=parseL(row?.text||$('baseLevel23')?.value||'0'),step=(num($('height').value)||280)/100;
 const txt=prompt('Nível e descrição do novo pavimento (cópia da planta '+src.name+'):',fmt2(L.value+step)+' '+((L.label?L.label+' ':'')+'(cópia)').trim());if(txt===null)return;
 const id=nextPage36++,name=src.name.replace(/ \(cópia.*\)$/,'')+' (cópia '+fmt2(parseL(txt).value)+')';
 addCopyPage(srcId,id,name);state.pageCopies72??=[];state.pageCopies72.push({id,of:srcId,name});
 const map=new Map();const clones=walls.map(w=>{const c=JSON.parse(JSON.stringify(w));c.uid=uid();c.page=id;delete c.seq58;delete c.manualRows;delete c.locked76;map.set(w.uid,c.uid);return c;});
 state.support53??={};for(const[o,n]of map)if(state.support53[o])state.support53[n]=JSON.parse(JSON.stringify(state.support53[o]));
 state.walls.push(...clones);state.levels53??=[];state.levels53.push({id:'lvl-'+id+'-'+Date.now().toString(36),text:txt.trim(),page:String(id),rep:1});
 try{options36(String($('page').value));}catch{}renderWalls();invalidate();
 try{const key=L68()?.keyOf?.(id);if(key)await L68().switchTo(key);else L68()?.refresh?.();}catch(e){console.error(e);}
 $('page').value=String(id);try{await renderPage();}catch{}renderWalls();drawPlan();
 $('planStatus').textContent='Novo nível “'+txt.trim()+'” criado com '+clones.length+' parede(s) copiadas da planta '+src.name+'. Ajuste o que muda, confira e gere a modulação deste nível.';};
// salvar/abrir: as cópias de planta voltam ao abrir o projeto
{const r=$('restore');if(r){const old=r.onchange;r.onchange=async function(...a){const res=await old?.apply(this,a);try{for(const c of state.pageCopies72||[])addCopyPage(c.of,c.id,c.name);options36(String($('page').value));L68()?.refresh?.();renderWalls();}catch(e){console.error(e);}return res;};}}
for(const id of ['newProject','example']){const b=$(id);if(!b)continue;const old=b.onclick;b.onclick=function(...a){const r=old?.apply(this,a);state.pageCopies72=[];return r;};}

// ---------- 2. Pavimento repetido nos quantitativos
const repOfPage=pg=>N((state.levels53||[]).find(l=>String(l.page)===String(pg))?.rep)||1;
function repOfGroup(g){let r=1;for(const i of g.walls){const w=state.walls[i];if(w)r=Math.max(r,repOfPage(w.page||1));}return r;}
function repBox(g,rep,compact){let blocks={},rows=[];try{window.withLevel54(g,()=>{blocks=blockTotals26();rows=steelSchedule();});}catch(e){return '';}
 const diam=new Map();rows.forEach(r=>diam.set(r.diameter,(diam.get(r.diameter)||0)+r.total));const f2=v=>v.toFixed(2).replace('.',',');
 const tb=(head,body)=>'<table><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+body.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 // V102 — compra por pavimento: as quantidades acima são de UM pavimento; diz quais pavimentos são iguais e quais têm laje própria
 let own=[],key='';try{key=window.level68.keyOf(Number(state.walls[[...g.walls][0]]?.page||1));const i0=(window.loads77.levels()||[]).findIndex(l=>l.key===key);own=window.loads77.ownList(key,i0===0?'tipo':'piso').filter(j=>j<=rep);}catch{}
 const all=Array.from({length:rep},(_,k)=>k+1),eq=all.filter(j=>!own.includes(j)),R=window.loads77?.repTxt||(r=>r.join(', '));
 return '<div class="rep72box"><h3>Pavimento-tipo · '+rep+' pavimentos — quantidades POR PAVIMENTO</h3><p>As quantidades de blocos, aço das paredes, graute e argamassa acima são de <b>um pavimento</b> e valem para cada um dos '+rep+' pavimentos (as paredes são as mesmas) — compra pavimento a pavimento.'+(own.length?' Lajes: '+(own.length===1?'o '+esc(R(own))+' pavimento tem':'os pavimentos '+esc(R(own))+' têm')+' <b>laje própria</b> (vigas, reforços e aberturas diferentes — ver a prancha “Vigas, reforços e aberturas” de cada um); os demais ('+esc(R(eq))+') seguem o tipo.':'')+'</p></div>';}
function groupsNow(){try{return window.levelGroups54?.()||[];}catch{return [];}}
const rr=renderResults;renderResults=function(...a){const r=rr.apply(this,a);try{const out=$('output');out.querySelectorAll('.rep72box').forEach(e=>e.remove());const gs=groupsNow();if(!gs.length)return r;
 if(gs.length>=2){const arts=[...out.querySelectorAll('.levelQuant54')];gs.forEach((g,k)=>{const rep=repOfGroup(g);if(rep>1&&arts[k])arts[k].insertAdjacentHTML('beforeend',repBox(g,rep));});}
 else{const g=gs[0],rep=repOfGroup(g);if(rep>1){const art=[...out.querySelectorAll('article.wallResult')].find(x=>/^Quantitativo de blocos/.test(x.querySelector('h3')?.textContent||''));if(art)art.insertAdjacentHTML('afterend','<article class="wallResult">'+repBox(g,rep)+'</article>');}}}catch(e){console.error('V72 repetições',e);}return r;};
const cp=collectPlot26;collectPlot26=function(...a){const res=cp.apply(this,a);try{const gs=groupsNow();const sums=res.items.filter(it=>/^Resumos de aço e blocos/.test(it.title||''));
 const pairs=gs.length>=2?gs.map(g=>[g,sums.find(it=>it.title.includes((g.label||'')&&g.label)||it.title.includes(fmt2(g.value)))]):[[gs[0],sums[0]]];
 for(const[g,it]of pairs){if(!g||!it)continue;const rep=repOfGroup(g);if(rep<2)continue;const box=repBox(g,rep,true);const html=it.html+box,h=measureHTML26('<div class="plotSheet26" style="outline:none"><div class="plotItem26" style="position:relative;width:100%"><h3 class="plotItemTitle26">'+esc(it.title)+'</h3>'+html+'</div></div>',it.w)+2;if(h<=res.availH){it.html=html;it.h=h;}else res.items.push({title:it.title+' · repetições',w:it.w,h:Math.min(res.availH,measureHTML26('<div class="plotSheet26"><div class="plotItem26" style="position:relative;width:100%"><h3 class="plotItemTitle26">x</h3>'+box+'</div></div>',it.w)+2),html:box,summary:true});}}catch(e){console.error('V72 pranchas',e);}return res;};

// ---------- 3. Conferência dos pontos verticais entre pavimentos
function steelFor(walls){const res=walls.map(w=>L68()?.resultOf?.(w));if(!walls.length||res.some(m=>!m?.rows?.length))return null;const W=state.walls,R=state.results,S=state.steel;
 try{state.walls=walls;state.results=res;return buildSteel();}catch(e){console.error(e);return null;}finally{state.walls=W;state.results=R;state.steel=S;}}
let marks72=[];
window.continuity72=function(){const all=L68()?.all?.()||state.walls,keys=(L68()?.levelKeys?.()||[]).slice();if(keys.length<2){alert('É preciso ter pelo menos dois níveis para conferir.');return;}
 const kOfW=w=>L68().keyOf(N(w.page||1)),src=pg=>pages36.find(q=>q.id===N(pg))?.source;
 const lines=[];marks72=[];
 for(let i=1;i<keys.length;i++){const lo=keys[i-1],up=keys[i],wl=all.filter(w=>kOfW(w)===lo),wu=all.filter(w=>kOfW(w)===up);
  const sl=new Set(wl.map(w=>src(w.page))),su=new Set(wu.map(w=>src(w.page)));const same=[...su].some(s=>sl.has(s))||(!!window.aligned74&&!!wl.length&&!!wu.length&&wu.every(w=>window.aligned74(N(w.page||1),N(wl[0].page||1))));
  const name=k=>L68().nameOf(k);
  if(!same){lines.push({lvl:'warn',t:name(up)+' sobre '+name(lo),d:'As plantas destes níveis são arquivos diferentes e ainda não têm ponto de origem. Marque o mesmo ponto de origem nas duas plantas (⌖ Marcar ponto de origem) para conferir.'});continue;}
  const s1=steelFor(wl),s2=steelFor(wu);if(!s1||!s2){lines.push({lvl:'warn',t:name(up)+' sobre '+name(lo),d:'Gere a modulação dos dois níveis antes de conferir.'});continue;}
  const W74=(p,ws)=>{const pg=N(ws[p.wall]?.page||1);if(window.world74){const q=window.world74(pg,p);return {...p,X:q.x,Y:q.y};}const k=N(ws[p.wall]?.planScale)||pxCm||1;return {...p,X:p.x/k,Y:-p.y/k};};
  const pts=(s,ws)=>s.flatMap((d,i)=>(d?.points||[]).map(p=>W74({...p,wall:i},ws)));const P1=pts(s1,wl),P2=pts(s2,wu),tol=6;
  const miss=P2.filter(p=>!P1.some(q=>Math.hypot(q.X-p.X,q.Y-p.Y)<=tol)),extra=P1.filter(p=>!P2.some(q=>Math.hypot(q.X-p.X,q.Y-p.Y)<=tol));
  miss.forEach(p=>marks72.push({page:wu[p.wall]?.page,x:p.x,y:p.y,c:'#d1462f'}));
  lines.push({lvl:miss.length?'err':'ok',t:name(up)+' sobre '+name(lo),d:miss.length?miss.length+' ponto(s) de graute/aço vertical do nível de cima sem ponto embaixo (até 6 cm): '+miss.slice(0,8).map(p=>'Parede '+(p.wall+1)+(p.t!=null?' a '+fmt(Math.round(p.t))+' cm':'')).join(', ')+(miss.length>8?'…':'')+'. Marcados em vermelho na planta do nível de cima.':'Todos os '+P2.length+' pontos verticais do nível de cima têm ponto embaixo ✔'+(extra.length?' ('+extra.length+' ponto(s) do nível de baixo não continuam — normal quando o de cima tem menos paredes).':'')});}
 let d=$('cont72');if(!d){d=document.createElement('dialog');d.id='cont72';d.className='check71';document.body.append(d);}
 d.innerHTML='<h3>Conferência entre pavimentos</h3><ul>'+lines.map(x=>'<li class="'+(x.lvl==='ok'?'':x.lvl)+'"><b>'+esc(x.t)+'</b><br><span>'+esc(x.d)+'</span></li>').join('')+'</ul><div class="btns71"><button type="button" id="cont72c">Fechar</button></div>';d.querySelector('#cont72c').onclick=()=>{d.close();drawPlan();};d.showModal();drawPlan();};
const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);if(!marks72.length||!image)return r;try{const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0};ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);for(const m of marks72){if(String(m.page)!==String($('page').value))continue;ctx.strokeStyle=m.c;ctx.lineWidth=3;ctx.beginPath();ctx.arc(m.x,m.y,9,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(m.x-6,m.y-6);ctx.lineTo(m.x+6,m.y+6);ctx.moveTo(m.x+6,m.y-6);ctx.lineTo(m.x-6,m.y+6);ctx.stroke();}ctx.restore();}catch(e){console.error(e);}return r;};
// botão na coluna (grupo Nível em trabalho)
{const g=document.querySelector('.lvlGrp68 .grpBody62');if(g){const b=document.createElement('button');b.type='button';b.className='secondary';b.id='cont72btn';b.textContent='⇅ Conferir pontos entre pavimentos';b.title='Confere se cada ponto de graute/aço vertical do pavimento de cima tem ponto embaixo.';b.onclick=()=>window.continuity72();g.append(b);const c=document.createElement('button');c.type='button';c.className='secondary';c.textContent='✕ Limpar marcas';c.onclick=()=>{marks72=[];drawPlan();};g.append(c);}}
const css=document.createElement('style');css.textContent='.rep72{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:#2b4a66}.rep72 input{width:64px}.rep72box{margin-top:10px;padding:8px 10px;border:1px dashed #8fb3d6;border-radius:8px;background:#f6f9fc}.rep72box h3{margin:0 0 6px;font-size:14px;color:#174a78}.rep72box table{margin-bottom:6px}';document.head.append(css);
})();
