// V105 — Dados do projeto em duas colunas + Editor de pavimentos (como o "Editar pisos" do CYPECAD e o editor de pavimentos do TQS).
// Cada linha é um pavimento: nome + piso a piso (m) + repetições; a cota é calculada (cota de baixo + piso a piso).
// Inserir acima / abaixo nunca mexe no pavimento de baixo. Máscara por pavimento: a mesma do de baixo (com ou sem as paredes),
// uma máscara nova (DXF/PDF) ou nenhuma (cobertura, fundação). Por baixo continua a lista de níveis de sempre (levels53).
(function(){
'use strict';
const N=Number,L68=()=>window.level68,LD=()=>window.loads77;
const sec=$('projectSection37');if(!L68()||!sec)return;
const fz=v=>{v=Math.round(v*1000)/1000;if(Math.abs(v)<5e-4)v=0;let s=v.toFixed(3).replace(/0$/,'');return s.replace('.',',');};
const fs=v=>(v>=0?'+':'−')+fz(Math.abs(v)).replace(/^(\d+),(\d)$/,'$1,$20');
const fmH=cm=>(N(cm)/100).toFixed(2).replace('.',',');
const parse=t=>{const m=String(t??'').trim().match(/^([+-]?\d+(?:[.,]\d+)?)\s*(.*)$/);return m?{value:N(m[1].replace(',','.')),label:m[2].trim()}:{value:0,label:String(t||'').trim()};};
const keyT=t=>{const L=parse(t);return (Number.isFinite(L.value)?L.value:0).toFixed(3)+'|'+(L.label||'');};
const tSlab=()=>N(window.opt3d74?.t)||10,Hdef=()=>num($('height').value)||280,hDef=()=>Hdef()+tSlab(),FI=20;
const typeOf=n=>/cobert|caixa|reservat|telhad|[áa]tico|platiband/i.test(n||'')?'cob':/funda|baldrame|sapata|radier|estaca/i.test(n||'')?'fund':'piso';
const TN={piso:'Piso',cob:'Cobertura',fund:'Fundação'};
const tp=F=>F.type&&F.type!=='auto'?F.type:typeOf(F.name);
const uidF=()=>'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const pagesNow=()=>{const s=new Set();try{for(const p of pages36)s.add(N(p.id));}catch{}try{for(const w of window.level68.all())s.add(N(w.page||1));}catch{}return [...s].sort((a,b)=>a-b);};
const pageObj=pg=>{try{return pages36.find(p=>N(p.id)===N(pg));}catch{return null;}};
const isCopy=pg=>(state.pageCopies72||[]).some(c=>N(c.id)===N(pg));
const rowOf=pg=>(state.levels53||[]).find(l=>String(l.page)===String(pg));
const allW=()=>{try{return L68().all();}catch{return state.walls||[];}};
const wallsOf=F=>allW().filter(w=>(F.pages||[]).includes(N(w.page||1)));
function wallH(F){const hs={};for(const w of wallsOf(F)){const h=Math.round(N(w.height)||0);if(h)hs[h]=(hs[h]||0)+1;}const e=Object.entries(hs).sort((a,b)=>b[1]-a[1])[0];return e?N(e[0]):Hdef();}
function msg(t){const s=$('planStatus');if(s)s.textContent=t;}
function store(){const S=LD()?.S?.();if(!S)return null;S.fl105??={base:0,list:[],sel:null};return S.fl105;}
function cotas(D){const z=[];let c=N(D.base)||0;for(const F of D.list){z.push(c);c+=Math.max(1,N(F.rep)||1)*(N(F.h)||0)/100;}return z;}
let busy=false;const noPlant='Este pavimento não tem planta (DXF/PDF) carregada — é o caso do projeto de exemplo. Para copiar, abra a planta de arquitetura (📂 Abrir PDF / DXF) e desenhe ou proponha as paredes sobre ela.';

// ---------- 1. lista de pavimentos <-> níveis das plantas
function reconcile(){const D=store();if(!D)return null;const P=pagesNow();
 const G=new Map();for(const pg of P){const r=rowOf(pg);if(!r)continue;const L=parse(r.text),k=keyT(r.text);let g=G.get(k);if(!g)G.set(k,g={key:k,z:L.value,label:L.label,rep:1,pages:[]});g.pages.push(pg);g.rep=Math.max(g.rep,Math.max(1,N(r.rep)||1));}
 const fresh=!D.list.length,zOld=cotas(D);D.list.forEach((F,i)=>{F._z=zOld[i];F._i=i;delete F._ext;});
 const used=new Set(),keep=[];
 for(const F of D.list){F.pages=(F.pages||[]).map(N).filter(pg=>P.includes(pg));
  if(F.pages.length){const r=rowOf(F.pages[0]),k=keyT(r?.text),g=G.get(k);if(!g||used.has(k))continue;used.add(k);
   if(F.key!==k&&g.label)F.name=g.label;F.rep=g.rep;F.pages=g.pages.slice();F._ext=g.z;F._z=g.z;F.key=k;keep.push(F);}
  else keep.push(F);}
 for(const g of [...G.values()].sort((a,b)=>a.z-b.z)){if(used.has(g.key))continue;
  const hit=keep.find(F=>!F.pages.length&&tp(F)==='piso'&&Math.abs(F._z-g.z)<0.006);
  if(hit){hit.pages=g.pages.slice();hit.rep=g.rep;hit._ext=g.z;if(g.label)hit.name=g.label;continue;}
  keep.push({id:uidF(),name:g.label||'',h:null,rep:g.rep,type:'auto',pages:g.pages.slice(),_ext:g.z,_z:g.z,_i:1e9+keep.length,key:g.key});}
 if(!keep.length){keep.push({id:uidF(),name:'Térreo',h:hDef(),rep:1,type:'auto',pages:[],_z:N(D.base)||0,_i:0},{id:uidF(),name:'Cobertura',h:0,rep:1,type:'auto',pages:[],_z:(N(D.base)||0)+hDef()/100,_i:1});}
 keep.sort((a,b)=>a._z-b._z||((a.pages.length?0:1)-(b.pages.length?0:1))||a._i-b._i);
 if(fresh&&keep.some(F=>F.pages.length)&&!keep.some(F=>!F.pages.length&&tp(F)==='cob'))keep.push({id:uidF(),name:'Cobertura',h:0,rep:1,type:'auto',pages:[],_z:1e9,_i:1e9});
 D.base=keep[0]._ext??keep[0]._z??0;let c=N(D.base)||0;
 for(let i=0;i<keep.length;i++){const F=keep[i];
  if(i>0&&F._ext!=null&&Math.abs(c-F._ext)>4e-4){const E=keep[i-1],r=Math.max(1,N(E.rep)||1),z0=c-r*(N(E.h)||0)/100;E.h=Math.max(0,Math.round((F._ext-z0)/r*1e5)/1e3);c=z0+r*E.h/100;}
  if(F.h==null)F.h=i===keep.length-1&&tp(F)==='cob'?0:wallH(F)+tSlab();
  c+=Math.max(1,N(F.rep)||1)*(N(F.h)||0)/100;}
 keep.forEach(F=>{delete F._z;delete F._i;delete F._ext;});D.list=keep;if(!D.list.some(F=>F.id===D.sel))D.sel=(D.list.find(F=>F.pages.length)||D.list[0])?.id||null;return D;}
// grava a cota e o nome de cada pavimento nas linhas das plantas; renomeia o que estava guardado com o nome antigo
function sync(){const D=store();if(!D)return 0;const z=cotas(D),ren=[],seen=new Set();
 D.list.forEach((F,i)=>{if(!F.pages.length){F.key=null;return;}let nm=String(F.name||'').trim(),txt=fz(z[i])+(nm?' '+nm:''),k=keyT(txt);
  while(seen.has(k)){nm=(nm||'Pavimento')+' (2)';txt=fz(z[i])+' '+nm;k=keyT(txt);}seen.add(k);F.name=nm;
  for(const pg of F.pages){const r=rowOf(pg);if(!r)continue;const ok=keyT(r.text);if(ok!==k&&!ren.some(x=>x[0]===ok))ren.push([ok,k]);r.text=txt;r.rep=Math.max(1,N(F.rep)||1);}F.key=k;});
 if(ren.length)rekey(ren);const b=$('baseLevel23');if(b)b.value=fz(N(D.base)||0);return ren.length;}
function rekey(ren){const S=LD()?.S?.();if(!S)return;const fl=S.fl105;delete S.fl105;let js=JSON.stringify(S);const rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 ren.forEach(([a],i)=>{js=js.replace(new RegExp('"'+rx(JSON.stringify(a).slice(1,-1))+'(?=["#|])','g'),'"\u0001'+i+'\u0001');});
 ren.forEach(([,b],i)=>{js=js.split('"\u0001'+i+'\u0001').join('"'+JSON.stringify(b).slice(1,-1));});
 try{const ns=JSON.parse(js);for(const k of Object.keys(S))delete S[k];Object.assign(S,ns);}catch(e){console.error('V105 rekey',e);}S.fl105=fl;try{window.lvl103?.takeSnap?.();}catch{}}
function apply(text){renumber();const n=sync();try{L68().refresh();}catch(e){console.error(e);}try{renderWalls();}catch{}try{LD()?.touch?.();}catch{}try{window.invalidate3D74?.();}catch{}render(true);if(text)msg(text);return n;}
window.cobName105=topKey=>{const D=store();if(!D)return '';const i=D.list.findIndex(F=>F.key===topKey),F=D.list[i+1];return F&&!F.pages.length&&tp(F)==='cob'?F.name:'';};

// ---------- 2. ações
const cur=()=>{const D=store();return D?D.list.find(F=>F.id===D.sel)||null:null;};
const idx=F=>store().list.indexOf(F);
const AUTO=/^\d+\s*[º°o]\s*pavimento(\s+\d+)?$/i,TER=/t[ée]rreo/i;
function ordinal(i){const D=store();const t0=Math.max(0,D.list.findIndex(F=>TER.test(F.name||'')));if(i<t0)return 0;let n=1;for(let k=t0;k<i;k++)if(tp(D.list[k])==='piso')n+=Math.max(1,N(D.list[k].rep)||1);return n;}
function renumber(){const D=store();if(!D)return;D.list.forEach((F,i)=>{if(tp(F)!=='piso'||!AUTO.test(String(F.name||'').trim()))return;const n=ordinal(i);if(n>=2)F.name=n+'º pavimento';});}
function uniqName(nm){const D=store();let s=nm,k=2;while(D.list.some(F=>F.name===s))s=nm+' '+(k++);return s;}
function insert(dir){busy=true;try{const D=reconcile();sync();const F=cur(),s=F?idx(F):D.list.length-1;
 let at,name;if(dir>0){at=s+1;const top=at>=D.list.length||D.list.slice(at).every(G=>tp(G)!=='piso');name=ordinal(at)===1&&!D.list.some(G=>TER.test(G.name||''))?'Térreo':Math.max(2,ordinal(at))+'º pavimento';}
 else{at=Math.max(0,s);name=at===0?'Subsolo':'Pavimento intermediário';}
 const nf={id:uidF(),name:AUTO.test(name)?name:uniqName(name),h:hDef(),rep:1,type:'auto',pages:[]};
 if(dir<0&&at===0)D.base=Math.round(((N(D.base)||0)-nf.h/100)*1000)/1000;
 // o de cima que era a última laje (cobertura sem altura) passa a ter o piso a piso do novo
 D.list.splice(at,0,nf);D.sel=nf.id;
 apply('Pavimento “'+nf.name+'” inserido '+(dir>0?'acima':'abaixo')+'. '+(dir<0&&at===0?'Os pavimentos de cima não mudaram de cota.':'Os pavimentos de baixo não mudaram.')+' Escolha a máscara dele no quadro do pavimento.');}finally{busy=false;}}
function copyPage(of,name){const p=pageObj(of);if(!p)return null;const id=nextPage36++;pages36.push({id,local:p.local,name,source:p.source});state.pageCopies72??=[];state.pageCopies72.push({id,of:N(of),name});state.pageScales23??={};if(state.pageScales23[of]&&!state.pageScales23[id])state.pageScales23[id]=state.pageScales23[of];
 state.levels53??=[];state.levels53.push({id:'lvl-'+id+'-'+Date.now().toString(36),text:'0',page:String(id),rep:1});return id;}
async function withWalls(F,src){// F recebe a máscara de src (e as paredes, se houver)
 const D=store(),z=cotas(D)[idx(F)],txt=fz(z)+' '+F.name,before=new Set(pagesNow()),op=window.prompt,oc=window.confirm;
 window.prompt=()=>txt;window.confirm=()=>true;try{for(const pg of src.pages){const has=allW().some(w=>N(w.page||1)===pg);if(has){const sw=allW().filter(w=>N(w.page||1)===pg),pr=[...(L68().props?.()||[]),...(window.props54raw?.get()||[])].filter(q=>sw.includes(q.wall)),b0=new Set(pagesNow()),keep=sw.map(w=>L68().resultOf(w));await window.copyLevel72(pg);sw.forEach((w,i)=>{if(keep[i])try{L68().setResult(w,keep[i]);}catch{}});copyProps(sw,pr,pagesNow().find(x=>!b0.has(x)));}else copyPage(pg,(pageObj(pg)?.name||'Planta').replace(/ \(cópia.*\)$/,'')+' (cópia '+fz(z)+')');}}finally{window.prompt=op;window.confirm=oc;}
 F.pages=pagesNow().filter(pg=>!before.has(pg));for(const pg of F.pages){const r=rowOf(pg);if(r){r.text=txt;r.rep=Math.max(1,N(F.rep)||1);}}try{options36(String($('page').value));}catch{}}
async function copyFloor(){if(busy)return;busy=true;try{const D=reconcile();sync();const F=cur();if(!F||!F.pages.length){alert('Escolha um pavimento que tenha máscara/paredes para copiar.');return;}for(const pg of F.pages)ensurePage(pg);
 const nf={id:uidF(),name:Math.max(2,ordinal(idx(F)+1))+'º pavimento',h:F.h,rep:1,type:F.type||'auto',pages:[]};D.list.splice(idx(F)+1,0,nf);D.sel=nf.id;sync();
 await withWalls(nf,F);const n=wallsOf(nf).length;apply('Pavimento “'+nf.name+'” criado acima de “'+F.name+'” com '+n+' parede(s) copiadas. O de baixo continua igual.');}finally{busy=false;}}
async function sameMask(walls){if(busy)return;busy=true;try{const D=reconcile();sync();const F=cur();if(!F)return;const i=idx(F),src=[...D.list.slice(0,i)].reverse().find(G=>G.pages.length);
 if(!src){alert('Não há pavimento com máscara abaixo deste.');return;}for(const pg of src.pages)ensurePage(pg);if(F.pages.length){alert('Este pavimento já tem máscara.');return;}
 if(walls){await withWalls(F,src);}else{const z=cotas(D)[i],txt=fz(z)+' '+F.name;F.pages=src.pages.map(pg=>copyPage(pg,(pageObj(pg)?.name||'Planta').replace(/ \(cópia.*\)$/,'')+' (cópia '+fz(z)+')')).filter(x=>x!=null);for(const pg of F.pages){const r=rowOf(pg);if(r)r.text=txt;}try{options36(String($('page').value));}catch{}}
 apply('“'+F.name+'” usa a máscara de “'+src.name+'”'+(walls?' com '+wallsOf(F).length+' parede(s) copiadas.':' (sem paredes: desenhe ou proponha as paredes sobre ela).'));}finally{busy=false;}}
// V105.1 — projeto sem planta de fundo (exemplo, paredes desenhadas à mão): a planta vira uma folha em branco para poder copiar
function blankSrc(pg){let X=1400,Y=1000;for(const w of allW())if(N(w.page||1)===N(pg)&&w.line)for(const q of w.line){X=Math.max(X,q.x+400);Y=Math.max(Y,q.y+400);}
 const c=document.createElement('canvas');c.width=Math.min(6000,Math.ceil(X));c.height=Math.min(6000,Math.ceil(Y));const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);return {name:'(sem planta de fundo)',type:'dxf',canvas:c,points:[],pages:[],blank105:true};}
function ensurePage(pg,name,src){pg=N(pg);let p=pageObj(pg);if(p)return p;p={id:pg,local:1,name:name||('Planta '+pg),source:src||blankSrc(pg)};pages36.push(p);try{nextPage36=Math.max(nextPage36,pg+1);}catch{}
 state.pageScales23??={};try{if(!state.pageScales23[pg]&&pxCm)state.pageScales23[pg]=pxCm;}catch{}try{options36(String($('page').value||pg));}catch{}return p;}
function restorePages(){try{const cps=state.pageCopies72||[];if(!cps.length)return;let n=0;for(const c of cps){if(!pageObj(c.of)){ensurePage(c.of);n++;}if(!pageObj(c.id)){ensurePage(c.id,c.name,pageObj(c.of)?.source);n++;}}
 if(n){try{options36(String($('page').value));}catch{}try{L68().refresh();}catch{}try{renderWalls();}catch{}}}catch(e){console.error('V105.1 plantas',e);}}
// V105.2 — a cópia leva também os vãos ainda não aceitos (propostas do DXF), para conferir no pavimento de cima
function copyProps(sw,pr,nid){if(!pr.length||nid==null)return;const nw=allW().filter(w=>N(w.page||1)===N(nid));const same=(a,b)=>a.line&&b.line&&a.line.every((q,i)=>Math.abs(q.x-b.line[i].x)<1e-6&&Math.abs(q.y-b.line[i].y)<1e-6);
 const out=[];for(const q of pr){const i=sw.indexOf(q.wall),c=nw.find(w=>same(w,q.wall))||nw[i];if(!c)continue;const {wall,...rest}=q;out.push({...JSON.parse(JSON.stringify(rest)),wall:c});}
 if(!out.length)return;try{if(state.walls.includes(out[0].wall))window.props54raw.set([...(window.props54raw.get()||[]),...out]);else L68().props?.().push(...out);}catch(e){console.error('V105.2 vãos',e);}}
// V105.2 — no modo Laje as paredes mostradas são as de baixo: aviso fixo para não editar o pavimento errado
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{const e=window.lvl92ctx;if(e&&String(e.id).startsWith('l|')&&window.mode94!=='cima'){const h=$('hud88')?.querySelector('.in88');if(h){const d=document.createElement('div');d.style.color='#c2410c';d.textContent='⚠ Paredes de '+L68().nameOf(e.wallKey)+' (as que sustentam esta laje): portas, janelas e paredes mudadas aqui mudam esse pavimento. Para editar '+L68().nameOf(e.slabKey)+', clique em “Paredes de cima”.';h.append(d);$('hud88').style.display='';}}}catch(er){console.error('V105.2 aviso',er);}return r;};}
// V105.3 — excluir pavimento com máscara própria: a página some do projeto (fica registrada como excluída); o arquivo sai do projeto quando nenhuma página dele é mais usada
function dropPlant(src){try{const used=pages36.some(p=>p.source===src)||(state.pageCopies72||[]).some(c=>(src.pages||[]).map(x=>N(x.id??x)).includes(N(c.of))&&pageObj(c.id));if(used)return;const k=plants36.indexOf(src);if(k>=0)plants36.splice(k,1);}catch(e){console.error(e);}}
function hidePages(){const D=store();const H=new Set((D?.hidden||[]).map(N));if(!H.size)return;let n=0;for(const pg of H){const k=pages36.findIndex(p=>N(p.id)===pg);if(k>=0){pages36.splice(k,1);n++;}}
 state.levels53=(state.levels53||[]).filter(l=>!H.has(N(l.page)));if(n){try{const left=pagesNow();options36(String(left.includes(N($('page').value))?$('page').value:left[0]));}catch{}try{L68().refresh();}catch{}}}
