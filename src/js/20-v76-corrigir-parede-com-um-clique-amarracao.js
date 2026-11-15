// V76 — corrigir parede com um clique (amarração com a menor mudança possível) e paredes aprovadas travadas.
(function(){
'use strict';
const N=v=>Number(v),f1=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1}),clone=o=>JSON.parse(JSON.stringify(o));
const bondMin=()=>N(window.BondRule53?.min?.())||N($('bondMin53')?.value)||10;
const slotEnd=p=>N(p.x)+N(p.length)+N(p.joint||0);

// ---------------------------------------------------------------- 1. Juntas e conflitos
function joints(row){const ps=row.pieces.filter(p=>!p.fill&&!p.channel).slice().sort((a,b)=>a.x-b.x),out=[];
 for(let i=1;i<ps.length;i++){const p=ps[i-1],q=ps[i],end=N(p.x)+N(p.joint)/2+N(p.length),start=N(q.x)+N(q.joint)/2;if(start-end<=6.01)out.push((start+end)/2);}return out;}
function conflicts(rows){const min=bondMin(),out=[];for(let r=1;r<rows.length;r++){const a=joints(rows[r-1]),b=joints(rows[r]),hit=[];for(const p of a)for(const q of b)if(Math.abs(p-q)<min-.001)hit.push([p,q]);if(hit.length)out.push({r,hit});}return out;}
// peças que não podem mudar: encontros, canaletas, enchimentos, zonas reservadas
let zonesFree=true;
const isFixed=p=>{if(p.fill||p.channel||p.reserved76)return true;if(Array.isArray(p.zone53)&&zonesFree)return false;return !!(p.junction||p.meeting||p.zone53||p.span);};
function runsOf(row){const ps=row.pieces.map((p,k)=>({p,k})).sort((a,b)=>a.p.x-b.p.x),runs=[];let cur=null;const J=N($('jh')?.value)||1;
 ps.forEach(({p,k},n)=>{if(isFixed(p)){cur=null;return;}if(cur&&Math.abs(N(p.x)-cur.b)<.6){cur.ks.push(k);cur.b=slotEnd(p);cur.last=n;}else{cur={a:N(p.x),b:slotEnd(p),ks:[k],j:J,first:n,last:n,zones:[]};runs.push(cur);}if(Array.isArray(p.zone53))cur.zones.push({z:p.zone53.map(N),p});});
 for(const run of runs){const prev=ps[run.first-1]?.p,next=ps[run.last+1]?.p;if(prev){const e=slotEnd(prev);if(run.a-e>=-.01&&run.a-e<1.5)run.a=e;}if(next){const g=N(next.x)-run.b;if(g>=-.01&&g<1.5)run.b=N(next.x);}}
 return runs;}
const sig=row=>JSON.stringify(row.pieces.map(p=>[Math.round(p.x*2),Math.round(p.length*2),p.code]));

// ---------------------------------------------------------------- 2. Blocos disponíveis para a parede
function palette(w,m,row){const h=N(row.pieces.find(p=>!p.channel)?.height)||19,W=N(w.width);
 const all=state.blocks.filter(b=>b.active!==false&&b.type!=='Canaleta'&&N(b.width)===W&&N(b.height)===h&&N(b.length)>0&&!(N(state.mod84?.minPiece??0)>0&&N(b.length)<N(state.mod84.minPiece)));
 const role=b=>b.role||(window.ModEngine?.roleOf?.(b,state.blocks))||'';
 const whole=all.map(b=>({code:b.code,len:N(b.length),main:role(b)==='Principal',enc:role(b)==='Encontro'}));
 const seen=new Set();return whole.sort((a,b)=>a.enc-b.enc).filter(b=>{if(seen.has(b.len))return false;seen.add(b.len);return true;}).sort((a,b)=>b.len-a.len);}

// ---------------------------------------------------------------- 3. Refaz um trecho livre da fiada (programação dinâmica)
// custo: peça diferente da original = 1; corte = 40 + 3 × cm cortados; filete (< 10 cm) = 0,6
function relay(run,orig,K,pal,opt){for(const margin of [.3,0]){const r=relay0(run,orig,K,pal,opt,margin);if(r&&r.okAfter)return r;if(r&&margin===0)return r;}return null;}
function relay0(run,orig,K,pal,opt,margin){const U=10,T=Math.round((run.b-run.a)*U),j=run.j,min=bondMin(),TOL=6;if(T<=0||T>40000)return null;
 const ok=x=>K.every(k=>Math.abs(x-k)>=min-.001+margin);
 const pieces=pal.map(b=>({code:b.code,len:b.len,cut:false,amt:0,main:b.main,enc:b.enc}));const zones=run.zones||[];
 if(opt.cut){const maxAmt=opt.maxCut;for(let c=Math.max(9,N(state.mod84?.minPiece??0));c<=Math.max(...pal.map(b=>b.len));c+=.5){if(pal.some(b=>Math.abs(b.len-c)<.01))continue;const src=pal.filter(b=>!b.enc&&b.len>c&&b.len-c<=maxAmt).sort((a,b)=>a.len-b.len)[0];if(!src)continue;pieces.push({code:src.code+'_C'+c.toFixed(2),len:c,cut:true,amt:src.len-c,src:src.code,srcLen:src.len});}}
 const origAt=new Map();for(const p of orig){const u0=Math.round((N(p.x)-run.a)*U);for(let d=-12;d<=12;d++)if(!origAt.has(u0+d))origAt.set(u0+d,p);}
 const INF=1e9,CC=Math.max(1,opt.cuts||1),best=Array.from({length:CC+1},()=>new Float64Array(T+1).fill(INF)),choice=Array.from({length:CC+1},()=>new Int32Array(T+1).fill(-1));
 for(let u=T;u>=Math.max(0,T-TOL);u--)for(let c=0;c<=CC;c++)best[c][u]=0;
 for(let u=T-TOL-1;u>=0;u--)for(let c=0;c<=CC;c++){let bv=INF,bi=-1;for(let i=0;i<pieces.length;i++){const p=pieces[i];if(p.cut&&c>=CC)continue;const bs=run.a+u/U+j/2,be=bs+p.len;let covers=false,bad=false;for(const{z,p:zp}of zones){if(be>z[0]+.01&&bs<z[1]-.01){if(bs<=z[0]+.01&&be>=z[1]-.01&&!p.cut&&(p.enc||Math.abs(p.len-N(zp.length))<.01))covers=true;else bad=true;}}if(bad||(p.enc&&!covers))continue;const u2=u+Math.round((p.len+j)*U);if(u2>T)continue;if(u2<T-TOL&&!ok(run.a+u2/U))continue;if(u2>=T-TOL&&u2<T&&false)continue;const nc=c+(p.cut?1:0),rest=best[nc][u2];if(rest>=INF)continue;
   const o=origAt.get(u),same=o&&Math.abs(N(o.length)-p.len)<.01&&!o.cut===!p.cut;let cost=rest+(same?0:1)+(covers&&!same?1.5:0)+(p.cut?40+3*p.amt:0)+(p.len<10?.6:0)+(p.main?0:.001);if(cost<bv){bv=cost;bi=i;}}
  best[c][u]=bv;choice[c][u]=bi;}
 if(best[0][0]>=INF)return null;
 const out=[];let u=0,c=0,changed=0,cuts=0,amt=0;while(u<T-TOL||(u<T&&choice[c][u]>=0&&best[c][u]>0)){const i=choice[c][u];if(i<0)return null;const p=pieces[i],o=origAt.get(u);if(!(o&&Math.abs(N(o.length)-p.len)<.01&&!o.cut===!p.cut))changed++;if(p.cut){cuts++;amt+=p.amt;}const bs=run.a+u/U+j/2,zone=zones.find(({z})=>bs<=z[0]+.01&&bs+p.len>=z[1]-.01);out.push({...p,x:run.a+u/U,zone:zone?.p||null});u+=Math.round((p.len+j)*U);if(p.cut)c++;}
 const used=out.reduce((t,p)=>t+p.len+j,0),extra=(run.b-run.a)-used;if(extra<-.01||extra>TOL/U+.01)return null;let acc=0;const n=out.length,share=n>1?extra/(n-1):extra;out.forEach((p,k)=>{p.x=run.a+acc;p.joint=j+(k<n-1||n===1?share:0);acc+=p.len+p.joint;});
 let okAfter=true;{let x=run.a;for(let k=0;k<out.length-1;k++){x+=out[k].len+out[k].joint;if(!K.every(q=>Math.abs(x-q)>=min-.001))okAfter=false;}}
 return {pieces:out,cost:best[0][0],changed,cuts,amt,okAfter};}

