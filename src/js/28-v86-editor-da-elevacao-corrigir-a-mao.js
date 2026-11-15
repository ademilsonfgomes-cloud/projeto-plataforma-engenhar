// V86 — Editor da elevação: corrigir à mão, direto no desenho, sem janelas.
// 1 clique = bloco · 2 cliques = fiada · Delete apaga nas fiadas de mesma alternância (Shift = só esta fiada)
// arrastar = move o trecho entre pontos fixos (ímã na amarração ideal) · setas = 0,5 cm · clique no vão = preencher
// amarração verde/vermelha ao vivo · blocos de encontro travados · Ctrl+Z · ✔ Parede OK
(function(){
'use strict';
const N=Number,clone=o=>JSON.parse(JSON.stringify(o)),f1=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1});
const bondMin=()=>N(window.BondRule53?.min?.())||N($('bondMin53')?.value)||10;
const minPiece=()=>N(state.mod84?.minPiece??14)||0;
const jh=()=>N($('jh')?.value)||1;
const slotEnd=p=>N(p.x)+N(p.length)+N(p.joint||0);
// V86.3: só o que é da parede vizinha (passagem com X) fica travado; os blocos desta parede no encontro ficam livres
const isFixed=p=>!!(p.fill||p.channel||p.reserved76);
const EPS=.6;

let E=null;// estado do editor aberto
const box=document.createElement('div');box.id='ed86';box.className='noPrint';box.hidden=true;document.body.append(box);

// ---------- geometria das fiadas
function jointsOf(row){const ps=row.pieces.filter(p=>!p.fill&&!p.channel).slice().sort((a,b)=>a.x-b.x),out=[];
 for(let i=1;i<ps.length;i++){const p=ps[i-1],q=ps[i],end=N(p.x)+N(p.joint)/2+N(p.length),start=N(q.x)+N(q.joint)/2;if(start-end<=6.01)out.push({x:(start+end)/2,a:p,b:q});}return out;}
function openingsAt(row){const y0=N(row.pieces[0]?.y||0),y1=y0+N(row.pieces.find(p=>!p.channel)?.height||19);return (E.w.openings||[]).filter(o=>N(o.bottom)<y1-.01&&N(o.bottom)+N(o.height)>y0+.01).map(o=>[N(o.start),N(o.start)+N(o.width)]);}
function rowY(r){const row=E.rows[r];const p=row.pieces.find(q=>Number.isFinite(N(q.y)));return p?N(p.y):r*E.step;}
function gapsOf(r){const row=E.rows[r];if(row.pieces.some(p=>p.channel))return [];const ps=row.pieces.slice().sort((a,b)=>a.x-b.x),ops=openingsAt(row),out=[];const J=jh();
 const pts=[];let cur=0;// lacunas entre 0 e L, descontando aberturas
 const occupied=[...ps.map(p=>[N(p.x),slotEnd(p)]),...ops.map(([a,b])=>[a-J/2,b+J/2]),...passOf(r).map(z=>[z.u,z.v])].sort((a,b)=>a[0]-b[0]);
 for(const[a,b]of occupied){if(a-cur>EPS)pts.push([cur,a]);cur=Math.max(cur,b);}if(E.L-cur>EPS)pts.push([cur,E.L]);
 for(const[a,b]of pts){if(b-a<=EPS)continue;out.push({r,a,b,size:b-a});}return out;}
// passagens da vizinha (fiadas em que ela atravessa) e encontros que esta parede precisa cobrir — lidos ao abrir
function classify(){const J=jh();E.pass=E.rows.map(()=>[]);E.cover=E.rows.map(()=>[]);let qs=[];try{qs=JunctionEngine.detect(state.walls).filter(q=>q.a.i===E.i||q.b.i===E.i);}catch{}
 for(const q of qs){const me=q.a.i===E.i,t=me?q.ta:q.tb,no=(me?q.b.i:q.a.i)+1,tw=N(state.walls[no-1]?.width)||14,c0=Math.max(0,t-tw/2),c1=Math.min(E.L,t+tw/2);if(c1-c0<2)continue;
  E.rows.forEach((row,r)=>{if(row.pieces.some(p=>p.channel))return;let segs=[[Math.max(0,t-tw/2-J/2),Math.min(E.L,t+tw/2+J/2)]];for(const p of row.pieces){const a=N(p.x),b=slotEnd(p);segs=segs.flatMap(([u,v])=>b<=u+.3||a>=v-.3?[[u,v]]:[[u,Math.max(u,a)],[Math.min(v,b),v]]).filter(([u,v])=>v-u>.5);}
   const free=segs.reduce((a,[u,v])=>a+v-u,0);if(free>=(c1-c0)*.6){const u=Math.min(...segs.map(s=>s[0])),v=Math.max(...segs.map(s=>s[1]));E.pass[r].push({u,v,no});return;}
   const one=row.pieces.find(p=>!p.fill&&N(p.x)<=c0+.6&&slotEnd(p)>=c1-.6);if(one)E.cover[r].push({c0,c1,no,jid:one.junction??true});});}}
const passOf=r=>E.pass?.[r]||[];
function coverState(){const bad=[];E.rows.forEach((row,r)=>{for(const z of E.cover?.[r]||[])if(!row.pieces.some(p=>!p.fill&&N(p.x)<=z.c0+.6&&slotEnd(p)>=z.c1-.6))bad.push({r,...z});});return bad;}
function zonesOf(){if(E.zones)return E.zones;const z=[];// só encontros reais da geometria atual (a parede vizinha passa ali)
 try{const J=jh(),qs=JunctionEngine.detect(state.walls).filter(q=>q.a.i===E.i||q.b.i===E.i);for(const q of qs){const me=q.a.i===E.i,t=me?q.ta:q.tb,o=state.walls[me?q.b.i:q.a.i],tw=N(o?.width)||14;z.push([t-tw/2-J,t+tw/2+J,(me?q.b.i:q.a.i)+1]);}}catch{}
 return E.zones=z;}
function bondState(){const min=bondMin(),bad=new Set();let nb=0;const J=E.rows.map(jointsOf);
 for(let r=0;r<E.rows.length;r++){for(const j of J[r]){let ok=true;for(const rr of [r-1,r+1]){if(rr<0||rr>=E.rows.length)continue;if(E.rows[rr].pieces.some(p=>p.channel)&&E.rows[r].pieces.some(p=>p.channel))continue;for(const k of J[rr])if(Math.abs(k.x-j.x)<min-.001)ok=false;}j.ok=ok;if(!ok){nb++;bad.add(r);}}}
 const cv=coverState();for(const c of cv)bad.add(c.r);
 return {J,nb,bad,cv};}

