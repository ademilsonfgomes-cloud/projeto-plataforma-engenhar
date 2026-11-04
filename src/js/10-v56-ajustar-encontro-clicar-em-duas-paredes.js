// V56 — "Ajustar encontro" (clicar em duas paredes) e "Mover para o eixo" (parede marcada pela face).
(function(){
'use strict';
let tool56=null,undo56=null,long56=false;
const kOf=w=>{const[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y);return Number(scaleForWall23?.(w))||Number(w.planScale)||(len/Number(w.length))||pxCm||1;};
const isH=w=>{const[a,b]=w.line;return Math.abs(b.x-a.x)>=Math.abs(b.y-a.y);};
const name=w=>'Parede '+(state.walls.indexOf(w)+1);
function snapshot(){const s=state.walls.map(w=>({w,line:w.line?w.line.map(p=>({...p})):null,length:w.length,openings:JSON.parse(JSON.stringify(w.openings||[])),seg:w.locationSegments24?JSON.parse(JSON.stringify(w.locationSegments24)):undefined}));s.arr=state.walls.slice();return s;}
function refresh(msg){renderWalls();drawPlan();invalidate();showTool(msg);}
// endireita parede quase horizontal/vertical (até 6°)
function straighten(w){const[a,b]=w.line,dx=b.x-a.x,dy=b.y-a.y,ang=Math.atan2(Math.min(Math.abs(dx),Math.abs(dy)),Math.max(Math.abs(dx),Math.abs(dy)))*180/Math.PI;if(ang<1e-6)return false;if(ang>6)return null;
 if(Math.abs(dx)>=Math.abs(dy)){const y=(a.y+b.y)/2;w.line=[{x:a.x,y},{x:b.x,y}];}else{const x=(a.x+b.x)/2;w.line=[{x,y:a.y},{x,y:b.y}];}return true;}
// move uma ponta mantendo portas e janelas no mesmo lugar físico
function setEnd(w,idx,P,k=kOf(w)){const[a,b]=w.line,L0=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/L0,uy=(b.y-a.y)/L0;
 let shift=0;if(idx===0){shift=((a.x-P.x)*ux+(a.y-P.y)*uy)/k;for(const o of w.openings||[])o.start=Math.round((Number(o.start)+shift)*10)/10;}
 w.line[idx]={x:P.x,y:P.y};const[na,nb]=w.line;w.planScale??=k;w.length=Math.round(Math.hypot(nb.x-na.x,nb.y-na.y)/k);
 const sg=w.locationSegments24;if(Array.isArray(sg)&&sg.length){let L=w.length,v=sg.map(x=>({...x,start:Math.max(0,Number(x.start)+shift),end:Math.min(L,Number(x.end)+shift)})).filter(x=>x.end>x.start+.5);if(!v.length)v=[{...sg[0],start:0,end:L}];v[0].start=0;v[v.length-1].end=L;w.locationSegments24=v;}}
const along=(w,p)=>isH(w)?p.x:p.y,axis=w=>isH(w)?w.line[0].y:w.line[0].x;

// ---------- Ajustar encontro (L, T ou X) entre duas paredes
function join(A,B){const snap=snapshot();long56=false;for(const w of [A,B]){if(straighten(w)===null){restoreSnap(snap);return 'A '+name(w)+' está inclinada demais para ajuste automático (mais de 6°). Marque-a de novo.';}}
 if(isH(A)===isH(B)){restoreSnap(snap);return name(A)+' e '+name(B)+' são paralelas: escolha uma horizontal e uma vertical.';}
 const H=isH(A)?A:B,V=isH(A)?B:A,P={x:axis(V),y:axis(H)},kH=kOf(H),kV=kOf(V),changed=[];
 for(const[w,k]of [[H,kH],[V,kV]]){const[a,b]=w.line,lo=Math.min(along(w,a),along(w,b)),hi=Math.max(along(w,a),along(w,b)),p=along(w,P),tol=Number(w.width)*k*1.6;
  if(p>lo+tol&&p<hi-tol)continue; // parede que passa (T/X): fica como está
  const idx=Math.abs(along(w,a)-p)<=Math.abs(along(w,b)-p)?0:1,far=Math.abs(along(w,w.line[idx])-p)/k;
  if(far>600){restoreSnap(snap);return 'As paredes estão a '+fmt(Math.round(far))+' cm do encontro (mais de 6 m). Confira se escolheu as paredes certas.';}if(far>200&&!confirm(name(w)+' vai ser estendida '+fmt(Math.round(far))+' cm até o encontro. Continuar?')){restoreSnap(snap);return 'União cancelada.';}if(far>40)long56=true;
  if(Math.hypot(w.line[idx].x-P.x,w.line[idx].y-P.y)>.01){setEnd(w,idx,P,k);changed.push(name(w)+' '+(far<.5?'alinhada':'ajustada '+fmt(Math.round(far*10)/10)+' cm'));}}
 undo56=snap;const type=changed.length===2?'L':changed.length===1?'T':'X';
 return changed.length?'Paredes unidas em '+type+': '+changed.join('; ')+'.'+(long56?' Se houver porta ou janela no trecho acrescentado, clique dentro do vão para cadastrar.':''):'As paredes já se encontram no eixo ('+type+').';}

// ---------- Mover para o eixo: anda meia espessura para o lado das paredes que chegam
function toAxis(W,forced){const snap=snapshot();if(straighten(W)===null){restoreSnap(snap);return 'A '+name(W)+' está inclinada demais (mais de 6°). Marque-a de novo.';}
 const k=kOf(W),h=isH(W),half=Number(W.width)*k/2,reach=Number(W.width)*k*2.4,ax=axis(W),[a,b]=W.line,lo=Math.min(along(W,a),along(W,b)),hi=Math.max(along(W,a),along(W,b));
 const page=Number(W.page||1),others=state.walls.filter(w=>w!==W&&w.line&&Number(w.page||1)===page&&isH(w)!==h);
 const ends=[];for(const w of others)w.line.forEach((p,idx)=>{const perp=h?p.y-ax:p.x-ax,al=along(W,p);if(Math.abs(perp)<=reach&&al>=lo-reach&&al<=hi+reach)ends.push({w,idx,perp});});
 let dir=forced||0;if(!dir){const s=ends.reduce((n,e)=>n+Math.sign(e.perp),0);dir=Math.sign(s);}
 if(!dir){restoreSnap(snap);askDirection(W);return null;}
 const newAx=ax+dir*half;W.line=W.line.map(p=>h?{x:p.x,y:newAx}:{x:newAx,y:p.y});
 const changed=[];
 // pontas das paredes que chegam vão para o novo eixo
 for(const e of ends){const p=e.w.line[e.idx],P=h?{x:axis(e.w),y:newAx}:{x:newAx,y:axis(e.w)};if(Math.hypot(p.x-P.x,p.y-P.y)>.01){setEnd(e.w,e.idx,P);if(!changed.includes(name(e.w)))changed.push(name(e.w));}}
 // pontas da própria parede vão até o eixo da parede perpendicular mais próxima
 for(const idx of [0,1]){const p=W.line[idx];let best=null;for(const w of others){const wa=axis(w),[c,d]=w.line,wlo=Math.min(along(w,c),along(w,d)),whi=Math.max(along(w,c),along(w,d));if(newAx<wlo-reach||newAx>whi+reach)continue;const dist=Math.abs(along(W,p)-wa);if(dist<=reach&&(!best||dist<best.dist))best={wa,dist};}
  if(best&&best.dist>.01){setEnd(W,idx,h?{x:best.wa,y:newAx}:{x:newAx,y:best.wa},k);}}
 undo56=snap;const dirTxt=h?(dir>0?'para baixo':'para cima'):(dir>0?'para a direita':'para a esquerda');
 return name(W)+' movida '+fmt(Number(W.width)/2)+' cm '+dirTxt+' (para o eixo)'+(changed.length?'; encontros ajustados com '+changed.join(', '):'')+'.';}
// ---------- Esticar parede: ponta mais próxima do 1º clique vai até o 2º clique
function extend(W,endIdx,target,raw){const snap=snapshot();if(straighten(W)===null){restoreSnap(snap);return 'A '+name(W)+' está inclinada demais (mais de 6°). Marque-a de novo.';}
 const k=kOf(W),h=isH(W),ax=axis(W);let P,msg;
 if(target&&target!==W&&isH(target)!==h){straighten(target);P=h?{x:axis(target),y:ax}:{x:ax,y:axis(target)};msg=name(W)+' estendida até o eixo da '+name(target);}
 else if(target&&target!==W&&isH(target)===h&&Math.abs(axis(target)-ax)<=Number(W.width)*k*1.2){
  // mesma linha (pedaço do outro lado da porta): une as duas
  const[c,d]=target.line,far=Math.abs(along(W,c)-along(W,W.line[endIdx]))>Math.abs(along(W,d)-along(W,W.line[endIdx]))?c:d;
  if(!confirm('Unir a '+name(W)+' com a '+name(target)+' numa parede só? Depois cadastre a porta ou janela entre elas.')){restoreSnap(snap);return 'União cancelada.';}
  const tk=kOf(target),[t0,t1]=target.line,tL=Math.hypot(t1.x-t0.x,t1.y-t0.y),tDir=Math.sign(along(target,t1)-along(target,t0))||1,tOps=(target.openings||[]).map(o=>{const s1=along(target,t0)+tDir*Number(o.start)*tk,s2=s1+tDir*Number(o.width)*tk;return {o,s1,s2};});
  P=h?{x:along(target,far),y:ax}:{x:ax,y:along(target,far)};setEnd(W,endIdx,P,k);
  const w0=along(W,W.line[0]),wDir=Math.sign(along(W,W.line[1])-w0)||1;
  for(const {o,s1,s2}of tOps){const q=Math.min((s1-w0)*wDir,(s2-w0)*wDir)/k;W.openings??=[];W.openings.push({...o,start:Math.round(q*10)/10});}
  state.walls.splice(state.walls.indexOf(target),1);undo56=snap;return name(W)+' unida com a parede da mesma linha. Para cadastrar a porta ou janela entre os dois trechos, clique dentro do vão.';}
 else{P=h?{x:raw.x,y:ax}:{x:ax,y:raw.y};msg=name(W)+' ajustada até o ponto clicado';}
 const before=W.length;setEnd(W,endIdx,P,k);undo56=snap;return msg+' ('+fmt(before)+' → '+fmt(W.length)+' cm).';}
// ---------- Apagar trecho: divide a parede e remove só o pedaço escolhido (cm desde o início da parede)
function cutWall(W,s1,s2){if(!W?.line)return 'Parede não encontrada.';const L=Number(W.length);s1=Math.max(0,Math.min(L,s1));s2=Math.max(0,Math.min(L,s2));if(s2<s1)[s1,s2]=[s2,s1];s1=Math.round(s1*2)/2;s2=Math.round(s2*2)/2;if(s2-s1<1)return 'Trecho muito pequeno.';
 const snap=snapshot(),i=state.walls.indexOf(W),[a,b]=W.line,P=s=>({x:a.x+(b.x-a.x)*s/L,y:a.y+(b.y-a.y)*s/L}),k=kOf(W);
 const ops=W.openings||[],inA=o=>Number(o.start)+Number(o.width)<=s1+.01,inB=o=>Number(o.start)>=s2-.01,lost=ops.filter(o=>!inA(o)&&!inB(o)).length;
 const seg=(lo,hi,shift)=>{const sg=W.locationSegments24;if(!Array.isArray(sg)||!sg.length)return sg;let v=sg.map(x=>({...x,start:Math.max(lo,Number(x.start))-shift,end:Math.min(hi,Number(x.end))-shift})).filter(x=>x.end>x.start+.5);if(!v.length)v=[{...sg[0],start:0,end:hi-lo}];v[0].start=0;v[v.length-1].end=hi-lo;return v;};
 const parts=[];
 if(s1>=1){const A=W;const segA=seg(0,s1,0);A.line=[{...a},P(s1)];A.length=s1;A.openings=ops.filter(inA);if(segA)A.locationSegments24=segA;A.planScale??=k;A.confirmed=false;delete A.manualRows;parts.push(A);}
 if(L-s2>=1){const B=JSON.parse(JSON.stringify({...W,line:null,openings:[],locationSegments24:null}));B.uid='wall-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);B.line=[P(s2),{...b}];B.length=Math.round((L-s2)*2)/2;B.openings=ops.filter(inB).map(o=>({...o,start:Math.round((Number(o.start)-s2)*10)/10}));const segB=seg(s2,L,s2);if(segB)B.locationSegments24=segB;else delete B.locationSegments24;B.planScale??=k;B.confirmed=false;delete B.manualRows;delete B.labelPosition28;parts.push(B);}
 state.walls.splice(i,1,...parts);try{window.splitProps54?.(W,parts,s1,s2);}catch(e){console.error(e);}
 undo56=snap;const n=state.walls.indexOf(parts[0])+1;
 return 'Pedaço de '+fmt(s1)+' a '+fmt(s2)+' cm apagado da '+(parts.length?'Parede '+n:'parede')+(parts.length===2?': ficaram as Paredes '+n+' ('+fmt(parts[0].length)+' cm) e '+(n+1)+' ('+fmt(parts[1].length)+' cm)':parts.length?' ('+fmt(parts[0].length)+' cm)':' (parede removida)')+'.'+(lost?' '+lost+' abertura(s) dentro do trecho foram retiradas.':'')+' Confira e marque as paredes como conferidas.';}
window.cutWall56=function(W,s1,s2,ask=true){const L=Number(W.length),a=Math.max(0,Math.min(s1,s2)),b=Math.min(L,Math.max(s1,s2));if(ask&&!confirm('Apagar o pedaço de parede de '+fmt(Math.round(a*2)/2)+' a '+fmt(Math.round(b*2)/2)+' cm da '+name(W)+'? A parede é dividida em duas e só esse pedaço sai.'))return null;const msg=cutWall(W,a,b);refresh(msg);return msg;};
function restoreSnap(s){if(s.arr)state.walls.splice(0,state.walls.length,...s.arr);for(const r of s){r.w.line=r.line;r.w.length=r.length;r.w.openings=r.openings;if(r.seg)r.w.locationSegments24=r.seg;}}
function askDirection(W){const h=isH(W);showTool('Não há paredes chegando na '+name(W)+' para indicar o lado. Escolha para onde ela anda meia espessura:',[[h?'▲ Para cima':'◀ Para a esquerda',()=>done(toAxis(W,-1))],[h?'▼ Para baixo':'▶ Para a direita',()=>done(toAxis(W,1))]]);}
function done(msg){if(msg)refresh(msg);}

// ---------- painel, botões e cliques na planta
function showTool(msg,actions=[]){let p=$('walltool56');if(!p){p=document.createElement('div');p.id='walltool56';p.className='walltool56 noPrint';$('planStatus').after(p);}
 p.innerHTML='';const t=document.createElement('span');t.textContent=msg||'';p.append(t);for(const[label,fn]of actions){const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;b.onclick=fn;p.append(b);}
 if(undo56&&!actions.length){const u=document.createElement('button');u.type='button';u.className='secondary';u.textContent='Desfazer ajuste';u.onclick=()=>{restoreSnap(undo56);undo56=null;refresh('Ajuste desfeito.');};p.append(u);}
 p.style.display=msg?'flex':'none';}
function start(kind){if(!image){alert('Carregue a planta primeiro.');return;}try{window.stopAll108?.();}catch{}mode='';points=[];tool56={kind,picks:[],cut:[]};document.body.classList.add('tool56');
 showTool(kind==='cut'?'Apagar pedaço de parede: clique onde o pedaço começa (ou dentro de um vão do desenho para tirar a parede de todo o vão).':kind==='join'?'Unir paredes: clique na primeira parede.':kind==='extend'?'Estender parede: clique perto da ponta que vai crescer.':'Mover para o eixo: clique na parede que foi marcada pela face.',[['Cancelar',cancel]]);drawPlan();}
function cancel(){tool56=null;document.body.classList.remove('tool56');showTool('');drawPlan();}
window.cancelTool56=cancel;
function rawPoint(e){const c=$('plan'),r=c.getBoundingClientRect();return {x:(e.clientX-r.left)*c.width/r.width+(c.planOrigin25?.x||0),y:(e.clientY-r.top)*c.height/r.height+(c.planOrigin25?.y||0)};}
function near56(P){let i=wallNear(P);if(i>=0)return i;let bd=1e9;state.walls.forEach((w,j)=>{if(!w.line||Number(w.page||1)!==num($('page').value))return;const[a,b]=w.line,dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;if(!den)return;const t=Math.max(0,Math.min(1,((P.x-a.x)*dx+(P.y-a.y)*dy)/den)),d=Math.hypot(P.x-a.x-t*dx,P.y-a.y-t*dy),lim=Number(w.width)*kOf(w)/2+8/zoom;if(d<=lim&&d<bd){bd=d;i=j;}});return i;}
$('plan').addEventListener('click',e=>{if(!tool56)return;e.stopImmediatePropagation();e.preventDefault();const i=near56(rawPoint(e));
 if(tool56.kind==='extend'&&tool56.picks.length){const W=tool56.picks[0],idx=tool56.endIdx,raw=rawPoint(e),target=i>=0&&state.walls[i]!==W?state.walls[i]:null;cancel();refresh(extend(W,idx,target,raw));return;}if(i<0){showTool('Nenhuma parede próxima. Clique mais perto da linha da parede.',[['Cancelar',cancel]]);return;}
 const w=state.walls[i];
 if(tool56.kind==='cut'){const p=rawPoint(e),[a,b]=w.line,len=Math.hypot(b.x-a.x,b.y-a.y),L=Number(w.length),s=Math.max(0,Math.min(L,((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/(len*len)*L));
  if(!tool56.picks.length){const g=window.detectGap57?.(w,p);if(g&&s>=g.start-3&&s<=g.start+g.width+3){cancel();window.cutWall56(w,g.start,g.start+g.width);return;}tool56.picks.push(w);tool56.cut=[s];drawPlan();showTool('Apagar pedaço da '+name(w)+': agora clique onde o pedaço termina.',[['Cancelar',cancel]]);return;}
  const W=tool56.picks[0],[c,d]=W.line,l2=Math.hypot(d.x-c.x,d.y-c.y),s2=Math.max(0,Math.min(Number(W.length),((p.x-c.x)*(d.x-c.x)+(p.y-c.y)*(d.y-c.y))/(l2*l2)*Number(W.length))),s1=tool56.cut[0];cancel();window.cutWall56(W,s1,s2);return;}
 if(tool56.kind==='extend'&&!tool56.picks.length){const p=rawPoint(e),[a,b]=w.line;tool56.endIdx=Math.hypot(p.x-a.x,p.y-a.y)<=Math.hypot(p.x-b.x,p.y-b.y)?0:1;tool56.picks.push(w);drawPlan();showTool('Estender '+name(w)+': clique até onde ela vai (outra parede ou um ponto).',[['Cancelar',cancel]]);return;}
 if(tool56.kind==='axis'){const t=tool56;cancel();const msg=toAxis(w);if(msg)refresh(msg);return;}
 if(tool56.picks.includes(w))return;tool56.picks.push(w);drawPlan();
 if(tool56.picks.length===1){showTool('Unir paredes: '+name(w)+' selecionada. Clique na segunda parede.',[['Cancelar',cancel]]);return;}
 const[A,B]=tool56.picks;cancel();refresh(join(A,B));},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&tool56)cancel();});
const dp=drawPlan;drawPlan=function(...a){const r=dp(...a);if(!tool56?.picks?.length||!image)return r;const c=$('plan'),ctx=c.getContext('2d'),o=c.planOrigin25||{x:0,y:0};ctx.save();ctx.setTransform(1,0,0,1,-o.x,-o.y);ctx.strokeStyle='#1769c2';ctx.lineWidth=6;ctx.globalAlpha=.55;for(const w of tool56.picks){const[a,b]=w.line;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();return r;};
// botões na barra da planta
{const anchor=$('numberWalls');if(anchor&&!$('join56')){const b1=document.createElement('button');b1.id='join56';b1.type='button';b1.className='secondary';b1.textContent='Unir paredes';b1.title='Clique em uma parede e depois na outra: no L as duas vão até o canto; no T a que chega vai até o eixo da outra (até 6 m).';b1.onclick=()=>start('join');
 const b2=document.createElement('button');b2.id='axis56';b2.type='button';b2.className='secondary';b2.textContent='Mover para o eixo';b2.title='Clique na parede marcada pela face: ela anda meia espessura e encontra as outras paredes.';b2.onclick=()=>start('axis');const b3=document.createElement('button');b3.id='extend56';b3.type='button';b3.className='secondary';b3.textContent='Estender parede';b3.title='Clique perto da ponta e depois até onde ela vai: outra parede (vai até o eixo), parede da mesma linha (une as duas) ou um ponto.';b3.onclick=()=>start('extend');const b4=document.createElement('button');b4.id='cut56';b4.type='button';b4.className='secondary';b4.textContent='Apagar pedaço de parede';b4.title='Apaga só um pedaço da parede (ex.: vão aberto sem parede): clique no começo e no fim, ou dentro do vão do desenho. A parede é dividida em duas.';b4.onclick=()=>start('cut');anchor.after(b1,b2,b3,b4);}}
const css=document.createElement('style');css.textContent='.walltool56{display:none;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0;padding:8px 12px;border:2px solid #1769c2;border-radius:8px;background:#eef5fd;font-size:14px;color:#102e4b}body.tool56 #plan{cursor:pointer}';document.head.append(css);
window.walltool56={join,toAxis,straighten,cutWall,setEnd,kOf,rawPoint,near56,refresh:m=>{renderWalls();drawPlan();invalidate();$('planStatus').textContent=m||'';}};
})();