function applyRun(row,run,sol){const tpl=row.pieces[run.ks[0]],orig=run.ks.map(k=>row.pieces[k]),keep=row.pieces.filter((p,k)=>!run.ks.includes(k));
 const made=sol.pieces.map(s=>{const p={...tpl,code:s.code,baseCode:s.cut?s.src:s.code,length:s.len,x:Math.round(s.x*1000)/1000,joint:Math.round(s.joint*1000)/1000,fill:false,changed76:!orig.some(o=>Math.abs(N(o.length)-s.len)<.01&&Math.abs(N(o.x)-s.x)<=1.2&&!o.cut===!s.cut)};delete p.cut;delete p.sourceCode;delete p.sourceLength;delete p.cutAmount;delete p.junction;delete p.meeting;delete p.draftConflict;delete p.zone53;delete p.span;delete p.end53;if(s.zone){for(const k of ['junction','meeting','zone53','span','end53'])if(s.zone[k]!==undefined)p[k]=s.zone[k];}if(s.cut){p.cut=true;p.sourceCode=s.src;p.sourceLength=s.srcLen;p.cutAmount=Math.round(s.amt*10)/10;}return p;});
 row.pieces=[...keep,...made].sort((a,b)=>a.x-b.x);}

// ---------------------------------------------------------------- 4. Corrige a parede inteira
function repairWall(w,m,opt){const rows=clone(m.rows),log=[];let changed=0,cuts=0,amt=0;const touched=new Set();
 for(let it=0;it<40;it++){const cf=conflicts(rows);if(!cf.length)break;const {r,hit}=cf[0];let best=null;
  const order=opt.flip?[r-1,r]:[r,r-1];
  for(const t of order){const row=rows[t];if(!row)continue;let G=rows.map((x,i)=>i).filter(i=>sig(rows[i])===sig(row));if(G.some(g=>G.includes(g+1)))G=[t];
   const K=[...new Set(G.flatMap(g=>[g-1,g+1]).filter(n=>n>=0&&n<rows.length&&!G.includes(n)).flatMap(n=>joints(rows[n])))];
   const myJ=joints(row),bad=myJ.filter(x=>K.some(k=>Math.abs(x-k)<bondMin()-.001));if(!bad.length)continue;
   const runs=runsOf(row),plan=[];let okAll=true,cost=0;
   for(const x of bad){const run=runs.find(q=>x>q.a-.8&&x<q.b+.8);if(!run){okAll=false;break;}if(plan.some(p=>p.run===run))continue;
    const orig=run.ks.map(k=>row.pieces[k]),sol=relay(run,orig,K,palette(w,m,row),opt);if(!sol){okAll=false;break;}plan.push({run,sol});cost+=sol.cost*G.length;}
   if(okAll&&plan.length){const test=clone(row),tr=runsOf(test);for(const{run,sol}of plan){const q=tr.find(z=>Math.abs(z.a-run.a)<.01&&Math.abs(z.b-run.b)<.01);if(q)applyRun(test,q,sol);}const still=joints(test).some(x=>K.some(k=>Math.abs(x-k)<bondMin()-.001));if(still)okAll=false;}
   if(okAll&&plan.length&&(!best||cost<best.cost))best={t,G,plan,cost};}
  if(!best)return null;
  for(const g of best.G){const row=rows[g],runs=runsOf(row);for(const{run,sol}of best.plan){const rr=runs.find(q=>Math.abs(q.a-run.a)<.01&&Math.abs(q.b-run.b)<.01);if(!rr)return null;applyRun(row,rr,sol);changed+=sol.changed;cuts+=sol.cuts;amt+=sol.amt;}touched.add(g);}
  log.push(best);}
 if(conflicts(rows).length)return null;
 const err=window.V7Rules?.audit?.(rows);if(err)return null;
 for(const row of rows){const ps=row.pieces.slice().sort((a,b)=>a.x-b.x);for(let i=1;i<ps.length;i++){if(!ps[i].fill&&!ps[i-1].fill&&slotEnd(ps[i-1])>N(ps[i].x)+.01)return null;}}
 const lcs=(A,B)=>{const d=Array.from({length:A.length+1},()=>new Int16Array(B.length+1));for(let x=1;x<=A.length;x++)for(let y=1;y<=B.length;y++)d[x][y]=A[x-1]===B[y-1]?d[x-1][y-1]+1:Math.max(d[x-1][y],d[x][y-1]);return d[A.length][B.length];};
 let real=0;for(const r of touched){const A=m.rows[r].pieces.slice().sort((a,b)=>a.x-b.x).map(p=>p.code),B=rows[r].pieces.slice().sort((a,b)=>a.x-b.x).map(p=>p.code);real+=Math.max(B.length-lcs(A,B),A.length-lcs(A,B));}
 return {rows,changed:real,cuts,amt:Math.round(amt*10)/10,touched:[...touched].sort((a,b)=>a-b)};}

function meetingsOK(i,rows){try{const J=window.JunctionEngine;if(!J?.auditMeetings)return true;const jh=N($('jh')?.value)||1;const base=J.auditMeetings(state.walls,state.results,state.blocks,jh).filter(c=>!c.ok&&c.walls?.includes(i)).length;
 const tent=state.results.map((m,k)=>k===i?{...m,rows}:m);const now=J.auditMeetings(state.walls,tent,state.blocks,jh).filter(c=>!c.ok&&c.walls?.includes(i)).length;return now<=base&&now===0||now<base;}catch(e){console.error(e);return true;}}
