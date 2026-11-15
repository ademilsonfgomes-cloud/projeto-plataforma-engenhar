// V83 — armaduras: “VERGA” / “CONTRAVERGA” escrito na barra; ferramentas por modo, sem janelas (✏ editar · ⫘ unir · ✂ separar).
(function(){
'use strict';
const N=Number,DIAS=[8,10,12.5];
const fd=d=>Number(d).toFixed(1).replace('.',',');

// ---------- 1. Rótulo da barra: VERGA / CONTRAVERGA
const kindTag=b=>{const k=String(b?.label83||b?.kind||'');if(/^Contraverga/i.test(k))return 'CONTRAVERGA';if(/^Verga/i.test(k))return 'VERGA';return '';};
try{const ap=applySteelMerges23;applySteelMerges23=function(data){ap.call(this,data);try{for(const d of data)for(const b of d.horizontals){if(!b.merged23)continue;const rec=(state.steelMerges23||[]).find(r=>r.id===b.merged23);if(!rec)continue;const ks=rec.members.map(m=>String(m).split('|')[0]);if(ks.length&&ks.every(k=>/^Verga/i.test(k)))b.label83='Verga';else if(ks.length&&ks.every(k=>/^Contraverga/i.test(k)))b.label83='Contraverga';}}catch(e){console.error('V83',e);}};}catch(e){console.error('V83',e);}
try{const sw=steelWall;steelWall=function(w,m,which,...a){let html=sw.call(this,w,m,which,...a);if(which!=='elevation')return html;try{const i=state.walls.indexOf(w),d=state.steel?.[i];if(!d)return html;
 html=html.replace(/(<g data-steel-wall="\d+" data-steel-kind="horizontal" data-steel-index="(\d+)"[^>]*>[\s\S]*?<text [^>]*>)([^<]*)(<\/text>)/g,(all,pre,idx,txt,post)=>{const b=d.horizontals.find(x=>x.editIndex===N(idx)),t=kindTag(b);return t&&!txt.includes(t)?pre+txt+' · '+t+post:all;});}catch(e){console.error('V83 rótulo',e);}return html;};}catch(e){console.error('V83',e);}

// ---------- 2. Ferramentas por modo
let mode='',sel=null;const undo=[];
const barOf=(wall,kind,index)=>{const d=state.steel?.[wall];if(!d)return null;return kind==='vertical'?d.points[index]:d.horizontals.find(b=>b.editIndex===index);};
function say(t){const s=$('st83msg');if(s)s.textContent=t||'';}
const HELP={edit:'✏ Editar aço: clique numa barra (horizontal ou vertical) para mudar bitola e quantidade. Esc sai.',union:'⫘ Unir: clique no 1º ferro e depois no 2º — viram uma barra só. Continue unindo; Ctrl+Z desfaz. Esc sai.',split:'✂ Separar: clique numa barra unida para desfazer a união. Esc sai.'};
function setMode(m){mode=mode===m?'':m;sel=null;closePop();paint();document.body.classList.toggle('st83on',!!mode);document.querySelectorAll('#st83 [data-m],#st83side [data-m]').forEach(b=>b.classList.toggle('on',b.dataset.m===mode));say(mode?HELP[mode]:'');}
function paint(){document.querySelectorAll('[data-steel-wall] line:not([data-hit])').forEach(l=>{if(l.dataset.st83){l.style.stroke='';l.style.strokeWidth='';delete l.dataset.st83;}});if(!sel)return;
 document.querySelectorAll(`[data-steel-wall="${sel.wall}"][data-steel-kind="${sel.kind}"][data-steel-index="${sel.index}"] line:not([data-hit])`).forEach(l=>{l.style.stroke='#087dcc';l.style.strokeWidth='.9';l.dataset.st83='1';});}
function refresh(wall){const old=$('wall-result-'+wall),top=old?.getBoundingClientRect().top,sx=window.scrollX,sy=window.scrollY;renderResults({reports:state.junctionReports||[]},state.results);const now=$('wall-result-'+wall);window.scrollTo(sx,Math.max(0,top!=null&&now?window.scrollY+now.getBoundingClientRect().top-top:sy));paint();}

// ⫘ unir
function voidCrossed(w,start,end,b){const y=b.y+b.height*.75;return (w.openings||[]).some(o=>y>N(o.bottom)+.01&&y<N(o.bottom)+N(o.height)-.01&&end>N(o.start)&&start<N(o.start)+N(o.width));}
function unite(wall,i1,i2){const d=state.steel?.[wall],w=state.walls[wall],b1=barOf(wall,'horizontal',i1),b2=barOf(wall,'horizontal',i2);if(!d||!b1||!b2)return false;
 if(Math.abs(b1.y-b2.y)>.01||Math.abs(b1.height-b2.height)>.01){say('Os dois ferros precisam estar na mesma fiada. Clique de novo no 1º ferro.');return false;}
 const start=Math.min(b1.start,b2.start),end=Math.max(b1.end,b2.end);if(voidCrossed(w,start,end,b1)){say('A união atravessaria um vão vazio (porta ou janela nessa altura).');return false;}
 state.steelMerges23??=[];const removed=[],members=new Set();
 for(const b of [b1,b2]){if(b.merged23){const k=state.steelMerges23.findIndex(r=>r.id===b.merged23);if(k>=0){removed.push(state.steelMerges23[k]);state.steelMerges23[k].members.forEach(x=>members.add(x));state.steelMerges23.splice(k,1);}}else members.add(barIdentity23(b));}
 const o1=state.steelOverrides?.[b1.key]||{},o2=state.steelOverrides?.[b2.key]||{},diameter=Math.max(N(o1.diameter||b1.diameter),N(o2.diameter||b2.diameter)),quantity=Math.max(N(o1.quantity||b1.quantity||1),N(o2.quantity||b2.quantity||1));
 const rec={id:'merge-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),wall:w.uid,geometry:steelGeometryKey(w),members:[...members],start,end};state.steelMerges23.push(rec);
 const merged={...b1,start,end,length:Math.floor(end-start-5+1e-8),kind:'Aço unido'},key=steelOverrideKey({i:wall},merged,'horizontal');state.steelOverrides??={};const prev=state.steelOverrides[key];state.steelOverrides[key]={...(o1||{}),diameter,quantity,lowerQuantity:Math.max(N(o1.lowerQuantity||0),N(o2.lowerQuantity||0))};
 undo.push({rec,removed,key,prev});refresh(wall);const nb=state.steel?.[wall]?.horizontals.find(b=>b.merged23===rec.id);say('Unido: '+(nb?nb.n+' · '+nb.quantity+' Ø'+fd(nb.diameter)+' · C = '+nb.length+' cm':'barra contínua')+'. Clique em outros dois ferros para unir de novo · Ctrl+Z desfaz.');return true;}
function undoUnion(){const u=undo.pop();if(!u)return;state.steelMerges23=(state.steelMerges23||[]).filter(r=>r.id!==u.rec.id);state.steelMerges23.push(...u.removed);if(u.prev===undefined)delete state.steelOverrides[u.key];else state.steelOverrides[u.key]=u.prev;const wall=state.walls.findIndex(w=>w.uid===u.rec.wall);refresh(Math.max(0,wall));say('União desfeita.');}

// ✏ editar (painel pequeno junto do clique, aplica na hora)
function closePop(){$('st83pop')?.remove();}
function openPop(wall,kind,index,x,y){closePop();const p=barOf(wall,kind,index);if(!p)return;const key=kind==='vertical'?p.overrideKey:p.key,o=()=>state.steelOverrides?.[key]||{};
 const pop=document.createElement('div');pop.id='st83pop';pop.className='noPrint';document.body.append(pop);
 const draw=()=>{const q=barOf(wall,kind,index)||p,ov=o(),dia=N(ov.diameter||q.diameter),qt=N(ov.quantity||q.quantity||1),lq=N(ov.lowerQuantity||0),ld=N(ov.lowerDiameter||q.diameter),tag=kind==='horizontal'?kindTag(q):'';
  pop.innerHTML=`<div class="h">${esc(q.n||'')} · ${kind==='vertical'?'vertical':esc(tag||q.kind||'horizontal')} · Parede ${wall+1}<button type="button" data-a="x">✕</button></div>
  <div class="r"><span>Bitola</span>${DIAS.map(v=>`<button type="button" data-a="d" data-v="${v}" class="${Math.abs(v-dia)<.01?'on':''}">Ø${fd(v)}</button>`).join('')}</div>
  <div class="r"><span>Barras</span><button type="button" data-a="q" data-v="-1">−</button><b>${qt}</b><button type="button" data-a="q" data-v="1">+</button></div>
  ${kind==='horizontal'?`<div class="r"><span>Camada inferior</span><button type="button" data-a="lq" data-v="-1">−</button><b>${lq}</b><button type="button" data-a="lq" data-v="1">+</button>${lq?DIAS.map(v=>`<button type="button" data-a="ld" data-v="${v}" class="${Math.abs(v-ld)<.01?'on':''}">Ø${fd(v)}</button>`).join(''):''}</div>`:''}
  <div class="r"><button type="button" data-a="auto" class="secondary">Voltar ao automático</button>${q.merged23?'<button type="button" data-a="split" class="secondary">✂ Separar união</button>':''}</div>`;};
 const set=f=>{const q=barOf(wall,kind,index)||p;state.steelOverrides??={};const cur={diameter:N(o().diameter||q.diameter),quantity:N(o().quantity||q.quantity||1),...o()};f(cur);if(kind==='horizontal'){cur.lowerQuantity=Math.max(0,Math.min(20,N(cur.lowerQuantity||0)));if(cur.lowerQuantity&&!cur.lowerDiameter)cur.lowerDiameter=cur.diameter;}cur.quantity=Math.max(1,Math.min(20,cur.quantity));state.steelOverrides[key]=cur;refresh(wall);draw();};
 pop.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;e.stopPropagation();const a=b.dataset.a,v=N(b.dataset.v);
  if(a==='x')return closePop();if(a==='d')set(c=>{c.diameter=v;});if(a==='q')set(c=>{c.quantity+=v;});if(a==='lq')set(c=>{c.lowerQuantity=N(c.lowerQuantity||0)+v;});if(a==='ld')set(c=>{c.lowerDiameter=v;});
  if(a==='auto'){delete state.steelOverrides?.[key];refresh(wall);draw();}if(a==='split'){const q=barOf(wall,kind,index);if(q?.merged23){undoSteelMerge23(wall,q);closePop();refresh(wall);}}});
 draw();const r=pop.getBoundingClientRect();pop.style.left=Math.min(window.innerWidth-r.width-10,x+12)+'px';pop.style.top=Math.min(window.innerHeight-r.height-10,y+12)+'px';}

// cliques no desenho (captura: antes dos cliques antigos)
document.addEventListener('click',e=>{if(!mode)return;if(e.target.closest('#st83,#st83pop,#st83side'))return;const g=e.target.closest('[data-steel-wall]');if(!g){if(mode==='edit')closePop();return;}
 e.stopPropagation();e.preventDefault();const wall=N(g.dataset.steelWall),kind=g.dataset.steelKind,index=N(g.dataset.steelIndex);
 if(mode==='edit'){sel={wall,kind,index};paint();openPop(wall,kind,index,e.clientX,e.clientY);return;}
 if(mode==='split'){const b=barOf(wall,kind,index);if(kind==='horizontal'&&b?.merged23){undoSteelMerge23(wall,b);refresh(wall);say('União desfeita: '+(b.n||''));}else say('Esse ferro não é uma união.');return;}
 if(mode==='union'){if(kind!=='horizontal'){say('A união vale para ferros horizontais (verga, contraverga, respaldo, reforço).');return;}
  if(!sel||sel.wall!==wall||sel.index===index){if(sel&&sel.index===index&&sel.wall===wall){sel=null;paint();say(HELP.union);return;}sel={wall,kind,index};paint();say('1º ferro marcado ('+(barOf(wall,kind,index)?.n||'')+'). Agora clique no 2º.');return;}
  const ok=unite(wall,sel.index,index);sel=ok?null:{wall,kind,index};paint();}},true);
document.addEventListener('dblclick',e=>{if(mode&&e.target.closest('[data-steel-wall]')){e.stopPropagation();e.preventDefault();}},true);
document.addEventListener('keydown',e=>{if(!mode)return;if(e.key==='Escape'){if($('st83pop'))closePop();else setMode(mode);}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&mode==='union'&&undo.length&&!e.target.closest?.('input,textarea')){e.preventDefault();e.stopImmediatePropagation();undoUnion();}},true);