// V105.4 — ▶▶ Todos os níveis e 🔢 Renumerar ficavam fora da tela (junto do botão antigo): vão para a faixa de cima, ao lado do ▶ Gerar modulação
{const g=$('gen85');if(g){const host=g.parentElement;let at=g;for(const id of ['genAll103','renum101']){const b=$(id);if(b){b.classList.add('top105');at.after(b);at=b;}}}}
{const b=$('genAll103');if(b){b.textContent='▶▶ Todos';b.title='▶▶ Todos os níveis: gera a modulação de todos os pavimentos, um depois do outro';}}
// V105.4 — parede copiada de um pavimento já gerado vinha “travada” (desenho preservado) sem ter desenho: destrava antes de gerar
{const unl=()=>{try{for(const w of state.walls)if(w.locked76&&!(L68().resultOf(w)?.rows?.length))delete w.locked76;}catch(e){console.error(e);}};
 const g=$('generate');if(g)g.addEventListener('click',unl,true);}
let pend=null;
function loadOwn(){const F=cur();if(!F)return;pend=F.id;window.mk100skip=true;const inp=$('pdf');if(!inp){pend=null;window.mk100skip=false;return;}
 const clear=()=>setTimeout(()=>{if(pend&&!(inp.files&&inp.files.length)){pend=null;window.mk100skip=false;}},1500);inp.addEventListener('cancel',()=>{pend=null;window.mk100skip=false;},{once:true});window.addEventListener('focus',clear,{once:true});inp.value='';inp.click();}
{const ap=addPlant36;addPlant36=async function(file,stored){const n0=plants36.length,want=stored?null:pend;const r=await ap.apply(this,arguments);
 if(want){pend=null;setTimeout(()=>{window.mk100skip=false;},500);try{if(plants36.length>n0){const src=plants36[plants36.length-1],D=store(),F=D?.list.find(x=>x.id===want);if(F){const pgs=(src.pages||[]).map(p=>N(p.id??p));
  for(const pg of pgs){let r=rowOf(pg);if(!r){state.levels53??=[];r={id:'lvl-'+pg+'-'+Date.now().toString(36),text:'0',page:String(pg),rep:1};state.levels53.push(r);}}
  F.pages=[...new Set([...(F.pages||[]),...pgs])];if(src.type==='dxf')for(const pg of pgs)if(!state.origins74?.[pg])try{window.dxf00Page74?.(pg);}catch{}
  apply('Máscara '+(src.name||'')+' atribuída a “'+F.name+'”. As paredes que você propuser ou desenhar sobre ela ficam neste pavimento.');}}}catch(e){console.error('V105 máscara',e);}}
 else setTimeout(()=>{try{if($('dados105')&&document.body.dataset.v85==='dados')render();}catch{}},900);return r;};}
