// V87.2 — Visibilidade (olhinhos, como no CYPECAD): mostra/esconde camadas da planta. Só visual — nada sai do projeto.
(function(){
'use strict';
const N=Number;let hid=new Set();try{hid=new Set(JSON.parse(localStorage.getItem('vis87')||'[]'));}catch{}
const save=()=>{try{localStorage.setItem('vis87',JSON.stringify([...hid]));}catch{}};
const ld=k=>{const c=$(k==='cargas'?'ld77show':'ld77infl');if(c)return !!c.checked;return !!state.loads77?.cfg?.[k==='cargas'?'show':'infl'];};
const setLd=(k,on)=>{if(ld(k)===on)return;const c=$(k==='cargas'?'ld77show':'ld77infl');if(c)c.click();else{state.loads77??={};state.loads77.cfg??={};state.loads77.cfg[k==='cargas'?'show':'infl']=on;}};
const L=[['fundo','Desenho de fundo (DXF / PDF)'],['nomes','Nome das paredes'],['aberturas','Portas e janelas'],['cargas','Lajes e cargas'],['infl','Áreas de influência (cores das cargas)'],['desniveis','Desníveis (−60, base −60, laje −60)']];
const isOn=k=>k==='cargas'||k==='infl'?ld(k):!hid.has(k);
function setOn(k,on){if(k==='cargas'||k==='infl'){setLd(k,on);}else{if(on)hid.delete(k);else hid.add(k);save();}window.dn87hide=hid.has('desniveis');}
window.dn87hide=hid.has('desniveis');
window.vis87={isOn,setOn,hidden:()=>[...hid]};

// desenho: tira só da tela durante o desenho da planta
try{const dp=drawPlan;drawPlan=function(...a){if(!hid.size)return dp.apply(this,a);const P=CanvasRenderingContext2D.prototype,di=P.drawImage,ft=P.fillText,st=P.strokeText;let saved=null;
 try{if(hid.has('fundo')){const img=typeof image!=='undefined'?image:null;P.drawImage=function(x,...r){if(img&&x===img){if(window.under88){window.under88(this);return;}this.save();this.fillStyle='#fff';this.fillRect(0,0,x.width||0,x.height||0);this.restore();return;}return di.call(this,x,...r);};}
  if(hid.has('nomes')){const re=/^Parede \d+$/;P.fillText=function(t,...r){if(re.test(String(t)))return;return ft.call(this,t,...r);};P.strokeText=function(t,...r){if(re.test(String(t)))return;return st.call(this,t,...r);};}
  if(hid.has('aberturas')){saved=(state.walls||[]).map(w=>w.openings);for(const w of state.walls||[])w.openings=[];}
  return dp.apply(this,a);}
 finally{P.drawImage=di;P.fillText=ft;P.strokeText=st;if(saved)(state.walls||[]).forEach((w,i)=>{w.openings=saved[i];});}};}catch(e){console.error('V87 visibilidade',e);}

// painel com os olhinhos (faixa de cima)
const EYE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 EYEOFF='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke-dasharray="2.6 1.8"/><path d="M4 20 20 4" stroke-width="2"/></svg>';
const btn=document.createElement('button');btn.type='button';btn.id='vis87btn';btn.title='Visibilidade: mostrar / esconder camadas da planta';btn.innerHTML='<span class="e87v">'+EYE+'</span> Visibilidade';
const pop=document.createElement('div');pop.id='vis87pop';pop.hidden=true;pop.className='noPrint';
function render(){const off=L.filter(([k])=>!isOn(k)).length;btn.classList.toggle('some87',off>0);btn.querySelector('.e87v').innerHTML=off?EYEOFF:EYE;
 pop.innerHTML='<div class="t87v">Mostrar na planta <span>clique no olho · botão direito = só esta</span></div>'+L.map(([k,t])=>'<button type="button" class="r87v '+(isOn(k)?'on':'off')+'" data-k="'+k+'"><span class="o87v">'+(isOn(k)?EYE:EYEOFF)+'</span>'+t+'</button>').join('')+
  '<div class="f87v"><button type="button" data-all="1">Mostrar tudo</button><span>Só visual: nada sai do projeto, das pranchas nem do DXF.</span></div>';}
function place(){const r=btn.getBoundingClientRect();pop.style.left=Math.max(8,Math.min(innerWidth-330,r.left))+'px';pop.style.top=(r.bottom+4)+'px';}
btn.onclick=e=>{e.stopPropagation();pop.hidden=!pop.hidden;if(!pop.hidden){render();place();}};
let solo=null;
pop.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('button');if(!b)return;
 if(b.dataset.all){for(const[k]of L)setOn(k,true);solo=null;}else{const k=b.dataset.k;setOn(k,!isOn(k));}
 render();try{drawPlan();}catch{}});
pop.addEventListener('contextmenu',e=>{const b=e.target.closest('button[data-k]');if(!b)return;e.preventDefault();const k=b.dataset.k;
 if(solo===k){for(const[x]of L)setOn(x,true);solo=null;}else{for(const[x]of L)setOn(x,x===k);solo=k;}render();try{drawPlan();}catch{}});
document.addEventListener('click',e=>{if(!pop.hidden&&!pop.contains(e.target)&&e.target!==btn)pop.hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden)pop.hidden=true;});
function mount(){const host=$('top85');if(!host){document.body.append(pop);return;}const lv=host.querySelector('.lv85');if(lv)lv.after(btn);else host.append(btn);document.body.append(pop);render();}
mount();
// o olhinho de lajes e cargas nas barras atualiza o painel também
const ld0=window.ldEye85;if(ld0)window.ldEye85=(...a)=>{const r=ld0(...a);render();return r;};
const css=document.createElement('style');css.textContent=`#vis87btn{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 10px;margin:0 4px;border-radius:6px;border:1px solid #3b6a96;background:#1d4a73;color:#e8f1fa;font-size:13px;cursor:pointer}
#vis87btn .e87v svg{width:18px;height:18px;display:block}#vis87btn.some87{background:#f59e0b;border-color:#f59e0b;color:#1b2b3a}
#vis87pop{position:fixed;z-index:95;width:320px;background:#fff;border:1px solid #c5d4e3;border-radius:9px;box-shadow:0 10px 28px #0003;padding:8px;font:13px "Segoe UI",Arial,sans-serif}
#vis87pop[hidden]{display:none}#vis87pop .t87v{font-weight:700;color:#174a78;padding:2px 4px 6px}#vis87pop .t87v span{font-weight:400;color:#6b7c8d;font-size:11px;margin-left:6px}
#vis87pop .r87v{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:6px 6px;margin:0;border:0;border-radius:6px;background:transparent;color:#1b2b3a;cursor:pointer;font-size:13px}
#vis87pop .r87v:hover{background:#eef4fb}#vis87pop .r87v .o87v svg{width:20px;height:20px;display:block}#vis87pop .r87v.on .o87v{color:#1f6fd1}#vis87pop .r87v.off{color:#8a99a8}#vis87pop .r87v.off .o87v{color:#b0bcc8}
#vis87pop .f87v{display:flex;align-items:center;gap:8px;border-top:1px solid #e3eaf1;margin-top:6px;padding-top:7px}#vis87pop .f87v button{padding:4px 10px;margin:0;border-radius:6px;border:1px solid #8db8e4;background:#eef4fb;color:#174a78;cursor:pointer;font-size:12px}#vis87pop .f87v span{font-size:11px;color:#6b7c8d}`;document.head.append(css);
})();
