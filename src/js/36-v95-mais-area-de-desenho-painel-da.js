// V95 — mais área de desenho: painel da direita recolhido; "Resultado da modulação" no canto da faixa de ferramentas;
// as propriedades da parede aparecem numa janelinha (arrastável) só quando uma parede é selecionada.
(function(){
'use strict';
const prog=$('prog86'),card=$('wcard85');if(!prog||!card||!document.body.classList.contains('ui85'))return;
// 1) resultado no canto superior direito da faixa de ferramentas
const host=document.createElement('div');host.id='progHost95';host.className='noPrint';host.append(prog);document.body.append(host);
// 2) propriedades numa janelinha
const fl=document.createElement('div');fl.id='card95';fl.className='noPrint';fl.hidden=true;fl.innerHTML='<div class="h95"><b>Propriedades</b><span>arraste por aqui</span><button type="button" title="Fechar">✕</button></div><div class="b95"></div>';document.body.append(fl);fl.querySelector('.b95').append(card);
fl.querySelector('.h95 button').onclick=()=>{try{window.select85?.(-1);}catch{}fl.hidden=true;};
let d=null;fl.querySelector('.h95').addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;const r=fl.getBoundingClientRect();d={dx:e.clientX-r.left,dy:e.clientY-r.top};try{fl.setPointerCapture(e.pointerId);}catch{}e.preventDefault();});
fl.addEventListener('pointermove',e=>{if(!d)return;fl.style.left=Math.max(0,Math.min(innerWidth-120,e.clientX-d.dx))+'px';fl.style.top=Math.max(40,Math.min(innerHeight-60,e.clientY-d.dy))+'px';fl.style.right='auto';});
fl.addEventListener('pointerup',()=>{d=null;});
const sync=()=>{const i=window.sel85?.();fl.hidden=!(i>=0);};
{const s=window.select85;if(s)window.select85=function(i){const r=s.apply(this,arguments);sync();return r;};}
new MutationObserver(sync).observe(card,{childList:true,subtree:true});
// 3) painel lateral recolhido por padrão (o botão ⟨ continua abrindo: controles e lista completa)
document.body.classList.add('noside85');const tg=$('sideTg85');if(tg)tg.textContent='⟨';
setTimeout(()=>{try{document.documentElement.style.setProperty('--w85',(document.querySelector('#main85')?.clientWidth||innerWidth)+'px');window.dispatchEvent(new Event('resize'));drawPlan();}catch{}},80);
const css=document.createElement('style');css.textContent=
'#progHost95{position:fixed;top:50px;right:6px;width:178px;max-height:80px;z-index:60;overflow:hidden}'+
'#progHost95 .pg86{padding:5px 9px!important;margin:0!important;border:1px solid #d5dee7;border-radius:8px;background:#fff;font-size:11.5px;line-height:1.25}'+
'#progHost95 .pgT86{display:flex;justify-content:space-between;align-items:center;font-size:12px}#progHost95 .pgT86 b{font-size:12px}#progHost95 .pgBar86{height:5px;margin:3px 0}'+
'#progHost95 .pgN86,#progHost95 .pgDone86{font-size:11.5px;margin:0}#progHost95 .pgR86,#progHost95 .pgA86{display:inline-flex;gap:4px;margin:2px 4px 0 0}#progHost95 .pgR86 button,#progHost95 .pgA86 button,#progHost95 .pgNav86 button{padding:1px 6px;font-size:11px;margin:0}#progHost95 .pgL86{max-height:22px;overflow:auto}'+
'#card95{position:fixed;top:142px;right:14px;width:330px;max-height:calc(100vh - 190px);overflow:auto;z-index:62;background:#fff;border:1px solid #b9c6d3;border-radius:9px;box-shadow:0 10px 28px rgba(16,46,75,.22)}#card95[hidden]{display:none}'+
'#card95 .h95{display:flex;align-items:center;gap:8px;padding:7px 10px;background:#eef3f8;border-bottom:1px solid #d5dee7;cursor:move;user-select:none;position:sticky;top:0;z-index:1}#card95 .h95 span{color:#8a9aaa;font-size:11px;flex:1}#card95 .h95 button{border:0;background:none;font-size:15px;cursor:pointer;margin:0;padding:0 4px;color:#40566b}#card95 .b95{padding:8px 10px}#card95 #wcard85 h3:first-child{display:none}';
document.head.append(css);
// o cartão leva junto a aparência que tinha no painel lateral
try{const add=[];for(const sh of document.styleSheets){let rs;try{rs=sh.cssRules;}catch{continue;}for(const r of rs){const t=r.selectorText;if(!t||!t.includes('#side85'))continue;const parts=t.split(',').map(x=>x.trim()).filter(x=>x.includes('#side85 ')&&!/noside85/.test(x));if(parts.length)add.push(parts.map(x=>x.replace(/#side85 /g,'#card95 ')).join(',')+'{'+r.style.cssText+'}');}}
 const st=document.createElement('style');st.textContent=add.join('\n')+'#card95 #wcard85 h3:first-child{display:none}#rib85{max-width:calc(100vw - 188px)!important;overflow-x:auto!important;overflow-y:hidden!important;scrollbar-width:thin}';document.head.append(st);}catch(e){console.error('V95 estilo',e);}
})();