async function delFloor(){if(busy)return;const D=reconcile();sync();const F=cur();if(!F)return;if(D.list.length<2){alert('O projeto precisa de pelo menos um pavimento.');return;}
 const orig=F.pages.filter(pg=>!isCopy(pg)&&!pageObj(pg)?.source?.blank105);
 const n=wallsOf(F).length;if(!confirm('Excluir o pavimento “'+(F.name||'sem nome')+'”'+(n?' e as '+n+' parede(s) dele':'')+(orig.length?', com a máscara '+orig.map(pg=>pageObj(pg)?.name||pg).join(', '):'')+'?\nOs pavimentos de cima descem '+fmH(Math.max(1,N(F.rep)||1)*F.h)+' m.'))return;busy=true;
 try{if(F.pages.length){await L68().switchTo('all',true);const del=new Set(F.pages);state.walls=state.walls.filter(w=>!del.has(N(w.page||1)));
   for(const pg of del){const k=pages36.findIndex(p=>N(p.id)===pg);if(k>=0){const src=pages36[k].source;pages36.splice(k,1);if(!isCopy(pg)){D.hidden=[...new Set([...(D.hidden||[]),pg])];if(src&&!src.blank105)dropPlant(src);}}}state.pageCopies72=(state.pageCopies72||[]).filter(c=>!del.has(N(c.id)));state.levels53=(state.levels53||[]).filter(l=>!del.has(N(l.page)));
   try{const S=LD().S();if(F.key)S.items=(S.items||[]).filter(it=>LD().itemKey(it)!==F.key);}catch{}
   const left=pagesNow();if(left.length&&!left.includes(N($('page').value))){try{options36(String(left[0]));$('page').value=String(left[0]);await renderPage();}catch{}}else try{options36(String($('page').value));}catch{}
   try{invalidate();}catch{}}
  const i=idx(F);D.list.splice(i,1);D.sel=(D.list[i]||D.list[i-1])?.id||null;apply('Pavimento “'+F.name+'” excluído.');
  try{const E=window.lvl92?.entries?.()||[];if(window.lvl92?.current?.()==='all'&&E.length)await window.lvl92.go(E[0].id,true);}catch{}}finally{busy=false;render();}}