// ---------- 3. Paleta (flutuante, junto das elevações) e grupo na coluna de ferramentas
const ICONS=[['edit','✏','Editar aço'],['union','⫘','Unir'],['split','✂','Separar']];
{const pal=document.createElement('div');pal.id='st83';pal.className='noPrint';pal.innerHTML='<b>Armaduras</b>'+ICONS.map(([m,i,t])=>`<button type="button" data-m="${m}" title="${t}"><span>${i}</span>${t}</button>`).join('')+'<span id="st83msg"></span>';document.body.append(pal);pal.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>setMode(b.dataset.m));
 const vis=()=>{pal.style.display=state.steel&&state.results?.length&&document.querySelector('#output [data-steel-wall]')?'flex':'none';};
 const rr=renderResults;renderResults=function(...a){const r=rr.apply(this,a);try{vis();paint();}catch{}return r;};setTimeout(vis,500);}
{const side=$('tools62');if(side){const g=document.createElement('details');g.className='grp62';g.open=false;g.innerHTML='<summary>Armaduras</summary>';const body=document.createElement('div');body.className='grpBody62';body.id='st83side';
 for(const[m,i,t]of ICONS){const b=document.createElement('button');b.type='button';b.className='secondary';b.dataset.m=m;b.innerHTML='<span class="ico62">'+i+'</span><span>'+t+'</span>';b.onclick=()=>{setMode(m);$('output')?.querySelector('[data-steel-wall]')?.closest('article')?.scrollIntoView({behavior:'smooth',block:'start'});};body.append(b);}
 const n=document.createElement('p');n.className='note';n.style.fontSize='11.5px';n.textContent='Escolha a ferramenta e clique nos ferros das elevações — sem janelas. Esc sai.';body.append(n);g.append(body);const ref=side.querySelector('.grp77');if(ref)ref.before(g);else side.append(g);}}
