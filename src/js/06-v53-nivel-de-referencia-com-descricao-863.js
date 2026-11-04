// V53 — nível de referência com descrição: "863,35 caixa d'água"
(function(){
'use strict';
function parse53(){const raw=String($('baseLevel23')?.value??'').trim(),m=raw.match(/^([+-]?\d+(?:[.,]\d+)?)\s*(.*)$/);if(!m)return {value:0,label:raw,valid:!raw};return {value:Number(m[1].replace(',','.')),label:m[2].trim(),valid:true};}
level23=function(){const v=parse53().value;return Number.isFinite(v)?v:0;};
window.levelLabel53=()=>parse53().label;
levelMarks23=function(pad,bottom,height,k){const top=bottom-height*k,f=v=>(v>=0?'+':'')+v.toFixed(2).replace('.',',')+' m',label=parse53().label;
 return [[bottom,level23(),label],[top,level23()+height/100,'']].map(([y,v,l])=>`<path d="M${pad-3},${y} l-2,-2 h4 z M${pad-5},${y} h-9" stroke="#174a78" fill="none" stroke-width=".22"/><text x="${pad-21}" y="${y-2.7}" font-size="2" fill="#174a78">${f(v)}</text>`+(l?`<text x="${pad-5}" y="${y+2.6}" font-size="1.8" text-anchor="end" fill="#174a78" data-level-label53="true">${esc(l)}</text>`:'')).join('');};
// abre espaço à esquerda da elevação quando a descrição é longa
const svgWallBefore=svgWall;
svgWall=function(w,m,which){let html=svgWallBefore(w,m,which);const label=parse53().label;if(which!=='elevation'||!label)return html;const need=label.length*1.05-14;if(need<=0)return html;
 const match=html.match(/viewBox="([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+) ([\d.e+-]+)"/);if(!match)return html;const a=match.slice(1).map(Number),width=a[2]+need;
 return html.replace(match[0],`viewBox="${a[0]-need} ${a[1]} ${width} ${a[3]}"`).replace(/width="[\d.e+-]+mm"/,`width="${width}mm"`).replace(/style="width:[\d.e+-]+mm;/,`style="width:${width}mm;`);};
const input=$('baseLevel23');if(input){input.type='text';input.removeAttribute('step');input.placeholder="ex.: 863,35 caixa d'água";input.title='Número do nível (m) e, depois de um espaço, a descrição. Ex.: 863,35 caixa d\'água';
 input.addEventListener('input',()=>{const p=parse53();input.style.borderColor=p.valid?'':'#c52828';});}
// Correção (existia na V52): o painel de cotas saía da página ao limpar os resultados
// e "Salvar projeto" deixava de funcionar depois de "Começar meu projeto".
{const park=document.createElement('div');park.id='dockPark53';park.hidden=true;document.body.append(park);
 const rescue=()=>{try{if(dimensionDock37&&!dimensionDock37.isConnected)park.append(dimensionDock37);}catch(e){}};
 const inv=invalidate;invalidate=function(...a){try{if(dimensionDock37&&$('output')?.contains(dimensionDock37))park.append(dimensionDock37);}catch(e){}return inv(...a);};
 new MutationObserver(rescue).observe(document.body,{childList:true,subtree:true});}
})();