async function openFloor(F){F=F||cur();if(!F)return;if(!F.pages.length){alert('Este pavimento ainda não tem máscara. Escolha uma no quadro do pavimento.');return;}
 [...document.querySelectorAll('button,a,[data-v],[data-view]')].find(b=>b.offsetParent&&/^\s*Planta\s*$/.test(b.textContent))?.click();
 try{const E=window.lvl92?.entries?.()||[],K=F.key;let e=E.find(x=>x.id==='p|'+K)||E.find(x=>x.id==='e|'+K);if(e)await window.lvl92.go(e.id);else{e=E.find(x=>x.id==='l|'+K);if(e){window.mode94='cima';await window.lvl92.go(e.id);}else await L68().switchTo(K);}}catch(er){console.error(er);}}
function fixWalls(F,H){for(const w of wallsOf(F))w.height=H;try{invalidate();}catch{}try{renderWalls();}catch{}render();msg('Paredes de “'+F.name+'” com '+H+' cm ('+H/FI+' fiadas). Gere a modulação deste pavimento de novo.');}

// ---------- 3. tela
const h2=sec.querySelector(':scope>h2');const wrap=document.createElement('div');wrap.id='dados105';
wrap.innerHTML='<div class="c105 L105"><h3><span class="b105">A</span>Dados do projeto</h3><div id="L105f"></div><div class="s105">Plantas (máscaras) carregadas</div><div id="L105p"></div><details class="tips105"><summary>ⓘ Dicas de calibração e escala</summary><div id="L105t"></div></details></div><div class="c105 R105" id="R105"></div>';
if(h2){h2.after(wrap);h2.textContent='1. Projeto e pavimentos';}else sec.prepend(wrap);
{const f=sec.querySelector('.projectFields37');if(f)$('L105f').append(f);sec.querySelectorAll(':scope>p.note').forEach(p=>$('L105t').append(p));
 const hl=$('height')?.closest('label');if(hl&&hl.firstChild?.nodeType===3)hl.firstChild.textContent='Altura das paredes · pé-direito modular (cm)';
 if(f&&!$('t105')){const l=document.createElement('label');l.innerHTML='Espessura da laje (cm)<input id="t105" type="number" min="6" max="40" step="1">';const hl2=$('height')?.closest('label');(hl2||f.lastChild)?.after(l);
  const t=$('t105');t.value=tSlab();t.onchange=()=>{const v=Math.max(6,Math.min(40,N(t.value)||10));t.value=v;if(window.opt3d74){window.opt3d74.t=v;try{localStorage.setItem('v3d74',JSON.stringify(window.opt3d74));}catch{}}try{window.invalidate3D74?.();}catch{}render();};}
 $('height')?.addEventListener('change',()=>setTimeout(render,0));}