function options(i){const w=state.walls[i],m=state.results?.[i];if(!m?.rows?.length)return [];const out=[],seen=new Set();
 for(const zf of [false,true])for(const opt of [{cut:false},{cut:false,flip:true},{cut:true,maxCut:5},{cut:true,maxCut:5,flip:true},{cut:true,maxCut:15},{cut:true,maxCut:15,flip:true},{cut:true,maxCut:30},{cut:true,maxCut:30,flip:true},{cut:true,maxCut:15,cuts:2},{cut:true,maxCut:30,cuts:2},{cut:true,maxCut:30,cuts:2,flip:true}]){
  let s=null;zonesFree=zf;try{s=repairWall(w,m,opt);}catch(e){console.error(e);}finally{zonesFree=true;}if(!s)continue;if(!meetingsOK(i,s.rows))continue;const key=JSON.stringify(s.rows.map(r=>r.pieces.map(p=>[p.x,p.length])));if(seen.has(key))continue;seen.add(key);out.push(s);}
 out.sort((a,b)=>a.cuts-b.cuts||a.amt-b.amt||a.changed-b.changed||a.touched.length-b.touched.length);return out.slice(0,3);}
window.fix76={options,repairWall,conflicts};

// ---------------------------------------------------------------- 5. Aprovar e gravar a correção
const approvable=m=>!m.errors?.length&&!m.sourceErrors?.length&&!m.closurePending&&!/preservad|parcial|fechamento/i.test(m.statusReason||'');
function applyFix(i,sol,lock){const w=state.walls[i],m=state.results[i];pushUndo(i);
 const keepPending=!approvable(m),warn=(m.warnings||[]).filter(t=>!/amarra|Parede não aprovada para o quantitativo/i.test(t));
 const note='Amarração corrigida com “Corrigir”: '+describe(sol)+'.';
 const nm=quantify({...m,rows:sol.rows,bondIssues:[],bondPending:false,manual:false,pending:keepPending,statusReason:keepPending?(m.statusReason||'')+' (amarração interna já corrigida)':'',warnings:[...warn,note],fixed76:true});
 state.results[i]=nm;state.savedResults??={};state.savedResults[w.uid]={signature:sourceSignature(w),neighbours:neighbourSignature(i),result:clone(nm),bondVersion:bondVer53()};
 w.fix76={at:Date.now(),text:describe(sol)};if(lock&&!keepPending)w.locked76=true;
 if(window.__fix84batch)return;
 renderResults({reports:state.junctionReports||[]},state.results);
 $('planStatus').textContent='Parede '+(i+1)+' corrigida: '+describe(sol)+(keepPending?'. Ainda há pendência de fechamento ou encontro.':'. Aprovada'+(w.locked76?' e travada.':'.'))+' Ctrl+Z desfaz.';
 setTimeout(()=>$('wall-result-'+i)?.scrollIntoView({behavior:'smooth',block:'start'}),60);}
function describe(s){const rows=s.touched.map(r=>r+1),txt=rows.length>6?rows.length+' fiadas ('+rows.slice(0,4).join(', ')+'…)':'fiada'+(rows.length>1?'s ':' ')+rows.join(', ');
 return (s.cuts?s.cuts+' corte'+(s.cuts>1?'s':'')+' ('+f1(s.amt)+' cm no total)':'sem corte')+' · '+(s.changed?s.changed+' bloco'+(s.changed===1?'':'s')+' trocado'+(s.changed===1?'':'s'):'só ajuste das juntas, nenhum bloco trocado')+' · '+txt;}

// desfazer (Ctrl+Z) da correção
const undo76=[];let lastFix=0,lastEdit=0;
function pushUndo(i){const w=state.walls[i];undo76.push({uid:w.uid,saved:clone(state.savedResults?.[w.uid]||null),result:clone(state.results[i]),fix:w.fix76?clone(w.fix76):null,locked:!!w.locked76});if(undo76.length>20)undo76.shift();lastFix=Date.now();}
function popUndo(){const u=undo76.pop();if(!u)return false;const i=state.walls.findIndex(w=>w.uid===u.uid);if(i<0)return false;const w=state.walls[i];
 if(u.saved)state.savedResults[w.uid]=u.saved;else delete state.savedResults[w.uid];state.results[i]=u.result;if(u.fix)w.fix76=u.fix;else delete w.fix76;if(u.locked)w.locked76=true;else delete w.locked76;
 renderResults({reports:state.junctionReports||[]},state.results);$('planStatus').textContent='Correção da Parede '+(i+1)+' desfeita.';lastFix=undo76.length?Date.now():0;return true;}
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.shiftKey||e.altKey||e.key.toLowerCase()!=='z')return;const t=e.target;if(t&&(t.isContentEditable||/^(input|textarea|select)$/i.test(t.tagName)&&!/^(checkbox|radio|button)$/i.test(t.type||'')))return;
 if(undo76.length&&lastFix>=lastEdit){e.preventDefault();e.stopImmediatePropagation();popUndo();}},true);
window.undoFix76=popUndo;

// ---------------------------------------------------------------- 6. Paredes travadas
try{const ss=sourceSignature;sourceSignature=function(w){if(!w)return ss(w);const {fix76,locked76,seq58,...rest}=w;return ss(rest);};}catch(e){console.error(e);}
const lockedOK=(w,i)=>{const s=state.savedResults?.[w.uid];return w.locked76&&s&&s.signature===sourceSignature(w)&&!s.result?.errors?.length&&s.result?.rows?.length;};
try{const sg=stableGenerationModels;stableGenerationModels=function(){const st=sg.apply(this,arguments)||{};state.walls.forEach((w,i)=>{if(lockedOK(w,i))st[i]=state.savedResults[w.uid].result;});return st;};}catch(e){console.error(e);}
try{const pr=preserveResults;preserveResults=function(fresh){const keep={};state.walls.forEach((w,i)=>{if(w.locked76){if(lockedOK(w,i))keep[i]=clone(state.savedResults[w.uid]);else{delete w.locked76;delete w.fix76;keep[i]=null;}}});
 const out=pr.apply(this,arguments);for(const[k,s]of Object.entries(keep)){const i=N(k),w=state.walls[i];if(!s){(out[i].warnings??=[]).push('Parede destravada: as medidas dela mudaram e ela foi recalculada.');continue;}
  const r=clone(s.result);if(s.neighbours!==neighbourSignature(i)){r.warnings=[...(r.warnings||[]).filter(t=>!/vizinha alterada/.test(t)),'Parede travada: uma parede vizinha mudou — o desenho travado foi mantido; confira o encontro.'];}
  out[i]=r;state.savedResults[w.uid]={...s,neighbours:s.neighbours,result:clone(r)};}
 return out;};}catch(e){console.error(e);}
// trava automaticamente as paredes aprovadas depois de gerar
let afterGen=false;{const g=$('generate');if(g){g.addEventListener('click',()=>{afterGen=true;},true);}}
const autoLock=()=>LS76('lock76')!=='0';function LS76(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch{}return null;}
function setLock(i,on){const w=state.walls[i];if(!w)return;if(!on){const m0=state.results?.[i];if(m0?.approvedBy78){const nm=clone(m0);nm.pending=true;nm.statusReason=m0.approvedBy78.reason;delete nm.approvedBy78;nm.warnings=(nm.warnings||[]).filter(t=>!/^Aprovada pelo projetista/.test(t));state.results[i]=nm;}}if(on){const m=state.results?.[i];if(!m?.rows?.length||m.errors?.length||m.pending){alert('Só paredes moduladas sem pendência podem ser travadas.');return;}state.savedResults??={};state.savedResults[w.uid]={signature:sourceSignature(w),neighbours:neighbourSignature(i),result:clone(m),bondVersion:bondVer53()};w.locked76=true;}else{delete w.locked76;}lastEdit=Date.now();renderResults({reports:state.junctionReports||[]},state.results);}
window.setLock76=setLock;
window.unlockAll76=()=>{let n=0;for(const w of (window.level68?.all?.()||state.walls))if(w.locked76){delete w.locked76;n++;}renderResults({reports:state.junctionReports||[]},state.results);$('planStatus').textContent=n+' parede(s) destravada(s). Ao gerar de novo, elas podem receber outro arranjo.';};

