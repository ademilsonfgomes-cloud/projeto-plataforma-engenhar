// V53 — apoio da parede configurável por parede: laje ou viga, com altura própria.
(function(){
'use strict';
const DEF={Viga:30,Laje:15};
function base(){const d=state.supportDefault53||{};const type=d.type==='Laje'?'Laje':'Viga';return {type,h:d.h===undefined||d.h===''?DEF[type]:Number(d.h)};}
function cfg(w){state.support53??={};const b=base(),s=(w&&state.support53[w.uid])||{},type=s.type?(s.type==='Laje'?'Laje':'Viga'):b.type,h=s.h===undefined||s.h===null||s.h===''?(s.type&&s.type!==b.type?DEF[type]:b.h):Number(s.h);return {type,h:Number.isFinite(h)?Math.max(0,Math.min(150,h)):DEF[type]};}
window.supportOf53=cfg;
let current=null;window.currentWall53=()=>current;
const sw=svgWall;svgWall=function(w,...a){const prev=current;current=w;try{return sw(w,...a);}finally{current=prev;}};
const ss=svgSection;svgSection=function(w,...a){const prev=current;current=w;try{return ss(w,...a);}finally{current=prev;}};
function hatch(x,y,W,H,step){let out='';for(let t=step;t<W+H;t+=step){let x1=x+t,y1=y,x2=x+t-H,y2=y+H;if(x1>x+W){y1=y+(x1-(x+W));x1=x+W;}if(x2<x){y2=y+H-(x-x2);x2=x;}if(y2>y1+.01)out+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#9aa3ab" stroke-width=".12"/>`;}return out;}
wallSupport22=function(x,y,width,k,which){const w=current,i=w?state.walls.indexOf(w):-1,c=cfg(w),h=c.h*k,label=`Apoio em ${c.type.toLowerCase()}`;
 const click=i>=0?` onclick="openSupport53(${i})" style="cursor:pointer"`:'';
 if(h<=0)return `<g data-wall-support="${which}"${click}><line x1="${x}" y1="${y}" x2="${x+width}" y2="${y}" stroke="#777" stroke-width=".25"/><text x="${which==='section'?x+width+1:x+width-2}" y="${y+2.4}" text-anchor="end" font-size="1.9">${label}</text></g>`;
 const inside=h>=3.2,tx=which==='section'?x+width+1:x+width-2,ty=which==='section'?y+h+3:inside?y+h*.5+.7:y+h+2.4;
 return `<g data-wall-support="${which}"${click}><title>${label} — clique para alterar</title><rect x="${x}" y="${y}" width="${width}" height="${h}" fill="#eeeeee" stroke="#8c959d" stroke-width=".15"/>${hatch(x,y,width,h,Math.max(1.2,2*k*5))}${which==='section'?`<path d="M${tx},${ty-2}L${x+width*.65},${y+h*.65}" fill="none" stroke="#555" stroke-width=".18"/>`:''}<text x="${tx}" y="${ty}" text-anchor="end" font-size="1.9"${inside&&which!=='section'?' paint-order="stroke" stroke="#eeeeee" stroke-width=".8"':''}>${label}</text></g>`;};
window.openSupport53=function(i){const s=document.querySelector(`select[data-sup53="${i}"]`);if(!s)return;s.scrollIntoView({block:'center',behavior:'smooth'});s.focus();s.closest('.support53')?.animate?.([{background:'#ffe9a8'},{background:'transparent'}],{duration:1400});};
window.setSupport53=function(i,field,value){const w=state.walls[i];if(!w)return;state.support53??={};const s=state.support53[w.uid]??={};if(field==='type'){s.type=value==='Laje'?'Laje':'Viga';delete s.h;}else{const v=Number(value);if(!(v>=0&&v<=150)){alert('Altura do apoio: de 0 a 150 cm.');return;}s.h=v;}steelEditing19={wall:i};refreshSteel19();};
const rr=renderResults;renderResults=function(...args){const r=rr(...args);for(const [i,w]of state.walls.entries()){const bar=document.querySelector(`#wall-result-${i} .steelTools53`);if(!bar||bar.querySelector('.support53'))continue;const c=cfg(w);const span=document.createElement('span');span.className='support53';
 span.innerHTML=`<b>Apoio:</b> <select data-sup53="${i}" onchange="setSupport53(${i},'type',this.value)"><option ${c.type==='Viga'?'selected':''}>Viga</option><option ${c.type==='Laje'?'selected':''}>Laje</option></select> altura <input type="number" min="0" max="150" step="1" value="${c.h}" data-suph53="${i}" onchange="setSupport53(${i},'h',this.value)"> cm`;bar.insertBefore(span,bar.querySelector('.note'));}return r;};
// controle geral: muda todas as paredes de uma vez
{const heightLabel=$('height')?.closest('label');if(heightLabel&&!$('supType53')){const l=document.createElement('label');l.innerHTML='Apoio das paredes (todas)<span class="supAll53"><select id="supType53"><option>Viga</option><option>Laje</option></select><input id="supH53" type="number" min="0" max="150" step="1"> cm</span>';heightLabel.after(l);
 const sync=()=>{const b=base();$('supType53').value=b.type;$('supH53').value=b.h;};sync();window.syncSupport53=sync;
 const apply=(field,value)=>{const cur=base();if(field==='type'?value===cur.type:Number(value)===cur.h)return;state.supportDefault53??={};if(field==='type'){state.supportDefault53.type=value;state.supportDefault53.h=DEF[value];}else{const v=Number(value);if(!(v>=0&&v<=150)){alert('Altura do apoio: de 0 a 150 cm.');sync();return;}state.supportDefault53.h=v;}
  const n=Object.keys(state.support53||{}).length;state.support53={};sync();if(state.results)renderResults({reports:state.junctionReports||[]},state.results);showStatus('Apoio aplicado a todas as paredes: '+base().type.toLowerCase()+', '+fmt(base().h)+' cm.'+(n?' Ajustes individuais anteriores foram substituídos.':''));};
 $('supType53').onchange=e=>apply('type',e.target.value);$('supH53').onchange=e=>apply('h',e.target.value);}}
const css=document.createElement('style');css.textContent='.supAll53{display:flex;gap:6px;align-items:center}.supAll53 select{flex:1}.supAll53 input{width:80px}.support53{display:inline-flex;gap:6px;align-items:center;padding:2px 10px;border-left:1px solid #c9dbea;border-radius:4px}.support53 select{width:auto;padding:5px 8px}.support53 input{width:70px;padding:5px 8px}';document.head.append(css);
})();