// ---------- trecho (run): peças livres encostadas entre dois pontos fixos
function runOf(r,k){const row=E.rows[r],ps=row.pieces.map((p,i)=>({p,i})).sort((a,b)=>a.p.x-b.p.x);const n=ps.findIndex(o=>o.i===k);if(n<0||isFixed(ps[n].p))return null;
 let a=n,b=n;while(a>0&&!isFixed(ps[a-1].p)&&Math.abs(slotEnd(ps[a-1].p)-N(ps[a].p.x))<EPS)a--;while(b<ps.length-1&&!isFixed(ps[b+1].p)&&Math.abs(N(ps[b+1].p.x)-slotEnd(ps[b].p))<EPS)b++;
 const ks=ps.slice(a,b+1).map(o=>o.i),x0=N(ps[a].p.x),x1=slotEnd(ps[b].p);
 // limites: vizinhos (peças ou aberturas) e as pontas da parede
 const ops=openingsAt(row),J=jh();let lo=0,hi=E.L;const prev=ps[a-1]?.p,next=ps[b+1]?.p;if(prev)lo=Math.max(lo,slotEnd(prev));if(next)hi=Math.min(hi,N(next.x));
 for(const[oa,ob]of ops){if(ob+J/2<=x0+.01)lo=Math.max(lo,ob+J/2);if(oa-J/2>=x1-.01)hi=Math.min(hi,oa-J/2);}
 for(const z of passOf(r)){if(z.v<=x0+.01)lo=Math.max(lo,z.v);if(z.u>=x1-.01)hi=Math.min(hi,z.u);}
 if(prev&&N(prev.x)<0&&lo<slotEnd(prev))lo=slotEnd(prev);
 return {r,ks,x0,x1,min:lo-x0,max:hi-x1};}
function matchRun(run,r2){// trecho correspondente em outra fiada: mesmas peças nas mesmas posições
 if(r2===run.r)return run;const row=E.rows[run.r],row2=E.rows[r2];if(row2.pieces.some(p=>p.channel))return null;const ref=run.ks.map(k=>row.pieces[k]);const ks=[];
 for(const p of ref){const k=row2.pieces.findIndex(q=>!isFixed(q)&&Math.abs(N(q.x)-N(p.x))<EPS&&Math.abs(N(q.length)-N(p.length))<.05);if(k<0)return null;ks.push(k);}
 const rr=runOf(r2,ks[0]);if(!rr||rr.ks.length!==ks.length||!ks.every(k=>rr.ks.includes(k)))return null;return rr;}
const sameParity=(r,only)=>only?[r]:E.rows.map((_,i)=>i).filter(i=>i%2===r%2&&!E.rows[i].pieces.some(p=>p.channel));

// ---------- desfazer do editor
function snap(){E.askClose=false;E.undo.push(clone(E.rows));if(E.undo.length>60)E.undo.shift();E.dirty=true;}
function undo(){const u=E.undo.pop();if(!u){msg('Nada para desfazer.');return;}E.rows=u;E.sel=null;draw();msg('Desfeito.');}

// ---------- operações
function delSel(only){if(!E.sel){msg('Selecione um bloco (1 clique) ou uma fiada (2 cliques).');return;}const {r,k,row:wholeRow}=E.sel;snap();let n=0,skip=0;
 if(wholeRow){for(const rr of sameParity(r,only)){const before=E.rows[rr].pieces.length;E.rows[rr].pieces=E.rows[rr].pieces.filter(p=>isFixed(p));n+=before-E.rows[rr].pieces.length;}}
 else{const p=E.rows[r].pieces[k];if(!p||isFixed(p)){E.undo.pop();msg('🔒 Canaleta ou filete: não pode ser apagado aqui.');return;}
  for(const rr of sameParity(r,only)){const q=rr===r?k:E.rows[rr].pieces.findIndex(o=>!isFixed(o)&&Math.abs(N(o.x)-N(p.x))<EPS&&Math.abs(N(o.length)-N(p.length))<.05);if(q<0){skip++;E.flag.add(rr);continue;}E.rows[rr].pieces.splice(q,1);n++;}}
 E.sel=null;draw();msg('Apagado: '+n+' peça(s)'+(only?' (só esta fiada)':' nas fiadas '+(r%2?'pares':'ímpares'))+(skip?' · '+skip+' fiada(s) diferentes ficaram como estavam (confira as destacadas)':'')+'. Clique nos vãos para preencher.');}
function moveRun(run,dx,only,commit){// aplica dx no trecho e nos correspondentes
 const res={moved:0,skip:0};for(const rr of sameParity(run.r,only)){const m=matchRun(run,rr);if(!m){if(rr!==run.r){res.skip++;E.flag.add(rr);}continue;}const d=Math.max(m.min,Math.min(m.max,dx));if(Math.abs(d-dx)>.01&&rr!==run.r){res.skip++;E.flag.add(rr);continue;}
  for(const k of m.ks)E.rows[rr].pieces[k].x=Math.round((N(E.rows[rr].pieces[k].x)+d)*100)/100;res.moved++;}
 return res;}
function bestDx(run){// posição de melhor amarração (maior defasagem mínima) dentro dos limites
 let best=0,bs=-1;const base=E.rows.map(r=>r.pieces.map(p=>N(p.x)));
 for(let d=Math.ceil(run.min*2)/2;d<=run.max+1e-9;d+=.5){for(const k of run.ks)E.rows[run.r].pieces[k].x=base[run.r][k]+d;const J=jointsOf(E.rows[run.r]).map(j=>j.x);let s=Infinity;
  for(const rr of [run.r-1,run.r+1]){if(rr<0||rr>=E.rows.length)continue;for(const k of jointsOf(E.rows[rr]))for(const x of J)s=Math.min(s,Math.abs(k.x-x));}
  if(s>bs+.01||(Math.abs(s-bs)<=.01&&Math.abs(d)<Math.abs(best))){bs=s;best=d;}}
 for(const k of run.ks)E.rows[run.r].pieces[k].x=base[run.r][k];return {d:best,score:bs};}
