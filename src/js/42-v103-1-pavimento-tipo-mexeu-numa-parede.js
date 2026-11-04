// V103 — (1) pavimento-tipo: mexeu numa PAREDE de um pavimento repetido → só esse pavimento se separa como pavimento próprio
// (os de baixo e os de cima continuam iguais); (2) ▶ Gerar todos os níveis; (3) pranchas de todos os níveis na ordem da obra:
// cargas → nível 0 (fiadas e elevações) → laje do topo dele → próximo nível → … → cobertura.
(function(){
'use strict';
const N=Number,L68=()=>window.level68,L7=()=>window.loads77;if(!L68()||!L7())return;
const msg=t=>{const s=$('planStatus');if(s)s.textContent=t;};
const fm=v=>v.toFixed(2).replace('.',',');
const valK=k=>N(String(k).split('|')[0])||0,labK=k=>String(k).split('|')[1]||'';
const pagesOf=k=>{try{return pages36.filter(p=>L68().keyOf(p.id)===k).map(p=>p.id);}catch{return [];}};
const wallsOf=k=>L68().all().filter(w=>L68().keyOf(N(w.page||1))===k);
const rowOf=pg=>(state.levels53||[]).find(l=>String(l.page)===String(pg));
const repOf=k=>{let r=1;for(const pg of pagesOf(k))r=Math.max(r,N(rowOf(pg)?.rep)||1);return r;};
const uid=()=>'wall-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const sig=ws=>JSON.stringify(ws.map(w=>[w.uid,w.page,w.line,N(w.length),N(w.width),N(w.height),(w.openings||[]).map(o=>[N(o.start),N(o.width),N(o.bottom),N(o.height),o.type])]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));

// ---------- 1. paredes: separar o pavimento alterado
let snap=null,busy=false;
function ctxFloor(){const id=window.lvl92?.current?.();if(!id||id==='all')return null;const e=(window.lvl92.entries()||[]).find(x=>x.id===id);if(!e)return null;
 if(e.id.startsWith('r|'))return {key:e.wallKey,j:e.rep,id};
 if(e.id.startsWith('p|'))return {key:e.wallKey,j:1,id};
 if(e.id.startsWith('l|')&&window.mode94==='cima')return {key:e.slabKey,j:1,id};return null;}
function takeSnap(){if(busy)return;const c=ctxFloor();if(!c){snap=null;return;}const R=repOf(c.key);if(R<2){snap=null;return;}const tag=c.id+'|'+R;if(snap&&snap.tag===tag)return;
 const ws=wallsOf(c.key);snap={tag,key:c.key,j:c.j,R,sig:sig(ws),json:JSON.stringify(ws)};}
{const rw=renderWalls;renderWalls=function(...a){const r=rw.apply(this,a);try{check();}catch(e){console.error('V103 separar',e);}return r;};}
setInterval(()=>{try{takeSnap();}catch{}},700);
function check(){if(busy||!snap)return;const c=ctxFloor();if(!c||c.key!==snap.key||c.j!==snap.j){snap=null;return;}const ws=wallsOf(snap.key);const s=sig(ws);if(s===snap.sig)return;
 busy=true;const S0=snap;snap=null;setTimeout(()=>{split(S0,JSON.stringify(wallsOf(S0.key))).catch(e=>console.error('V103 separar',e)).finally(()=>{busy=false;});},0);}
function newPage(src,z,lbl,rep){const p=pages36.find(q=>q.id===N(src));const id=nextPage36++;const name=(p?.name||'Planta').replace(/ \(cópia.*\)$/,'').replace(/ · \d.*$/,'')+' · '+lbl;
 pages36.push({id,local:p?.local||1,name,source:p?.source});state.pageCopies72??=[];state.pageCopies72.push({id,of:N(src),name});state.pageScales23??={};if(state.pageScales23[src]&&!state.pageScales23[id])state.pageScales23[id]=state.pageScales23[src];
 state.levels53??=[];state.levels53.push({id:'lvl-'+id+'-'+Date.now().toString(36),text:fm(z)+' '+lbl,page:String(id),rep});return id;}
function cloneWalls(list,pageMap){return list.map(w=>{const c=JSON.parse(JSON.stringify(w));const o=c.uid;c.uid=uid();c.page=pageMap.get(N(w.page||1))??N(w.page||1);delete c.seq58;delete c.manualRows;delete c.confirmed;delete c.locked76;if(state.support53?.[o])state.support53[c.uid]=JSON.parse(JSON.stringify(state.support53[o]));return c;});}
async function split(S0,curJSON){const K=S0.key,R=S0.R,j=S0.j,v=valK(K),lb=labK(K)||'Pavimento',LVs=L7().levels(),li=LVs.findIndex(l=>l.key===K),H=N(LVs[li]?.H)||280,t=N(window.opt3d74?.t)||10,step=(H+t)/100,z=f=>v+(f-1)*step;
 const snapW=JSON.parse(S0.json),cur=JSON.parse(curJSON),srcPages=pagesOf(K);if(!srcPages.length)return;
 const SL=L7().S(),tgtSrc=li===0?'tipo':'piso',isOwn=f=>!!SL.own102?.[K+'|'+tgtSrc+'|'+f],ownIt=f=>SL.items.filter(it=>L7().itemKey(it)===K&&(it.tgt||'piso')===tgtSrc&&it.rep102===f),baseIt=()=>SL.items.filter(it=>L7().itemKey(it)===K&&(it.tgt||'piso')===tgtSrc&&it.rep102==null);
 const slabOf=f=>(isOwn(f)?ownIt(f):baseIt()).map(it=>JSON.parse(JSON.stringify(it)));
 const blocks=[];// {from,to,walls}
 if(j===1)blocks.push({from:2,to:R,walls:snapW});else{blocks.push({from:j,to:j,walls:cur});if(j<R)blocks.push({from:j+1,to:R,walls:snapW});}
 const keepRep=j===1?1:j-1;
 // laje e defaults de cada bloco (antes de mexer nos itens de K)
 const lvDef=JSON.parse(JSON.stringify(SL.lv?.[li===0?K+'#tipo':K]||SL.lv?.[K]||{}));
 const made=[];
 for(const b of blocks){const rep=b.to-b.from+1,lbl=lb+' '+b.from+'º'+(rep>1?'–'+b.to+'º':''),pm=new Map();for(const sp of srcPages)pm.set(N(sp),newPage(sp,z(b.from),lbl,rep));
  const nk=fm(z(b.from)).replace(',','.');const key=N(nk).toFixed(3)+'|'+lbl;
  const ws=cloneWalls(b.walls.filter(w=>srcPages.includes(N(w.page||1))),pm);
  const items=[];for(let f=b.from;f<=b.to;f++){const r=f-b.from+1;for(const it of slabOf(f)){it.id='ld-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);it.slab92=key;it.tgt='piso';if(r===1)delete it.rep102;else it.rep102=r;items.push(it);}if(r>1){SL.own102??={};SL.own102[key+'|piso|'+r]=true;}}
  made.push({b,key,ws,items,rep});SL.lv??={};SL.lv[key]=JSON.parse(JSON.stringify(lvDef));}
 // tira de K o que foi para os blocos
 const first=blocks[0].from;SL.items=SL.items.filter(it=>!(L7().itemKey(it)===K&&(it.tgt||'piso')===tgtSrc&&it.rep102!=null&&it.rep102>=first));for(const k of Object.keys(SL.own102||{}))if(k.startsWith(K+'|'+tgtSrc+'|')&&N(k.split('|').pop())>=first)delete SL.own102[k];
 // cobertura: passa para o novo topo
 const wasTop=li===LVs.length-1;if(wasTop){const top=made.at(-1).key;for(const it of SL.items)if(L7().itemKey(it)===K&&(it.tgt||'piso')==='cob')it.slab92=top;}
 for(const sp of srcPages){const r=rowOf(sp);if(r)r.rep=keepRep;}
 // paredes de K: no 1º alterado ficam as alteradas; senão voltam ao que eram
 if(j!==1){const keepU=new Set(cur.map(w=>w.uid));state.walls=state.walls.filter(w=>!(L68().keyOf(N(w.page||1))===K&&srcPages.includes(N(w.page||1))));state.walls.push(...snapW.map(w=>w));}
 for(const m of made){state.walls.push(...m.ws);SL.items.push(...m.items);}
 try{options36(String($('page').value));}catch{}try{L7().touch();}catch{}
 try{L68().refresh();}catch(e){console.error(e);}renderWalls();invalidate();
 const goKey=j===1?K:made[0].key;try{await L68().switchTo(goKey,true);}catch(e){console.error(e);}
 try{const E=window.lvl92.entries();const e=E.find(x=>x.wallKey===goKey&&(x.id.startsWith('p|')||x.id.startsWith('r|')))||E.find(x=>x.slabKey===goKey);if(e)await window.lvl92.go(e.id,true);if(e?.id.startsWith('l|')){window.mode94='cima';await window.lvl92.go(e.id,true);}}catch{}
 msg(j===1?'1º pavimento separado: a alteração ficou só nele. Os pavimentos 2º a '+R+'º continuam iguais entre si (novo nível +'+fm(z(2))+' m).':'O '+j+'º pavimento foi separado como pavimento próprio (nível +'+fm(z(j))+' m) com a alteração; os outros continuam iguais. Gere a modulação dele.');try{drawPlan();}catch{}}

// ---------- 2. ▶ Gerar todos os níveis
// V105.5 — durante ▶▶ Todos os níveis cada pavimento é gerado sozinho: lajes e cargas do prédio são calculadas uma vez e reaproveitadas; no fim, recalcula tudo
{const L=window.loads77;if(L&&L.compute){const c0=L.compute;L.compute=function(...a){const B=window.__bulk103;if(!B)return c0.apply(this,a);let k;try{k=JSON.stringify(a);}catch{return c0.apply(this,a);}if(!B.has(k))B.set(k,c0.apply(this,a));return B.get(k);};}}
const gb=document.createElement('button');gb.type='button';gb.id='genAll103';gb.className='secondary noPrint';gb.textContent='▶▶ Todos os níveis';gb.title='Gera a modulação de todos os níveis, um depois do outro';
{const g=$('generate');if(g)g.after(gb);}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
gb.onclick=async()=>{const keys=L68().levelKeys().filter(k=>wallsOf(k).length);if(!keys.length){msg('Não há paredes.');return;}const back=window.lvl92?.current?.();gb.disabled=true;const old=window.__noCheck71;window.__noCheck71=true;let ok=0;window.__bulk103=new Map();
 try{for(const [n,k] of keys.entries()){await L68().switchTo(k,true);await wait(120);msg('▶▶ Gerando '+(n+1)+' de '+keys.length+': '+L68().nameOf(k)+'…');for(let w=0;w<60&&$('generate').disabled;w++)await wait(100);$('generate').click();const t0=Date.now();let tc=t0,tries=0;await wait(250);
   const done=()=>Array.isArray(state.results)&&state.results.length===state.walls.length&&state.results.every(m=>m&&!(m.errors||[]).some(e=>/ainda não calculada/.test(e)));
   while(Date.now()-t0<(window.__genT103||180000)){const g=$('generate');if(!g.disabled&&done())break;if(!g.disabled&&Date.now()-tc>4000&&tries<4){g.click();tc=Date.now();tries++;}await wait(150);}ok++;}}
 finally{window.__noCheck71=old;window.__bulk103=null;try{window.loads77?.touch?.();}catch{}gb.disabled=false;try{if(back&&back!=='all')await window.lvl92.go(back,true);}catch{}}
 msg('▶▶ Modulação gerada em '+ok+' nível(is). As pranchas agora saem com todos os níveis, na ordem da obra.');};

// ---------- 3. pranchas de todos os níveis
const GLOBAL=it=>it.load77||it.slab95||it.el97||it.res96||it.slab82;
{const cp=collectPlot26;collectPlot26=function(...a){const cur=L68().current(),keys=L68().levelKeys().filter(k=>wallsOf(k).length);
 if(cur==='all'||keys.length<2)return cp.apply(this,a);
 const LV=L7().levels(),idx=k=>Math.max(0,LV.findIndex(l=>l.key===k));const keepW=state.walls,keepR=state.results;let first=null;const items=[],miss=[];
 try{for(const k of keys){const ws=L68().all().filter(w=>L68().keyOf(N(w.page||1))===k).sort((x,y)=>(N(x.seq58)||0)-(N(y.seq58)||0));const rs=ws.map(w=>L68().resultOf(w));
   const has=rs.length&&rs.every(r=>r&&r.rows);if(!has&&k!==cur){miss.push(L68().nameOf(k));}
   state.walls=k===cur?keepW:ws;state.results=k===cur?keepR:(has?rs:null);if(!state.results&&k!==cur)continue;
   let d;try{d=cp.apply(this,a);}catch(e){console.error('V103 pranchas',k,e);continue;}if(!first)first=d;
   for(const it of d.items||[]){if(GLOBAL(it)){if(d===first)items.push(it);continue;}it.lv77=idx(k);it.lvl103=k;items.push(it);}}}
 finally{state.walls=keepW;state.results=keepR;}
 if(!first)return cp.apply(this,a);
 // V104 — ciclo por pavimento, na ordem da obra: cargas (e resistências) → para CADA pavimento (inclusive as repetições):
 // 1ª e 2ª fiadas → elevações e resumo → vigas e reforços → laje do topo dele; cada pavimento começa numa folha nova.
 const t3=N(window.opt3d74?.t)||10,floors=[];const lvls=keys.map(k=>{const L=LV.find(l=>l.key===k);return {k,R:repOf(k),H:N(L?.H)||280,v:valK(k)};});
 lvls.forEach((L,n)=>{for(let f=1;f<=L.R;f++){const z=L.v+(f-1)*(L.H+t3)/100,top=f<L.R?L.v+f*(L.H+t3)/100:(lvls[n+1]?lvls[n+1].v:L.v+L.R*(L.H+t3)/100);floors.push({k:L.k,f,R:L.R,z,top});}});
 const cotas=it=>[...String(it.title||'').matchAll(/\+(\d+(?:\.\d{3})*,\d{2})/g)].map(m=>N(m[1].replace(/\./g,'').replace(',','.')));
 const isSlab=it=>it.slab95||it.el97||it.slab82,glob=items.filter(it=>it.load77||it.res96),slabs=items.filter(isSlab),wallsBy=new Map();
 for(const it of items){if(GLOBAL(it))continue;const k=it.lvl103;if(!wallsBy.has(k))wallsBy.set(k,[]);wallsBy.get(k).push(it);}
 const out=[...glob.filter(it=>it.load77),...glob.filter(it=>it.res96).map(it=>({...it,lv77:0}))];const used=new Set();
 floors.forEach((F,n)=>{const lvTag=n+1,ren=t=>F.R>1?String(t||'').replace(/\(\+[\d.,]+ m\)/,'— '+F.f+'º de '+F.R+' (+'+fm(F.z)+' m)'):t;
  for(const it of wallsBy.get(F.k)||[]){const c={...it,title:ren(it.title),lv77:lvTag};out.push(c);}
  const mine=slabs.filter(it=>cotas(it).some(c=>Math.abs(c-F.top)<.006));const ord=it=>it.el97?0:it.arm106?1.5:it.slab95?1:2;
  for(const it of mine.sort((a,b)=>ord(a)-ord(b))){out.push({...it,lv77:lvTag});used.add(it);}});
 for(const it of slabs)if(!used.has(it))out.push({...it,lv77:floors.length+1});
 const items2=out;items.length=0;items.push(...items2);
 first.items=items;if(miss.length)try{setTimeout(()=>msg('Pranchas: '+miss.join(', ')+' ainda sem modulação — use ▶▶ Todos os níveis para incluir.'),50);}catch{}return first;};}

const css=document.createElement('style');css.textContent='#genAll103{margin:0 0 0 6px;white-space:nowrap}';document.head.append(css);
window.lvl103={split,check,takeSnap};
})();
