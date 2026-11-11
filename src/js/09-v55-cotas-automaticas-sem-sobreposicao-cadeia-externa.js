// V55 — cotas automáticas sem sobreposição: cadeia externa (aberturas · eixos · total) e vão livre dos ambientes.
(function(){
'use strict';
const cfg55=()=>({mode:'completa',unit:'m',...(state.cotas55||{})});
const fmt55=cm=>cfg55().unit==='cm'?String(Math.round(cm)):(Math.round(cm)/100).toFixed(2).replace('.',',');
let course55=0;
const gs=generalSVG;generalSVG=function(g,...a){const prev=course55;course55=Number(g?.pieces?.[0]?.course)||0;try{return gs(g,...a);}finally{course55=prev;}};

function pageWalls(page){return state.walls.map((w,i)=>{if(!w.line||Number(w.page||1)!==Number(page))return null;const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)return null;const k=Number(w.planScale)||len/Number(w.length),h=Math.abs(b.x-a.x)>=Math.abs(b.y-a.y);if(Math.min(Math.abs(b.x-a.x),Math.abs(b.y-a.y))>Math.max(1,len*.01))return null;
 return {w,i,k,h,a,b,u:{x:(b.x-a.x)/len,y:(b.y-a.y)/len},axis:h?(a.y+b.y)/2:(a.x+b.x)/2,from:h?Math.min(a.x,b.x):Math.min(a.y,b.y),to:h?Math.max(a.x,b.x):Math.max(a.y,b.y),t:Number(w.width)*k/2};}).filter(Boolean);}

function build55(page,layout,part){
 const c=cfg55();if(c.mode==='nenhuma'&&part!=='open')return '';const W=pageWalls(page);if(!W.length)return '';
 const k=W.reduce((s,d)=>s+d.k,0)/W.length,den=Math.max(1,num($('scale').value)||50),mm=v=>v*den/10*k;
 const font=mm(2),tick=mm(1),laneGap=mm(6),firstOff=mm(9),extGap=mm(1.2),pad=mm(.9),tMax=Math.max(...W.map(d=>d.t)),tol=tMax*1.3;
 const myTexts=[],myLines=[],edits=state.dimensionEdits27||{};let out='';
 const textSize=(label,vertical)=>{const w=label.length*font*.62+font*.5,h=font*1.3;return vertical?{w:h,h:w}:{w,h};};
 const boxAt=(cx,cy,sz)=>({x:cx-sz.w/2,y:cy-sz.h/2,w:sz.w,h:sz.h});
 const freeBox=b=>!layout.walls.some(q=>overlap25(b,q,1))&&!layout.texts.some(q=>overlap25(b,q,2))&&!myTexts.some(q=>overlap25(b,q,2))&&!layout.lines.some(l=>lineHits25(l,b,1))&&!myLines.some(s=>segmentHits25(s,b,.6));
 const shrink=(s,e)=>{const dx=s.x2-s.x1,dy=s.y2-s.y1,L=Math.hypot(dx,dy)||1,f=Math.min(e,L/3)/L;return {x1:s.x1+dx*f,y1:s.y1+dy*f,x2:s.x2-dx*f,y2:s.y2-dy*f};};
 const lineFree=s=>{const q=shrink(s,tick);return !layout.texts.some(b=>segmentHits25(q,b,.6))&&!myTexts.some(b=>segmentHits25(q,b,.6));};
 const seg=(x1,y1,x2,y2,wd=.18,op=1)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="${mm(wd)}" style="stroke-width:${mm(wd)};vector-effect:none" stroke-linecap="round" ${op<1?`opacity="${op}"`:''}/>`;
 // Uma cota: o = 'h' | 'v'; a,b ao longo do eixo; at = coordenada perpendicular; side = lado preferido do texto (-1/+1)
 function dim(o,a,b,at,cm,id,opts={}){
  const ed=edits[id]||{};if(ed.hidden)return true;const label=fmt55(cm),vertical=o==='v',sz=textSize(label,vertical),color=opts.color||'#174a78';
  const P=(s,t)=>vertical?{x:t,y:s}:{x:s,y:t};const L=b-a;
  let pos=null;
  if(ed.position)pos=ed.position;
  else{const side=opts.side||-1,off=pad+(vertical?sz.w:sz.h)/2,cands=[];
   if(L>=(vertical?sz.h:sz.w)+tick*3){for(const f of [.5,.36,.64,.24,.76])for(const sd of [side,-side])cands.push(P(a+L*f,at+sd*off));}
   for(const sd of [side,-side]){cands.push(P(b+tick+(vertical?sz.h:sz.w)/2+pad,at+sd*off*0));cands.push(P(a-tick-(vertical?sz.h:sz.w)/2-pad,at+sd*off*0));cands.push(P(b+tick+(vertical?sz.h:sz.w)/2+pad,at+sd*off));}
   for(const q of cands){const bx=boxAt(q.x,q.y,sz);if(freeBox(bx)){pos=q;break;}}}
  if(!pos)return false;
  const line={x1:P(a,at).x,y1:P(a,at).y,x2:P(b,at).x,y2:P(b,at).y};
  if(!opts.force&&!lineFree(line))return false;
  const bx=boxAt(pos.x,pos.y,sz);myTexts.push(bx);
  // quebra a linha onde cruza outra cota já desenhada (cota menos importante é interrompida)
  let parts=[[a,b]];for(const s of opts.breakAt||[])parts=parts.flatMap(([p,q])=>s>p+tick&&s<q-tick?[[p,s-tick*1.2],[s+tick*1.2,q]]:[[p,q]]);
  let g=`<g data-dimension27="${esc(id)}" data-dxf-layer37="COTAS" onclick="event.stopPropagation();selectDimension27(event,this)" style="cursor:move;color:${color}">`;
  for(const[p,q]of parts){const A=P(p,at),B=P(q,at);g+=seg(A.x,A.y,B.x,B.y,.18);myLines.push({x1:A.x,y1:A.y,x2:B.x,y2:B.y});}
  for(const s of [a,b]){const A=P(s,at);g+=seg(A.x-tick*.7,A.y+tick*.7,A.x+tick*.7,A.y-tick*.7,.35);}
  for(const e of opts.ext||[]){const A=P(e.s,e.from),B=P(e.s,at+(at>e.from?tick:-tick));g+=seg(A.x,A.y,B.x,B.y,.1,.75);}
  g+=`<rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" fill="none" pointer-events="all"/>`+(vertical?`<text transform="translate(${pos.x} ${pos.y}) rotate(-90)" text-anchor="middle" dominant-baseline="middle" font-size="${font}" fill="currentColor">${label}</text>`:`<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle" font-size="${font}" fill="currentColor">${label}</text>`)+'</g>';
  out+=g;dimensionRegistry27.set(id,{id,o:vertical?'vertical':'horizontal',a,b,label,key:'v55',page:Number(page),k,position:{x:pos.x,y:pos.y},boxes:[bx]});
  layout.texts.push(bx);return {line,parts};}

 if(part!=='open'){
 // ---------------- cadeia externa
 if(c.mode==='completa'||c.mode==='externas'){
  const Hs=W.filter(d=>d.h),Vs=W.filter(d=>!d.h);
  const sides=[];
  if(Hs.length&&Vs.length){const minY=Math.min(...Hs.map(d=>d.axis)),maxY=Math.max(...Hs.map(d=>d.axis)),minX=Math.min(...Vs.map(d=>d.axis)),maxX=Math.max(...Vs.map(d=>d.axis));
   sides.push({name:'top',h:true,at:minY,out:-1,per:Hs.filter(d=>Math.abs(d.axis-minY)<tol),cross:Vs,reach:d=>d.from<=minY+tol});
   sides.push({name:'bottom',h:true,at:maxY,out:1,per:Hs.filter(d=>Math.abs(d.axis-maxY)<tol),cross:Vs,reach:d=>d.to>=maxY-tol});
   sides.push({name:'left',h:false,at:minX,out:-1,per:Vs.filter(d=>Math.abs(d.axis-minX)<tol),cross:Hs,reach:d=>d.from<=minX+tol});
   sides.push({name:'right',h:false,at:maxX,out:1,per:Vs.filter(d=>Math.abs(d.axis-maxX)<tol),cross:Hs,reach:d=>d.to>=maxX-tol});}
  for(const s of sides){if(!s.per.length)continue;const lo=Math.min(...s.per.map(d=>d.from)),hi=Math.max(...s.per.map(d=>d.to));if(hi-lo<tick*4)continue;
   const uniq=v=>[...new Set(v.map(x=>Math.round(x*100)/100))].sort((p,q)=>p-q).filter((x,i,arr)=>!i||x-arr[i-1]>tick*.5);
   const axes=uniq([lo,hi,...s.cross.filter(d=>d.axis>lo+tol&&d.axis<hi-tol&&s.reach(d)).map(d=>d.axis)]);
   const opens=[];for(const d of s.per)for(const o of d.w.openings||[]){const st=Number(o.start),en=st+Number(o.width);for(const v of [st,en]){const p={x:d.a.x+d.u.x*v*d.k,y:d.a.y+d.u.y*v*d.k};opens.push(s.h?p.x:p.y);}}
   const lanes=[];if(opens.length)lanes.push({kind:'abertura',br:uniq([lo,hi,...opens]),color:'#c46a0a'});if(axes.length>2)lanes.push({kind:'eixo',br:axes,color:'#2f6fa8'});lanes.push({kind:'total',br:[lo,hi],color:'#102e4b'});
   const face=s.at+s.out*tMax;
   lanes.forEach((ln,li)=>{const at=face+s.out*(firstOff+li*laneGap);for(let j=1;j<ln.br.length;j++){const a=ln.br[j-1],b=ln.br[j],cm=(b-a)/k;if(cm<1)continue;const id=`v55|${page}|${s.name}|${ln.kind}|${a.toFixed(1)}|${b.toFixed(1)}`;
     dim(s.h?'h':'v',a,b,at,cm,id,{side:s.out,color:ln.color,force:true,ext:li===0||ln.kind!=='abertura'?[{s:a,from:face+s.out*extGap},{s:b,from:face+s.out*extGap}]:[]});}
    // inclui a faixa na área do desenho
    const ext=s.h?{x:lo,y:Math.min(at,face)-font,w:hi-lo,h:Math.abs(at-face)+font*2}:{x:Math.min(at,face)-font,y:lo,w:Math.abs(at-face)+font*2,h:hi-lo};layout.texts.push({...ext,w:.01,h:.01},{x:ext.x+ext.w,y:ext.y+ext.h,w:.01,h:.01});});
  }
 }
 // ---------------- vão livre dos ambientes (em "L", sem cruzar no meio do ambiente)
 if(c.mode==='completa'||c.mode==='internas'){
  const rooms=ensureSpatial24().rooms.filter(r=>r.page===Number(page)),t=W.reduce((s,d)=>s+d.t,0)/W.length;
  for(const room of rooms){const xs=room.polygon.map(p=>p.x),ys=room.polygon.map(p=>p.y),X1=Math.min(...xs),X2=Math.max(...xs),Y1=Math.min(...ys),Y2=Math.max(...ys),e=t*.6;
   const rect=room.polygon.every(p=>Math.abs(p.x-X1)<e||Math.abs(p.x-X2)<e||Math.abs(p.y-Y1)<e||Math.abs(p.y-Y2)<e);
   const x1=X1+t,x2=X2-t,y1=Y1+t,y2=Y2-t,wcm=(x2-x1)/k,dcm=(y2-y1)/k,idh=`v55|${page}|amb|${room.key}|h`,idv=`v55|${page}|amb|${room.key}|v`;
   let done=false;
   if(rect&&wcm>40&&dcm>40){
    search:for(const f of [.2,.8,.34,.66,.5])for(const g of [.2,.8,.34,.66,.5]){const yh=y1+(y2-y1)*f,xv=x1+(x2-x1)*g;
     const snapT=myTexts.length,snapL=myLines.length,snapO=out,snapLT=layout.texts.length;
     const rh=dim('h',x1,x2,yh,wcm,idh,{side:f<.5?1:-1,color:'#1f7a59'});
     if(rh!==false){const rv=dim('v',y1,y2,xv,dcm,idv,{side:g<.5?1:-1,color:'#1f7a59',breakAt:[yh]});if(rv!==false){done=true;break search;}}
     myTexts.length=snapT;myLines.length=snapL;out=snapO;layout.texts.length=snapLT;}
   }
   if(!done){// rótulo compacto num ponto livre do ambiente
    const label=fmt55(wcm)+' × '+fmt55(dcm),sz=textSize(label,false),id=`v55|${page}|amb|${room.key}|c`;if(edits[id]?.hidden)continue;let pos=edits[id]?.position||null;
    if(!pos)search2:for(const fy of [.5,.3,.7,.2,.8])for(const fx of [.5,.3,.7]){const q={x:x1+(x2-x1)*fx,y:y1+(y2-y1)*fy},bx=boxAt(q.x,q.y,sz);if(freeBox(bx)&&insideRect25(bx,room)){pos=q;break search2;}}
    if(!pos){layout.unplaced.push({room:room.id,label,orientation:'horizontal',key:room.key});continue;}
    const bx=boxAt(pos.x,pos.y,sz);myTexts.push(bx);layout.texts.push(bx);dimensionRegistry27.set(id,{id,o:'horizontal',a:0,b:0,label,key:'v55',page:Number(page),k,position:pos,boxes:[bx]});
    out+=`<g data-dimension27="${esc(id)}" data-dxf-layer37="COTAS" onclick="event.stopPropagation();selectDimension27(event,this)" style="cursor:move;color:#1f7a59"><rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" fill="none" pointer-events="all"/><text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle" font-size="${font}" fill="currentColor">${label}</text></g>`;}
  }
 }
 }
 // ---------------- V59: vãos tracejados com descrição (primeira e segunda fiada)
 const dash=`${mm(1.2)} ${mm(.8)}`,cx58=W.reduce((t,d)=>t+(d.a.x+d.b.x)/2,0)/W.length,cy58=W.reduce((t,d)=>t+(d.a.y+d.b.y)/2,0)/W.length,ax58=W.filter(d=>d.h).map(d=>d.axis),ay58=W.filter(d=>!d.h).map(d=>d.axis),outer58=d=>{const L=d.h?ax58:ay58;return L.length>1&&(Math.abs(d.axis-Math.min(...L))<tol||Math.abs(d.axis-Math.max(...L))<tol);};
 for(const d of W)(d.w.openings||[]).forEach((o,oi)=>{const id=`v55|${page}|ab|${d.w.uid||d.i}|${oi}`;
  const st=Number(o.start),wd=Number(o.width),bt=Number(o.bottom)||0,ht=Number(o.height);if(!(wd>0))return;
  const isWin=o.type==='Janela'||(o.type!=='Porta'&&bt>0),col=isWin?'#1769c2':'#9a4f12';
  const P=(s,t)=>({x:d.a.x+d.u.x*s*d.k-d.u.y*t,y:d.a.y+d.u.y*s*d.k+d.u.x*t}),q=[P(st,-d.t),P(st+wd,-d.t),P(st+wd,d.t),P(st,d.t)];
  out+=`<path data-dxf-layer37="COTAS" d="M${q.map(p=>p.x+' '+p.y).join(' L')} Z" fill="none" stroke="${col}" stroke-width="${mm(.2)}" style="stroke-width:${mm(.2)};vector-effect:none" stroke-dasharray="${dash}"/>`;
  out+=`<line data-dxf-layer37="COTAS" x1="${P(st,0).x}" y1="${P(st,0).y}" x2="${P(st+wd,0).x}" y2="${P(st+wd,0).y}" stroke="${col}" stroke-width="${mm(.13)}" style="stroke-width:${mm(.13)};vector-effect:none" stroke-dasharray="${dash}" opacity=".8"/>`;
  if(edits[id]?.hidden)return;
  const n=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1});
  const rh=o.real73?o.real73.height:ht,rb=o.real73?o.real73.bottom:bt;const full=(isWin?'Janela ':'Porta ')+n(wd)+' × '+n(rh)+(isWin?' · Peitoril '+n(rb):''),short=(isWin?'J ':'P ')+n(wd)+'×'+n(rh)+(isWin?' / '+n(rb):'');
  const mid=st+wd/2,c0=P(mid,0);let pos=edits[id]?.position||null,label=full;
  const vert=!d.h,inSd=Math.sign(d.h?cy58-c0.y:cx58-c0.x)||1,sides=outer58(d)?[inSd]:[inSd,-inSd];if(!pos)search:for(const lab of [full,short]){const sz=textSize(lab,vert),along=d.h?sz.w:sz.h;for(const f of [1,1.5,2.1,2.8])for(const sh of [0,.3,-.3,.6,-.6])for(const sd of sides){const off=d.t+pad+(d.h?sz.h:sz.w)/2*f,dl=sh*Math.max(along,wd*d.k),qq=d.h?{x:c0.x+dl,y:c0.y+sd*off}:{x:c0.x+sd*off,y:c0.y+dl},bx=boxAt(qq.x,qq.y,sz);if(freeBox(bx)){pos=qq;label=lab;break search;}}}
  if(!pos){label=short;const sz=textSize(label,vert);pos=d.h?{x:c0.x,y:c0.y+inSd*(d.t+pad+sz.h/2)}:{x:c0.x+inSd*(d.t+pad+sz.w/2),y:c0.y};}
  if(edits[id]?.position&&!edits[id]?.label58)label=full;
  const sz=textSize(label,vert),bx=boxAt(pos.x,pos.y,sz);myTexts.push(bx);layout.texts.push(bx);dimensionRegistry27.set(id,{id,o:vert?'vertical':'horizontal',a:0,b:0,label,key:'v55',page:Number(page),k,position:pos,boxes:[bx]});
  out+=`<g data-dimension27="${esc(id)}" data-dxf-layer37="COTAS" onclick="event.stopPropagation();selectDimension27(event,this)" style="cursor:move;color:${col}"><rect x="${bx.x}" y="${bx.y}" width="${bx.w}" height="${bx.h}" fill="none" pointer-events="all"/><text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="middle" font-size="${font*.9}" fill="currentColor"${vert?` transform="rotate(-90 ${pos.x} ${pos.y})"`:''}>${esc(label)}</text></g>`;});
 return out;}

// substitui as cotas automáticas antigas; mantém as cotas manuais
const base55=buildAnnotationLayout25;
buildAnnotationLayout25=function(page,labels){const box=$('showDimensions24'),on=box?box.checked:true;if(box)box.checked=false;let r;try{r=base55(page,labels);}finally{if(box)box.checked=on;}
 {let extra='';try{extra+=build55(page,r.layout,on&&course55===0?'all':'open');}catch(e){console.error('cotas V55',e);}
  if(on)
  for(const d of state.manualDimensions27||[])if(Number(d.page)===Number(page))extra+=renderDimensionText27({...d,label:fmt55(Math.abs(d.b-d.a)/d.k)},d.position,r.layout,null);
  r.dimensions=/<\/g>$/.test(r.dimensions||'')?r.dimensions.replace(/<\/g>$/,'')+extra+'</g>':(r.dimensions||'')+'<g>'+extra+'</g>';}
 return r;};

// controles
function controls55(){const cb=$('showDimensions24');if(!cb||$('cotasMode55'))return;const lab=cb.closest('label');const wrap=document.createElement('span');wrap.className='cotas55';
 wrap.innerHTML='<label>Cotas na planta<select id="cotasMode55"><option value="completa">Completa</option><option value="externas">Só externas</option><option value="internas">Só internas</option><option value="nenhuma">Nenhuma</option></select></label><label>Unidade<select id="cotasUnit55"><option value="m">metros (3,06)</option><option value="cm">centímetros (306)</option></select></label>';
 (lab||cb).after(wrap);if(lab){for(const n of lab.childNodes)if(n.nodeType===3&&n.textContent.trim())n.textContent=' Mostrar cotas (automáticas e manuais) · ';}
 const sync=()=>{const c=cfg55();$('cotasMode55').value=c.mode;$('cotasUnit55').value=c.unit;};sync();window.syncCotas55=sync;
 $('cotasMode55').onchange=e=>{state.cotas55={...cfg55(),mode:e.target.value};refreshDimensions27();};$('cotasUnit55').onchange=e=>{state.cotas55={...cfg55(),unit:e.target.value};refreshDimensions27();};}
controls55();
const rr55=renderResults;renderResults=function(...a){const r=rr55(...a);controls55();window.syncCotas55?.();return r;};
const css=document.createElement('style');css.textContent='.cotas55{display:inline-flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-left:12px}.cotas55 label{display:flex;flex-direction:column;font-size:13px}.cotas55 select{width:auto}';document.head.append(css);
})();