function plantsHTML(){const D=store(),ps=(()=>{try{return pages36;}catch{return [];}})();const use=pg=>D.list.filter(F=>F.pages.includes(N(pg))).map(F=>F.name||'—');
 const orig=ps.filter(p=>!isCopy(p.id));if(!orig.length)return '<p class="note">Nenhuma planta carregada ainda.</p>'+btns();
 const rows=orig.map(p=>{const cps=ps.filter(q=>isCopy(q.id)&&q.source===p.source);const fl=[...new Set([...use(p.id),...cps.flatMap(q=>use(q.id))])];return '<tr><td><b>'+esc(p.name)+(p.local>1?' p.'+p.local:'')+'</b></td><td>'+esc(p.source?.name||'')+'</td><td>'+(fl.length?esc(fl.join(', ')):'<i>—</i>')+'</td></tr>';}).join('');
 return '<table class="t105"><tr><th>Máscara</th><th>Arquivo</th><th>Usada em</th></tr>'+rows+'</table>'+btns();
 function btns(){return '<div class="tb105"><button type="button" class="secondary" data-a="load">＋ Carregar planta (DXF/PDF)</button></div>';}}
function wallCheck(F){if(tp(F)!=='piso'||!F.pages.length)return null;const exp=Math.round(N(F.h)-tSlab()),H=wallH(F),n=wallsOf(F).length,mod=exp%FI===0;
 return {exp,H,n,mod,same:Math.abs(H-exp)<0.5,ok:mod&&Math.abs(H-exp)<0.5};}