// ---------------------------------------------------------------- 7. Desenho: blocos com problema em vermelho, cadeado no título
function badPieces(m){const set=new Set();if(!m?.rows?.length||m.approvedBy78)return set;const min=bondMin();
 for(const{r,hit}of conflicts(m.rows)){for(const[p,q]of hit){for(const[ri,x]of[[r-1,p],[r,q]]){const row=m.rows[ri];row.pieces.forEach((pc,k)=>{if(pc.fill||pc.channel)return;const s=N(pc.x)+N(pc.joint)/2,e=s+N(pc.length);if(Math.abs(e-x)<1.6||Math.abs(s-x)<1.6)set.add(ri+','+k);});}}}return set;}
const sv=svgWall;svgWall=function(w,m,which,...rest){let html=sv.call(this,w,m,which,...rest);try{if(which!=='elevation'||!m?.rows?.length)return html;const i=state.walls.indexOf(w);const bad=badPieces(m),ch=m.fixed76?new Set(m.rows.flatMap((row,r)=>row.pieces.map((p,k)=>p.changed76?r+','+k:null)).filter(Boolean)):new Set();if(!bad.size&&!ch.size)return html;
 const box=document.createElement('div');box.innerHTML=html;for(const rc of box.querySelectorAll('rect[onclick^="selectPiece"]')){const mm=rc.getAttribute('onclick').match(/selectPiece\((\d+),(\d+),(\d+)\)/);if(!mm)continue;const key=mm[2]+','+mm[3];
  if(bad.has(key)){rc.setAttribute('fill','#e8503a');rc.setAttribute('stroke','#8f1d0e');rc.setAttribute('stroke-width','.6');rc.setAttribute('data-fix76',String(i));rc.style.cursor='pointer';const t=document.createElementNS('http://www.w3.org/2000/svg','title');t.textContent='Junta sem defasagem suficiente — clique para ver as correções';rc.prepend(t);}
  else if(ch.has(key)){rc.setAttribute('stroke','#15803d');rc.setAttribute('stroke-width','.7');}}
 return box.innerHTML;}catch(e){console.error(e);return html;}};
// clique num bloco vermelho abre as correções
$('output')?.addEventListener('click',e=>{const t=e.target.closest?.('[data-fix76]');if(!t)return;e.stopPropagation();e.preventDefault();quickFix(N(t.getAttribute('data-fix76')));},true);

// ---------------------------------------------------------------- 8. Janela de correção
function nearJunction(k){const w=state.walls[k];if(!w?.line)return 0;const[a,b]=w.line,L=Math.hypot(b.x-a.x,b.y-a.y)||1,s=N(w.planScale)||L/N(w.length),u={x:(b.x-a.x)/L,y:(b.y-a.y)/L};const pts=[];state.walls.forEach((o,j)=>{if(j===k||!o.line||N(o.page||1)!==N(w.page||1))return;for(const P of o.line){const t=((P.x-a.x)*u.x+(P.y-a.y)*u.y)/s,d=Math.abs((P.x-a.x)*u.y-(P.y-a.y)*u.x)/s;if(d<30&&t>-20&&t<N(w.length)+20)pts.push(t);}});let best=0,bd=Infinity;(w.openings||[]).forEach((o,oi)=>{for(const t of pts){const dd=Math.min(Math.abs(t-N(o.start)),Math.abs(t-N(o.start)-N(o.width)),t>N(o.start)&&t<N(o.start)+N(o.width)?0:Infinity);if(dd<bd){bd=dd;best=oi;}}});return best;}
function rootOf(i){const m=state.results?.[i];const src=[...(m?.errors||[]),...(m?.sourceErrors||[])];for(const t of src){const mm=t.match(/Parede (\d+), fiada (\d+): (.+)$/);if(mm)return {wall:N(mm[1])-1,row:N(mm[2]),why:mm[3]};}return null;}
function openFix(i){const w=state.walls[i],m=state.results?.[i];if(!w)return;let d=$('fix76');if(!d){d=document.createElement('dialog');d.id='fix76';d.className='fix76';document.body.append(d);}
 d.innerHTML='<div class="fx76h"><b>Corrigir Parede '+(i+1)+'</b><span class="note"> · '+f1(w.length)+' × '+f1(w.height)+' cm</span><button type="button" class="secondary fx76x">✕</button></div><div class="fx76b"><p class="note">Procurando a correção com a menor mudança possível…</p></div>';
 d.querySelector('.fx76x').onclick=()=>d.close();if(!d.open)d.showModal();
 setTimeout(()=>{const body=d.querySelector('.fx76b');try{body.innerHTML=okBar(i)+fixBody(i);wire(d,i);}catch(e){console.error(e);body.innerHTML='<p class="warn74">Não foi possível analisar esta parede: '+esc(e.message)+'</p>';}},30);}