function palette(row){const h=N(row.pieces.find(p=>!p.channel)?.height)||19,W=N(E.w.width),mp=minPiece();
 const all=state.blocks.filter(b=>b.active!==false&&b.type!=='Canaleta'&&N(b.width)===W&&N(b.height)===h&&N(b.length)>0&&!(mp>0&&N(b.length)<mp)).map(b=>({code:b.code,len:N(b.length),pri:/^[A-Z]\d/.test(b.code)?0:1}));all.sort((a,b)=>a.pri-b.pri);const seen=new Set();return all.filter(b=>{const k=Math.round(b.len*10);if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>b.len-a.len);}
function tplOf(row){const p=row.pieces.find(q=>!q.fill&&!q.channel)||row.pieces[0]||{};return {y:N(p.y)||0,height:N(p.height)||19,width:N(p.width)||N(E.w.width),joint:jh()};}
function fillPlan(row,size,mode,cutLen){const J=jh(),pal=palette(row),mp=minPiece(),out=[];if(!pal.length)return {err:'Nenhum bloco do catálogo serve nesta fiada.'};
 if(mode==='filete'){if(size-J>4.01||size<=J)return {err:'Filete só até 4 cm (o vão tem '+f1(size-J)+' cm).'};return {pieces:[{fill:true,filete37:true,code:'FILETE',len:size-J}]};}
 if(mode==='cut'){const net=N(cutLen);if(!(net>0)||net+J>size+.01)return {err:'O corte precisa ser menor que o vão ('+f1(size-J)+' cm).'};if(mp&&net<mp)return {err:'Peça de '+f1(net)+' cm é menor que a peça mínima ('+mp+' cm).'};const src=pal.slice().reverse().find(b=>b.len>=net-.01);if(!src)return {err:'Nenhum bloco do catálogo é grande o bastante.'};
  const exact=Math.abs(src.len-net)<.05;return {pieces:[exact?{code:src.code,len:src.len}:{code:src.code+'_C'+net.toFixed(2),len:net,cut:true,src:src.code,srcLen:src.len}],rest:size-(net+J)};}
 // automático (V87.2): prioridade ao bloco principal (39); completa com uma ou duas peças inteiras; corte só se não houver jeito
 const W=N(E.w.width),mb=state.blocks.find(b=>b.active!==false&&b.type!=='Canaleta'&&N(b.width)===W&&/Principal/i.test(String(b.role||'')))||state.blocks.find(b=>b.active!==false&&N(b.width)===W&&Math.abs(N(b.length)-39)<.3);
 const main=pal.find(b=>mb&&b.code===mb.code)||pal.find(b=>Math.abs(b.len-39)<.3)||pal[0],stp=main.len+J,tol=.3;
 const tail=rem=>{if(rem<=.01)return [];const one=pal.filter(b=>Math.abs(b.len+J-rem)<=tol).sort((x,y)=>y.len-x.len)[0];if(one)return [{code:one.code,len:one.len,joint:rem-one.len}];
  for(const x of pal)for(const y of pal){if(y.len>x.len)continue;const d=x.len+y.len+2*J;if(Math.abs(d-rem)<=tol)return [{code:x.code,len:x.len},{code:y.code,len:y.len,joint:rem-(x.len+J)-y.len}];}return null;};
 for(let n=Math.floor((size+.01)/stp);n>=0;n--){const rem=size-n*stp,t=tail(rem);if(t){for(let k=0;k<n;k++)out.push({code:main.code,len:main.len,...(k===n-1&&!t.length?{joint:J+rem}:{})});out.push(...t);return {pieces:out};}}
 // sem fechamento com peças inteiras: blocos principais e, no fim, filete ou corte
 let n=Math.floor((size+.01)/stp),rem=size-n*stp;while(n>0&&mp&&rem-J>4.01&&rem-J<mp){n--;rem+=stp;}
 for(let k=0;k<n;k++)out.push({code:main.code,len:main.len});const net=rem-J;
 if(net>.01){if(net<=4.01)out.push({fill:true,filete37:true,code:'FILETE',len:net});
  else{if(mp&&net<mp)return {err:'O vão de '+f1(size-J)+' cm daria uma peça menor que '+mp+' cm. Sugestão: mova o trecho para juntar os vãos de um lado só, ou use um filete se for até 4 cm.',small:true};
   const src=pal.slice().reverse().find(b=>b.len>=net-.01);if(!src)return {err:'Vão maior que os blocos do catálogo.'};out.push({code:src.code+'_C'+net.toFixed(2),len:net,cut:true,src:src.code,srcLen:src.len});}}
 return {pieces:out};}
function applyFill(g,mode,cutLen,only){const plan0=fillPlan(E.rows[g.r],g.size,mode,cutLen);if(plan0.err){msg('⚠ '+plan0.err,true);return;}snap();let n=0,skip=0;
 for(const rr of sameParity(g.r,only)){const gs=gapsOf(rr).find(x=>Math.abs(x.a-g.a)<EPS&&Math.abs(x.size-g.size)<EPS);if(!gs){if(rr!==g.r){skip++;E.flag.add(rr);}continue;}const plan=rr===g.r?plan0:fillPlan(E.rows[rr],gs.size,mode,cutLen);if(plan.err){skip++;E.flag.add(rr);continue;}
  const t=tplOf(E.rows[rr]);let x=gs.a;for(const s of plan.pieces){const J=s.joint??t.joint;const p={code:s.code,x:Math.round(x*100)/100,y:t.y,length:Math.round(s.len*100)/100,height:t.height,width:t.width,joint:Math.round(J*100)/100,changed76:true,edited86:true};
   if(s.fill){p.fill=true;p.filete37=true;}if(s.cut){p.cut=true;p.baseCode=s.src;p.sourceCode=s.src;p.sourceLength=s.srcLen;p.cutAmount=Math.round((s.srcLen-s.len)*10)/10;}else if(!s.fill)p.baseCode=s.code;
   E.rows[rr].pieces.push(p);x+=s.len+J;}E.rows[rr].pieces.sort((a,b)=>a.x-b.x);n++;}
 hidePop();draw();msg('Vão preenchido em '+n+' fiada(s)'+(skip?' · '+skip+' fiada(s) com vão diferente ficaram como estavam':'')+'.');}

// ---------- V86.3: trocar bloco (botão direito) e trocar de lugar com o vizinho (T)
function limitAfter(rr,x){const row=E.rows[rr],J=jh();let hi=E.L;for(const p of row.pieces)if(isFixed(p)&&N(p.x)>=x+.01)hi=Math.min(hi,N(p.x));for(const[a]of openingsAt(row))if(a-J/2>=x+.01)hi=Math.min(hi,a-J/2);for(const z of passOf(rr))if(z.u>=x-.01)hi=Math.min(hi,z.u);return hi;}
function replacePiece(r,k,code,only){const p0=E.rows[r].pieces[k];if(!p0||isFixed(p0))return;const b=state.blocks.find(x=>x.code===code);if(!b)return;const len=N(b.length),J=jh();snap();let n=0,skip=0;
 for(const rr of sameParity(r,only)){const row=E.rows[rr],q=rr===r?p0:row.pieces.find(o=>!isFixed(o)&&Math.abs(N(o.x)-N(p0.x))<EPS&&Math.abs(N(o.length)-N(p0.length))<.05);if(!q){if(rr!==r){skip++;E.flag.add(rr);}continue;}
  const x=N(q.x),end=x+len+J;if(end>limitAfter(rr,x)+.05){skip++;E.flag.add(rr);continue;}
  row.pieces=row.pieces.filter(o=>o===q||isFixed(o)||!(N(o.x)>=x-.01&&N(o.x)<end-.05));
  const nx=row.pieces.filter(o=>o!==q&&N(o.x)>x+.01).sort((a,c)=>a.x-c.x)[0],oldEnd=slotEnd(q);
  Object.assign(q,{code:b.code,length:len,joint:J,baseCode:b.code,changed76:true,edited86:true});for(const key of['cut','sourceCode','sourceLength','cutAmount'])delete q[key];
  // o que sobrou até a próxima peça vira complemento automático
  const g=gapsOf(rr).find(o=>Math.abs(o.a-end)<EPS);if(g&&end>oldEnd-.05){const plan=fillPlan(row,g.size,'auto');if(!plan.err){const t=tplOf(row);let xx=g.a;for(const s of plan.pieces){const jj=s.joint??t.joint,np={code:s.code,x:Math.round(xx*100)/100,y:t.y,length:Math.round(s.len*100)/100,height:t.height,width:t.width,joint:Math.round(jj*100)/100,changed76:true,edited86:true};if(s.fill){np.fill=true;np.filete37=true;}if(s.cut){np.cut=true;np.baseCode=s.src;np.sourceCode=s.src;np.sourceLength=s.srcLen;np.cutAmount=Math.round((s.srcLen-s.len)*10)/10;}else if(!s.fill)np.baseCode=s.code;row.pieces.push(np);xx+=s.len+jj;}}}
  row.pieces.sort((a,c)=>a.x-c.x);n++;}
 if(!n){E.undo.pop();msg('⚠ O '+code+' não cabe aqui: passaria por cima de uma abertura, canaleta ou da parede vizinha.',true);draw();return;}
 E.sel=null;hidePop();draw();msg('Trocado por '+code+' em '+n+' fiada(s)'+(only?' (só esta fiada)':'')+(skip?' · '+skip+' fiada(s) diferentes ou sem espaço ficaram como estavam':'')+'.');}
function showSwapPop(r,k,e){const p=E.rows[r].pieces[k];if(!p)return;if(isFixed(p)){msg('🔒 Esta peça não pode ser trocada.');return;}E.sel={r,k};draw();const pop=box.querySelector('#ed86pop'),pal=palette(E.rows[r]);
 pop.innerHTML='<div class="pt86">Trocar <b>'+esc(p.cut?(p.sourceCode||'')+'✂'+f1(p.length):p.code)+'</b> por · fiada '+(r+1)+'</div><div class="pl86">'+pal.map(b=>'<button type="button" data-c="'+esc(b.code)+'"'+(b.code===p.code?' disabled':'')+'>'+esc(b.code)+' <small>'+f1(b.len)+'</small></button>').join('')+'</div><div class="ph86">Começa no mesmo ponto; o que sobrar vira complemento. Fiadas '+((r%2)?'pares':'ímpares')+(only()?' — <b>só esta fiada</b>':'')+' (Shift = só esta).</div>';
 const R=box.getBoundingClientRect();pop.style.left=Math.min(R.width-290,Math.max(8,e.clientX-R.left+10))+'px';pop.style.top=Math.min(R.height-200,Math.max(8,e.clientY-R.top+10))+'px';pop.hidden=false;
 pop.onclick=ev=>{const b=ev.target.closest('button[data-c]');if(!b)return;replacePiece(r,k,b.dataset.c,only()||ev.shiftKey||e.shiftKey);};}
function swapNext(only){if(!E.sel||E.sel.row){msg('Selecione um bloco e aperte T para trocar de lugar com o da direita.');return;}const {r,k}=E.sel,p0=E.rows[r].pieces[k];if(!p0||isFixed(p0))return;snap();let n=0,skip=0;
 for(const rr of sameParity(r,only)){const row=E.rows[rr],p=rr===r?p0:row.pieces.find(o=>!isFixed(o)&&Math.abs(N(o.x)-N(p0.x))<EPS&&Math.abs(N(o.length)-N(p0.length))<.05);const q=p&&row.pieces.find(o=>o!==p&&Math.abs(N(o.x)-slotEnd(p))<EPS);if(!p||!q||isFixed(q)){skip++;if(rr!==r)E.flag.add(rr);continue;}
  const x=N(p.x);q.x=x;p.x=Math.round((x+N(q.length)+N(q.joint||0))*100)/100;p.edited86=q.edited86=true;row.pieces.sort((a,c)=>a.x-c.x);n++;}
 if(!n){E.undo.pop();msg('Não há bloco livre encostado à direita para trocar.',true);return;}E.sel=null;draw();msg('Trocados de lugar em '+n+' fiada(s)'+(skip?' · '+skip+' fiada(s) diferentes ficaram como estavam':'')+'.');}

// ---------- desenho
const COL={14:'#c7b3e0',19:'#a9c7d6',29:'#8fc0a0',34:'#e4c570',39:'#d98956',44:'#c9848f',54:'#8fa6d6'};
const colorOf=p=>p.fill?'#cfd5db':p.cut?'#f2b8b8':p.channel?'#b9c2cc':(COL[Math.round(N(p.length))]||'#d9b38c');
function draw(){if(!E)return;const svg=box.querySelector('#ed86svg');const H=E.rows.length*E.step,L=E.L,pad=30;
 svg.setAttribute('viewBox',[-pad-12,-pad,L+2*pad+12,H+2*pad+10].join(' '));
 const bs=bondState();let h='<defs><pattern id="h86" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="4" stroke="#c0392b" stroke-width="1.2"/></pattern><pattern id="c86" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="3" stroke="#7a1f1f" stroke-width=".5"/></pattern></defs>';
 h+='<rect x="0" y="0" width="'+L+'" height="'+H+'" fill="#fff" stroke="#9aa7b4" stroke-width=".6"/>';
 for(const o of E.w.openings||[]){const y=H-(N(o.bottom)+N(o.height));h+='<rect x="'+N(o.start)+'" y="'+y+'" width="'+N(o.width)+'" height="'+N(o.height)+'" fill="#eef3f8" stroke="#5b7a99" stroke-dasharray="3 2" stroke-width=".6"/><text x="'+(N(o.start)+N(o.width)/2)+'" y="'+(y+N(o.height)/2)+'" font-size="6" text-anchor="middle" dominant-baseline="central" fill="#5b7a99">vão '+f1(o.width)+' × '+f1(o.height)+'</text>';}
 E.rows.forEach((row,r)=>{const yb=rowY(r),selRow=E.sel?.row&&E.sel.r===r,hl=E.flag?.has(r);
  row.pieces.forEach((p,k)=>{const x=N(p.x)+N(p.joint||0)/2,w=N(p.length),hh=N(p.height)||19,y=H-(N(p.y??yb)+hh);const sel=E.sel&&!E.sel.row&&E.sel.r===r&&E.sel.k===k,inRun=E.drag&&E.drag.rows?.has(r)&&E.drag.ks?.[r]?.includes(k);
   h+='<g class="pc86" data-r="'+r+'" data-k="'+k+'"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" fill="'+colorOf(p)+'" stroke="'+(sel||inRun?'#1f6fd1':selRow?'#1f6fd1':'#384c5c')+'" stroke-width="'+(sel||selRow||inRun?1.6:.4)+'"/>'+(p.cut?'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+hh+'" fill="url(#c86)" opacity=".35" pointer-events="none"/>':'')+
    (w>=9?'<text x="'+(x+w/2)+'" y="'+(y+hh/2)+'" font-size="'+Math.min(6.2,hh*.36)+'" text-anchor="middle" dominant-baseline="central" pointer-events="none" fill="#1b2b3a">'+(p.fill?'filete':esc(String(p.cut?(p.sourceCode||'')+'✂'+f1(p.length):p.code)))+'</text>':'')+
    (isFixed(p)&&!p.channel&&!p.fill?'<text x="'+(x+w-1)+'" y="'+(y+5)+'" font-size="4.5" text-anchor="end" pointer-events="none">🔒</text>':'')+'</g>';});
  // passagem da parede vizinha: bloco dela visto de topo (X) — travado
  {const hh=N(row.pieces.find(p=>!p.channel)?.height)||19,y=H-(yb+hh);for(const z of passOf(r)){const u=z.u,v=z.v;
   h+='<g class="ps86" data-r="'+r+'"><rect x="'+u+'" y="'+y+'" width="'+(v-u)+'" height="'+hh+'" fill="#e3e8ee" stroke="#384c5c" stroke-width=".5"/><path d="M'+u+' '+y+'L'+v+' '+(y+hh)+'M'+v+' '+y+'L'+u+' '+(y+hh)+'" stroke="#384c5c" stroke-width=".55"/>'+(v-u>=8?'<text x="'+((u+v)/2)+'" y="'+(y+hh-2.2)+'" font-size="3.6" text-anchor="middle" fill="#40566b" paint-order="stroke" stroke="#e3e8ee" stroke-width="1.6">P'+z.no+'</text>':'')+'</g>';}}
  // vãos
  for(const g of gapsOf(r)){const hh=N(row.pieces.find(p=>!p.channel)?.height)||19,y=H-(yb+hh),small=minPiece()&&g.size-jh()<minPiece()&&g.size-jh()>4.01;
   h+='<g class="gap86" data-r="'+r+'" data-a="'+g.a+'" data-b="'+g.b+'"><rect x="'+g.a+'" y="'+y+'" width="'+g.size+'" height="'+hh+'" fill="url(#h86)" stroke="'+(small?'#c0392b':'#e67e22')+'" stroke-width=".8"/>'+(g.size>=7?'<text x="'+(g.a+g.size/2)+'" y="'+(y+hh/2)+'" font-size="5.2" text-anchor="middle" dominant-baseline="central" fill="#7a1f1f" font-weight="700" pointer-events="none">'+f1(g.size-jh())+'</text>':'')+'</g>';}
  // numeração da fiada
  h+='<text x="-6" y="'+(H-(yb+(N(row.pieces[0]?.height)||19)/2))+'" font-size="6.5" text-anchor="end" dominant-baseline="central" fill="'+(bs.bad.has(r)?'#c0392b':hl?'#e67e22':'#40566b')+'" font-weight="'+(bs.bad.has(r)||hl?700:400)+'" class="rn86" data-r="'+r+'">'+(r+1)+'</text>';});
 // encontros sem amarração (por cima de tudo)
 for(const c of bs.cv){const r=c.r,hh=N(E.rows[r].pieces.find(p=>!p.channel)?.height)||19,y=H-(rowY(r)+hh);h+='<rect x="'+c.c0+'" y="'+(y+.6)+'" width="'+(c.c1-c.c0)+'" height="'+(hh-1.2)+'" fill="none" stroke="#e02424" stroke-width="1.4" stroke-dasharray="2 1.2" pointer-events="none"/><text x="'+((c.c0+c.c1)/2)+'" y="'+(y-1.2)+'" font-size="4" text-anchor="middle" fill="#e02424" font-weight="700" pointer-events="none">sem amarração P'+c.no+'</text>';}
 // juntas: verde = defasagem ok · vermelho = alinhada com a fiada de cima/baixo
 bs.J.forEach((js,r)=>{const yb=rowY(r),hh=N(E.rows[r].pieces.find(p=>!p.channel)?.height)||19,y=H-(yb+hh);for(const j of js)h+='<line x1="'+j.x+'" x2="'+j.x+'" y1="'+(y+1)+'" y2="'+(y+hh-1)+'" stroke="'+(j.ok?'#1d9a4a':'#e02424')+'" stroke-width="'+(j.ok?1.1:2.2)+'" pointer-events="none"/>';});
 // cota do arraste
 if(E.drag?.dx!==undefined){h+='<text x="'+(E.drag.cx)+'" y="'+(H-(rowY(E.drag.run.r)+20)-3)+'" font-size="7" text-anchor="middle" fill="#1f6fd1" font-weight="700">'+(E.drag.dx>=0?'+':'')+f1(E.drag.dx)+' cm'+(E.drag.snapped?' · amarração ideal':'')+'</text>';}
 svg.innerHTML=h;
 const st=box.querySelector('#ed86bond');st.innerHTML=bs.cv.length?'<b style="color:#e02424">● '+bs.cv.length+' fiada(s) sem amarração no encontro</b> ('+[...new Set(bs.cv.map(c=>'P'+c.no))].join(', ')+') — um bloco desta parede precisa cobrir a passagem'+(bs.nb?' · '+bs.nb+' junta(s) alinhada(s)':''):bs.nb?'<b style="color:#e02424">● '+bs.nb+' junta(s) alinhada(s)</b> nas fiadas '+[...bs.bad].map(r=>r+1).join(', '):'<b style="color:#1d9a4a">● Amarração OK em todas as fiadas</b>';
 const gs=E.rows.reduce((a,_,r)=>a+gapsOf(r).length,0);box.querySelector('#ed86gaps').textContent=gs?gs+' vão(s) a preencher':'';
 box.querySelector('#ed86sel').textContent=E.sel?(E.sel.row?'Fiada '+(E.sel.r+1)+' selecionada':'Fiada '+(E.sel.r+1)+' · '+(E.rows[E.sel.r].pieces[E.sel.k]?.code||'')):'Nada selecionado';}
function msg(t,warn){const m=box.querySelector('#ed86msg');if(m){m.textContent=t||'';m.className=warn?'w86':'';}}

// ---------- abrir / fechar / salvar
function open(i){const w=state.walls?.[i],m=state.results?.[i];if(!w||!m?.rows?.length){alert('Esta parede ainda não tem modulação. Gere a modulação primeiro.');return;}
  E={i,w,m,rows:clone(m.rows),L:N(m.L)||N(w.length),step:N(m.step)||20,undo:[],sel:null,drag:null,dirty:false,flag:new Set()};classify();
 box.innerHTML='<div class="bar86"><b>✏ Editar elevação · Parede '+(i+1)+'</b><span class="d86">'+f1(E.L)+' × '+f1(N(w.height))+' cm</span>'+
 '<span class="sep86"></span><span class="hint86">clique = bloco · 2× = fiada · <b>arraste</b> · <b>Delete</b> (Shift = só a fiada) · <b>setas</b> 0,5 · <b>vão</b> = preencher · <b>botão direito</b> = trocar bloco · <b>T</b> = trocar de lugar</span>'+
 '<span class="sp86"></span><button type="button" id="ed86undo" title="Ctrl+Z">↶ Desfazer</button><button type="button" id="ed86del">🗑 Apagar</button><label class="only86"><input type="checkbox" id="ed86only"> só esta fiada</label>'+
 '<button type="button" id="ed86save" class="secondary">Salvar</button><button type="button" id="ed86ok" class="ok86">✔ Parede OK</button><button type="button" id="ed86close" class="secondary">✕ Fechar</button></div>'+
 '<div class="st86"><span id="ed86bond"></span><span id="ed86gaps"></span><span id="ed86sel"></span><span id="ed86msg"></span></div><div class="cv86"><svg id="ed86svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg></div><div id="ed86pop" hidden></div>';
 box.hidden=false;document.body.classList.add('ed86on');draw();msg((w.locked76?'Parede aprovada e travada: ao salvar ela volta a ser aprovada. ':'')+'Editando a Parede '+(i+1)+'. Só os blocos da parede vizinha (com X) ficam travados; os desta parede, inclusive no encontro, você pode mover, apagar e trocar (botão direito).');
 box.querySelector('#ed86undo').onclick=undo;box.querySelector('#ed86del').onclick=()=>delSel(only());box.querySelector('#ed86close').onclick=()=>close(false);
 box.querySelector('#ed86save').onclick=()=>save(false);box.querySelector('#ed86ok').onclick=()=>save(true);wire();}
const only=()=>!!box.querySelector('#ed86only')?.checked;
function close(force){if(!E)return;if(!force&&E.dirty&&!E.askClose){E.askClose=true;msg('Há alterações não salvas: clique em ✕ Fechar de novo para descartar, ou em Salvar / ✔ Parede OK.',true);return;}E=null;box.hidden=true;box.innerHTML='';document.body.classList.remove('ed86on');}
function save(ok){if(!E)return;const {i,w,m}=E;const bs=bondState(),gaps=E.rows.reduce((a,_,r)=>a+gapsOf(r).length,0);
 E.rows.forEach((row,r)=>{for(const z of E.cover[r]||[]){const p=row.pieces.find(p=>!p.fill&&N(p.x)<=z.c0+.6&&slotEnd(p)>=z.c1-.6);if(p&&!p.junction){p.junction=z.jid;p.meeting=true;}}});
 const nc=bs.cv.length;const rows=E.rows.map(r=>({...r,pieces:r.pieces.slice().sort((a,b)=>a.x-b.x)}));const issues=bs.nb>0||gaps>0||nc>0;
 const warn=(m.warnings||[]).filter(t=>!/Editada no editor da elevação/.test(t));
 let nm={...m,rows,bondIssues:[],bondPending:bs.nb>0,closurePending:gaps>0,manual:false,edited86:{at:new Date().toISOString(),bad:bs.nb,gaps},pending:issues,statusReason:issues?[nc?nc+' fiada(s) sem amarração no encontro':'',bs.nb?bs.nb+' junta(s) alinhada(s)':'',gaps?gaps+' vão(s) sem preencher':''].filter(Boolean).join(' · ')+' — editada à mão':'',warnings:[...warn,'Editada no editor da elevação ('+new Date().toLocaleDateString('pt-BR')+').']};
 delete nm.sourceErrors;delete nm.revisionStale;delete nm.approvedBy78;
 try{nm=quantify(nm);}catch(e){console.error('V86 quantify',e);}
 state.results[i]=nm;state.savedResults??={};state.savedResults[w.uid]={signature:sourceSignature(w),neighbours:neighbourSignature(i),result:clone(nm),bondVersion:bondVer53()};
 delete w.locked76;if(issues&&!ok)w.manualRows=clone(rows);else delete w.manualRows;
 close(true);
 if(ok)w.confirmed=true;// V108.3: ✔ Parede OK também marca a parede como conferida
 if(ok){if(issues){window.approveOK80?.(i);}else{try{window.setLock76?.(i,true);}catch{}}}else{if(!issues){try{window.setLock76?.(i,true);}catch{}}else renderResults({reports:state.junctionReports||[]},state.results);}
 try{drawPlan();}catch{}
 $('planStatus').textContent='Parede '+(i+1)+': edição da elevação salva'+(ok?' e aprovada (✔ Parede OK, travada)':issues?' com pendência ('+nm.statusReason+')':' e travada')+'. Plantas de 1ª/2ª fiada, quantitativos e pranchas atualizados.';
 try{window.select85?.(i);}catch{}}
window.ed86={open,close,isOpen:()=>!!E,_E:()=>E};
try{const ab=auditDisplayedBonding;auditDisplayedBonding=function(results,...x){const r=ab.call(this,results,...x);try{for(const m of results||[])if(m?.approvedBy78&&m.bondPending){m.pending=false;m.statusReason='';m.bondPending=false;}}catch{}return r;};}catch(e){console.error('V86',e);}

// ---------- mouse e teclado
function hitOf(t){const g=t.closest?.('.pc86,.gap86,.rn86');if(!g)return null;if(g.classList.contains('pc86'))return {kind:'pc',r:N(g.dataset.r),k:N(g.dataset.k)};if(g.classList.contains('gap86'))return {kind:'gap',r:N(g.dataset.r),a:N(g.dataset.a),b:N(g.dataset.b)};return {kind:'row',r:N(g.dataset.r)};}
function toCm(e){const svg=box.querySelector('#ed86svg'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse());}
let lastClick={t:0,r:-1,k:-1};
function wire(){const svg=box.querySelector('#ed86svg');
 svg.addEventListener('pointerdown',e=>{if(!E||e.button!==0)return;const h=hitOf(e.target);hidePop();if(!h){E.sel=null;draw();return;}
  if(h.kind==='row'){E.sel={r:h.r,row:true};draw();return;}
  if(h.kind==='gap'){const g=gapsOf(h.r).find(x=>Math.abs(x.a-h.a)<.01);if(g)showPop(g,e);return;}
  const now=Date.now();if(now-lastClick.t<350&&lastClick.r===h.r&&lastClick.k===h.k){E.sel={r:h.r,row:true};lastClick={t:0};draw();return;}lastClick={t:now,r:h.r,k:h.k};
  E.sel={r:h.r,k:h.k};const p=E.rows[h.r].pieces[h.k];if(isFixed(p)){draw();msg('🔒 '+(p.channel?'Canaleta: fica como está.':p.fill?'Filete: apague o bloco ao lado e preencha o vão de novo.':'Peça travada.'));return;}
  const run=runOf(h.r,h.k);if(!run){draw();return;}const P=toCm(e);E.drag={run,start:P.x,base:clone(E.rows),dx:undefined,moved:false,shift:e.shiftKey||only(),rows:new Set([h.r]),ks:{[h.r]:run.ks},cx:(run.x0+run.x1)/2,best:bestDx(run)};svg.setPointerCapture(e.pointerId);draw();});
 svg.addEventListener('contextmenu',e=>{if(!E)return;e.preventDefault();const h=hitOf(e.target);if(h?.kind==='pc')showSwapPop(h.r,h.k,e);});
 svg.addEventListener('pointermove',e=>{if(!E?.drag)return;const P=toCm(e),D=E.drag;let dx=P.x-D.start;if(!D.moved&&Math.abs(dx)<1.5)return;D.moved=true;dx=Math.round(dx*2)/2;dx=Math.max(D.run.min,Math.min(D.run.max,dx));D.snapped=false;if(Math.abs(dx-D.best.d)<=3&&D.best.score>0){dx=D.best.d;D.snapped=true;}
  E.rows=clone(D.base);const res=moveRun(D.run,dx,D.shift);D.dx=dx;D.res=res;D.cx=(D.run.x0+D.run.x1)/2+dx;draw();});
 svg.addEventListener('pointerup',e=>{if(!E?.drag)return;const D=E.drag;E.drag=null;if(!D.moved||!D.dx){E.rows=D.base;draw();return;}E.undo.push(D.base);E.dirty=true;draw();
  msg('Trecho movido '+(D.dx>0?'+':'')+f1(D.dx)+' cm em '+(D.res?.moved||1)+' fiada(s)'+(D.shift?' (só esta fiada)':'')+(D.res?.skip?' · '+D.res.skip+' fiada(s) diferentes não foram movidas':'')+(D.snapped?' · posição de melhor amarração':'')+'. Clique nos vãos para preencher.');});}
function showPop(g,e){const pop=box.querySelector('#ed86pop'),net=g.size-jh(),mp=minPiece();const auto=fillPlan(E.rows[g.r],g.size,'auto');
 pop.innerHTML='<div class="pt86">Vão de <b>'+f1(net)+' cm</b> · fiada '+(g.r+1)+'</div>'+
 (auto.err?'<div class="pw86">⚠ '+auto.err+'</div>':'<button type="button" data-m="auto">⚡ Automático: '+auto.pieces.map(s=>s.fill?'filete '+f1(s.len)+' cm':s.cut?s.src+' cortado em '+f1(s.len):s.code).join(' + ')+'</button>')+
 '<div class="pr86"><span>Corte de</span><input type="number" step="0.5" min="1" id="ed86cut" value="'+Math.max(mp||0,Math.round(net*2)/2)+'"><span>cm</span><button type="button" data-m="cut">Aplicar</button></div>'+
 (net<=4.01&&net>0?'<button type="button" data-m="filete">Filete de '+f1(net)+' cm</button>':'')+'<div class="ph86">Aplica nas fiadas '+((g.r%2)?'pares':'ímpares')+' com o mesmo vão'+(only()?' — <b>só esta fiada</b> marcado':'')+' (Shift = só esta).</div>';
 const R=box.getBoundingClientRect();pop.style.left=Math.min(R.width-290,Math.max(8,e.clientX-R.left+10))+'px';pop.style.top=Math.min(R.height-170,Math.max(8,e.clientY-R.top+10))+'px';pop.hidden=false;
 pop.onclick=ev=>{const b=ev.target.closest('button[data-m]');if(!b)return;applyFill(g,b.dataset.m,box.querySelector('#ed86cut')?.value,only()||e.shiftKey);};}
function hidePop(){const p=box.querySelector('#ed86pop');if(p)p.hidden=true;}
window.addEventListener('keydown',e=>{if(!E)return;try{if(window.st91?.key?.(e))return;}catch(er){console.error(er);}const t=e.target;if(t&&/^(input|textarea|select)$/i.test(t.tagName)&&t.type!=='checkbox')return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopImmediatePropagation();undo();return;}
 if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopImmediatePropagation();delSel(e.shiftKey||only());return;}
 if(e.key==='t'||e.key==='T'){if(e.ctrlKey||e.metaKey||e.altKey)return;e.preventDefault();e.stopImmediatePropagation();swapNext(e.shiftKey||only());return;}
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!box.querySelector('#ed86pop')?.hidden){hidePop();return;}if(E.sel){E.sel=null;draw();return;}close(false);return;}
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){if(!E.sel||E.sel.row)return;e.preventDefault();e.stopImmediatePropagation();const run=runOf(E.sel.r,E.sel.k);if(!run){msg('🔒 Este bloco não se move.');return;}const d=e.key==='ArrowLeft'?-.5:.5;if(d<run.min-1e-9||d>run.max+1e-9){msg('Encostou no ponto fixo: não dá para mover mais.');return;}snap();const res=moveRun(run,d,e.shiftKey||only());draw();msg('Movido '+(d>0?'+':'')+'0,5 cm em '+res.moved+' fiada(s).');}},true);