function svgHTML(D,z){const W=150,HP=Math.max(300,Math.min(440,90+D.list.length*34)),bands=[],b0=N(D.base)||0;
 D.list.forEach((F,i)=>{const r=Math.max(1,N(F.rep)||1);for(let j=0;j<r;j++)bands.push({F,i,j,r,z0:z[i]+j*F.h/100,h:N(F.h)||0});});
 const top=Math.max(b0+0.5,...bands.map(b=>b.z0+b.h/100)),span=Math.max(1,top-b0);let k=Math.min(70,(HP-60)/span);
 const px=b=>b.h>0?Math.max(10,b.h/100*k):0;let tot=bands.reduce((s,b)=>s+px(b),0);if(tot>HP-50){k*=(HP-50)/tot;tot=bands.reduce((s,b)=>s+px(b),0);}
 let y=HP-28;const ys=bands.map(b=>{const y0=y;y-=px(b);return y0;});
 const g=(b0<=0&&top>=0)?0:b0;let gy=HP-28;bands.forEach((b,n)=>{if(Math.abs(b.z0-g)<1e-3&&n>=0&&gy===HP-28&&g!==b0)gy=ys[n];});if(g!==b0&&gy===HP-28){const bi=bands.findIndex(b=>b.z0<=g&&g<b.z0+b.h/100);if(bi>=0)gy=ys[bi]-(g-bands[bi].z0)*100/bands[bi].h*px(bands[bi]);}
 const col={piso:['#dff3e4','#1e6b36'],cob:['#fde7d9','#9a4a12'],fund:['#ece5d8','#6b5320']};
 let out='<rect x="0" y="'+gy+'" width="'+W+'" height="'+(HP-gy)+'" fill="#f3e6a6"/><line x1="0" x2="'+W+'" y1="'+gy+'" y2="'+gy+'" stroke="#b39a3a" stroke-width="1.2"/>';
 bands.forEach((b,n)=>{const y=ys[n],hpx=px(b),y1=y-hpx,t=tp(b.F),[f,s]=col[t],on=b.F.id===D.sel,nm=b.F.name||'',full=b.F.pages.length||t!=='piso';
  if(hpx>0)out+='<g data-f="'+b.F.id+'" style="cursor:pointer"><title>'+esc(nm)+(b.r>1?' ('+(b.j+1)+'º de '+b.r+')':'')+' · '+fs(b.z0)+' m · piso a piso '+fmH(b.h)+' m</title><rect x="54" y="'+y1+'" width="'+(W-62)+'" height="'+hpx+'" fill="'+(on?'#9cc2ff':full?f:'#fff')+'" stroke="'+(on?'#1d4f86':s)+'" stroke-width="'+(on?2.4:1)+'"'+(full?'':' stroke-dasharray="4 3"')+'/>'+(hpx>=13?'<text x="'+(54+(W-62)/2)+'" y="'+(y1+hpx/2+3.5)+'" font-size="9.5" text-anchor="middle" fill="'+(on?'#0d2f57':s)+'" font-weight="bold">'+esc((b.r>1?(b.j+1)+'º · ':'')+(nm.length>16?nm.slice(0,15)+'…':nm))+'</text>':'')+'</g>';
  else out+='<g data-f="'+b.F.id+'" style="cursor:pointer"><title>'+esc(nm)+' · '+fs(b.z0)+' m</title><rect x="50" y="'+(y-3)+'" width="'+(W-54)+'" height="6" fill="'+(on?'#1d4f86':s)+'"/><text x="'+(54+(W-62)/2)+'" y="'+(y-7)+'" font-size="9.5" text-anchor="middle" fill="'+s+'" font-weight="bold">'+esc(nm.length>16?nm.slice(0,15)+'…':nm)+'</text></g>';
  if(b.j===0||hpx>=12)out+='<text x="48" y="'+(y+3.5)+'" font-size="9" text-anchor="end" fill="#405169">'+fs(b.z0)+'</text><line x1="50" x2="54" y1="'+y+'" y2="'+y+'" stroke="#405169"/>';});
 return '<svg id="sv105" width="'+W+'" height="'+HP+'" viewBox="0 0 '+W+' '+HP+'">'+out+'</svg>';}
function render(force){const R=$('R105');if(!R||(busy&&!force))return;const D=reconcile();if(!D)return;if(sync()){try{L68().refresh();}catch{}try{renderWalls();}catch{}try{LD()?.touch?.();}catch{}}const z=cotas(D),F=cur();
 const rowsHTML=D.list.map((G,i)=>({G,i})).reverse().map(({G,i})=>{const t=tp(G),c=wallCheck(G),r=Math.max(1,N(G.rep)||1),last=i===D.list.length-1;
  const msk=G.pages.length?G.pages.map(pg=>esc(pageObj(pg)?.name||('Planta '+pg))).join(', '):(t==='piso'?'<span class="no105">sem máscara</span>':'<span class="mu105">—</span>');
  let h='<tr data-f="'+G.id+'" class="'+(G.id===D.sel?'on105':'')+'"><td><input class="nm105" data-k="name" value="'+esc(G.name||'')+'" placeholder="nome do pavimento"></td>'+
   '<td><select data-k="type" class="ty105 t-'+t+'"><option value="auto"'+(G.type==='auto'||!G.type?' selected':'')+'>'+TN[typeOf(G.name)]+' (auto)</option>'+Object.entries(TN).map(([k,v])=>'<option value="'+k+'"'+(G.type===k?' selected':'')+'>'+v+'</option>').join('')+'</select></td>'+
   '<td class="n105"><input class="h105" data-k="h" value="'+(last&&!N(G.h)?'':fmH(G.h))+'" placeholder="—"></td><td class="n105 z105">'+fs(z[i])+'</td><td class="m105">'+msk+'</td>'+
   '<td>'+(t==='piso'?'<input class="r105" data-k="rep" type="number" min="1" step="1" value="'+r+'">':'<span class="mu105">—</span>')+'</td><td class="n105">'+(c?c.n+' '+(c.ok?'<span class="ok105">✓</span>':'<span class="wa105" title="altura das paredes">⚠</span>'):'<span class="mu105">—</span>')+'</td></tr>';
  if(r>1)for(let j=r-1;j>=0;j--)h+='<tr class="sub105" data-f="'+G.id+'"><td>&nbsp;&nbsp;└ '+(j+1)+'º de '+r+(j===0?' (tipo)':'')+'</td><td></td><td class="n105">'+fmH(G.h)+'</td><td class="n105">'+fs(z[i]+j*G.h/100)+'</td><td colspan="3" class="mu105">'+(j===0?'pavimento-tipo':'igual ao tipo')+'</td></tr>';
  return h;}).join('');
 let det='';if(F){const i=idx(F),t=tp(F),c=wallCheck(F),below=[...D.list.slice(0,i)].reverse().find(G=>G.pages.length);
  det='<div class="det105"><div class="dh105"><b>Pavimento selecionado: '+esc(F.name||'(sem nome)')+'</b><span>cota '+fs(z[i])+' m · piso a piso '+fmH(F.h)+' m'+(N(F.rep)>1?' · ×'+F.rep:'')+'</span>'+(F.pages.length?'<button type="button" data-a="open">✏ Abrir planta deste pavimento</button>':'')+'</div>';
  if(t==='piso'){det+='<div class="ml105">Máscara / paredes deste pavimento</div>';
   if(F.pages.length)det+='<div class="ms105">✔ <b>'+F.pages.map(pg=>esc(pageObj(pg)?.name||pg)+(isCopy(pg)?' <span class="mu105">(mesma máscara de '+esc(pageObj((state.pageCopies72||[]).find(x=>N(x.id)===pg)?.of)?.name||'')+')</span>':' <span class="mu105">('+esc(pageObj(pg)?.source?.name||'')+')</span>')).join(', ')+'</b> · '+wallsOf(F).length+' parede(s)</div>';
   else det+='<div class="opt105">'+(below?'<button type="button" data-a="sameW">⧉ Mesma máscara do de baixo + copiar as paredes <small>('+esc(below.name)+')</small></button><button type="button" data-a="same">▭ Mesma máscara do de baixo, sem paredes</button>':'')+'<button type="button" data-a="own">📂 Máscara própria (abrir DXF/PDF)…</button></div>';
   if(c){const fi=c.exp/FI;det+='<div class="ck105">Parede: '+fmH(F.h)+' − laje '+fmH(tSlab())+' = <b>'+fmH(c.exp)+' m → '+(c.mod?fi+' fiadas':fi.toFixed(2).replace('.',',')+' fiadas')+'</b> '+(c.mod?'<span class="ok105">✓ modula</span>':'<span class="wa105">⚠ não modula</span> · sugestão: piso a piso '+fmH(Math.round(c.exp/FI)*FI+tSlab())+' m')+
    (c.n&&!c.same?'<br><span class="wa105">⚠ As paredes deste pavimento estão com '+fmH(c.H)+' m.</span>'+(c.mod?' <button type="button" data-a="fixw" data-h="'+c.exp+'">Ajustar paredes para '+fmH(c.exp)+' m</button>':''):'')+'</div>';}
   else if(!F.pages.length)det+='<div class="ck105 mu105">Piso a piso '+fmH(F.h)+' m − laje '+fmH(tSlab())+' = parede de '+fmH(F.h-tSlab())+' m ('+((F.h-tSlab())/FI).toFixed(1).replace('.',',').replace(',0','')+' fiadas).</div>';}
  else det+='<div class="ck105 mu105">'+(t==='cob'?'Cobertura: laje de topo apoiada nas paredes do pavimento de baixo — sem paredes acima. Para uma caixa d’água, insira outro pavimento acima com o piso a piso dela.':'Fundação: base do prédio, sem laje. A distância até o pavimento de cima é o piso a piso desta linha.')+'</div>';
  det+='</div>';}
 R.innerHTML='<h3><span class="b105">B</span>Editar pavimentos</h3><div class="tb105"><button type="button" class="pr105" data-a="up">⬆ Inserir acima</button><button type="button" class="pr105" data-a="dn">⬇ Inserir abaixo</button><button type="button" class="secondary" data-a="copy">⧉ Copiar pavimento</button><button type="button" class="dl105" data-a="del">🗑 Excluir</button><label class="bz105">Cota do pavimento mais baixo <input id="base105" value="'+fz(N(D.base)||0)+'"> m</label></div>'+
  '<div class="bd105">'+svgHTML(D,z)+'<div class="tw105"><table class="t105 ed105"><tr><th>Nome do pavimento</th><th>Tipo</th><th class="n105">Piso a piso (m)</th><th class="n105">Cota (m)</th><th>Máscara</th><th>Rep.</th><th class="n105">Paredes</th></tr>'+rowsHTML+'</table>'+det+'</div></div>'+
  '<div class="lg105"><span class="t-cob tg105">Cobertura</span> laje de topo, sem paredes acima <span class="t-piso tg105">Piso</span> paredes + laje <span class="t-fund tg105">Fundação</span> base, sem laje · a cota é calculada: cota de baixo + piso a piso × repetições</div>';
 $('L105p').innerHTML=plantsHTML();}
