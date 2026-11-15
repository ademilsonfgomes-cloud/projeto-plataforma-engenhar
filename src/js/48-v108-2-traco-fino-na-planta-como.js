// V108.2 — TRAÇO FINO na planta (como no AutoCAD): linhas finas e textos sem negrito. Liga/desliga no painel Visibilidade.
// Só visual: não muda pranchas, DXF nem o projeto.
(function(){
'use strict';
const c=$('plan');if(!c)return;const ctx=c.getContext('2d'),P=CanvasRenderingContext2D.prototype;
const LW=Object.getOwnPropertyDescriptor(P,'lineWidth'),FT=Object.getOwnPropertyDescriptor(P,'font');if(!LW||!FT)return;
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch{}return null;};
let on=LS('fino108')!=='0',drawing=0,minW=.6;
const F=.38,FS=.92;// linhas a 38 %, textos a 92 % e sem negrito
Object.defineProperty(ctx,'lineWidth',{configurable:true,get(){return LW.get.call(this);},set(v){this.__raw108=Number(v);if(on&&drawing){v=Number(v);if(v>0)v=Math.max(v*F,Math.min(v,minW));}LW.set.call(this,v);}});
Object.defineProperty(ctx,'font',{configurable:true,get(){return FT.get.call(this);},set(v){if(on&&drawing&&typeof v==='string'){v=v.replace(/\b(bold|bolder|[6-9]00)\s+/g,'').replace(/(\d+(?:\.\d+)?)px/,(m,n)=>(Number(n)*FS).toFixed(2)+'px');}FT.set.call(this,v);}});

// V108.5 — linha da parede (verde/laranja da conferência, azul/verde/roxo/vermelho da posição) com 1 pixel de tela, como no AutoCAD
const WALL=new Set(['#24795d','#e29222','#2a9d5c','#8a4fbf']),WALL4=new Set(['#174a78','#d1462f']);let hair=1;
{const st=P.stroke;ctx.stroke=function(...a){if(on&&drawing){const s=String(this.strokeStyle).toLowerCase(),r=this.__raw108;if((WALL.has(s)&&(r===3||r===4))||(WALL4.has(s)&&r===4)){if(window.wl108on?.())return;const keep=LW.get.call(this);LW.set.call(this,hair);try{return st.apply(this,a);}finally{LW.set.call(this,keep);}}}return st.apply(this,a);};}
{const dp=drawPlan;drawPlan=function(...a){const r0=c.getBoundingClientRect(),sc=((typeof zoom==='number'&&zoom>0)?zoom:0)||((r0.width&&c.width)?r0.width/c.width:1);minW=.75/(sc||1);hair=1/(sc||1);drawing++;try{return dp.apply(this,a);}finally{drawing--;}};}
function toggle(v){on=v===undefined?!on:!!v;LS('fino108',on?'1':'0');try{drawPlan();}catch{}}
window.fino108={toggle,get on(){return on;}};
// botão dentro do painel Visibilidade
{const vp=$('vis87pop');if(vp)new MutationObserver(()=>{if(vp.hidden)return;let b=vp.querySelector('.fn108');const f=vp.querySelector('.f87v');if(!f)return;
 if(!b){b=document.createElement('button');b.type='button';b.className='bg88lnk fn108';b.onclick=e=>{e.stopPropagation();toggle();b.textContent=lbl();};f.before(b);}b.textContent=lbl();}).observe(vp,{childList:true,attributes:true});}
const lbl=()=>(on?'✔':'○')+' Traço fino (como no AutoCAD)';
})();
