// V71 — salvamento automático, "Conferir antes de gerar" e cores da parede por posição.
(function(){
'use strict';
const N=v=>Number(v);
// ---------- 1. Salvamento automático (IndexedDB do navegador)
const DB='engenharAutosave71',ST='saves';
function db(){return new Promise((ok,no)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(ST);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}
async function put(v){const d=await db();return new Promise((ok,no)=>{const t=d.transaction(ST,'readwrite');t.objectStore(ST).put(v,'last');t.oncomplete=()=>ok();t.onerror=()=>no(t.error);});}
async function get(){const d=await db();return new Promise((ok,no)=>{const t=d.transaction(ST,'readonly'),r=t.objectStore(ST).get('last');r.onsuccess=()=>ok(r.result||null);r.onerror=()=>no(r.error);});}
async function del(){const d=await db();return new Promise(ok=>{const t=d.transaction(ST,'readwrite');t.objectStore(ST).delete('last');t.oncomplete=()=>ok();});}
function snapshot(){const sv=$('save');if(!sv?.onclick)return null;let captured=null;const old=window.download;window.download=(name,text)=>{captured=text;};try{sv.onclick.call(sv);}catch(e){console.error('autosave',e);}finally{window.download=old;}return captured;}
let dirty=false,timer=null,restoring=false,lastSaved=0;
async function autosave(reason){if(restoring||!state.walls?.length)return;const json=snapshot();if(!json)return;try{await put({json,when:Date.now(),project:$('project')?.value||'',walls:(window.level68?.all?.()||state.walls).length});dirty=false;lastSaved=Date.now();const b=$('autoBadge71');if(b)b.textContent='Salvo automaticamente às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}catch(e){console.error('autosave',e);}}
const mark=()=>{if(restoring)return;dirty=true;if(timer)clearTimeout(timer);timer=setTimeout(()=>autosave('mudança'),45000);};
for(const name of ['invalidate','renderWalls']){const base=window[name];if(typeof base!=='function')continue;window[name]=function(...a){const r=base.apply(this,a);mark();return r;};}
setInterval(()=>{if(dirty)autosave('intervalo');},180000);
window.addEventListener('beforeunload',()=>{if(dirty){const json=snapshot();if(json)put({json,when:Date.now(),project:$('project')?.value||'',walls:state.walls.length});}});
// ao salvar manualmente, o automático fica em dia
{const sv=$('save');if(sv){sv.addEventListener('click',()=>{dirty=false;},true);}}
async function offer(){let s;try{s=await get();}catch{return;}if(!s?.json)return;const age=Date.now()-s.when;if(age>30*864e5)return;
 const bar=document.createElement('div');bar.id='recover71';bar.className='recover71 noPrint';const when=new Date(s.when).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
 bar.innerHTML='<b>Trabalho salvo automaticamente</b> em '+when+(s.project?' · '+esc(s.project):'')+' · '+s.walls+' parede(s). <button type="button" id="rec71">Recuperar</button><button type="button" class="secondary" id="dis71">Descartar</button><button type="button" class="secondary" id="hid71">Agora não</button>';
 document.body.prepend(bar);
 $('rec71').onclick=async()=>{restoring=true;try{const file=new File([s.json],'Recuperado_'+new Date(s.when).toISOString().slice(0,16).replace(/[:T]/g,'-')+'.json',{type:'application/json'});await $('restore').onchange({target:{files:[file],value:''}});bar.remove();$('planStatus')&&($('planStatus').textContent='Trabalho recuperado do salvamento automático de '+when+'. Salve um .json para guardar.');}catch(e){alert('Não foi possível recuperar: '+e.message);}finally{restoring=false;}};
 $('dis71').onclick=async()=>{if(!confirm('Descartar o salvamento automático?'))return;await del();bar.remove();};
 $('hid71').onclick=()=>bar.remove();}
setTimeout(offer,800);window.autosave71=autosave;
{const anchor=$('save');if(anchor){const b=document.createElement('span');b.id='autoBadge71';b.className='autoBadge71';b.textContent='Salvamento automático ligado';anchor.after(b);}}

// ---------- 2. Conferir antes de gerar
const okLoc=l=>['Interna','Externa','Mista'].includes(l);
const step=()=>(N(state.blocks.find(b=>b.active!==false&&b.type!=='Canaleta')?.height)||19)+(num($('jv').value)||1);
function issues(){try{window.norm73?.();}catch{}const out=[],st=step(),W=state.walls;
 const noLoc=W.map((w,i)=>okLoc(w.location)?null:i).filter(i=>i!==null);
 if(noLoc.length)out.push({lvl:'warn',t:noLoc.length+' parede(s) sem posição interna/externa',d:'Paredes '+noLoc.map(i=>i+1).join(', ')+'. O respaldo sai em canaleta U por padrão; externas deveriam usar J.',go:()=>row(noLoc[0]),btn:'Ir para a parede',fix:['Reconhecer internas / externas',()=>$('classifyWalls24')?.click()]});
 const badOp=[];W.forEach((w,i)=>(w.openings||[]).forEach((o,oi)=>{const b=N(o.bottom)||0,t=b+N(o.height),off=v=>Math.abs(v/st-Math.round(v/st))>.001;if(off(b)||off(t)||t>N(w.height)+.01||N(o.start)+N(o.width)>N(w.length)+.01)badOp.push({i,oi,o});}));
 if(badOp.length)out.push({lvl:'err',t:badOp.length+' abertura(s) com medida fora das fiadas ou da parede',d:badOp.slice(0,6).map(x=>(x.o.tag58||'Abertura')+' (Parede '+(x.i+1)+': '+(N(x.o.bottom)||0)+'/'+N(x.o.height)+' cm)').join(' · ')+'. Peitoril e topo precisam ser múltiplos de '+st+' cm (ex.: 220, 260).',go:()=>{const x=badOp[0];const r=$('openList62')?.querySelector('[data-e62="'+x.i+','+x.oi+'"]');if(r){r.scrollIntoView({block:'center'});r.click();}else row(x.i);},btn:'Corrigir'});
 const pend=window.props54raw?.get?.()||[];if(pend.length)out.push({lvl:'warn',t:pend.length+' abertura(s) do DXF ainda em conferência (quadradinhos)',d:'As marcadas como aceitas entram ao gerar; as outras ficam de fora.',go:()=>$('dxfOpenings54')?.scrollIntoView({block:'center'}),btn:'Ver lista'});
 const unc=W.map((w,i)=>w.confirmed?null:i).filter(i=>i!==null);
 if(unc.length)out.push({lvl:'err',t:unc.length+' parede(s) não conferida(s)',d:'Paredes '+unc.slice(0,15).map(i=>i+1).join(', ')+(unc.length>15?'…':'')+'. Parede não conferida não é modulada.',go:()=>row(unc[0]),btn:'Ir para a parede',fix:['Marcar todas como conferidas',()=>{unc.forEach(i=>state.walls[i].confirmed=true);renderWalls();}]});
 try{const box=$('levels53');const w=box?.querySelector('.warning');if(w&&/mesmo nível/.test(w.textContent))out.push({lvl:'err',t:'Plantas com o mesmo nível',d:w.textContent.replace(/^Atenção:\s*/,''),go:()=>box.scrollIntoView({block:'center'}),btn:'Ver níveis'});}catch{}
 const odd=W.filter(w=>{const h=N(w.height);return Math.abs(h/st-Math.round(h/st))>.001;}).length;if(odd)out.push({lvl:'info',t:odd+' parede(s) com altura fora das fiadas',d:'Serão moduladas com complemento hachurado no topo (definir em obra).'});
 const noLine=W.filter(w=>!w.line).length;if(noLine)out.push({lvl:'info',t:noLine+' parede(s) sem posição na planta',d:'Aparecem só na elevação, não nas plantas de fiada.'});
 return out;}
function row(i){const tr=$('walls')?.querySelectorAll('tr')[i];if(tr){tr.scrollIntoView({behavior:'smooth',block:'center'});tr.classList.add('gr57flash');setTimeout(()=>tr.classList.remove('gr57flash'),2500);}}
function showCheck(list,onGo){let d=$('check71');if(!d){d=document.createElement('dialog');d.id='check71';d.className='check71';document.body.append(d);}
 const blocking=list.some(x=>x.lvl==='err');
 d.innerHTML='<h3>Conferir antes de gerar</h3>'+(list.length?'<ul>'+list.map((x,k)=>'<li class="'+x.lvl+'"><b>'+esc(x.t)+'</b><br><span>'+esc(x.d||'')+'</span><div>'+(x.go?'<button type="button" class="secondary" data-go="'+k+'">'+esc(x.btn||'Ver')+'</button>':'')+(x.fix?'<button type="button" class="secondary" data-fix="'+k+'">'+esc(x.fix[0])+'</button>':'')+'</div></li>').join('')+'</ul>':'<p class="okc71">✔ Nada a corrigir. Pode gerar.</p>')+
 '<div class="btns71">'+(onGo?'<button type="button" id="goGen71">'+(blocking?'Gerar mesmo assim':'Gerar modulação')+'</button>':'')+'<button type="button" class="secondary" id="close71">Fechar e corrigir</button></div>';
 d.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{d.close();list[N(b.dataset.go)].go();});
 d.querySelectorAll('[data-fix]').forEach(b=>b.onclick=()=>{list[N(b.dataset.fix)].fix[1]();const nl=issues();showCheck(nl,onGo);});
 d.querySelector('#close71').onclick=()=>d.close();if(onGo)d.querySelector('#goGen71').onclick=()=>{d.close();onGo();};
 if(!d.open)d.showModal();}
window.check71=()=>showCheck(issues(),null);
{const gen=$('generate');let pass=false;if(gen){gen.addEventListener('click',e=>{if(pass||window.__noCheck71){pass=false;return;}const list=issues().filter(x=>x.lvl!=='info');if(!list.length)return;e.stopImmediatePropagation();e.preventDefault();showCheck(issues(),()=>{pass=true;gen.click();});},true);
 const b=document.createElement('button');b.type='button';b.id='check71btn';b.className='secondary';b.textContent='Conferir antes de gerar';b.onclick=()=>window.check71();gen.after(b);}}

// ---------- 3. Cores da parede na planta: conferência ou posição
let colorMode='conf';try{colorMode=localStorage.getItem('color71')||'conf';}catch{}
const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);if(colorMode!=='pos'||!image)return r;try{const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0};ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);
 for(const w of state.walls){if(!w.line||Number(w.page||1)!==num($('page').value))continue;const[a2,b2]=w.line,loc=w.location;if(!okLoc(loc)){ctx.setLineDash([]);ctx.lineWidth=6;ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(a2.x,a2.y);ctx.lineTo(b2.x,b2.y);ctx.stroke();}ctx.lineWidth=4;ctx.setLineDash(okLoc(loc)?[]:[8,5]);ctx.strokeStyle=loc==='Externa'?'#174a78':loc==='Interna'?'#2a9d5c':loc==='Mista'?'#8a4fbf':'#d1462f';ctx.beginPath();ctx.moveTo(a2.x,a2.y);ctx.lineTo(b2.x,b2.y);ctx.stroke();}
 ctx.setLineDash([]);ctx.restore();}catch(e){console.error(e);}return r;};
{const vis=$('zoomIn')?.closest('.grpBody62');if(vis){const b=document.createElement('button');b.type='button';b.id='color71';b.className='secondary';const lab=()=>{b.textContent=colorMode==='pos'?'🎨 Cores: posição (int./ext.)':'🎨 Cores: conferência';};lab();b.title='Alterna as cores das paredes: conferência (verde = conferida, laranja = falta conferir) ou posição (azul = externa, verde = interna, roxo = mista, vermelho tracejado = sem posição).';b.onclick=()=>{colorMode=colorMode==='pos'?'conf':'pos';try{localStorage.setItem('color71',colorMode);}catch{}lab();drawPlan();const st=$('planStatus');if(st)st.textContent=colorMode==='pos'?'Cores por posição: azul = externa, verde = interna, roxo = mista, vermelho tracejado = sem posição.':'Cores por conferência: verde = conferida, laranja = falta conferir.';};vis.append(b);}}