const st=document.createElement('style');st.textContent=`
#st83{position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:9000;display:none;gap:6px;align-items:center;background:#102e4b;color:#fff;padding:7px 10px;border-radius:12px;box-shadow:0 8px 24px rgba(16,46,75,.35);max-width:min(1100px,96vw);flex-wrap:wrap}
#st83 b{font-size:12px;letter-spacing:.06em;text-transform:uppercase;margin-right:4px}
#st83 button{background:#1b4469;color:#fff;border:1px solid #2f5f8c;border-radius:8px;padding:6px 11px;font-size:13px;display:flex;gap:6px;align-items:center;box-shadow:none}
#st83 button span{font-size:16px}#st83 button.on,#st83side button.on{background:#f2b705!important;color:#102e4b!important;font-weight:700;outline:none}
#st83msg{font-size:12.5px;color:#d7e6f5;margin-left:6px;max-width:520px}
body.st83on #output [data-steel-wall]{cursor:crosshair!important}
#st83pop{position:fixed;z-index:9100;background:#fff;border:1px solid #9fb6cf;border-radius:10px;box-shadow:0 12px 30px rgba(16,46,75,.3);font-size:13px;min-width:250px}
#st83pop .h{background:#174a78;color:#fff;padding:6px 10px;border-radius:10px 10px 0 0;font-weight:700;display:flex;justify-content:space-between;align-items:center;gap:10px}
#st83pop .h button{background:transparent;color:#fff;border:0;padding:0 4px;font-size:14px;box-shadow:none}
#st83pop .r{display:flex;gap:5px;align-items:center;padding:6px 10px;flex-wrap:wrap}#st83pop .r span{width:96px;font-weight:600;color:#2b4a66;font-size:12px}
#st83pop .r button{padding:4px 9px;font-size:12.5px;border-radius:6px;background:#e8eff7;color:#102e4b;border:1px solid #c9d7e6;box-shadow:none}#st83pop .r button.on{background:#174a78;color:#fff}
#st83pop .r b{min-width:22px;text-align:center}`;document.head.append(st);
window.steel83={setMode,unite};
})();
