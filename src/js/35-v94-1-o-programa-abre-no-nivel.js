// V94 — (1) o programa abre no Nível +0,00 · Piso; (2) nos níveis do meio: "Laje + paredes de baixo" ou "Paredes de cima",
// com a outra metade em fantasma; (3) clicou na laje → janelinha: tipo, espessura, direção, beiral, apagar laje.
(function(){
'use strict';
const N=Number,L68=()=>window.level68;if(!L68()||!window.lvl92)return;
window.mode94=window.mode94||'laje';
const curE=()=>{const id=window.lvl92.current();return (window.lvl92.entries()||[]).find(e=>e.id===id)||null;};
// ---------- chave Laje / Paredes de cima
const md=document.createElement('span');md.id='md94';md.innerHTML='<button type="button" data-m="laje" title="Laje deste nível sobre as paredes que chegam aqui (as de cima aparecem em fantasma)">Laje</button><button type="button" data-m="cima" title="Paredes que nascem neste nível (as de baixo aparecem em fantasma)">Paredes de cima</button>';
$('lvlHost85')?.append(md);
function syncMd(){const e=curE(),show=!!e&&e.id.startsWith('l|');md.style.display=show?'':'none';md.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.m===(window.mode94||'laje')));}
md.onclick=async ev=>{const b=ev.target.closest('button');if(!b)return;const e=curE();if(!e)return;if(md.classList.contains('busy94'))return;if(b.dataset.m===(window.mode94||'laje')&&b.classList.contains('on'))return;window.mode94=b.dataset.m;syncMd();md.classList.add('busy94');await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));try{await window.lvl92.go(e.id,true);}finally{md.classList.remove('busy94');}syncMd();
 $('planStatus').textContent=window.mode94==='cima'?'Nível '+fmV(e.v)+' · paredes que nascem aqui (1ª fiada delas). As paredes de baixo aparecem em fantasma.':'Nível '+fmV(e.v)+' · laje sobre as paredes que chegam aqui. As paredes de cima aparecem em fantasma.';};
const fmV=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(2).replace('.',',')+' m';
setInterval(()=>{try{syncMd();}catch{}},600);
// ---------- fantasma da outra metade (tracejado roxo)
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{const e=curE();if(!e||!e.id.startsWith('l|')||!image)return r;const other=window.mode94==='cima'?e.wallKey:e.slabKey;
 const pg=N($('page').value),c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},z=zoom||1;const ws=L68().all().filter(w=>w.line&&L68().keyOf(N(w.page||1))===other);if(!ws.length)return r;
 ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);ctx.lineCap='butt';
 for(const w of ws){const wp=N(w.page||1);let A=w.line[0],B=w.line[1];try{if(wp!==pg){A=window.toPage74(pg,window.world74(wp,A));B=window.toPage74(pg,window.world74(wp,B));}}catch{}
  ctx.strokeStyle='rgba(124,58,237,.22)';ctx.lineWidth=Math.max(3,(N(w.width)||14)*(N(w.planScale)||pxCm||1));ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();
  ctx.strokeStyle='rgba(124,58,237,.9)';ctx.lineWidth=1.4/z;ctx.setLineDash([7/z,5/z]);ctx.beginPath();ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y);ctx.stroke();ctx.setLineDash([]);}
 ctx.restore();const h=$('hud88')?.querySelector('.in88');if(h){const d=document.createElement('div');d.style.color='#6d28d9';d.textContent='Fantasma: '+(window.mode94==='cima'?'paredes de baixo (que sustentam a laje)':'paredes de cima (que nascem neste nível)')+' · '+ws.length+' parede(s)';h.append(d);$('hud88').style.display='';}}catch(er){console.error('V94 fantasma',er);}return r;};}