window.openFix76=openFix;
let lastOpts=[];
function fixBody(i){const w=state.walls[i],m=state.results?.[i];lastOpts=[];
 const errs=[...(m?.errors||[])];
 if(!m||errs.length&&!m.rows?.length){const msg=errs.join(' ')||'Sem resultado.';let h='<p><b>Esta parede não foi modulada.</b> '+esc(msg)+'</p><div class="fx76acts">';
  if(/conferid/i.test(msg))h+='<button type="button" data-act="conf">Marcar como conferida e gerar de novo</button>';
  if(/espessura/i.test(msg)){const ws=[...new Set(state.blocks.filter(b=>b.active!==false&&b.type!=='Canaleta').map(b=>N(b.width)))];h+=ws.map(v=>'<button type="button" data-act="width" data-v="'+v+'">Usar espessura '+f1(v)+' cm e gerar</button>').join('');}
  const rt=rootOf(i);if(rt&&rt.wall!==i)h+='<button type="button" data-act="go" data-v="'+rt.wall+'">Corrigir a Parede '+(rt.wall+1)+' (causa)</button>';
  h+='<button type="button" class="secondary" data-act="row">Ir para a parede na tabela</button></div>';return h;}
 const rt=rootOf(i);let pre='';
 if(rt)pre='<div class="fx76cause"><b>Causa no encontro:</b> Parede '+(rt.wall+1)+', fiada '+rt.row+' — '+esc(rt.why)+'<div class="fx76acts">'+(/abertura/i.test(rt.why)?'<button type="button" data-act="opening" data-v="'+rt.wall+'">Abrir as aberturas da Parede '+(rt.wall+1)+'</button>':'')+'<button type="button" class="secondary" data-act="rowof" data-v="'+rt.wall+'">Ir para a Parede '+(rt.wall+1)+'</button></div><p class="note">Resolvendo a causa e gerando de novo, as paredes ligadas a ela voltam a modular.</p></div>';
 if(m.sourceErrors?.length){const own=!rt||rt.wall===i;return pre+'<p><b>Desenho provisório.</b> O conjunto de encontros ligado a esta parede não fechou'+(rt?(own?' por causa desta parede':' por causa da Parede '+(rt.wall+1)):'')+', então o programa mostra um arranjo parcial. Corrija a causa acima e clique em “Gerar modulação”: esta parede volta a ser calculada junto com as vizinhas.</p>'+(rt?'':'<p class="note">'+esc(m.sourceErrors.join(' '))+'</p>');}
 const cf=conflicts(m.rows);
 if(!cf.length&&m.pending&&/respaldo/i.test(m.statusReason||''))return pre+respaldoBox(i);
 if(!cf.length){return pre+(m.pending?'<p>A amarração entre as fiadas desta parede já está correta. Pendência: '+esc(m.statusReason||'revisão')+'.</p>'+(/encontro|preservad/i.test(m.statusReason||'')?'<div class="fx76acts"><button type="button" data-act="regen">Destravar esta parede e as vizinhas e gerar de novo</button></div><p class="note">O encontro é recalculado junto com as paredes ligadas a ele. As demais paredes travadas continuam como estão.</p>':''):'<p class="ok74">✔ Esta parede está aprovada. Nada a corrigir.</p>')+lockBox(i);}
 const opts=options(i);lastOpts=opts;
 let h=pre+'<p><b>'+cf.length+' par'+(cf.length>1?'es':'')+' de fiadas</b> com juntas a menos de '+f1(bondMin())+' cm (em vermelho na elevação). Correções testadas, da menor para a maior mudança — só os blocos livres desta parede mudam; encontros, canaletas e paredes vizinhas ficam como estão:</p>';
 if(!opts.length)return h+'<p class="warn74">Nenhuma correção só dentro desta parede resolve todas as juntas — já testando até 2 blocos cortados por trecho de fiada (corte de até 30 cm, peça mínima de 9 cm), sem mexer nos encontros nem nas paredes vizinhas.</p><div class="fx76acts"><button type="button" data-act="regen">Procurar mexendo também nos encontros (destrava esta parede e as ligadas a ela e gera de novo)</button></div><p class="note">As demais paredes travadas continuam como estão. Se ainda assim não fechar, ajuste o comprimento da parede ou a posição da abertura, ou use “Parede OK” se o desenho estiver do jeito que você quer.</p>'+lockBox(i);
 let before='';try{before=svgWall(w,m,'elevation');}catch{}
 h+='<div class="fx76opts">'+opts.map((s,k)=>{const prev={...m,rows:s.rows,fixed76:true,bondIssues:[]};let svg='';try{svg=sv(w,prev,'elevation');}catch{}const after=markChanged(svg,s),bb=bboxOf(after,'[data-chg76]')||bboxOf(before,'[data-fix76]');
  const zoom=bb?'<div class="fx76zoom"><div><span>Antes</span>'+zoomSvg(before,bb)+'</div><div><span>Depois</span>'+zoomSvg(after,bb)+'</div></div>':'';
  return '<div class="fx76opt'+(k===0?' best':'')+'"><div class="fx76t">'+(k===0?'★ Recomendada — ':'Opção '+(k+1)+' — ')+esc(describe(s))+'</div>'+zoom+'<details class="fx76all"><summary>Ver a elevação inteira depois da correção</summary><div class="fx76pv">'+after+'</div></details><button type="button" data-act="apply" data-v="'+k+'">Aplicar esta correção</button></div>';}).join('')+'</div>';
 return h+lockBox(i,true);}
// V80: “Parede OK” — o projetista confere e aprova a parede como está, mesmo com pendência apontada pelo programa
function approveOK(i){const w=state.walls[i],m=state.results?.[i];if(!w||!m?.rows?.length){alert('Só dá para aprovar uma parede que já tem desenho.');return false;}
 const why=m.statusReason||(conflicts(m.rows).length?'juntas com defasagem menor que '+f1(bondMin())+' cm':'revisão');
  pushUndo(i);const nm=clone(m);nm.pending=false;nm.statusReason='';nm.bondIssues=[];delete nm.sourceErrors;delete nm.revisionStale;nm.approvedBy78={reason:why,at:new Date().toISOString()};nm.warnings=[...(nm.warnings||[]).filter(t=>!/sem contorno fechado/i.test(t)),'Aprovada pelo projetista ('+new Date().toLocaleDateString('pt-BR')+'). Pendência original: '+why+'.'];
 state.results[i]=nm;w.confirmed=true;setLock(i,true);try{drawPlan();}catch{}$('planStatus').textContent='Parede '+(i+1)+' aprovada pelo projetista e travada (pendência original: '+why+').';return true;}
window.approveOK80=approveOK;
// V84: “Corrigir” sem janela — aplica a melhor solução e mostra uma barrinha na parede (outra opção · desfazer · detalhes)
const bars84=new Map();window.bars84=bars84;
function bar84(i,msg,acts){bars84.set(i,{msg,acts});drawBars84();}
function drawBars84(){document.querySelectorAll('.fx84bar').forEach(e=>e.remove());for(const[i,b]of bars84){const art=$('wall-result-'+i);const h=art?.querySelector('h3');if(!h)continue;const d=document.createElement('div');d.className='fx84bar noPrint';d.innerHTML='<span>'+esc(b.msg)+'</span>';for(const[l,fn]of b.acts){const x=document.createElement('button');x.type='button';x.className='secondary';x.textContent=l;x.onclick=e=>{e.stopPropagation();fn();};d.append(x);}const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='✕';close.onclick=()=>{bars84.delete(i);drawBars84();};d.append(close);h.after(d);}}
function quickFix(i,k=0,optsIn){const m=state.results?.[i];if(!m?.rows?.length){openFix(i);return;}
 const cf=conflicts(m.rows);if(!cf.length){if(m.pending&&/respaldo/i.test(m.statusReason||'')){openFix(i);return;}if(m.pending&&/encontro|preservad|provisório|liberada/i.test(m.statusReason||'')){bar84(i,'A amarração desta parede está certa; a pendência é no encontro.',[['Gerar o encontro de novo',()=>{const ids=new Set([i]);try{for(const q of JunctionEngine.detect(state.walls))if(q.a.i===i||q.b.i===i){ids.add(q.a.i);ids.add(q.b.i);}}catch{}for(const x of ids)delete state.walls[x].locked76;bars84.delete(i);lastEdit=Date.now();$('generate').click();}],['✔ Parede OK',()=>{bars84.delete(i);approveOK(i);}],['detalhes',()=>openFix(i)]]);return;}openFix(i);return;}
 const opts=optsIn||options(i);if(!opts.length){bar84(i,'Nenhuma correção só nesta parede resolve (testado até 2 cortes por trecho, sem mexer nos encontros).',[['Procurar mexendo nos encontros',()=>{const ids=new Set([i]);try{for(const q of JunctionEngine.detect(state.walls))if(q.a.i===i||q.b.i===i){ids.add(q.a.i);ids.add(q.b.i);}}catch{}for(const x of ids)delete state.walls[x].locked76;bars84.delete(i);lastEdit=Date.now();$('generate').click();}],['✔ Parede OK',()=>{bars84.delete(i);approveOK(i);}]]);return;}
 const s=opts[Math.min(k,opts.length-1)];applyFix(i,s,true);
 const acts=[];if(k+1<opts.length)acts.push(['outra opção ('+(k+2)+' de '+opts.length+') ›',()=>{popUndo();quickFix(i,k+1,opts);}]);acts.push(['↶ desfazer',()=>{bars84.delete(i);popUndo();}],['detalhes',()=>{popUndo();bars84.delete(i);openFix(i);}]);
 bar84(i,'Corrigida'+(opts.length>1?' (opção '+(k+1)+' de '+opts.length+')':'')+': '+describe(s)+'.',acts);}
