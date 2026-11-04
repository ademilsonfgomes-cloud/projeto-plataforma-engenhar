// V53 — vários níveis no projeto: cada planta (PDF/DXF/página) pode ter seu próprio nível.
(function(){
'use strict';
const parse=raw=>{raw=String(raw??'').trim();const m=raw.match(/^([+-]?\d+(?:[.,]\d+)?)\s*(.*)$/);return m?{value:Number(m[1].replace(',','.')),label:m[2].trim(),valid:true}:{value:0,label:raw,valid:!raw};};
const fmtL=v=>v.toFixed(2).replace('.',',');
function levelFor53(w){const page=Number(w?.page||1),l=(state.levels53||[]).find(l=>l.page!==''&&l.page!=null&&Number(l.page)===page);return l?parse(l.text):parse($('baseLevel23')?.value);}
window.levelFor53=levelFor53;
// pranchas: do nível mais baixo para o mais alto
window.pageLevel53=page=>{const v=levelFor53({page}).value;return Number.isFinite(v)?v:0;};
window.wallsByLevel53=()=>[...state.walls.entries()].sort((a,b)=>window.pageLevel53(a[1].page||1)-window.pageLevel53(b[1].page||1)||a[0]-b[0]);
window.levelTag53=page=>{const L=levelFor53({page}),v=Number.isFinite(L.value)?L.value:0,n=(v>=0?'+':'')+fmtL(v)+' m';return L.label?' · '+L.label+' ('+n+')':' · Nível '+n;};
window.levelText58=page=>window.levelTag53(page).replace(/^ · /,'');
levelMarks23=function(pad,bottom,height,k){const L=levelFor53(window.currentWall53?.()),base=Number.isFinite(L.value)?L.value:0,top=bottom-height*k,f=v=>(v>=0?'+':'')+fmtL(v)+' m';
 return [[bottom,base,L.label],[top,base+height/100,'']].map(([y,v,l])=>`<path d="M${pad-3},${y} l-2,-2 h4 z M${pad-5},${y} h-9" stroke="#174a78" fill="none" stroke-width=".22"/><text x="${pad-21}" y="${y-2.7}" font-size="2" fill="#174a78">${f(v)}</text>`+(l?`<text x="${pad-5}" y="${y+2.6}" font-size="1.8" text-anchor="end" fill="#174a78" data-level-label53="true">${esc(l)}</text>`:'')).join('');};
// espaço à esquerda para descrições longas (por parede)
const sw=svgWall;svgWall=function(w,m,which){let html=sw(w,m,which);if(which!=='elevation')return html;const label=levelFor53(w).label,baseLabel=parse($('baseLevel23')?.value).label;if(!label||label.length<=baseLabel.length&&label===baseLabel)return html;const need=label.length*1.05-14;if(need<=0)return html;
 const match=html.match(/viewBox="([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)"/);if(!match)return html;const a=match.slice(1).map(Number),width=a[2]+need;return html.replace(match[0],`viewBox="${a[0]-need} ${a[1]} ${width} ${a[3]}"`).replace(/width="[\d.e+-]+mm"/,`width="${width}mm"`).replace(/style="width:[\d.e+-]+mm;/,`style="width:${width}mm;`);};

// ---------- painel "Níveis do projeto"
function pages(){return [...($('page')?.options||[])].map(o=>({value:o.value,text:o.textContent}));}
function rerender(){if(state.results)renderResults({reports:state.junctionReports||[]},state.results);}
function panel(){let box=$('levels53');if(!box){const lab=$('baseLevel23')?.closest('label'),row=lab?.closest('.row');if(!row)return;box=document.createElement('div');box.id='levels53';box.className='levels53';row.after(box);}
 state.levels53??=[];const list=state.levels53,ps=pages(),all=window.level68?.all?.()||state.walls||[];
 // V69: uma linha por planta — cada planta tem o seu nível (sem ligação escondida com o campo de referência)
 for(const o of ps)if(!list.some(l=>String(l.page)===o.value))list.push({id:'lvl-'+o.value+'-'+Date.now().toString(36),text:$('baseLevel23')?.value||'0,00',page:o.value});
 const lab=$('baseLevel23')?.closest('label');if(lab&&lab.firstChild&&lab.firstChild.nodeType===3)lab.firstChild.textContent=ps.length?'Nível padrão para novas plantas (m) e descrição':'Nível de referência (m) e descrição';
 const rows=ps.map(o=>({o,k:list.findIndex(l=>String(l.page)===o.value)})).filter(r=>r.k>=0),loose=list.map((l,k)=>({l,k})).filter(r=>!ps.some(o=>o.value===String(r.l.page)));
 const keyOf=t=>{const p=parse(t);return (Number.isFinite(p.value)?p.value:0).toFixed(3)+'|'+p.label.toLowerCase();},groups={};rows.forEach(r=>{const key=keyOf(list[r.k].text);(groups[key]??=[]).push(r.o.text);});
 const dup=Object.values(groups).filter(g=>g.length>1);
 const html=`<div class="levelsHead53"><b>Níveis do projeto</b><span class="note">${ps.length?'Cada planta carregada tem o seu nível. “Repetições” multiplica os quantitativos (pavimento-tipo); “Copiar para novo nível” duplica as paredes para o pavimento de cima. Escreva o valor (m) e a descrição; o seletor “Nível em trabalho” usa esta lista.':'Carregue as plantas (PDF/DXF): cada uma ganha aqui uma linha com o seu nível. Sem planta, vale o nível de referência acima.'}</span></div>`+
 rows.map(({o,k})=>{const l=list[k],p=parse(l.text),n=all.filter(w=>Number(w.page||1)===Number(o.value)).length;return `<div class="levelRow53 plant69"><span class="plantName69">Planta ${esc(o.text)}</span><input type="text" value="${esc(l.text)}" placeholder="ex.: 858,43 Piso do 2º pavimento" style="${p.valid?'':'border-color:#c52828'}" onchange="editLevel53(${k},'text',this.value)"><label class="rep72" title="Quantas vezes este pavimento se repete na obra (pavimento-tipo). Os quantitativos mostram também o total multiplicado.">Repetições <input type="number" min="1" step="1" value="${Number(l.rep)||1}" onchange="editLevel53(${k},'rep',Math.max(1,Math.round(Number(this.value)||1)))"></label><span class="note">${n} parede(s)</span><button type="button" class="secondary" title="Cria um novo nível com uma cópia das paredes e aberturas desta planta (para o pavimento de cima, ajustando depois só o que muda)." onclick="copyLevel72('${o.value}')">⧉ Copiar para novo nível</button></div>`;}).join('')+
 (dup.length?`<p class="warning" style="margin:6px 0">Atenção: ${dup.map(g=>g.map(t=>'“'+esc(t)+'”').join(' e ')).join('; ')} estão com o mesmo nível e descrição — serão tratadas como um nível só (paredes numeradas juntas). Se são pavimentos diferentes, corrija o nível de uma delas.</p>`:'')+
 loose.map(({l,k})=>`<div class="levelRow53"><input type="text" value="${esc(l.text)}" onchange="editLevel53(${k},'text',this.value)"><select onchange="editLevel53(${k},'page',this.value)"><option value="">— nível sem planta —</option>${ps.map(o=>`<option value="${esc(o.value)}" disabled>Planta ${esc(o.text)}</option>`).join('')}</select><span class="note">sem planta</span><button type="button" class="secondary" title="Excluir nível" onclick="removeLevel53(${k})">✕</button></div>`).join('');
 if(box.__html53!==html){box.innerHTML=html;box.__html53=html;}}
window.addLevel53=function(dir){state.levels53??=[];const vals=[parse($('baseLevel23').value).value,...state.levels53.map(l=>parse(l.text).value)].filter(Number.isFinite),step=(num($('height').value)||280)/100,v=dir>0?Math.max(...vals)+step:Math.min(...vals)-step,cur=String($('page')?.value||''),free=cur&&!state.levels53.some(l=>String(l.page)===cur)&&!(state.walls||[]).some(w=>String(w.page||1)===cur)?cur:'';
 state.levels53.push({id:'lvl-'+Date.now().toString(36),text:fmtL(v)+(dir>0?' nível acima':' nível abaixo'),page:free});panel();rerender();showStatus('Nível '+fmtL(v)+' criado. Edite o valor e a descrição e escolha a planta correspondente.');};
window.editLevel53=function(k,field,value){const l=state.levels53?.[k];if(!l)return;l[field]=value;panel();rerender();try{window.level68?.refresh?.();}catch(e){console.error(e);}};
window.removeLevel53=function(k){if(!confirm('Excluir este nível? As paredes da planta voltam ao nível de referência.'))return;state.levels53.splice(k,1);panel();rerender();};
// mantém o painel atualizado quando plantas/páginas mudam
if($('page'))new MutationObserver(()=>panel()).observe($('page'),{childList:true});
const rr=renderResults;renderResults=function(...args){const r=rr(...args);panel();window.syncSupport53?.();return r;};
const inv=invalidate;invalidate=function(...a){const r=inv(...a);panel();return r;};
// abrir projeto salvo: atualiza painel e apoio geral
const restore=$('restore').onchange;$('restore').onchange=async function(...a){const r=await restore.apply(this,a);panel();window.syncSupport53?.();return r;};
for(const id of ['newProject','example']){const b=$(id),old=b.onclick;b.onclick=function(...a){const r=old?.apply(this,a);const cleared=id==='newProject'&&!state.walls.length;if(cleared||!state.levels53)state.levels53=[];if(cleared){state.supportDefault53={};state.support53={};}panel();window.syncSupport53?.();return r;};}

// ---------- V54: quantitativos por nível (sem total geral somando níveis)
function levelGroups54(){const groups=new Map();(state.walls||[]).forEach((w,i)=>{const m=state.results?.[i];if(!m?.rows?.length)return;const L=levelFor53(w),key=(Number.isFinite(L.value)?L.value:0).toFixed(3)+'|'+L.label;if(!groups.has(key))groups.set(key,{value:Number.isFinite(L.value)?L.value:0,label:L.label,walls:new Set()});groups.get(key).walls.add(i);});return [...groups.values()].sort((a,b)=>a.value-b.value);}
window.levelGroups54=levelGroups54;
const levelName54=g=>'Nível '+(g.value>=0?'+':'')+fmtL(g.value)+' m'+(g.label?' · '+g.label:'');
function withLevel54(g,fn){const R=state.results;state.results=R.map((m,i)=>g.walls.has(i)||!m?m:{...m,rows:[],quant:{},otherLevel54:true});try{return fn();}finally{state.results=R;}}
window.withLevel54=withLevel54;
function blockTable54(){const t=blockTotals26(),rows=Object.entries(t);return rows.length?'<table><thead><tr><th>Peça</th><th>Quantidade</th></tr></thead><tbody>'+rows.map(([c,q])=>'<tr><td>'+esc(c)+'</td><td>'+q+'</td></tr>').join('')+'</tbody></table>':'<p class="note">Sem blocos desenhados neste nível.</p>';}
// tela
const rr54=renderResults;renderResults=function(...args){const r=rr54(...args);try{state.walls.forEach((w,i)=>{const h=$('wall-result-'+i)?.querySelector('h3');if(!h)return;h.querySelector('.lvl58')?.remove();const sp=document.createElement('span');sp.className='lvl58';sp.textContent=window.levelText58(w.page||1);h.append(sp);});}catch(e){console.error(e);}const groups=levelGroups54();const out=$('output');if(!out)return r;out.querySelectorAll('.levelQuant54').forEach(e=>e.remove());
 const originals=[...out.querySelectorAll('article.wallResult')].filter(a=>/^Quantitativo de blocos/.test(a.querySelector('h3')?.textContent||'')||a.classList.contains('steelSummary')||a.id==='materialsResult34');
 if(groups.length<2){originals.forEach(a=>a.style.display='');return r;}
 originals.forEach(a=>a.style.display='none');const anchor=originals[0]||out.lastElementChild;
 const html=groups.map(g=>withLevel54(g,()=>`<article class="wallResult levelQuant54"><h3>Quantitativos · ${esc(levelName54(g))}</h3><p class="note">Paredes deste nível: ${[...g.walls].map(i=>i+1).join(', ')}. Total somente deste nível.</p><h3>Blocos</h3>${blockTable54()}${steelSummary().replace(/^<article[^>]*>/,'').replace(/<\/article>$/,'')}${typeof materialsSummary34==='function'?materialsSummary34():''}</article>`)).join('');
 anchor.insertAdjacentHTML('beforebegin',html);return r;};
// pranchas
const collect54=collectPlot26;collectPlot26=function(...args){const res=collect54(...args);const groups=levelGroups54();if(groups.length<2)return res;
 res.items=res.items.filter(it=>!it.summary&&!/^Resumo de aço · posições/.test(it.title||''));const W=Math.min(res.availW,300);
 for(const g of groups)withLevel54(g,()=>{const rows=steelSchedule(),diam=new Map();rows.forEach(r=>diam.set(r.diameter,(diam.get(r.diameter)||0)+r.total));
  const pending=g.walls.size&&[...g.walls].some(i=>state.results[i]?.pending)?'<p class="plotPending26">LEVANTAMENTO PARCIAL · Há paredes pendentes neste nível.</p>':'';
  const details=rr=>plotTable26(['N','Ø (mm)','Qtde.','C unit. (cm)','Total (m)'],rr.map(r=>[r.n,r.diameter.toFixed(1).replace('.',','),r.quantity,fmt(r.length),r.total.toFixed(2).replace('.',',')]));
  const totals='<h3>Relação de aço · barras de 12 m</h3>'+plotTable26(['Bitola','BR. 12 m','Peso (kg)'],[...diam].map(([d,l])=>['Ø'+fmt(d),(l/12).toFixed(2).replace('.',','),(l*steelMassPerMetre(d)).toFixed(2).replace('.',',')]))+'<h3>Resumo dos blocos</h3>'+plotTable26(['Peça','Quantidade'],Object.entries(blockTotals26()))+'<p>Total somente deste nível. Sem acréscimo de perdas.</p>'+(typeof materialsSummary34==='function'?materialsSummary34():'');
  const title='Resumos de aço e blocos · '+levelName54(g),head='<h3>'+esc(levelName54(g))+'</h3>';let full=head+'<h3>Resumo de aço</h3>'+pending+details(rows)+totals,h=measureHTML26(full,W-4)+13;
  if(h<=res.availH){res.items.push({title,w:W,h,html:full,summary:true});return;}
  let chunk=[];const push=(c,cont)=>{const html=head+'<h3>Resumo de aço · posições'+(cont?' (continuação)':'')+'</h3>'+pending+details(c);res.items.push({title:'Resumo de aço · posições · '+levelName54(g),w:W,h:measureHTML26(html,W-4)+13,html});};
  let first=true;for(const row of rows){const trial=[...chunk,row];if(chunk.length&&measureHTML26(head+details(trial),W-4)+30>res.availH){push(chunk,!first);first=false;chunk=[];}chunk.push(row);}if(chunk.length)push(chunk,!first);
  const tot=head+'<h3>Resumo de aço · total por bitola</h3>'+pending+totals;res.items.push({title,w:W,h:measureHTML26(tot,W-4)+13,html:tot,summary:true});});
 return res;};
panel();
const css=document.createElement('style');css.textContent='.levels53{margin:4px 0 14px;padding:10px 12px;background:#f5f8fb;border:1px solid #d4e0eb;border-radius:8px}.levelsHead53{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center}.levelsHead53 .note{margin:0;flex:1 1 280px}.levelsBtns53{display:flex;gap:8px}.plant69 .plantName69{min-width:220px;font-weight:600;color:#102e4b}.levelRow53{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px}.levelRow53 input{flex:1 1 220px}.levelRow53 select{flex:1 1 220px;width:auto}.levelRow53 .note{margin:0}';document.head.append(css);
document.head.append(Object.assign(document.createElement('style'),{textContent:'.lvl58{margin-left:10px;font-size:13px;font-weight:600;color:#7a4b00;background:#fff4dc;border:1px solid #f0d49a;border-radius:12px;padding:2px 10px;vertical-align:middle}'}));
})();