// eventos
wrap.addEventListener('click',async e=>{const a=e.target.closest('[data-a]')?.dataset.a;if(a){e.preventDefault();
  if(a==='up')insert(1);else if(a==='dn')insert(-1);else if(a==='copy')await copyFloor();else if(a==='del')await delFloor();else if(a==='open')await openFloor();
  else if(a==='sameW')await sameMask(true);else if(a==='same')await sameMask(false);else if(a==='own')loadOwn();else if(a==='load'){window.mk100skip=false;$('pdf')?.click();}
  else if(a==='fixw'){const F=cur();if(F)fixWalls(F,N(e.target.closest('[data-h]').dataset.h));}return;}
 const g=e.target.closest('[data-f]');if(g&&!e.target.closest('input,select')){const D=store();if(D.sel!==g.dataset.f){D.sel=g.dataset.f;render();}}});
wrap.addEventListener('dblclick',e=>{const g=e.target.closest('#sv105 [data-f]');if(g){const F=store().list.find(x=>x.id===g.dataset.f);if(F)openFloor(F);}});
wrap.addEventListener('focusin',e=>{const tr=e.target.closest('tr[data-f]');if(tr&&e.target.matches('input,select')){const D=store();if(D.sel!==tr.dataset.f){D.sel=tr.dataset.f;for(const x of wrap.querySelectorAll('tr.on105'))x.classList.remove('on105');tr.classList.add('on105');}}});
wrap.addEventListener('change',e=>{const el=e.target;if(el.id==='base105'){const v=N(String(el.value).replace(',','.'));if(!Number.isFinite(v)){render();return;}const D=store();D.base=v;apply('Cota do pavimento mais baixo: '+fs(v)+' m. Os de cima acompanham.');return;}
 const k=el.dataset.k,tr=el.closest('tr[data-f]');if(!k||!tr)return;const D=reconcile(),F=D.list.find(x=>x.id===tr.dataset.f);if(!F)return;D.sel=F.id;
 if(k==='name'){const v=String(el.value).trim();if(!v){render();return;}if(D.list.some(G=>G!==F&&G.name===v)){alert('Já existe um pavimento com esse nome.');render();return;}F.name=v;apply('Pavimento renomeado: '+v+'.');}
 else if(k==='type'){F.type=el.value;apply();}
 else if(k==='h'){let v=N(String(el.value).replace(',','.'));if(!Number.isFinite(v)||v<0){render();return;}if(v>20)v=v/100;F.h=Math.round(v*1000)/10;apply('Piso a piso de “'+F.name+'”: '+fmH(F.h)+' m. Os pavimentos de cima foram recalculados; os de baixo não mudaram.');}
 else if(k==='rep'){const v=Math.max(1,Math.round(N(el.value)||1));F.rep=v;apply('“'+F.name+'” repete '+v+'×.');}});
