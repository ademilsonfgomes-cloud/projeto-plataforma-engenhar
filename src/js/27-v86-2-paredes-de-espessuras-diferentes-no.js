// V86.2 — paredes de espessuras diferentes no mesmo projeto (ex.: 14 e 19 cm, Braúnas):
// ao escolher a espessura de uma parede, os blocos dessa espessura entram no catálogo sozinhos (sem trocar a família do projeto).
(function(){
'use strict';
const N=Number;
function catalogFor(w){if(w===19&&typeof catalog19_34==='function')return catalog19_34();if(w===14&&typeof braunasBlocks==='function')return braunasBlocks().filter(b=>N(b.width)===14);return [];}
function ensure(width){const w=N(width);if(!(w>0))return 0;if(state.blocks.some(b=>b.active!==false&&b.type!=='Canaleta'&&N(b.width)===w))return 0;
 const add=catalogFor(w).filter(b=>!state.blocks.some(x=>x.code===b.code));if(!add.length)return 0;state.blocks.push(...add.map(b=>({...b,active:true,auto86:true})));
 try{renderBlocks();}catch{}try{$('planStatus').textContent='Blocos de '+w+' cm da Braúnas acrescentados ao catálogo ('+add.map(b=>b.code).join(', ')+'). Os de '+state.family34+' cm continuam. Encontros com paredes de outra espessura viram amarração indireta (grampo) ao gerar.';}catch{}return add.length;}
window.ensureWidth86=ensure;
try{const ew=editWall;editWall=function(i,k,v,...r){if(k==='width')ensure(v);return ew.call(this,i,k,v,...r);};}catch(e){console.error('V86 espessura',e);}
// projeto aberto com paredes de outra espessura: garante os blocos antes de gerar
$('generate')?.addEventListener('click',()=>{try{for(const w of new Set((state.walls||[]).map(x=>N(x.width))))ensure(w);}catch{}},true);
})();