// ---------- janelinha da laje
const pop=document.createElement('div');pop.id='lj94';pop.className='noPrint';pop.hidden=true;document.body.append(pop);
const TL=[['tr8','TR8'],['tr12','TR12'],['tr16','TR16'],['tr20','TR20'],['mac','Maciça'],['alv','Alveolar'],['sem','Sem laje / vão aberto']];
let P0=null,scope='painel';
function busy(){const b=document.body.classList;return b.contains('tool56')||b.contains('ld77on')||b.contains('newvao54')||b.contains('cad88')||(typeof mode!=='undefined'&&mode)||window.trim88?.active?.()||window.mark57on;}
function close(){pop.hidden=true;P0=null;if(typeof selEdge!=='undefined'&&selEdge){selEdge=null;try{drawPlan();}catch{}}}
function fx(v,d=2){return (Math.round(N(v)*10**d)/10**d).toLocaleString('pt-BR');}
function render(ev){const S=window.slab94;if(!S||!P0)return;const r=S.at(P0),ctx=S.ctx(),lv=S.level(),ground=!ctx.below&&ctx.tgt==='piso';let h='';
 const titulo=ctx.tgt==='cob'?'Laje de cobertura':ground?'Piso':'Laje do nível';
 if(ground){const b=lv.base||'sem';h='<div class="h">'+titulo+' · '+(L68().nameOf?.(ctx.key)||'')+'<button type="button" data-a="x">✕</button></div>'+
  '<div class="r">'+[['sem','Sem laje'],['solo','Contrapiso com tela'],['radier','Radier']].map(([k,t])=>'<button type="button" data-a="gb" data-v="'+k+'" class="'+(b===k?'on':'')+'">'+t+'</button>').join('')+'</div>'+
  (b!=='sem'?'<div class="r"><span>Espessura</span><input type="number" min="5" max="40" step="1" value="'+fx(lv.h||10,0)+'" data-a="gh"> cm</div>':'')+
  '<div class="r act"><button type="button" data-a="ok" class="ok">✔ Confirmar</button></div><div class="ft">'+(b==='sem'?'O piso não carrega as paredes. Escolha contrapiso ou radier se houver.':b==='radier'?'Radier: entra no total da fundação.':'Contrapiso sobre o solo: vai direto para o solo, não carrega as paredes.')+'</div>';}
 else{if(!r.v||r.outside){close();return;}const p=scope==='painel'?r.prop:lv,tp=p.type||'tr8',isTR=/^tr\d+$/.test(tp),hasH=tp==='mac'||tp==='alv';
  h='<div class="h">'+titulo+(scope==='painel'?' · este painel':' · todo o nível')+'<button type="button" data-a="x">✕</button></div>'+
  '<div class="r seg"><button type="button" data-a="sc" data-v="painel" class="'+(scope==='painel'?'on':'')+'">Este painel</button><button type="button" data-a="sc" data-v="nivel" class="'+(scope==='nivel'?'on':'')+'">Todo o nível</button></div>'+
  '<div class="r"><span>Tipo</span>'+TL.filter(([k])=>k!=='sem'||scope==='painel').map(([k,t])=>'<button type="button" data-a="t" data-v="'+k+'" class="'+(tp===k?'on':'')+(k==='sem'?' del':'')+'">'+t+'</button>').join('')+'</div>'+
  (tp==='sem'?'':(hasH?'<div class="r"><span>Espessura</span><input type="number" min="6" max="40" step="1" value="'+fx(p.h||10,0)+'" data-a="h"> cm</div>':'<div class="r"><span>Altura</span><b>'+(isTR?({tr8:12,tr12:16,tr16:20,tr20:25})[tp]:'')+' cm</b><small>(treliça + capa)</small></div>')+
  (isTR||tp==='alv'?(()=>{const raw=scope==='painel'?(r.item&&r.item.dir!=null&&r.item.dir!==''?r.item.dir:lv.dir):lv.dir,au=raw==null||raw===''||raw==='auto';return '<div class="r"><span>Vigotas</span><button type="button" data-a="d" data-v="auto" class="'+(au?'on':'')+'" title="Vigotas no vão menor do painel">Auto (vão menor)'+(au&&p.dirAuto!==undefined?' '+(N(p.dir)===90?'↕':'↔'):'')+'</button><button type="button" data-a="d" data-v="0" class="'+(!au&&N(p.dir)!==90?'on':'')+'">↔</button><button type="button" data-a="d" data-v="90" class="'+(!au&&N(p.dir)===90?'on':'')+'">↕</button></div>';})():'')+
  ((()=>{try{return window.arm106?.popHTML?.(p)||'';}catch{return '';}})())+
  '<div class="ft">Peso próprio '+fx(S.ppDefault(tp,p.h,p.bi))+' kN/m²'+(tp==='mac'?' · bordas contínuas engastadas (60°), demais apoiadas (45°)':'')+'</div>')+
  '<div class="r act"><button type="button" data-a="ok" class="ok">✔ Confirmar</button><button type="button" data-a="edge">＋ Beiral / balanço</button>'+(scope==='painel'&&tp!=='sem'?'<button type="button" data-a="t" data-v="sem" class="del">🗑 Apagar laje deste painel</button>':'')+(scope==='painel'&&r.item?'<button type="button" data-a="clr" class="sec">Voltar ao padrão do nível</button>':'')+'</div>';}
 pop.innerHTML=h;pop.hidden=false;if(ev){const w=310;pop.style.left=Math.max(8,Math.min(innerWidth-w-8,ev.clientX+14))+'px';pop.style.top=Math.max(60,Math.min(innerHeight-300,ev.clientY+14))+'px';}}