window.quickFix84=quickFix;
// V84: Corrigir todas — causas nos encontros primeiro, só soluções pequenas (até 2 cortes por trecho)
function fixAll(){const R=state.results;if(!Array.isArray(R))return;const roots=new Set();R.forEach((m,i)=>{const rt=rootOf(i);if(rt)roots.add(rt.wall);});
 const order=[...roots,...R.map((_,i)=>i).filter(i=>!roots.has(i))];let n=0,miss=0;const before=undo76.length;window.__fix84batch=true;
 try{for(const i of order){const m=state.results[i];if(!m?.rows?.length||state.walls[i].locked76)continue;if(!conflicts(m.rows).length)continue;let o=[];try{o=options(i);}catch{}if(o.length){applyFix(i,o[0],true);n++;}else miss++;}}finally{window.__fix84batch=false;}
 renderResults({reports:state.junctionReports||[]},state.results);const done=undo76.length-before;try{window.diagnose84?.();}catch{}
 $('planStatus').textContent='Corrigir todas: '+n+' parede(s) corrigida(s)'+(miss?', '+miss+' sem solução local (use o editor ou “Parede OK”)':'')+'.';
 const box=$('genReport57');if(box){let d=box.querySelector('.fx84all');if(!d){d=document.createElement('p');d.className='fx84all';box.prepend(d);}d.innerHTML='🛠 Corrigir todas: <b>'+n+'</b> corrigida(s)'+(miss?' · '+miss+' sem solução local':'')+(done?' <button type="button" class="secondary" id="fx84undo">↶ desfazer tudo</button>':'');$('fx84undo')?.addEventListener('click',()=>{for(let k=0;k<done;k++)popUndo();d.remove();});}}
window.fixAll84=fixAll;
// V80: pendência de classificação do respaldo (trecho sem contorno fechado) — resolver aqui mesmo
function respaldoBox(i){const w=state.walls[i];let spans=[];try{spans=effectiveSegments24(w,i);}catch{spans=w.locationSegments24||[];}
 const row=(s,k)=>'<tr><td>'+f1(s.start)+' – '+f1(s.end)+' cm</td><td>'+(s.channel?esc(s.location)+' · '+s.channel+(s.manual?' (manual)':''):'<b style="color:#b45309">sem classificação</b> · U provisório')+'</td><td>'+(s.channel?'':'<button type="button" class="secondary" data-act="rsp" data-v="'+k+'|Interna">Interna · U</button> <button type="button" class="secondary" data-act="rsp" data-v="'+k+'|Externa">Externa · J</button>')+'</td></tr>';
 return '<p>A amarração entre as fiadas desta parede já está correta. <b>Pendência: classificação do respaldo.</b> Num trecho o programa não achou contorno fechado (lado de dentro × lado de fora) e usou canaleta U provisória.</p>'+
 '<table class="fx76tab"><thead><tr><th>Trecho</th><th>Respaldo</th><th>Definir</th></tr></thead><tbody>'+spans.map(row).join('')+'</tbody></table>'+
 '<div class="fx76acts"><button type="button" data-act="rspall">✔ Está certo como desenhado — aceitar e aprovar</button></div>'+
 '<p class="note">Aceitar mantém exatamente o que está na elevação (trecho sem classificação fica como interna · U), tira a pendência e trava a parede. Nada é recalculado: as outras paredes não mudam. Escolher “Externa · J” num trecho troca só a canaleta desse trecho.</p>';}
function setRespaldo(i,list){const w=state.walls[i],m=state.results?.[i];w.locationOverrides24??=[];for(const s of list)w.locationOverrides24.push({start:s.start,end:s.end,location:s.location});w.classification36='Mista';w.locationMode24='auto';
 try{updateWallLocations24();}catch{}
 // o desenho já está pronto: troca só o respaldo dos trechos definidos, sem recalcular a parede (nem os encontros)
 let ok=false;try{if(m?.rows?.length){const nm=clone(m),row=nm.rows.at(-1),jh=N(nm.jh??m.jh)||1;
  for(const s of list){const ch=s.location==='Externa'?'J':'U';const inR=row.pieces.filter(p=>p.channelUse==='Respaldo'&&p.x+N(p.length)/2>=s.start-.01&&p.x+N(p.length)/2<s.end+.01);if(!inR.length)continue;
   if(inR.every(p=>p.channel===ch)){inR.forEach(p=>{p.location24=s.location;p.locationUncertain24=false;});continue;}
   const a=Math.min(...inR.map(p=>p.x)),b=Math.max(...inR.map(p=>p.x+N(p.length)+N(p.joint||0))),base=state.blocks.find(q=>q.type==='Canaleta'&&q.channel===ch&&N(q.width)===N(w.width)&&N(q.height)===N(inR[0].height));if(!base)throw Error('sem canaleta '+ch);
   const tiles=ChannelEngine.tile(a,b,base,inR[0].y,'Respaldo',jh).map(p=>({...p,location24:s.location,locationUncertain24:false}));row.pieces=row.pieces.filter(p=>!inR.includes(p)).concat(tiles).sort((p,q)=>p.x-q.x);}
  if(row.pieces.some(p=>p.channelUse==='Respaldo'&&p.locationUncertain24))throw Error('ainda há trecho sem classificação');
  const quant={};for(const r of nm.rows)for(const p of r.pieces)if(!p.fill){const code=p.sourceCode==='B39'?'B39':p.code;quant[code]=(quant[code]||0)+1;}nm.quant=quant;
  nm.pending=false;nm.statusReason='';nm.warnings=(nm.warnings||[]).filter(t=>!/sem contorno fechado/i.test(t));delete nm.sourceErrors;
  state.results[i]=nm;ok=true;}}catch(e){console.warn('V80 respaldo',e);}
 renderWalls();
 if(ok){setLock(i,true);drawPlan();$('planStatus').textContent='Parede '+(i+1)+': respaldo definido ('+list.map(s=>f1(s.start)+'–'+f1(s.end)+' cm '+(s.location==='Externa'?'externa · J':'interna · U')).join('; ')+'). Parede aprovada e travada — o desenho das outras paredes não mudou.';return;}
 invalidate();lastEdit=Date.now();$('generate').click();$('planStatus').textContent='Parede '+(i+1)+': classificação do respaldo definida. Gerando de novo.';}
