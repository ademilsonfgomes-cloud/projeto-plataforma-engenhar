// V96 — RESISTÊNCIAS POR PAVIMENTO: fbk (bloco) e fgk (graute) a partir da carga acumulada nas paredes.
// Compressão simples (ABNT NBR 16868-1): Nd ≤ fd·A·R, fd = fk/γm, R = 1 − (λ/40)³, λ = hef/tef; fk = k·fpk; fpk = η·fbk.
// Um fbk por pavimento (o da parede mais carregada), nunca menor que o do pavimento de cima e nunca menor que o mínimo da norma.
// Também: notas executivas montadas pelo projeto e quantitativo de blocos por pavimento e por resistência.
(function(){
'use strict';
const N=Number,L7=()=>window.loads77;if(!L7())return;
const f1=(v,d=1)=>(Number.isFinite(v)?v:0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
const DEF={gm:2.0,kfk:0.7,eta:0.5,fh:1,delta:1,exc:0,min:4,minItem:'',gMin:15,gItem:'6.1.3',list:[4,6,8,10,12,14,16,18,20],ovr:{}};
function S(){const s=L7().S();s.res96??={};const r=s.res96;for(const k in DEF)if(r[k]===undefined||r[k]===null||r[k]==='')r[k]=JSON.parse(JSON.stringify(DEF[k]));if(!r.ovr||typeof r.ovr!=='object')r.ovr={};return r;}
const C=window.calcAlv; // src/calculo/alvenaria.js
const fgkOf=fbk=>C.fgkDoGraute(fbk,S().gMin);
const up=v=>C.fbkComercial(v,S().list);
const normMin=()=>'ABNT NBR 15270-1:2023'+(String(S().minItem||'').trim()?', item '+String(S().minItem).trim():'');
const normG=()=>'ABNT NBR 16868-1'+(String(S().gItem||'').trim()?', item '+String(S().gItem).trim():'');
const fmV=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(2).replace('.',',');

// ---------- cálculo
function compute(){let R;try{R=L7().compute({});}catch(e){console.error('V96',e);return null;}if(!R?.LV?.length||!R.rows)return null;
 const c=L7().S().cfg,gG=N(c.gG)||1.4,gQ=N(c.gQ)||1.4,s=S(),gm=N(s.gm)||2,kf=N(s.kfk)||.7,eta=N(s.eta)||.5;
 const out=R.LV.map((l,i)=>{let own=null;try{own=L7().compute({lv:l.key});}catch{}
  let crit=null,maxOwn=0;const slender=[],walls=[];const RP=Math.max(1,N(l.rep)||1),repCalc=new Array(RP).fill(0);
  // hef = fh·h, tef = δ·t; com excentricidade (exc = e/t > 0) a carga do próprio pavimento entra com momento (flexo-compressão).
  const P={gm,kf,eta,fh:N(s.fh)||1,delta:N(s.delta)||1},ef=N(s.exc)||0;
  R.rows[i].forEach((r,j)=>{const t=N(r.x.t)||14,H=N(r.x.H)||280,nd=C.cargaDeCalculo(r.g,r.q,gG,gQ);
   const o=own?.rows?.[i]?.[j];const od=o?gG*o.g+gQ*o.q:0;if(od>maxOwn)maxOwn=od;
   const calc=(n,nx)=>ef>0?C.flexoCompressao(n,Math.min(n,nx),t,H,P,ef):C.compressaoSimples(n,t,H,P),cs=calc(nd,od),lam=cs.lambda;if(lam>24)slender.push(r.label);walls.push({nome:r.label,gk:r.g,qk:r.q,...cs});
   if(!crit||cs.fbk>crit.fbk)crit={label:r.label,pd:nd,od,t,H,lam,R:cs.R,sig:cs.sigma,fk:cs.fk,fpk:cs.fpk,fbk:cs.fbk,hef:cs.hef,tef:cs.tef,ef,e:cs.e,nexc:cs.nexc,md:cs.md,sigM:cs.sigmaM,fbkN:cs.fbkCompressao};
   // V107.2 — andar a andar no pavimento-tipo (1 = o de baixo)
   const od1=od/RP;for(let jr=1;jr<=RP;jr++){const nj=Math.max(0,nd-(jr-1)*od1),fb=calc(nj,od1).fbk;if(fb>repCalc[jr-1])repCalc[jr-1]=fb;}});
  const tt=N(window.opt3d74?.t)||10,step=((N(l.H)||280)+tt)/100,v0=N(String(l.key).split('|')[0])||0;
  return {i,key:l.key,name:l.name,rep:RP,v:v0,step,repCalc,crit,maxOwn,slender,walls,calc:crit?crit.fbk:0};});
 // de cima para baixo: nunca menor que o de cima
 let above=0;for(let i=out.length-1;i>=0;i--){const L=out[i];let a=up(Math.max(L.calc,N(s.min)||4)),why=L.calc<(N(s.min)||4)?'min':'calc';
  if(a<above){a=above;why='acima';}const o=N(s.ovr[L.key]);L.auto=a;L.warn=[];
  if(o>0){if(o<a)L.warn.push('fbk escolhido ('+f1(o)+' MPa) menor que o necessário ('+f1(a)+' MPa).');a=o;why='ovr';}
  // andares do pavimento-tipo, de cima para baixo: cada um com o seu fbk (nunca menor que o de cima)
  if(L.rep>1){const reps=[];let ab=above;for(let jr=L.rep;jr>=1;jr--){const c=L.repCalc[jr-1]||0;let f=up(Math.max(c,N(s.min)||4));if(f<ab)f=ab;if(o>0)f=Math.max(f,o);reps.unshift({jr,z:L.v+(jr-1)*L.step,calc:c,fbk:f,fgk:fgkOf(f)});ab=Math.max(ab,f);}
   L.reps=reps;a=Math.max(a,reps[0].fbk);const G=[];for(const r of reps){const g=G.at(-1);if(g&&g.fbk===r.fbk){g.to=r.jr;g.calc=Math.max(g.calc,r.calc);}else G.push({from:r.jr,to:r.jr,fbk:r.fbk,fgk:r.fgk,calc:r.calc,z:r.z});}L.groups=G;}
  L.fbk=a;L.why=why;L.fgk=fgkOf(a);L.fpk=a*eta;L.fk=L.fpk*kf;L.util=a>0?L.calc/a:0;above=Math.max(above,a,...(L.reps||[]).map(r=>r.fbk));
  if(L.slender.length)L.warn.push('Esbeltez λ = h/t acima de 24 em '+L.slender.slice(0,6).join(', ')+(L.slender.length>6?'…':'')+' — conferir contraventamento ou armar a parede.');}
 return {levels:out,gG,gQ,gm,kf,eta,fh:N(s.fh)||1,delta:N(s.delta)||1,ef:N(s.exc)||0};}
function whyTxt(L){const s=S();return L.why==='min'?'Mínimo da norma: '+f1(N(s.min))+' MPa ('+normMin()+'). Cálculo: '+f1(L.calc,2)+' MPa.':L.why==='acima'?'Igual ao pavimento de cima (não diminuir de cima para baixo).':L.why==='ovr'?'Escolhido pelo projetista.':'Pela parede mais carregada ('+(L.crit?.label||'—')+').';}

// ---------- tabela (tela e prancha)
function tableHTML(D,paper){const s=S();if(!D)return '<p class="note">Sem paredes com posição na planta.</p>';
 const head=['Pavimento','Nível (m)','Carga do pavimento p<sub>d</sub> (kN/m)','Maior carga acumulada p<sub>d</sub> (kN/m)','Parede crítica','fbk calculado (MPa)','fbk adotado (MPa)','fpk (MPa)','fgk graute (MPa)','Aproveit.','Observação'];
 const rows=D.levels.slice().reverse().flatMap(L=>{if(L.groups&&L.groups.length>1)return L.groups.slice().reverse().map((g,gi)=>['<b>'+esc(L.name)+'</b> · '+g.from+'º'+(g.to>g.from?' a '+g.to+'º':'')+' de '+L.rep,fmV(g.z),f1(L.maxOwn),gi===L.groups.length-1?f1(L.crit?.pd||0):'—',gi===L.groups.length-1?esc(L.crit?.label||'—'):'—',f1(g.calc,2),'<b>'+f1(g.fbk)+'</b>'+(paper||gi?'':ovrSel(L)),f1(g.fbk*D.eta),f1(g.fgk,0),Math.round((g.calc/(g.fbk||1))*100)+'%',g.fbk>up(Math.max(g.calc,N(s.min)||4))+1e-9?'Igual ao andar de cima (não diminui para baixo).':g.calc<(N(s.min)||4)?'Mínimo da norma: '+f1(N(s.min))+' MPa.':'Cálculo pela parede mais carregada do andar.']);
  return [['<b>'+esc(L.name)+'</b>'+(L.rep>1?' ×'+L.rep:''),fmV(L.v),f1(L.maxOwn),f1(L.crit?.pd||0),esc(L.crit?.label||'—'),f1(L.calc,2),'<b>'+f1(L.fbk)+'</b>'+(paper?'':ovrSel(L)),f1(L.fpk),f1(L.fgk,0),Math.round(L.util*100)+'%',esc(whyTxt(L))+(L.warn.length&&!paper?'<br><span class="w96">'+L.warn.map(esc).join('<br>')+'</span>':'')]];});
 return '<table class="t96"><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+v+'</td>').join('')+'</tr>').join('')+'</tbody></table>'+
  '<p class="n96">Compressão simples (ABNT NBR 16868-1): N<sub>d</sub> ≤ f<sub>d</sub>·A·R; f<sub>d</sub> = f<sub>k</sub>/γ<sub>m</sub> (γ<sub>m</sub> = '+f1(D.gm)+'); R = 1 − (λ/40)³, λ = h<sub>ef</sub>/t<sub>ef</sub>; f<sub>k</sub> = '+f1(D.kf,2)+'·f<sub>pk</sub>; f<sub>pk</sub> = '+f1(D.eta,2)+'·f<sub>bk</sub> (eficiência prisma/bloco — confirmar com o fornecedor e com o ensaio de prisma). p<sub>d</sub> = '+f1(D.gG)+'·g<sub>k</sub> + '+f1(D.gQ)+'·q<sub>k</sub>, média de cada parede na base do pavimento. Um fbk por pavimento, pela parede mais carregada; no pavimento-tipo, um fbk por andar (a carga diminui a cada andar para cima); nunca menor que o do andar de cima. fbk mínimo: '+f1(N(s.min))+' MPa ('+esc(normMin())+'). fgk ≈ 2,3·fbk arredondado de 5 em 5 MPa, mínimo de '+f1(N(s.gMin),0)+' MPa ('+esc(normG())+').</p>';}
function ovrSel(L){const s=S(),cur=N(s.ovr[L.key])||0;return ' <select class="o96" data-k="'+esc(L.key)+'" title="Trocar o fbk deste pavimento"><option value="0"'+(cur?'':' selected')+'>auto</option>'+s.list.map(v=>'<option value="'+v+'"'+(cur===N(v)?' selected':'')+'>'+f1(N(v))+'</option>').join('')+'</select>';}

// ---------- quantitativo por pavimento e por resistência
function groupsLv(){const G=window.levelGroups54?.()||[];return G;}
function matchLv(D,g){if(!D)return null;const k=(N(g.value)||0).toFixed(3)+'|'+(g.label||'');return D.levels.find(L=>L.key===k)||D.levels.find(L=>Math.abs(L.v-N(g.value))<.001)||null;}
// V102 — compra por pavimento: uma linha por pavimento (sem multiplicar as repetições)
function buyRows(D){const out=[];const G=groupsLv();if(!G.length||!D)return [];
 for(const g of G){const L=matchLv(D,g)||(D.levels.length===1?D.levels[0]:null);if(!L)continue;let t={};try{t=G.length>1?window.withLevel54(g,()=>blockTotals26()):blockTotals26();}catch{}
  if(L.groups&&L.groups.length>1){for(const g of L.groups.slice().reverse())out.push({fbk:g.fbk,lv:[L.name+' — '+(g.to>g.from?g.from+'º a '+g.to+'º de '+L.rep+' (cada um)':g.from+'º de '+L.rep)],q:{...t}});}
  else out.push({fbk:L.fbk,lv:[L.name+(L.rep>1?' — cada um dos '+L.rep+' pavimentos iguais':'')],q:{...t}});}
 return out;}
function buyHTML(D){const B=buyRows(D);if(!B.length)return '';const codes=[...new Set(B.flatMap(b=>Object.keys(b.q)))].sort((a,b)=>a.localeCompare(b,'pt',{numeric:true}));
 return '<h3>Resumo para compra · por pavimento</h3><table class="t96"><thead><tr><th>fbk</th><th>Pavimento</th>'+codes.map(c=>'<th>'+esc(c)+'</th>').join('')+'<th>Total</th></tr></thead><tbody>'+
  B.map(b=>'<tr><td><b>'+f1(b.fbk)+' MPa</b></td><td>'+esc(b.lv.join(', '))+'</td>'+codes.map(c=>'<td>'+(b.q[c]||'—')+'</td>').join('')+'<td><b>'+Object.values(b.q).reduce((s,v)=>s+v,0)+'</b></td></tr>').join('')+'</tbody></table><p class="n96">Quantidades de UM pavimento (compra pavimento a pavimento), sem perdas. Pavimentos-tipo: a mesma quantidade vale para cada pavimento igual. Identificar os lotes por resistência na obra.</p>';}
function lvTag(L){if(L.groups&&L.groups.length>1)return 'Blocos e graute por andar: '+L.groups.slice().reverse().map(g=>(g.to>g.from?g.from+'º a '+g.to+'º':g.from+'º')+' de '+L.rep+' → fbk '+f1(g.fbk)+' MPa / fgk '+f1(g.fgk,0)+' MPa').join(' · ');return 'Blocos fbk = '+f1(L.fbk)+' MPa · graute fgk = '+f1(L.fgk,0)+' MPa';}
function repAt(z){const D=compute();if(!D)return null;for(const L of D.levels){if(L.reps){const r=L.reps.find(r=>Math.abs(r.z-z)<.006);if(r)return {fbk:r.fbk,fgk:r.fgk,L};}if(Math.abs(L.v-z)<.006)return {fbk:L.fbk,fgk:L.fgk,L};}return null;}

// tela: cada quantitativo por nível ganha o fbk; no fim, o resumo para compra
{const rr=renderResults;renderResults=function(...a){const r=rr.apply(this,a);try{decorate();}catch(e){console.error('V96 quantitativos',e);}return r;};}
function decorate(){const out=$('output');if(!out)return;out.querySelectorAll('.tag96,.buy96').forEach(e=>e.remove());const D=compute();if(!D)return;const G=groupsLv();
 const arts=[...out.querySelectorAll('article.levelQuant54')];
 if(arts.length){arts.forEach((a,k)=>{const L=matchLv(D,G[k]||{});if(!L)return;const h=[...a.querySelectorAll('h3')].find(x=>x.textContent.trim()==='Blocos');const p=document.createElement('p');p.className='tag96';p.innerHTML='<b>'+esc(lvTag(L))+'</b>';(h||a.querySelector('h3')).insertAdjacentElement('afterend',p);});}
 else{const a=[...out.querySelectorAll('article.wallResult')].find(x=>/^Quantitativo de blocos/.test(x.querySelector('h3')?.textContent||''));const L=D.levels[0];if(a&&L){const p=document.createElement('p');p.className='tag96';p.innerHTML='<b>'+esc(lvTag(L))+'</b>';a.querySelector('h3').insertAdjacentElement('afterend',p);}}
 const html=buyHTML(D);if(html){const anchor=arts.at(-1)||[...out.querySelectorAll('article.wallResult')].find(x=>/^Quantitativo de blocos/.test(x.querySelector('h3')?.textContent||''));if(anchor)anchor.insertAdjacentHTML('afterend','<article class="wallResult buy96">'+html+'<h3>Resistências por pavimento</h3>'+tableHTML(D,true)+'</article>');}}

// pranchas: fbk nos resumos de cada nível + tabela de resistências e resumo de compra
{const cp=collectPlot26;collectPlot26=function(...a){const d=cp.apply(this,a);try{const D=compute();if(D){
  for(const it of d.items){if(!it.html||!/Resumo dos blocos|<h3>Blocos<\/h3>/.test(it.html))continue;let L=null;const m=String(it.title||'').match(/Nível ([+\-−]?)([\d.,]+) m/);if(m){const v=N(m[2].replace(/\./g,'').replace(',','.'))*(m[1]&&m[1]!=='+'?-1:1);L=D.levels.find(x=>Math.abs(x.v-v)<.001);}if(!L){const G=groupsLv();if(G.length===1)L=matchLv(D,G[0]);else if(D.levels.length===1)L=D.levels[0];}if(!L)continue;
   it.html=it.html.replace(/<h3>(Resumo dos blocos|Blocos)<\/h3>/,'<h3>$1'+(L.groups&&L.groups.length>1?' · fbk por andar':' · fbk '+f1(L.fbk)+' MPa')+'</h3><p class="tg96p"><b>'+esc(lvTag(L))+'</b></p>');try{it.h=measureHTML26(it.html,it.w-4)+13;}catch{}}
  const W=Math.min(d.availW,300),html=tableHTML(D,true)+buyHTML(D);let h=measureHTML26(html,W-4)+13;
  if(h<=d.availH){let k=-1;d.items.forEach((it,j)=>{if(/^(Mapa|Tabela) de cargas/.test(it.title||''))k=j;});d.items.splice(k+1,0,{title:'Resistências por pavimento · blocos e graute',w:W,h,html,res96:true});}}}catch(e){console.error('V96 prancha',e);}return d;};}

// ---------- notas executivas montadas pelo projeto (fixas + condicionais)
function ctx(){const C={floors:1,levels:1,types:new Map(),roof:false,edges:false,ground:'sem',open:false,steel:[],codes:[],D:null,width:new Set()};
 try{const R=L7().compute({});C.levels=R.LV?.length||1;C.floors=(R.LV||[]).reduce((s,l)=>s+Math.max(1,N(l.rep)||1),0)||1;
  for(const sl of R.slabs||[]){if(sl.kind==='cob')C.roof=true;const add=p=>{if(!p||p.type==='sem')return;const k=p.type==='mac'||p.type==='alv'?p.type+'|'+N(p.h):p.type;if(!C.types.has(k))C.types.set(k,p);};add(sl.def);for(const p of sl.ctx?.props||[])add(p);}
  C.ground=R.ground?.base||'sem';C.groundH=N(R.ground?.def?.h)||0;}catch{}
 try{C.edges=(L7().S().items||[]).some(it=>it.kind==='edge');}catch{}
 C.open=(state.walls||[]).some(w=>(w.openings||[]).length);for(const w of state.walls||[])C.width.add(N(w.width)||14);
 try{const sch=state.results?steelSchedule():[];C.steel=[...new Set(sch.map(r=>N(r.diameter)))].sort((a,b)=>a-b);}catch{}
 try{C.codes=state.results?Object.keys(blockTotals26()):[];}catch{}
 C.D=compute();return C;}
const diaTxt=v=>'Ø'+f1(v);
function slabNotes(C){const n=[],tr=[],mac=[],alv=[];for(const[k,p]of C.types){if(/^tr/.test(p.type))tr.push(p);else if(p.type==='mac')mac.push(p);else if(p.type==='alv')alv.push(p);}
 const trs=[...new Set(tr.map(p=>L7().shortTxt(p)))];
 if(tr.length)n.push('Laje'+(trs.length>1?'s':'')+' treliçada'+(trs.length>1?'s':'')+' '+[...new Set(tr.map(p=>L7().shortTxt(p)+' (h = '+({tr8:12,tr12:16,tr16:20,tr20:25}[p.type]||'')+' cm)'))].join(', ')+': vigotas na direção indicada na planta de lajes, enchimento e capa de concreto conforme o fabricante; armadura de distribuição e nervura de travamento conforme o fabricante.');
 if(mac.length)n.push('Laje'+(mac.length>1?'s':'')+' maciça'+(mac.length>1?'s':'')+' (h = '+[...new Set(mac.map(p=>f1(N(p.h),0)))].join(', ')+' cm): armaduras positiva e negativa conforme o detalhamento das lajes; cobrimento conforme a classe de agressividade (ABNT NBR 6118).');
 if(alv.length)n.push('Laje'+(alv.length>1?'s':'')+' alveolar'+(alv.length>1?'es':'')+' protendida'+(alv.length>1?'s':'')+' (h = '+[...new Set(alv.map(p=>f1(N(p.h),0)))].join(', ')+' cm): apoio mínimo sobre a cinta e capeamento conforme o fabricante.');
 if(C.types.size)n.push('Escorar e reescorar as lajes conforme a ABNT NBR 15696; retirar as escoras só com resistência adequada do concreto.');
 if(C.edges)n.push('Beirais e balanços: armadura negativa ancorada na laje interna; escoramento até o concreto atingir a resistência de projeto.');
 if(C.roof)n.push('Na laje de cobertura, prever apoio deslizante (manta ou papel betumado) sobre a cinta, para reduzir fissuras por variação térmica.');
 {const its=(L7().S().items||[]),bm=its.filter(i=>i.kind==='beam'),hs=its.filter(i=>i.kind==='hole'),vg=bm.filter(i=>i.sub==='viga').map(i=>i.name),rf=bm.filter(i=>i.sub==='ref').map(i=>i.name);
  if(vg.length)n.push('Vigas '+vg.join(', ')+': seção, armaduras e estribos conforme o detalhe; concretar junto com a laje, com apoio nas paredes indicadas e escoramento até a resistência de projeto.');
  if(rf.length)n.push('Reforços de laje '+rf.join(', ')+': barras na faixa sob a parede de cima, conforme o detalhe, ancoradas nas paredes de apoio; cobrimento e espaçamento entre barras conforme a ABNT NBR 6118.');
  if(hs.length)n.push('Aberturas na laje ('+[...new Set(hs.map(i=>(i.use||'abertura').toLowerCase()))].join(', ')+'): posição e dimensões conforme a planta de lajes, com reforço de borda conforme o detalhe; não abrir furos não indicados.');}
 if(C.ground==='radier')n.push('Piso térreo em radier (h = '+f1(C.groundH,0)+' cm), conforme o projeto de fundações.');else if(C.ground==='solo')n.push('Piso térreo em contrapiso com tela sobre o solo compactado; o contrapiso não serve de apoio às paredes.');
 return n;}
function notes(){const C=ctx(),D=C.D,multi=C.floors>1,lv=D?.levels||[],fb=[...new Set(lv.map(L=>L.fbk))],G=[];
 const fbTxt=lv.length?(fb.length===1?'fbk = '+f1(fb[0])+' MPa em todos os pavimentos':'fbk conforme a TABELA DE RESISTÊNCIAS POR PAVIMENTO ('+lv.slice().reverse().map(L=>L.name+': '+f1(L.fbk)+' MPa').join('; ')+')'):'fbk indicado em projeto';
 const fgTxt=lv.length?([...new Set(lv.map(L=>L.fgk))].length===1?'fgk = '+f1(lv[0].fgk,0)+' MPa':'fgk conforme a TABELA DE RESISTÊNCIAS POR PAVIMENTO ('+lv.slice().reverse().map(L=>L.name+': '+f1(L.fgk,0)+' MPa').join('; ')+')'):'fgk especificado em projeto';
 const ws=[...C.width].sort((a,b)=>a-b),dims=ws.map(w=>f1(w,0)+'×19×39 cm').join(' e ');
 G.push(['GERAIS',['Medidas em centímetros e níveis em metros, salvo indicação. Não medir no desenho: valem as cotas.',
  'Ler em conjunto com os projetos de arquitetura, fundações, lajes e instalações. Divergências devem ser informadas ao projetista antes da execução.',
  'Normas: ABNT NBR 16868-1, -2 e -3 (alvenaria estrutural), NBR 15270-1 (blocos cerâmicos)'+(C.types.size||C.ground==='radier'?', NBR 6118 (concreto)':'')+', NBR 6120 (ações)'+(C.steel.length?' e NBR 7480 (aço)':'')+'.',
  'Paredes estruturais não podem ser demolidas, cortadas ou ter vãos abertos sem autorização do projetista.',
  ...(multi?['Edificação com '+C.floors+' pavimentos: executar a alvenaria de cada pavimento só depois da laje do pavimento inferior concretada, com resistência adequada e escorada; manter as paredes de um pavimento sobre as do pavimento de baixo, como nas plantas.']:[])]]);
 const mins=lv.filter(L=>L.why==='min');
 G.push(['BLOCOS',['Blocos cerâmicos estruturais '+dims+', '+fbTxt+', atendendo à ABNT NBR 15270-1. Recebimento por lote, com ensaios.',
  ...(mins.length?['fbk de '+f1(N(S().min))+' MPa'+(mins.length<lv.length?' em '+mins.map(L=>L.name).join(', '):'')+': valor mínimo para bloco cerâmico estrutural estabelecido pela '+normMin()+' (o cálculo pediu menos).']:[]),
  ...(fb.length>1?['Blocos de resistências diferentes: identificar e estocar os lotes separados por pavimento; não trocar blocos entre pavimentos.']:[]),
  ...(fb.some(v=>v>=10)?['Blocos com fbk ≥ 10 MPa de paredes maciças com ranhura nas paredes internas, conforme a ABNT NBR 15270-1 e a ABNT NBR 16868-1.']:[]),
  'Seguir a paginação das plantas de 1ª e 2ª fiada e das elevações'+(C.codes.length?'; peças usadas neste projeto: '+C.codes.join(', '):'')+'. Evitar cortes não indicados.',
  'Assentar os blocos limpos e sem umedecer em excesso; furos alinhados na vertical nos pontos de graute.']]);
 G.push(['ARGAMASSA E JUNTAS',['Argamassa de assentamento com a resistência especificada, sem ultrapassar a resistência do bloco na área líquida.',
  'Juntas horizontais e verticais de '+f1(N($('jh')?.value)||1,0)+' cm, cheias, salvo indicação. Prumo, nível e alinhamento dentro das tolerâncias da ABNT NBR 16868-2.',
  'Marcação da 1ª fiada a partir dos eixos, com esquadro e nível conferidos; usar escantilhão em todos os cantos.']]);
 G.push(['GRAUTE',['Graute com '+fgTxt+' (mínimo de '+f1(N(S().gMin),0)+' MPa, '+normG()+'), consistência fluida e agregado graúdo de até 9,5 mm (brita 0).',
  'Grautear só depois de a argamassa ganhar resistência (mínimo de 24 h após o assentamento).',
  'Deixar janela de inspeção e limpeza na 1ª fiada de cada furo grauteado; retirar as rebarbas de argamassa antes do lançamento.',
  'Lançar em camadas, adensando com haste ou vibração leve, sem deslocar a armadura; preencher totalmente o furo, sem vazios.']]);
 if(C.steel.length)G.push(['ARMADURA VERTICAL',['Aço CA-50 (ABNT NBR 7480), barras '+C.steel.map(diaTxt).join(', ')+' nas posições indicadas nas elevações (N), uma por furo, salvo indicação.',
  'Esperas (arranques) '+(multi?'da fundação e das lajes':'da fundação')+' na posição exata dos furos grauteados, com o comprimento de traspasse indicado no detalhe.',
  'Encaixe: posicionar a barra pela janela de inspeção e amarrá-la à espera antes do graute; manter a barra centrada no furo com espaçador e travada no topo.',
  'Não cravar a barra no graute já lançado.']]);
 const vc=[];if(C.open)vc.push('Vergas e contravergas em canaleta U grauteada e armada, com apoio mínimo de 30 cm para cada lado do vão.');
 vc.push('Cinta de respaldo em canaleta (U/J) no topo de todas as paredes estruturais'+(C.types.size?', sob a laje':'')+'.');
 G.push([C.open?'VERGAS, CINTAS E LAJES':'CINTAS E LAJES',[...vc,...slabNotes(C),'Cargas não previstas (caixa d’água, equipamentos) só com consulta ao projetista.']]);
 G.push(['INSTALAÇÕES E CONTROLE',['Eletrodutos pelos furos verticais dos blocos; tubulações hidráulicas em shafts ou paredes não estruturais. Proibidos rasgos horizontais ou inclinados em paredes estruturais.',
  'Controle tecnológico: corpos de prova de argamassa e graute e ensaios de prisma'+(multi?' por pavimento':'')+', conforme a ABNT NBR 16868-3.']]);
 return G;}
window.notes96=notes;

// ---------- janelinha
const box=document.createElement('div');box.id='res96';box.className='noPrint';box.hidden=true;document.body.append(box);
function render(){const s=S(),D=compute();
 box.innerHTML='<div class="h96"><b>Resistências por pavimento</b><span>arraste por aqui</span><button type="button" class="vto96" title="Vento (NBR 6123), desaprumo e paredes de contraventamento">🌬 Vento e contraventamento</button><button type="button" class="mem96" title="Memorial de cálculo para imprimir ou salvar em PDF">📄 Memorial de cálculo</button><button type="button" class="x96" title="Fechar">✕</button></div><div class="b96">'+tableHTML(D,false)+
  '<details><summary>Parâmetros (norma e fornecedor)</summary><div class="p96">'+
  inp('gm','γm alvenaria',s.gm)+inp('kfk','fk / fpk',s.kfk)+inp('eta','Eficiência fpk / fbk',s.eta)+inp('fh','hef / h (1 = travada no topo e na base; 2 = topo livre)',s.fh)+inp('delta','δ = tef / t (enrijecedores; 1 = sem)',s.delta)+inp('exc','Excentricidade da laje e / t (0 = desligada; ex.: 0,167)',s.exc)+inp('min','fbk mínimo (MPa)',s.min)+inp('minItem','Item da NBR 15270-1:2023',s.minItem,'text')+inp('gMin','fgk mínimo (MPa)',s.gMin)+inp('gItem','Item da NBR 16868-1',s.gItem,'text')+
  '</div>'+(String(s.minItem||'').trim()?'':'<p class="w96">Informe o item da NBR 15270-1:2023 do fbk mínimo, para ele sair nas notas e na tabela.</p>')+'</details></div>';
 box.querySelector('.x96').onclick=()=>{box.hidden=true;};
 box.querySelector('.mem96').onclick=()=>window.memorial?.imprimir();
 box.querySelector('.vto96').onclick=()=>window.vento109?.open();
 box.querySelectorAll('.o96').forEach(sel=>sel.onchange=()=>{const v=N(sel.value);if(v>0)s.ovr[sel.dataset.k]=v;else delete s.ovr[sel.dataset.k];after();});
 box.querySelectorAll('[data-p96]').forEach(i=>i.onchange=()=>{const k=i.dataset.p96;s[k]=i.type==='text'?i.value:N(String(i.value).replace(',','.'))||DEF[k];after();});
 drag();}
const inp=(k,l,v,t='number')=>'<label>'+l+'<input data-p96="'+k+'" type="'+t+'" step="any" value="'+esc(String(v))+'"></label>';
function after(){render();try{decorate();}catch{}try{window.undo58?.push?.();}catch{}}
let d=null;function drag(){const h=box.querySelector('.h96');h.onpointerdown=e=>{if(e.target.closest('button'))return;const r=box.getBoundingClientRect();d={dx:e.clientX-r.left,dy:e.clientY-r.top};try{h.setPointerCapture(e.pointerId);}catch{}e.preventDefault();};
 h.onpointermove=e=>{if(!d)return;box.style.left=Math.max(0,Math.min(innerWidth-160,e.clientX-d.dx))+'px';box.style.top=Math.max(40,Math.min(innerHeight-60,e.clientY-d.dy))+'px';box.style.right='auto';};h.onpointerup=()=>{d=null;};}
function open(){render();box.hidden=false;}
window.res96={compute,open,S,notes,tableHTML,buyHTML,repAt,lvTag};
const css=document.createElement('style');css.textContent=
 '#res96{position:fixed;top:120px;right:20px;width:min(980px,calc(100vw - 40px));max-height:calc(100vh - 160px);overflow:auto;z-index:63;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 10px 28px rgba(16,46,75,.22);font-size:12.5px}#res96[hidden]{display:none}'+
 '#res96 .h96{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#eef3f8;border-bottom:1px solid #d5dee7;cursor:move;user-select:none;position:sticky;top:0;z-index:1}#res96 .h96 span{color:#8a9aaa;font-size:11px;flex:1}#res96 .mem96,#res96 .vto96{font-size:11.5px;padding:3px 9px;margin:0}#res96 .x96{border:0;background:none;font-size:15px;cursor:pointer;margin:0;padding:0 4px;color:#40566b}'+
 '#res96 .b96{padding:8px 10px}.t96{border-collapse:collapse;width:100%}.t96 th,.t96 td{border:1px solid #c9d4df;padding:3px 5px;text-align:center;vertical-align:middle}.t96 th{background:#eef3f8;font-weight:600}.t96 td:last-child{text-align:left}'+
 '.n96{font-size:11px;color:#40566b;margin:5px 0}.w96{color:#a33a00;font-size:11.5px}#res96 select.o96{font-size:11px;padding:0 2px;margin:0;width:auto}#res96 details{margin-top:6px}#res96 summary{cursor:pointer;font-weight:600;color:#174a78}'+
 '.p96{display:flex;flex-wrap:wrap;gap:6px 12px;margin:6px 0}.p96 label{display:flex;flex-direction:column;font-size:11px;color:#40566b}.p96 input{width:130px;margin:0}.tag96{margin:4px 0;color:#174a78}';
document.head.append(css);
})();
