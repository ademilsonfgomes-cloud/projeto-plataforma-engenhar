// V78 — divisória arrastável entre a planta e a coluna de ferramentas; grupos na ordem do fluxo de trabalho.
(function(){
'use strict';
const work=$('work62'),side=$('tools62');if(!work||!side)return;
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch{}return null;};
// ---------- 1. Ordem dos grupos: Nível → Planta → Paredes → Aberturas → Vista → Ajustes → Cargas → Pavimentos · origem e 3D
{const groups=[...side.querySelectorAll(':scope > details.grp62')],t=g=>(g.querySelector('summary')?.textContent||'').trim().toLowerCase();
 const rank=g=>g.classList.contains('lvlGrp68')?0:t(g)==='planta'?1:t(g)==='paredes'?2:t(g)==='aberturas'?3:t(g)==='vista'?4:t(g)==='ajustes'?5:g.classList.contains('grp77')?6:g.classList.contains('grp74')?7:5.5;
 groups.sort((a,b)=>rank(a)-rank(b)).forEach(g=>side.append(g));}
// ---------- 2. Divisória arrastável
const bar=document.createElement('div');bar.id='split78';bar.className='split78 noPrint';bar.title='Arraste para aumentar ou diminuir a planta e a coluna de ferramentas · duplo clique volta ao tamanho padrão';bar.innerHTML='<span>⋮</span>';
work.insertBefore(bar,side);
const DEF=260,MIN=200;
const apply=w=>{const max=Math.max(MIN,work.getBoundingClientRect().width*.6);w=Math.round(Math.max(MIN,Math.min(max,w||DEF)));work.style.setProperty('--side78',w+'px');return w;};
let width=apply(Number(LS('side78'))||DEF);
const redraw=()=>{try{window.dispatchEvent(new Event('resize'));drawPlan();}catch{}};
let drag=null;
bar.addEventListener('pointerdown',e=>{e.preventDefault();bar.setPointerCapture(e.pointerId);drag={x:e.clientX,w:side.getBoundingClientRect().width};document.body.classList.add('drag78');});
bar.addEventListener('pointermove',e=>{if(!drag)return;const left=work.classList.contains('left62'),dx=e.clientX-drag.x;width=apply(drag.w+(left?dx:-dx));});
const end=()=>{if(!drag)return;drag=null;document.body.classList.remove('drag78');LS('side78',String(width));redraw();};
bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
bar.addEventListener('dblclick',()=>{width=apply(DEF);LS('side78',String(width));redraw();});
// teclado (acessibilidade): setas mudam 20 px
bar.tabIndex=0;bar.setAttribute('role','separator');bar.setAttribute('aria-orientation','vertical');
bar.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;e.preventDefault();const left=work.classList.contains('left62'),d=(e.key==='ArrowRight'?20:-20)*(left?1:-1);width=apply(width+d);LS('side78',String(width));redraw();});
window.addEventListener('resize',()=>{if(!drag)apply(width);});
const st=document.createElement('style');st.textContent=`
.work62{grid-template-columns:minmax(0,1fr) 12px var(--side78,260px)!important;column-gap:2px!important}
.work62.left62{grid-template-columns:var(--side78,260px) 12px minmax(0,1fr)!important}
.work62.left62 .tools62{order:-2}.work62.left62 .split78{order:-1}
.split78{align-self:stretch;min-height:200px;cursor:col-resize;display:flex;align-items:center;justify-content:center;border-radius:6px;user-select:none;touch-action:none}
.split78 span{display:flex;align-items:center;justify-content:center;width:8px;height:56px;border-radius:5px;background:#cfdceb;color:#2f6fa8;font:bold 14px Arial;position:sticky;top:45vh}
.split78:hover span,.split78:focus span,body.drag78 .split78 span{background:#2f6fa8;color:#fff}
.split78:focus{outline:none}
body.drag78{cursor:col-resize!important;user-select:none}body.drag78 *{cursor:col-resize!important}
.work62.full62 .split78{min-height:calc(100vh - 16px)}
@media(max-width:820px){.split78{display:none}}`;document.head.append(st);
})();
