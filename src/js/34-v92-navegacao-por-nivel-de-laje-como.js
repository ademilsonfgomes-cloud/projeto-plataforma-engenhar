// V92 — navegação por nível de laje (como TQS / CYPECAD): cada parede tem base e topo.
// Nível +0,00 = piso (paredes nascendo, sem laje até você ligar); nível +2,80 = laje apoiada nas paredes que chegam a 2,80;
// último nível = cobertura. A modulação das paredes é a mesma; o nível escolhe a laje em que você lança as cargas.
(function(){
'use strict';
const N=Number,L68=()=>window.level68;if(!L68())return;
const val=k=>N(String(k).split('|')[0])||0,lab=k=>String(k).split('|')[1]||'';
const fm=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(2).replace('.',',')+' m';
let cur='all',last=[];
function wallsOf(k){return L68().all().filter(w=>L68().keyOf(N(w.page||1))===k);}
// V100 — uma linha por nível real da obra: piso, cada laje (inclusive as das repetições do pavimento-tipo), cobertura
// e as plantas que ainda não têm paredes. Sem "Todos os níveis".
function lvInfo(k){let rep=1,H=0;try{const l=window.loads77?.levels?.().find(x=>x.key===k);if(l){rep=Math.max(1,N(l.rep)||1);H=N(l.H)||0;}}catch{}if(!H){const hs=wallsOf(k).map(w=>N(w.height)||0);H=hs.length?Math.max(...hs):280;}return {rep,H};}
function plantsOf(k){try{return pages36.filter(p=>L68().keyOf(p.id)===k).map(p=>p.name+(p.local>1?' p.'+p.local:''));}catch{return [];}}
function entries(){const ks=L68().levelKeys();const E=[];if(!ks.length)return E;const tt=N(window.opt3d74?.t)||10;
 const wk=ks.filter(k=>wallsOf(k).length),ek=ks.filter(k=>!wallsOf(k).length);
 if(wk.length){
  wk.forEach((k,i)=>{const{rep,H}=lvInfo(k),nm=lab(k),step=(H+tt)/100;
   if(i===0)E.push({id:'p|'+k,wallKey:k,slabKey:k,tgt:'piso',v:val(k),txt:'Nível '+fm(val(k))+' · Piso'+(nm?' — '+nm:'')});
   else E.push({id:'l|'+k,wallKey:wk[i-1],slabKey:k,tgt:'piso',v:val(k),txt:'Nível '+fm(val(k))+' · Laje'+(nm?' (piso do '+nm+')':'')+(rep>1?' · tipo 1º de '+rep:'')});
   for(let j=1;j<rep;j++){const z=val(k)+j*step,tg=i===0?'tipo':'piso',base=i===0&&j===1,own=!base&&!!window.loads77?.isOwn?.(k,tg,j+1);E.push({id:'r|'+k+'|'+j,wallKey:k,slabKey:k,tgt:tg,self:i>0,rep:j+1,of:rep,own,v:z,txt:'Nível '+fm(z)+' · Laje do tipo ('+(j+1)+'º de '+rep+')'+(nm?' — '+nm:'')+(base?' · tipo (vale para os iguais)':own?' · laje própria':' · igual ao tipo')});}});
  const top=wk.at(-1),{rep,H}=lvInfo(top),vt=val(top)+rep*(H+tt)/100;
  E.push({id:'c|'+top,wallKey:top,slabKey:top,tgt:'cob',v:vt,txt:'Nível '+fm(vt)+' · '+((()=>{try{return window.cobName105?.(top);}catch{return '';}})()||'Cobertura')});}
 for(const k of ek){const pl=plantsOf(k);E.push({id:'e|'+k,wallKey:k,slabKey:k,tgt:'piso',v:val(k),empty:true,txt:'Nível '+fm(val(k))+(lab(k)?' · '+lab(k):'')+' — planta sem paredes'+(pl.length?' ('+pl.join(', ')+')':'')});}
 return E.sort((a,b)=>a.v-b.v||(a.empty?1:0)-(b.empty?1:0));}
const sel=document.createElement('select');sel.id='lvl92';sel.title='Nível de laje: escolha o nível para ver as paredes que chegam nele e lançar a laje e as cargas desse nível';
function fill(){const E=entries();last=E;const html=E.map(e=>'<option value="'+esc(e.id)+'">'+esc(e.txt)+'</option>').join('')+'<option value="all" hidden>— escolha o nível —</option>';
 if(sel.__h!==html){sel.innerHTML=html;sel.__h=html;}
 // mantém a escolha coerente com o nível em trabalho
 const lc=L68().current(),up=window.mode94==='cima';if(lc==='all'){cur='all';}else{const c=E.find(e=>e.id===cur&&(up?e.slabKey:e.wallKey)===lc);if(!c){window.mode94='laje';const f=E.find(e=>e.wallKey===lc);cur=f?f.id:'all';}}
 sel.value=cur;const ce=cur==='all'?null:(E.find(e=>e.id===cur)||null);window.lvl92ctx=ce&&window.mode94!=='cima'?ce:null;document.body.classList.toggle('lvl92on',cur!=='all');}
// ações já lançadas na planta de cima passam para a vista das paredes de baixo (mesma posição no espaço)
function migrate(e,pg){const S=window.loads77?.S?.();if(!S||e.slabKey===e.wallKey)return;let n=0;
 for(const it of S.items||[]){if(it.slab92||(it.tgt||'piso')!=='piso')continue;if(window.loads77.keyOfPage(it.page)!==e.slabKey)continue;
  try{it.pts=(it.pts||[]).map(Q=>window.toPage74(pg,window.world74(N(it.page),Q)));it.slab92=e.slabKey;it.page=pg;n++;}catch{}}
 if(n)try{window.loads77.touch?.();}catch{}}
async function go(id,silent){const e=last.find(x=>x.id===id);try{window.cancelTool56?.();}catch{}
 if(id==='all'||!e){cur='all';window.lvl92ctx=null;await L68().switchTo('all');fill();if(!silent)$('planStatus').textContent='Todos os níveis: só para ver o projeto inteiro. Escolha um nível para lançar lajes e cargas.';return;}
 cur=id;const up94=window.mode94==='cima'&&e.id.startsWith('l|');if(!up94)window.mode94='laje';window.lvl92ctx=up94?null:e;const wk=up94?e.slabKey:e.wallKey;if(L68().current()!==wk)await L68().switchTo(wk);
 const S=window.loads77?.S?.();if(S){S.cfg.tgt=e.tgt;}migrate(e,N($('page').value));
 const t=$('ld77tgt');if(t){t.value=e.tgt;try{t.onchange?.({target:t});}catch{}}
 fill();try{drawPlan();}catch{}try{window.lvlSync85?.();}catch{}try{const s85=$('sLv85');if(s85)s85.textContent=sel.selectedOptions[0]?.textContent||'';}catch{}
 if(!silent&&e.id.startsWith('r|')){$('planStatus').textContent='Nível '+fm(e.v)+' · '+e.rep+'º de '+e.of+': '+(e.own?'laje própria deste pavimento — o que você mudar aqui vale só para ele (↺ Igual ao tipo desfaz).':(e.tgt==='tipo'&&e.rep===2)||e.id.startsWith('l|')?'laje do tipo — o que você lançar aqui vale para todos os pavimentos iguais.':'igual ao tipo — ao mexer na laje, este pavimento ganha laje própria e os outros não mudam.');return;}
 if(!silent&&e.empty){$('planStatus').textContent='Nível '+fm(e.v)+': planta ainda sem paredes. Proponha ou desenhe as paredes sobre esta máscara (elas ficam neste nível).';return;}
 if(!silent){const ws=state.walls.length;$('planStatus').textContent=e.tgt==='cob'?'Nível '+fm(e.v)+' · Cobertura: laje de cobertura apoiada nas '+ws+' paredes que chegam aqui.':e.id.startsWith('p|')?'Nível '+fm(e.v)+' · Piso: '+ws+' paredes nascendo aqui. Sem laje (o piso não carrega as paredes) — para radier ou contrapiso com tela, abra Laje → ⚙ Laje e ações do pavimento.':'Nível '+fm(e.v)+' · Laje apoiada nas '+ws+' paredes que chegam a '+fm(e.v)+'. Lance aqui a laje e as cargas deste nível.';}}
sel.onchange=()=>go(sel.value);
// troca o seletor da faixa de cima pelo de níveis de laje; ▲ ▼ andam de nível em nível
{const host=$('lvlHost85'),old=$('lvl85');if(host){if(old)old.style.display='none';host.append(sel);}
 const step=d=>{const ids=[...last.map(e=>e.id)];if(!ids.length)return;let k=ids.indexOf(cur);if(k<0)k=d>0?-1:ids.length;k=Math.max(0,Math.min(ids.length-1,k+d));go(ids[k]);};
 const up=$('lvUp85'),dn=$('lvDn85');if(up)up.onclick=e=>{e.preventDefault();e.stopPropagation();step(1);};if(dn)dn.onclick=e=>{e.preventDefault();e.stopPropagation();step(-1);};}
{const rw=renderWalls;renderWalls=function(...a){const r=rw.apply(this,a);try{fill();}catch(er){console.error('V92',er);}return r;};}
setTimeout(fill,0);
// V102 — voltar a laje própria de uma repetição a ser igual ao tipo
const back102=document.createElement('button');back102.type='button';back102.id='own102';back102.className='secondary noPrint';back102.textContent='↺ Igual ao tipo';back102.title='Apaga a laje própria deste pavimento: ele volta a ser igual ao tipo';back102.style.display='none';
{const host=$('lvlHost85');if(host)host.append(back102);}
back102.onclick=()=>{if(window.loads77?.backToTipo?.()){fill();$('planStatus').textContent='Este pavimento voltou a ser igual ao tipo.';}};
{const f0=fill;fill=function(){f0();try{const ce=last.find(e=>e.id===cur);back102.style.display=ce?.own?'':'none';}catch{}};}
window.lvl92={entries:()=>last,go,current:()=>cur};
const css=document.createElement('style');css.textContent='#lvl92{font-weight:600;max-width:340px}body.lvl92on .tgt77{display:none!important}';document.head.append(css);
})();