// ---------- entradas: botão em cada parede, painel lateral e barra de Elevações
try{const rr=renderResults;renderResults=function(...a){const r=rr.apply(this,a);try{(state.results||[]).forEach((m,i)=>{if(!m?.rows?.length)return;const art=$('wall-result-'+i);if(!art||art.querySelector('.ed86btn'))return;const ev=art.querySelector('.elevationView'),h=art.querySelector('h3');if(!ev&&!h)return;const b=document.createElement('button');b.type='button';b.className='ed86btn noPrint';b.innerHTML='✏ Editar elevação <small>— clicar, arrastar e preencher os blocos desta parede</small>';b.onclick=()=>open(i);const host=ev&&ev.parentElement&&ev.parentElement!==art&&/flex|grid/.test(getComputedStyle(ev.parentElement).display)?ev.parentElement:ev;if(host)host.before(b);else h.after(b);});}catch{}return r;};}catch(e){console.error('V86',e);}

const css=document.createElement('style');css.textContent=`
#ed86{position:fixed;inset:0;z-index:90;background:#f4f7fa;display:flex;flex-direction:column;font:13px "Segoe UI",Arial,sans-serif}
body.ui85 #ed86{top:132px;left:0;right:var(--sw85,340px);bottom:26px;z-index:58;border-right:1px solid #c9d3de}
#ed86[hidden]{display:none}
#ed86 .bar86{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 12px;background:#0f2f4f;color:#fff}
#ed86 .bar86 b{font-size:14px}#ed86 .d86{color:#cfe0f0}#ed86 .sep86{width:1px;height:22px;background:#2e5f8f}#ed86 .hint86{color:#cfe0f0;font-size:11.5px;flex:1;min-width:260px;line-height:1.3}#ed86 .hint86 b{color:#fff;font-size:12px}
#ed86 .bar86 button{background:#1c4670;color:#fff;border:1px solid #2e5f8f;border-radius:6px;padding:5px 10px;margin:0;font-size:12.5px;cursor:pointer}
#ed86 .bar86 button.ok86{background:#1d7a3a;border-color:#2a9a4c;font-weight:700}#ed86 .only86{display:flex;align-items:center;gap:4px;font-size:12px;color:#cfe0f0;margin:0;white-space:nowrap}
#ed86 .st86{display:flex;gap:16px;align-items:center;padding:5px 12px;background:#fff;border-bottom:1px solid #c9d3de;flex-wrap:wrap;font-size:12.5px}
#ed86 #ed86msg{margin-left:auto;color:#174a78}#ed86 #ed86msg.w86{color:#a3361f;font-weight:600}#ed86 #ed86gaps{color:#a3361f}
#ed86 .cv86{flex:1;min-height:0;overflow:auto;padding:10px}#ed86 #ed86svg{width:100%;height:100%;min-height:340px;touch-action:none;user-select:none;cursor:default;background:#fbfcfd;border:1px solid #c9d3de;border-radius:6px}
#ed86 .pc86{cursor:grab}#ed86 .gap86{cursor:pointer}#ed86 .rn86{cursor:pointer}
#ed86 #ed86pop{position:absolute;width:280px;background:#fff;border:1px solid #9fb6cf;border-radius:8px;box-shadow:0 8px 24px #0003;padding:9px;display:flex;flex-direction:column;gap:6px;z-index:5}
#ed86 #ed86pop[hidden]{display:none}#ed86 #ed86pop button{text-align:left;padding:6px 8px;border-radius:5px;border:1px solid #cdd7e1;background:#eef4fb;cursor:pointer;margin:0;font-size:12.5px;color:#1b2b3a}
#ed86 .pr86{display:flex;align-items:center;gap:5px}#ed86 .pr86 input{width:64px;padding:3px 5px}#ed86 .pt86{font-size:13px}#ed86 .pw86{color:#a3361f;font-size:12px}#ed86 .ph86{color:#6b7c8d;font-size:11px}
.pl86{display:flex;flex-wrap:wrap;gap:4px;margin:4px 0}.pl86 button{padding:4px 8px!important;min-width:0!important}.pl86 small{opacity:.65}
.ed86btn{display:block;margin:8px 0 6px 0;padding:8px 16px;border-radius:7px;background:#174a78;color:#fff;border:0;cursor:pointer;font-size:14px;font-weight:600;box-shadow:0 1px 3px #0002}.ed86btn small{font-weight:400;opacity:.8;font-size:12px}`;
document.head.append(css);
})();