function apply(vals){const S=window.slab94;if(scope==='painel')S.setPanel(P0,vals);else S.setLevel(vals);render();}
pop.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-a]');if(!b||b.tagName==='INPUT')return;const a=b.dataset.a,v=b.dataset.v,S=window.slab94;
 if(a==='x')return close();if(a==='ok'){const S=window.slab94;const ih=pop.querySelector('input[data-a="h"]'),ig=pop.querySelector('input[data-a="gh"]');try{if(ih&&N(ih.value)>0){const hv=Math.round(N(ih.value));if(scope==='painel')S.setPanel(P0,{h:hv});else S.setLevel({h:hv});}if(ig&&N(ig.value)>0)S.setLevel({h:Math.round(N(ig.value))});}catch(er){console.error(er);}$('planStatus').textContent='Laje confirmada.';return close();}
 if(a==='sc'){scope=v;render();return;}
 if(a==='t'){const vals={type:v};if(v==='mac'||v==='alv'){const cur=scope==='painel'?S.at(P0).prop:S.level();vals.h=N(cur.h)||(v==='mac'?10:15);}apply(vals);$('planStatus').textContent=v==='sem'?'Laje apagada neste painel (Ctrl+Z desfaz).':'Laje '+(scope==='painel'?'deste painel':'do nível')+': '+b.textContent+'.';return;}
 if(a==='d'){apply({dir:v==='auto'?'auto':N(v)});return;}
 if(a==='gb'){S.setLevel({base:v,h:N(S.level().h)||10});render();return;}
 if(a==='edge'){close();S.edge();return;}
 if(a==='clr'){S.clearPanel(P0);render();return;}});
pop.addEventListener('change',e=>{if(e.target.dataset.arm&&window.arm106){const S=window.slab94,cur=(scope==='painel'?S.at(P0).prop:S.level())?.arm||{},nv=window.arm106.change(e.target,cur);if(scope==='painel')S.setPanel(P0,{arm:nv});else S.setLevel({arm:nv});render();$('planStatus').textContent='Armadura da laje '+(scope==='painel'?'deste painel':'do nível')+' atualizada.';return;}const a=e.target.dataset.a,v=N(e.target.value);if(!(v>0))return;const S=window.slab94;if(a==='h'){if(scope==='painel')S.setPanel(P0,{h:Math.round(v)});else S.setLevel({h:Math.round(v)});}if(a==='gh')S.setLevel({h:Math.round(v)});});
pop.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();pop.querySelector('[data-a="ok"]')?.click();}e.stopPropagation();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden)close();});
let dragP=null;pop.addEventListener('pointerdown',e=>{const h=e.target.closest('.h');if(!h||e.target.closest('button'))return;e.preventDefault();const r=pop.getBoundingClientRect();dragP={dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId};try{pop.setPointerCapture(e.pointerId);}catch{}});
pop.addEventListener('pointermove',e=>{if(!dragP)return;pop.style.left=Math.max(0,Math.min(innerWidth-60,e.clientX-dragP.dx))+'px';pop.style.top=Math.max(0,Math.min(innerHeight-40,e.clientY-dragP.dy))+'px';});
pop.addEventListener('pointerup',()=>{dragP=null;});
document.addEventListener('pointerdown',e=>{if(!pop.hidden&&!pop.contains(e.target))close();},true);
let selEdge=null;
function edgeHit(P){const S=window.loads77?.S?.();if(!S)return null;const pg=N($('page').value),tol=9/(zoom||1);let best=null,bd=tol;
 for(const it of S.items||[]){if(it.kind!=='edge'||N(it.page)!==pg||(window.loads77.repOk&&!window.loads77.repOk(it)))continue;const q=it.pts||[];for(let k=0;k<q.length;k++){const a=q[k],b=q[(k+1)%q.length],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/l2)),d=Math.hypot(a.x+t*dx-P.x,a.y+t*dy-P.y);if(d<bd){bd=d;best=it;}}}return best;}