const css=document.createElement('style');css.textContent=`.recover71{position:sticky;top:0;z-index:5000;background:#fff4dc;border-bottom:2px solid #e0a23a;padding:10px 16px;font:14px Inter,Arial,sans-serif;color:#5a3c00;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.recover71 button{padding:5px 12px}
.autoBadge71{font-size:12px;color:#586c7c;margin-left:10px;align-self:center}
.check71{max-width:640px;width:calc(100% - 32px);border:0;border-radius:12px;padding:18px 22px;box-shadow:0 20px 60px rgba(0,0,0,.3);font:14px Inter,Arial,sans-serif;color:#102e4b}.check71::backdrop{background:rgba(16,46,75,.45)}
.check71 h3{margin:0 0 10px}.check71 ul{list-style:none;margin:0;padding:0;max-height:60vh;overflow:auto}.check71 li{border-left:4px solid #8fb3d6;background:#f6f9fc;margin:6px 0;padding:8px 10px;border-radius:6px}
.check71 li.err{border-color:#d1462f;background:#fff4f1}.check71 li.warn{border-color:#e0a23a;background:#fff9ec}.check71 li span{color:#40576b;font-size:13px}.check71 li div{margin-top:6px;display:flex;gap:6px;flex-wrap:wrap}.check71 li button{padding:3px 10px;font-size:12px}
.btns71{display:flex;gap:8px;margin-top:12px}.okc71{color:#1d6b3a;font-weight:600}`;document.head.append(css);
})();