function markChanged(html,s){try{const box=document.createElement('div');box.innerHTML=html;for(const rc of box.querySelectorAll('rect[onclick^="selectPiece"]')){const mm=rc.getAttribute('onclick').match(/selectPiece\((\d+),(\d+),(\d+)\)/);rc.removeAttribute('onclick');if(!mm)continue;const p=s.rows[N(mm[2])]?.pieces[N(mm[3])];if(p?.changed76){rc.setAttribute('stroke','#0f7a35');rc.setAttribute('stroke-width','1.6');rc.setAttribute('data-chg76','1');if(p.cut)rc.setAttribute('fill','#7cc68a');}}const svg=box.querySelector('svg');if(svg){svg.removeAttribute('width');svg.removeAttribute('height');svg.style.width='100%';svg.style.height='auto';}return box.innerHTML;}catch{return html;}}
function bboxOf(html,sel){try{const box=document.createElement('div');box.innerHTML=html;const rs=[...box.querySelectorAll('rect'+sel)];if(!rs.length)return null;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const r of rs){const x=N(r.getAttribute('x')),y=N(r.getAttribute('y')),w=N(r.getAttribute('width')),h=N(r.getAttribute('height'));x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+w);y1=Math.max(y1,y+h);}return {x0,y0,x1,y1};}catch{return null;}}
function zoomSvg(html,b){try{const box=document.createElement('div');box.innerHTML=html;const svg=box.querySelector('svg');if(!svg)return '';const w=Math.max(60,b.x1-b.x0+40),cx=(b.x0+b.x1)/2,h=Math.max(22,b.y1-b.y0+16),cy=(b.y0+b.y1)/2;svg.setAttribute('viewBox',[cx-w/2,cy-h/2,w,h].join(' '));svg.removeAttribute('width');svg.removeAttribute('height');svg.style.width='100%';svg.style.height='auto';svg.querySelectorAll('[onclick]').forEach(e=>e.removeAttribute('onclick'));return box.innerHTML;}catch{return '';}}
function lockBox(i,withApply){const w=state.walls[i];return '<label class="fx76lock"><input type="checkbox" id="fx76lk" '+(withApply?'checked':(w.locked76?'checked':''))+'> Travar a parede depois de aprovada (nem “Gerar modulação” nem outras correções mexem nela)</label>';}
function okBar(i){const m=state.results?.[i];if(!m?.rows?.length||(!m.pending&&!conflicts(m.rows).length&&!m.sourceErrors?.length))return '';return '<div class="fx76ok"><button type="button" data-act="ok80">✔ Parede OK — está certa assim, aprovar</button><span class="note">Use quando você conferiu o desenho e ele está do jeito que quer. A parede fica aprovada e travada.</span></div>';}
function wire(d,i){{const lk=d.querySelector('#fx76lk');if(lk&&!d.querySelector('[data-act="apply"]'))lk.onchange=()=>{setLock(i,lk.checked);if(lk.checked&&!state.walls[i].locked76)lk.checked=false;};}
 d.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const a=b.dataset.act,v=b.dataset.v;
 if(a==='apply'){const s=lastOpts[N(v)];if(!s)return;d.close();applyFix(i,s,$('fx76lk')?.checked);}
 else if(a==='conf'){state.walls[i].confirmed=true;renderWalls();d.close();$('generate').click();}
 else if(a==='width'){state.walls[i].width=N(v);state.walls[i].confirmed=true;renderWalls();invalidate();d.close();$('generate').click();}
 else if(a==='go'){openFix(N(v));}
 else if(a==='ok80'){if(approveOK(i))d.close();}
 else if(a==='rsp'||a==='rspall'){const w=state.walls[i];let spans=[];try{spans=effectiveSegments24(w,i);}catch{spans=w.locationSegments24||[];}
  let list;if(a==='rspall')list=spans.filter(s=>!s.channel).map(s=>({start:s.start,end:s.end,location:'Interna'}));else{const[k,loc]=String(v).split('|');const s=spans[N(k)];if(!s)return;list=[{start:s.start,end:s.end,location:loc}];}
  if(!list.length){d.close();return;}d.close();setRespaldo(i,list);}
 else if(a==='regen'){const ids=new Set([i]);try{for(const q of JunctionEngine.detect(state.walls))if(q.a.i===i||q.b.i===i){ids.add(q.a.i);ids.add(q.b.i);}}catch{}for(const k of ids)delete state.walls[k].locked76;d.close();lastEdit=Date.now();$('generate').click();}
 else if(a==='row'||a==='rowof'){d.close();const k=a==='row'?i:N(v);const tr=$('walls')?.querySelectorAll('tr')[k];if(tr){tr.scrollIntoView({behavior:'smooth',block:'center'});tr.classList.add('gr57flash');setTimeout(()=>tr.classList.remove('gr57flash'),2500);}}
 else if(a==='opening'){d.close();const k=N(v),w=state.walls[k];if(w?.openings?.length&&window.openReg54){const oi=nearJunction(k);$('plan')?.scrollIntoView({behavior:'smooth',block:'center'});const r=$('plan')?.getBoundingClientRect?.()||{left:200,top:200};setTimeout(()=>window.openReg54(w,oi,Math.max(40,innerWidth/2-200),160),400);}else{const tr=$('walls')?.querySelectorAll('tr')[k];tr?.scrollIntoView({behavior:'smooth',block:'center'});}}});}

// ---------------------------------------------------------------- 9. Caixa de resultado e cabeçalho das paredes
const rr=renderResults;renderResults=function(...a){if(!window.__fix76internal)lastEdit=Math.max(lastEdit,afterGen?Date.now():lastEdit);
 const r=rr.apply(this,a);try{if(afterGen&&autoLock()&&Array.isArray(state.results)){afterGen=false;let n=0;state.walls.forEach((w,i)=>{const m=state.results[i];if(!w.locked76&&m?.rows?.length&&!m.errors?.length&&!m.pending&&!m.sourceErrors?.length){state.savedResults??={};state.savedResults[w.uid]={signature:sourceSignature(w),neighbours:neighbourSignature(i),result:clone(m),bondVersion:bondVer53()};w.locked76=true;n++;}});}
  afterGen=false;decorateResults();}catch(e){console.error('V76',e);}return r;};