wrap.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('#dados105 input')){e.preventDefault();e.target.blur();}});
// abre/atualiza quando a aba "Dados do projeto" aparece
new MutationObserver(()=>{if(document.body.dataset.v85==='dados')render();}).observe(document.body,{attributes:true,attributeFilter:['data-v85']});
{const r=$('restore');if(r){const old=r.onchange;r.onchange=async function(...a){const res=await old?.apply(this,a);restorePages();hidePages();setTimeout(()=>{try{if(document.body.dataset.v85==='dados')render();}catch(e){console.error(e);}},50);return res;};}}
for(const id of ['newProject','example']){const b=$(id);if(!b)continue;const old=b.onclick;b.onclick=function(...a){const r=old?.apply(this,a);setTimeout(()=>{try{if(document.body.dataset.v85==='dados')render();}catch(e){console.error(e);}},60);return r;};}
setTimeout(()=>{try{if(document.body.dataset.v85==='dados')render();}catch(e){console.error('V105',e);}},0);
window.floors105={reconcile,sync,render,list:()=>store()?.list||[],cotas:()=>cotas(store()),insert,copyFloor,sameMask,delFloor,openFloor,select:id=>{store().sel=id;render();}};
const css=document.createElement('style');css.textContent=`
#dados105{display:grid;grid-template-columns:minmax(380px,40%) 1fr;gap:16px;align-items:start;margin-top:6px}
body.ui85[data-v85=plan] #dados105{display:none!important}
#projectSection37>#levels53{display:none!important}
#dados105 .c105{border:1px solid #d5dde8;border-radius:8px;background:#f7f9fc;padding:12px 14px;min-width:0}
#dados105 h3{margin:0 0 10px;font-size:17px;color:#1d4f86;display:flex;align-items:center;gap:6px}
.b105{display:inline-block;background:#f5b400;color:#203348;border-radius:50%;width:19px;height:19px;text-align:center;font-size:11px;line-height:19px}
#dados105 .projectFields37{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px 10px!important;margin:0!important}
#dados105 .projectFields37>label{margin:0!important;min-width:0;font-size:12px;grid-column:auto!important;width:auto!important;flex:none!important}
#dados105 .projectFields37>label:first-child{grid-column:1/-1!important}
#dados105 .projectFields37>label:has(#baseLevel23){display:none!important}
#dados105 .projectFields37 input,#dados105 .projectFields37 select{width:100%;box-sizing:border-box}
#dados105 .supAll53{display:flex;gap:6px}#dados105 .supAll53 select{flex:1}#dados105 .supAll53 input{width:64px}
.s105{font-size:11px;font-weight:bold;letter-spacing:.06em;color:#7a8aa0;margin:14px 0 6px;border-bottom:1px solid #e1e7ef;padding-bottom:3px;text-transform:uppercase}
.t105{border-collapse:collapse;width:100%;font-size:12.5px;background:#fff}
.t105 th{background:#e6ecf4;text-align:left;padding:5px 6px;font-size:11.5px;color:#405169;border-bottom:1px solid #cfd8e4;white-space:nowrap}
.t105 td{padding:4px 6px;border-bottom:1px solid #edf1f6}
.n105{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tb105{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0 10px}
.tb105 button{padding:5px 10px;font-size:12.5px}
.pr105{background:#1d4f86!important;color:#fff!important}
.dl105{background:#fff!important;color:#b42318!important;border:1px solid #f0c4c0!important}
.bz105{margin-left:auto;font-size:12px;display:inline-flex;align-items:center;gap:5px}.bz105 input{width:70px}
.bd105{display:flex;gap:12px;align-items:flex-start}
#sv105{flex:none;background:#fff;border:1px solid #d5dde8;border-radius:6px}
.tw105{flex:1;min-width:0}
.ed105 tr[data-f]{cursor:pointer}.ed105 tr.on105>td{background:#dbe9ff}
.ed105 input,.ed105 select{font-size:12.5px;padding:3px 5px;box-sizing:border-box}
.nm105{width:100%;min-width:110px}.h105{width:62px;text-align:right}.r105{width:52px}.ty105{min-width:112px;font-size:12px!important}
.sub105 td{color:#6a7a8f;font-size:11.5px;background:#fbfcfe!important}
.z105{font-weight:bold;color:#203348}
.m105{font-size:12px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.no105{color:#a15c00;font-style:italic}.mu105{color:#6a7a8f}
.ok105{color:#1e7b3b;font-weight:bold}.wa105{color:#a15c00;font-weight:bold}
.tg105{display:inline-block;border-radius:9px;padding:1px 7px;font-size:10.5px;font-weight:bold;margin-left:8px}
.t-cob{background:#fde7d9!important;color:#9a4a12}.t-piso{background:#dff3e4!important;color:#1e6b36}.t-fund{background:#ece5d8!important;color:#6b5320}
.ty105.t-cob,.ty105.t-piso,.ty105.t-fund{font-weight:bold}
.det105{margin-top:10px;border:1px solid #9cbcf0;background:#f2f7ff;border-radius:8px;padding:10px 12px;font-size:12.5px}
.dh105{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin-bottom:6px}.dh105 b{font-size:13.5px}.dh105 span{color:#5a6b80}.dh105 button{margin-left:auto}
.ml105{font-size:12px;color:#5a6b80;margin:4px 0}
.opt105{display:flex;flex-direction:column;gap:5px;align-items:flex-start}.opt105 button{font-size:12.5px;text-align:left}
.ck105{margin-top:8px;line-height:1.5}.ck105 button{font-size:12px;padding:2px 8px;margin-left:6px}
.lg105{margin-top:8px;font-size:11px;color:#5a6b80}.lg105 .tg105:first-child{margin-left:0}
#lvl92{min-width:140px!important;max-width:190px!important;flex-shrink:0!important}#mk100ref{max-width:100px!important;flex-shrink:0!important}.lv85{flex-shrink:0!important}#lvlHost85{flex-shrink:0!important}
@media (max-width:1750px){#autoBadge71{display:none!important}}
#genHost85{display:inline-flex!important;flex-wrap:nowrap!important;align-items:center!important;flex:none}
.top105{margin:0 0 0 6px!important;padding:6px 10px!important;font-size:13px!important;font-weight:600!important;white-space:nowrap;background:#fff!important;color:#1d4f86!important;border:1px solid #c9d4e3!important;border-radius:6px!important;height:auto!important}
.tips105{margin-top:12px;font-size:12px}.tips105 summary{cursor:pointer;color:#5a6b80}.tips105 .note{font-size:12px}
@media (max-width:1100px){#dados105{grid-template-columns:1fr}}
`;document.head.append(css);
})();