function delEdge(){if(!selEdge)return;const S=window.loads77.S();S.items=S.items.filter(x=>x!==selEdge);selEdge=null;try{window.loads77touch?.();}catch{}close();drawPlan();$('planStatus').textContent='Beiral apagado (Ctrl+Z desfaz).';}
function showEdgePop(ev){pop.innerHTML='<div class="h">Beiral / balanço<button type="button" data-a="x">✕</button></div><div class="ft">Linha do beiral selecionada (em laranja).</div><div class="r act"><button type="button" data-a="edel" class="del">🗑 Apagar beiral</button></div><div class="ft">Delete também apaga · Esc fecha.</div>';pop.hidden=false;const w=310;pop.style.left=Math.max(8,Math.min(innerWidth-w-8,ev.clientX+14))+'px';pop.style.top=Math.max(60,Math.min(innerHeight-200,ev.clientY+14))+'px';}
pop.addEventListener('click',e=>{const b=e.target.closest('[data-a="edel"]');if(b){e.stopPropagation();delEdge();}},true);
document.addEventListener('keydown',e=>{if(!selEdge||e.target?.closest?.('input,textarea,select'))return;if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();delEdge();}if(e.key==='Escape'){selEdge=null;drawPlan();}},true);
{const dp=drawPlan;drawPlan=function(...a){const r=dp.apply(this,a);try{if(selEdge&&image){const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0},q=selEdge.pts||[];if(q.length>1){ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);ctx.strokeStyle='#ea580c';ctx.lineWidth=4/(zoom||1);ctx.beginPath();q.forEach((p,k)=>k?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();ctx.restore();}}}catch{}return r;};}
$('plan')?.addEventListener('click',e=>{try{if(busy()||!window.lvl92ctx||window.mode94==='cima'||!window.slab94)return;const W=window.walltool56;if(!W)return;const P=W.rawPoint(e);
 const eh=edgeHit(P);if(eh){selEdge=eh;drawPlan();setTimeout(()=>showEdgePop(e),0);return;}if(selEdge){selEdge=null;drawPlan();}
 if(W.near56(P)>=0)return;
 const S=window.slab94,ctx=S.ctx(),ground=!ctx.below&&ctx.tgt==='piso',r=S.at(P);if(!ground&&(!r.v||r.outside))return;P0=P;scope='painel';setTimeout(()=>render(e),0);}catch(er){console.error('V94 laje',er);}});
// ---------- abre no Nível +0,00 · Piso (abrir projeto, exemplo, novo e ao iniciar)
const toPiso=()=>{try{const E=window.lvl92.entries();if(E.length)window.lvl92.go(E[0].id,true);}catch{}};
for(const id of ['example']){const b=$(id);if(!b)continue;const old=b.onclick;b.onclick=function(...a){const r=old?.apply(this,a);setTimeout(toPiso,600);return r;};}
{const rr=$('restore');if(rr){const old=rr.onchange;rr.onchange=async function(...a){const r=await old?.apply(this,a);setTimeout(toPiso,400);return r;};}}
setTimeout(()=>{if(window.lvl92.current()==='all'&&(L68().all()||[]).length)toPiso();},1500);
const css=document.createElement('style');css.textContent='#top85 button{white-space:nowrap;flex-shrink:0}#top85 .lv85,#lvlHost85{display:inline-flex;align-items:center;gap:5px;flex-wrap:nowrap;white-space:nowrap}#top85 select#lvl92{max-width:215px}#md94{flex:none;display:inline-flex;margin-left:6px;border:1px solid #2e5f8f;border-radius:6px;overflow:hidden}#md94 button{white-space:nowrap;flex:none;background:#1c4670;color:#cfe0f0;border:0;padding:0 8px;height:30px;font:inherit;font-size:12px;cursor:pointer;margin:0}#md94 button.on{background:#e8930c;color:#1b1306;font-weight:700}'+
'#lj94{position:fixed;z-index:9999;width:310px;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 10px 28px rgba(16,46,75,.22);padding:9px 11px;font:12.5px "Segoe UI",Arial,sans-serif;color:#102e4b}#lj94[hidden]{display:none}#lj94 .h{display:flex;justify-content:space-between;align-items:center;font-weight:700;margin:-9px -11px 6px;padding:8px 11px;background:#eef3f8;border-radius:9px 9px 0 0;cursor:move;user-select:none}#lj94 .r button.ok{background:#1d7a3a;border-color:#1d7a3a;color:#fff;font-weight:700}#lj94 .h button{border:0;background:none;font-size:14px;cursor:pointer;margin:0;padding:0 3px;color:#40566b}'+
'#lj94 .r{display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin:6px 0}#lj94 .r>span{min-width:66px;color:#40566b}#lj94 .r button{padding:4px 8px;border:1px solid #c9d7e6;border-radius:6px;background:#eef3f8;color:#102e4b;cursor:pointer;margin:0;font-size:12px}#lj94 .r button.on{background:#174a78;color:#fff;border-color:#174a78}#lj94 .r button.del{background:#fdecea;border-color:#f3c2bc;color:#a3361f}#lj94 .r button.sec{background:#fff}#lj94 .r.seg button{flex:1}#lj94 input{width:64px;padding:3px 6px;margin:0}#lj94 .r small{color:#5b6d7f}#lj94 .ft{color:#5b6d7f;font-size:11.5px;margin-top:4px}#lj94 .act{border-top:1px solid #e3eaf1;padding-top:7px;margin-top:8px}';document.head.append(css);
window.lj94={open:(P,ev)=>{P0=P;scope='painel';render(ev);},close,mode:()=>window.mode94};
})();