function decorateResults(){const R=state.results;if(!Array.isArray(R))return;setTimeout(drawBars84,0);
 state.walls.forEach((w,i)=>{const h=$('wall-result-'+i)?.querySelector('h3');if(!h)return;h.querySelectorAll('.lk76,.fx76btn,.ok80tag').forEach(e=>e.remove());const m=R[i];
  const lk=document.createElement('button');lk.type='button';lk.className='lk76 secondary'+(w.locked76?' on':'');lk.textContent=w.locked76?'🔒 Travada':'🔓 Travar';lk.title=w.locked76?'Parede travada: gerar de novo não muda este desenho. Clique para destravar.':'Travar este desenho (gerar de novo não muda esta parede).';lk.onclick=e=>{e.stopPropagation();setLock(i,!w.locked76);};
  if(m?.rows?.length&&!m.errors?.length&&!m.pending||w.locked76)h.append(lk);
  if(m?.rows?.length&&(m.pending||m.sourceErrors?.length||conflicts(m.rows).length)&&!m.approvedBy78){const ok=document.createElement('button');ok.type='button';ok.className='fx76btn ok80';ok.textContent='✔ Parede OK';ok.title='Conferi o desenho: está certo assim. Aprovar e travar.';ok.onclick=e=>{e.stopPropagation();approveOK(i);};h.append(ok);}
  if(m?.approvedBy78){const t=document.createElement('span');t.className='lk76 ok80tag';t.textContent='✔ aprovada pelo projetista';t.title='Pendência original: '+m.approvedBy78.reason;h.append(t);}
  if(m&&(m.errors?.length||m.pending||m.sourceErrors?.length)){const b=document.createElement('button');b.type='button';b.className='fx76btn';b.textContent='🛠 Corrigir';b.onclick=e=>{e.stopPropagation();quickFix(i);};h.append(b);}});
 const box=$('genReport57');if(box&&box.style.display!=='none'){
  box.querySelectorAll('.gr57see,.gr57go').forEach(b=>{if(b.nextElementSibling?.classList.contains('fx76go'))return;const i=N(b.dataset.row);const m=R[i];if(!m)return;const c=document.createElement('button');c.type='button';c.className='fx76go';c.textContent='🛠 Corrigir';c.onclick=()=>quickFix(i);b.after(c);if(m.rows?.length&&!m.errors?.length&&!m.approvedBy78){const o=document.createElement('button');o.type='button';o.className='fx76go ok80';o.textContent='✔ Parede OK';o.title='Conferi: está certa assim. Aprovar e travar.';o.onclick=()=>approveOK(i);c.after(o);}});
  // causa escondida em “Compatibilização pendente”: mostra a parede e o motivo
  if(!box.querySelector('.fx76root')){const roots=new Map();R.forEach((m,i)=>{const rt=rootOf(i);if(rt&&!roots.has(rt.wall))roots.set(rt.wall,rt);});
   if(roots.size){const sec=document.createElement('div');sec.className='gr57sec fx76root';sec.innerHTML='<b>Causa encontrada nos encontros:</b><ul>'+[...roots.values()].map(rt=>'<li><b>Parede '+(rt.wall+1)+'</b>, fiada '+rt.row+' — <span class="gr57why">'+esc(rt.why)+'</span> <button type="button" class="fx76go" data-w="'+rt.wall+'">🛠 Corrigir</button></li>').join('')+'</ul>';
    const head=box.querySelector('.gr57head');(head?head.nextSibling:box.firstChild)?box.insertBefore(sec,head?head.nextSibling:box.firstChild):box.append(sec);sec.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>openFix(N(b.dataset.w)));}}
  if(!box.querySelector('.fx84allbtn')){const pend=(state.results||[]).filter((m,i)=>m?.rows?.length&&!state.walls[i]?.locked76&&conflicts(m.rows).length).length;if(pend){const p=document.createElement('p');p.className='fx84allbtn';p.innerHTML='<button type="button">🛠 Corrigir todas ('+pend+')</button> <span class="note">aplica a correção recomendada em cada parede com junta alinhada; causas nos encontros primeiro.</span>';box.prepend(p);p.querySelector('button').onclick=()=>fixAll();}}
  const nl=state.walls.filter(w=>w.locked76).length;let lb=box.querySelector('.lk76bar');if(!lb){lb=document.createElement('p');lb.className='lk76bar';box.append(lb);}
  lb.innerHTML=(nl?'🔒 '+nl+' parede(s) aprovada(s) travada(s) — gerar de novo não muda o desenho delas. <button type="button" class="secondary" id="unlockAll76">Destravar todas</button>':'')+' <label style="display:inline-flex;gap:5px;align-items:center;font-size:12.5px;margin-left:8px"><input type="checkbox" id="autoLock76" '+(autoLock()?'checked':'')+' style="width:auto"> Travar automaticamente as paredes aprovadas</label>';
  $('unlockAll76')?.addEventListener('click',()=>window.unlockAll76());$('autoLock76').onchange=e=>LS76('lock76',e.target.checked?'1':'0');}}
// edições de parede contam como “última ação” (para o Ctrl+Z)
{const rw=renderWalls;renderWalls=function(...a){lastEdit=Date.now();return rw.apply(this,a);};}

const css=document.createElement('style');css.textContent=`
dialog.fix76{width:min(980px,96vw);max-height:92vh;border:none;border-radius:12px;padding:0;box-shadow:0 20px 60px rgba(0,0,0,.35)}
dialog.fix76::backdrop{background:rgba(10,25,40,.45)}
.fx76h{display:flex;align-items:center;gap:8px;padding:12px 16px;background:#102e4b;color:#fff;position:sticky;top:0;z-index:2}.fx76h .note{color:#c9d8e8}.fx76h .fx76x{margin-left:auto;background:#e8eef5;color:#102e4b}
.fx76b{padding:12px 16px;overflow:auto;max-height:calc(92vh - 52px);font-size:14px}
.fx76opts{display:flex;flex-direction:column;gap:12px;margin:10px 0}
.fx76opt{border:1px solid #cfdceb;border-radius:10px;padding:10px 12px;background:#fbfdff}.fx76opt.best{border:2px solid #22a06b;background:#f3fbf6}
.fx76t{font-weight:700;color:#102e4b;margin-bottom:6px}.fx76pv{background:#fff;border:1px solid #e1e8f0;border-radius:6px;padding:4px;margin-bottom:8px;overflow:hidden}.fx76pv svg{display:block;width:100%;height:auto;max-height:440px}
.fx76opt button{background:#1d7a3a;color:#fff;font-weight:600}
.fx76zoom{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:4px 0 8px}.fx76zoom>div{border:1px solid #e1e8f0;border-radius:6px;background:#fff;padding:4px}.fx76zoom span{display:block;font:700 11px sans-serif;color:#5b6b7b;text-transform:uppercase;letter-spacing:.08em;margin:2px 4px}.fx76zoom svg{display:block}
.fx76all{margin:4px 0 8px;font-size:13px}.fx76all summary{cursor:pointer;color:#174a78}
.fx76acts{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}.fx76cause{border:1px solid #f3c2b8;background:#fff4f1;border-radius:8px;padding:8px 12px;margin-bottom:10px}
.fx76ok{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#ecf8ef;border:1px solid #9fd4ad;border-radius:8px;padding:8px 10px;margin:0 0 10px}.fx76ok button{background:#1d7a3a;color:#fff}.fx76go.ok80{background:#1d7a3a!important;color:#fff!important;margin-left:4px}.fx76btn.ok80{background:#1d7a3a!important;color:#fff!important}.ok80tag{font-size:12px;color:#1d7a3a;font-weight:700;margin-left:6px}.fx84bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#ecf8ef;border:1px solid #9fd4ad;border-radius:8px;padding:6px 10px;margin:6px 0;font-size:13px}.fx84bar button{padding:4px 10px;font-size:12.5px}.fx84allbtn button{background:#1d7a3a;color:#fff}.fx76tab{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}.fx76tab th{background:#174a78;color:#fff;padding:4px 6px;text-align:left}.fx76tab td{padding:4px 6px;border-bottom:1px solid #e1e8f0}.fx76tab button{padding:4px 8px;font-size:12px}.fx76lock{display:flex;gap:7px;align-items:flex-start;font-size:13px;margin-top:6px}.fx76lock input{width:auto;margin-top:3px}
.fx76btn,.fx76go{background:#d9480f;color:#fff;font-weight:700;padding:3px 10px;margin-left:8px;border-radius:6px;font-size:12.5px}
.lk76{margin-left:8px;padding:2px 9px;font-size:12px}.lk76.on{background:#eef8f0;border-color:#5aa36f;color:#1d6b3a}
.lk76bar{margin:6px 0 0;font-size:13px;color:#2b4a66}`;document.head.append(css);
})();
