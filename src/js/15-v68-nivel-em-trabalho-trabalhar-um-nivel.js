// V68 — "Nível em trabalho": trabalhar um nível por vez. Paredes, numeração, resultados e pranchas só do nível escolhido;
// os outros níveis ficam guardados e voltam como estavam. Ao salvar, o projeto grava todos os níveis.
(function(){
'use strict';
let current='all',stash=[],allProps=[],seq=0;const resByUid={};
const keyOf=page=>{const L=window.levelFor53?levelFor53({page}):{value:0,label:''};const v=Number.isFinite(L.value)?L.value:0;return v.toFixed(3)+'|'+(L.label||'');};
const nameOf=key=>{const[v,l]=key.split('|');const n=(Number(v)>=0?'+':'')+Number(v).toFixed(2).replace('.',',')+' m';return l?l+' ('+n+')':'Nível '+n;};
const valOf=key=>Number(key.split('|')[0])||0;
const wKey=w=>keyOf(Number(w.page||1));
const allWalls=()=>[...state.walls,...stash];
function ensureSeq(list){for(const w of list){if(!Number.isFinite(w.seq58))w.seq58=++seq;else seq=Math.max(seq,w.seq58);}}
function pagesList(){try{return pages36.map(p=>p.id);}catch{return [];}}
function levelKeys(){const s=new Set();for(const p of pagesList())s.add(keyOf(p));for(const w of allWalls())s.add(wKey(w));return [...s].sort((a,b)=>valOf(a)-valOf(b));}
const inView=w=>current==='all'||wKey(w)===current;
function leave(){ensureSeq(state.walls);
 if(Array.isArray(state.results)&&state.results.length===state.walls.length)state.walls.forEach((w,i)=>{if(w.uid&&state.results[i])resByUid[w.uid]=state.results[i];});
 const shown=new Set(state.walls);allProps=allProps.filter(p=>!shown.has(p.wall)&&allWalls().includes(p.wall));try{allProps.push(...(window.props54raw?.get()||[]));}catch{}}
async function switchTo(key,silent){if(key===current&&!silent)return;try{window.cancelTool56?.();window.closePop54?.();}catch{}
 leave();const all=allWalls();ensureSeq(all);current=key;
 const sorted=all.slice().sort((a,b)=>valOf(wKey(a))-valOf(wKey(b))||a.seq58-b.seq58);
 state.walls=sorted.filter(inView);stash=sorted.filter(w=>!inView(w));
 const res=state.walls.map(w=>resByUid[w.uid]);state.results=state.walls.length&&res.every(Boolean)?res:null;
 try{window.props54raw?.set(allProps.filter(p=>state.walls.includes(p.wall)));}catch{}allProps=allProps.filter(p=>!state.walls.includes(p.wall));
 // planta do nível
 const pg=pagesList().filter(p=>current==='all'||keyOf(p)===current);hidePages();
 if(pg.length&&!pg.includes(Number($('page').value))){$('page').value=pg[0];try{await renderPage();}catch(e){console.error(e);}}
 renderWalls();
 if(state.results)renderResults({reports:[]},state.results);else $('output').innerHTML='<h2>Modulação e quantitativos</h2><p class="note">'+(current==='all'?'Todos os níveis':esc(nameOf(current)))+': clique em “Gerar modulação” para calcular.</p>';
 try{drawPlan();}catch{}try{window.undo58?.reset();}catch{}sync();
 if(!silent)$('planStatus').textContent='Nível em trabalho: '+(current==='all'?'todos os níveis':nameOf(current))+' · '+state.walls.length+' parede(s)'+(current==='all'?'':' (numeradas a partir da Parede 1)')+'.';}
window.level68={props:()=>allProps,setResult:(w,m)=>{const i=state.walls.indexOf(w);if(i>=0&&Array.isArray(state.results)&&state.results.length===state.walls.length)state.results[i]=m;if(w?.uid&&m)resByUid[w.uid]=m;},switchTo,keyOf,nameOf,levelKeys,resultOf:w=>{const i=state.walls.indexOf(w);return i>=0&&Array.isArray(state.results)?state.results[i]:resByUid[w.uid];},current:()=>current,all:allWalls,refresh:()=>{sync();if(current!=='all'&&!levelKeys().includes(current)){const pg=Number($('page').value);switchTo(keyOf(pg),true).then(()=>{$('planStatus').textContent='Nível em trabalho atualizado: '+nameOf(current)+'.';});}else{const all=allWalls();const want=current==='all'?all:all.filter(w=>wKey(w)===current);if(want.length!==state.walls.length||want.some(w=>!state.walls.includes(w)))switchTo(current,true);}}};
function hidePages(){const sel=$('page');if(!sel)return;for(const o of sel.options){const show=current==='all'||keyOf(Number(o.value))===current;o.hidden=!show;o.disabled=!show;}}
try{const o36=options36;options36=function(...a){const r=o36.apply(this,a);hidePages();return r;};}catch{}
// seletores (coluna de ferramentas e junto do Gerar modulação)
function makeSel(id){const s=document.createElement('select');s.id=id;s.className='lvlSel68';s.onchange=()=>switchTo(s.value);return s;}
function sync(){const keys=levelKeys();for(const id of ['lvlSel68','lvlSel68b']){const s=$(id);if(!s)continue;const html='<option value="all">Todos os níveis</option>'+keys.map(k=>'<option value="'+esc(k)+'">'+esc(nameOf(k))+'</option>').join('');if(s.__h!==html){s.innerHTML=html;s.__h=html;}s.value=keys.includes(current)||current==='all'?current:'all';}
 const lab=$('lvlNote68');if(lab)lab.textContent=current==='all'?'Mostrando todos os níveis (numeração contínua).':'Só este nível: paredes numeradas a partir da Parede 1. Os outros níveis ficam guardados.';
 document.body.classList.toggle('lvl68on',current!=='all');}
{const side=$('tools62');if(side){const g=document.createElement('details');g.className='grp62 lvlGrp68';g.open=true;g.innerHTML='<summary>Nível em trabalho</summary>';const body=document.createElement('div');body.className='grpBody62';body.append(makeSel('lvlSel68'));const n=document.createElement('p');n.id='lvlNote68';n.className='note';n.style.cssText='margin:2px 0 0;font-size:11.5px';body.append(n);g.append(body);side.prepend(g);}
 const gen=$('generate');if(gen){const wrap=document.createElement('label');wrap.className='lvlGen68';wrap.textContent='Nível em trabalho ';wrap.append(makeSel('lvlSel68b'));gen.before(wrap);}}
// mantém a lista de níveis atualizada
{const rw=renderWalls;renderWalls=function(...a){const r=rw.apply(this,a);try{sync();}catch{}return r;};}
// salvar: grava todos os níveis juntos
{const b=$('save'),old=b?.onclick;if(b&&old)b.onclick=function(...a){if(current==='all')return old.apply(this,a);leave();const keepWalls=state.walls,keepRes=state.results,keepProps=window.props54raw?.get()||[];const all=allWalls().slice().sort((x,y)=>valOf(wKey(x))-valOf(wKey(y))||x.seq58-y.seq58);
 try{state.walls=all;state.results=null;window.props54raw?.set(allProps);return old.apply(this,a);}finally{state.walls=keepWalls;state.results=keepRes;window.props54raw?.set(keepProps);allProps=allProps.filter(p=>!keepWalls.includes(p.wall));}};}
// abrir projeto, novo projeto e exemplo: volta para "todos"
const reset=()=>{current='all';stash=[];allProps=[];for(const k in resByUid)delete resByUid[k];hidePages();sync();};
{const r=$('restore');if(r){const old=r.onchange;r.onchange=async function(...a){reset();const res=await old?.apply(this,a);reset();ensureSeq(state.walls);return res;};}}
for(const id of ['newProject','example']){const b=$(id);if(!b)continue;const old=b.onclick;b.onclick=function(...a){reset();const r=old?.apply(this,a);setTimeout(()=>{reset();ensureSeq(state.walls);},0);return r;};}
ensureSeq(state.walls);sync();
const css=document.createElement('style');css.textContent=`.lvlSel68{width:100%;font-size:13.5px;padding:6px 8px;font-weight:600;color:#102e4b;background:#fff4dc;border:1px solid #f0d49a;border-radius:6px}
.lvlGrp68{border-color:#f0d49a!important;background:#fffaf0!important}
.lvlGen68{display:inline-flex;align-items:center;gap:6px;font-weight:600;margin-right:8px}.lvlGen68 .lvlSel68{width:auto}
body.lvl68on #walls{outline:2px solid #f0d49a}`;document.head.append(css);
})();
