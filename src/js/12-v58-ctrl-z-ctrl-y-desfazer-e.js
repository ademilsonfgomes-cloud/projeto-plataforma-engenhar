// V58 — Ctrl+Z / Ctrl+Y: desfazer e refazer alterações do projeto (paredes, aberturas, ajustes na planta, aço manual, apoio, níveis e tabela de vãos do DXF).
(function(){
'use strict';
const KEYS=['walls','steelManual53','steelRemoved53','steelOverrides','steelMerges23','support53','supportDefault53','levels53','loads77','origins74'];
const LIMIT=60;let undo=[],redo=[],last=null,timer=null,restoring=false;
function snap(){const o={};for(const k of KEYS)if(state[k]!==undefined)o[k]=state[k];let props=null;try{props=window.props54io?.get();}catch{}
 try{return JSON.stringify({s:o,p:props});}catch{return null;}}
function check(){timer=null;if(restoring)return;const now=snap();if(now===null)return;if(last===null){last=now;return;}if(now===last)return;
 undo.push(last);if(undo.length>LIMIT)undo.shift();redo=[];last=now;}
function schedule(){if(restoring)return;if(timer)clearTimeout(timer);timer=setTimeout(check,250);}
function apply(json){restoring=true;try{const d=JSON.parse(json),o=d.s||{};
 // mantém os mesmos objetos de parede (pelo uid) para não perder vínculos
 if(Array.isArray(o.walls)){const byUid=new Map(state.walls.filter(w=>w?.uid).map(w=>[w.uid,w]));state.walls=o.walls.map(w=>{const cur=w.uid&&byUid.get(w.uid);if(cur){for(const k of Object.keys(cur))if(!(k in w))delete cur[k];Object.assign(cur,w);return cur;}return w;});}
 for(const k of KEYS)if(k!=='walls'){if(k in o)state[k]=o[k];else delete state[k];}
 try{window.props54io?.set(d.p||[]);}catch{}
 try{window.cancelTool56?.();}catch{}
 renderWalls();drawPlan();invalidate();try{window.syncSupport53?.();}catch{}
 }finally{restoring=false;last=snap();}}
function step(from,to,label){if(timer){clearTimeout(timer);check();}if(!from.length){$('planStatus').textContent=label==='undo'?'Nada para desfazer.':'Nada para refazer.';return;}
 const cur=last??snap();to.push(cur);const prev=from.pop();apply(prev);$('planStatus').textContent=(label==='undo'?'Desfeito (Ctrl+Z). ':'Refeito (Ctrl+Y). ')+(from.length?from.length+' passo(s) ainda disponível(is).':'');}
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const k=e.key.toLowerCase();
 const t=e.target,typing=t&&(t.isContentEditable||/^(input|textarea|select)$/i.test(t.tagName)&&!/^(checkbox|radio|button|submit|range|color|file)$/i.test(t.type||''));
 if(typing)return; // dentro de um campo vale o desfazer da digitação
 if(k==='z'&&!e.shiftKey){e.preventDefault();step(undo,redo,'undo');}
 else if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();step(redo,undo,'redo');}});
for(const name of ['invalidate','renderWalls','drawPlan']){const base=window[name];if(typeof base!=='function')continue;const wrapped=function(...a){const r=base.apply(this,a);schedule();return r;};try{window[name]=wrapped;}catch{}}
// trocar de projeto zera o histórico
for(const id of ['newProject','example']){const b=$(id);if(!b)continue;const old=b.onclick;b.onclick=function(...a){const r=old?.apply(this,a);undo=[];redo=[];last=null;setTimeout(()=>{last=snap();},0);return r;};}
{const r=$('restore');if(r){const old=r.onchange;r.onchange=async function(...a){const res=await old?.apply(this,a);undo=[];redo=[];last=snap();return res;};}}
window.undo58={undo:()=>step(undo,redo,'undo'),redo:()=>step(redo,undo,'redo'),size:()=>[undo.length,redo.length],reset:()=>{undo=[];redo=[];last=snap();}};
setTimeout(()=>{last=snap();},0);
})();
// V59 — marcar/desmarcar "Conferida" sem redesenhar todos os resultados (era o que deixava o clique lento)
(function(){
const base=editWall;let drawTimer=null;
editWall=function(i,k,v){if(k!=='confirmed')return base.apply(this,arguments);const w=state.walls[i];if(!w)return;w.confirmed=!!v;
 const rep=$('genReport57');if(rep&&rep.style.display!=='none'&&!rep.querySelector('.gr57stale'))rep.insertAdjacentHTML('afterbegin','<p class="gr57stale">As entradas mudaram depois deste resultado. Clique em “Gerar modulação” para atualizar.</p>');
 if(state.results){const st=$('calculationStatus');if(st)st.textContent='Paredes conferidas alteradas. Clique em “Gerar modulação” para atualizar o resultado.';}
 if(drawTimer)cancelAnimationFrame(drawTimer);drawTimer=requestAnimationFrame(()=>{drawTimer=null;drawPlan();});};
})();
