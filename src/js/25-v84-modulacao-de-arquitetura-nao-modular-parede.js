// V84 — modulação de arquitetura não modular: parede dupla, encontros próximos com amarração indireta (grampo), peça mínima,
// corte automático para nenhuma parede ficar sem desenho, liberação por partes (no motor), respaldo U/J pela laje e diagnóstico.
(function(){
'use strict';
const N=Number,f1=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1});
const CFG=()=>{state.mod84??={};const c=state.mod84;if(c.minPiece===undefined)c.minPiece=14;if(c.dual===undefined)c.dual=true;if(c.indirect===undefined)c.indirect=true;return c;};
const jh=()=>N($('jh')?.value)||1;
const lenPx=w=>Math.hypot(w.line[1].x-w.line[0].x,w.line[1].y-w.line[0].y);
const kOf=w=>N(w.planScale)||lenPx(w)/N(w.length);
const uid=()=>'wall-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);

// ---------- 1. Peça mínima + liberação por partes + corte de reforço (no envio para o motor)
let boost84=false;
try{const gp=generationPayload;generationPayload=function(...a){const p=gp.apply(this,a);try{const mp=window.__noMin84?0:(N(CFG().minPiece)||0);
 if(mp>0)p.blocks=p.blocks.filter(b=>!(b.type!=='Canaleta'&&N(b.length)<mp));
 if(mp>0&&p.opts?.stableModels){const sm=Array.isArray(p.opts.stableModels)?p.opts.stableModels.slice():{...p.opts.stableModels};let cut=0;for(const k of Object.keys(sm)){const m=sm[k];if(m&&(m.rows||[]).some(r=>(r.pieces||[]).some(q=>!q.fill&&!q.channel&&!q.gap&&N(q.length)<mp))){if(Array.isArray(sm))sm[k]=undefined;else delete sm[k];cut++;}}if(cut)p.opts={...p.opts,stableModels:sm};}
 p.opts={...(p.opts||{}),release84:true,relLoops84:window.__relLoops84||1};p.walls=p.walls.map((w,i)=>state.walls[i]?.inGap84?{...w,page:800000+i,gap84:true}:state.walls[i]&&!state.walls[i].confirmed?{...w,page:700000+i}:w);if(boost84)p.cutOptions23={enabled:true,max:10};}catch(e){console.error('V84',e);}return p;};}catch(e){console.error('V84',e);}
// o desenho parcial (feito fora do motor quando um conjunto não fecha) também respeita a peça mínima
try{const pm=partialModel;partialModel=function(...a){const mp=window.__noMin84?0:(N(CFG().minPiece)||0);if(!(mp>0))return pm.apply(this,a);const keep=state.blocks;state.blocks=keep.filter(b=>!(b.type!=='Canaleta'&&N(b.length)<mp));try{return pm.apply(this,a);}finally{state.blocks=keep;}};}catch(e){console.error('V85',e);}
// campo “peça mínima”
{const fm=$('fillMax');if(fm&&!$('minPiece84')){const lab=document.createElement('label');lab.innerHTML='Peça mínima na modulação (cm)<input id="minPiece84" type="number" min="0" max="39" step="1" value="14"><span class="note">Peças do catálogo menores que isto (ex.: partilha de 5 cm) não são usadas; o programa prefere cortar um bloco. 0 = sem limite.</span>';fm.closest('label').after(lab);
 const inp=lab.querySelector('input');inp.onchange=()=>{CFG().minPiece=Math.max(0,N(inp.value)||0);try{invalidate();}catch{}};}}
const syncUI=()=>{const i=$('minPiece84');if(i)i.value=CFG().minPiece;};

// ---------- 2. Parede dupla (geminada): divide as paredes que atravessam as duas
function dualPairs(walls){const out=[];for(let a=0;a<walls.length;a++)for(let b=a+1;b<walls.length;b++){const A=walls[a],B=walls[b];if(!A.line||!B.line||N(A.page||1)!==N(B.page||1))continue;
 const ua=unit(A),ub=unit(B);if(Math.abs(ua.x*ub.x+ua.y*ub.y)<.999)continue;const k=kOf(A),n={x:-ua.y,y:ua.x},d=Math.abs((B.line[0].x-A.line[0].x)*n.x+(B.line[0].y-A.line[0].y)*n.y)/k,tt=(N(A.width)+N(B.width))/2;
 if(d<tt-2||d>tt+5)continue;const pa=[0,lenPx(A)],pb=B.line.map(P=>(P.x-A.line[0].x)*ua.x+(P.y-A.line[0].y)*ua.y).sort((x,y)=>x-y);const ov=(Math.min(pa[1],pb[1])-Math.max(pa[0],pb[0]))/k;if(ov<50)continue;out.push([a,b]);}return out;}
const unit=w=>{const L=lenPx(w);return {x:(w.line[1].x-w.line[0].x)/L,y:(w.line[1].y-w.line[0].y)/L};};
function crossParam(W,T){// parâmetro (cm, ao longo de W) onde o eixo de T cruza W; null se não cruza dentro de W e de T
 const u=unit(W),v=unit(T),cr=u.x*v.y-u.y*v.x;if(Math.abs(cr)<.995)return null;const kW=kOf(W),kT=kOf(T),dx=T.line[0].x-W.line[0].x,dy=T.line[0].y-W.line[0].y,s=(dx*v.y-dy*v.x)/cr/kW,t=(dx*u.y-dy*u.x)/cr/kT;
 if(s<1.1||s>N(W.length)-1.1)return null;if(t<-1.1||t>N(T.length)+1.1)return null;return s;}
function splitDual(){if(!CFG().dual)return 0;const walls=state.walls,pairs=dualPairs(walls);if(!pairs.length)return 0;let n=0;const log=[];
 for(const[a,b]of pairs){const A=walls[a],B=walls[b],ua=unit(A),k=kOf(A),nn={x:-ua.y,y:ua.x},off=P=>((P.x-A.line[0].x)*nn.x+(P.y-A.line[0].y)*nn.y)/k,dB=off(B.line[0]);
  walls.forEach((W,i)=>{if(W===A||W===B||!W.line||W.inGap84||N(W.page||1)!==N(A.page||1))return;const uw=unit(W);if(Math.abs(uw.x*ua.x+uw.y*ua.y)<.999)return;const o=(off(W.line[0])+off(W.line[1]))/2;const lo=Math.min(0,dB),hi=Math.max(0,dB);if(o>lo+.5&&o<hi-.5){W.inGap84={a:A.uid,b:B.uid};n++;state.log84=(state.log84||[]).concat(['Parede '+(i+1)+' (L = '+f1(W.length)+' cm) está dentro da parede dupla, sobrepondo as duas: não foi apagada, mas fica fora da modulação — confira se ela deve existir.']);}});}
 for(const[a,b]of pairs){const A=walls[a],B=walls[b];if(!A||!B)continue;
  for(let i=0;i<state.walls.length;i++){const W=state.walls[i];if(W===A||W===B||!W.line||N(W.page||1)!==N(A.page||1))continue;const s1=crossParam(W,A),s2=crossParam(W,B);if(s1==null||s2==null)continue;
   const lo0=Math.min(s1,s2),hi0=Math.max(s1,s2),k=kOf(W),u=unit(W),P=s=>({x:W.line[0].x+u.x*s*k,y:W.line[0].y+u.y*s*k});const lo=Math.round(lo0),Lw=N(W.length),hi=Lw-Math.round(Lw-hi0);
   const ops=(W.openings||[]).map(o=>({...o}));const w1=JSON.parse(JSON.stringify(W)),w2=JSON.parse(JSON.stringify(W));
   Object.assign(w1,{uid:uid(),line:[P(lo0-lo),P(lo0)],length:lo,openings:ops.filter(o=>N(o.start)+N(o.width)<=lo0+.01).map(o=>({...o,start:Math.max(0,Math.round((N(o.start)-(lo0-lo))*10)/10)})),dual84:{of:W.uid,part:1}});
   Object.assign(w2,{uid:uid(),line:[P(hi0),P(hi0+Lw-hi)],length:Lw-hi,openings:ops.filter(o=>N(o.start)>=hi0-.01).map(o=>({...o,start:Math.round((N(o.start)-hi0)*10)/10})),dual84:{of:W.uid,part:2}});
   for(const x of [w1,w2]){delete x.seq58;delete x.locked76;delete x.locationSegments24;}
   state.dual84Undo??=[];state.dual84Undo.push({orig:JSON.parse(JSON.stringify(W)),parts:[w1.uid,w2.uid]});
   state.walls.splice(i,1,w1,w2);i++;n++;log.push(f1(W.length)+' → '+f1(w1.length)+' + '+f1(w2.length));}}
 if(n){try{renderWalls();}catch{}}state.log84=(state.log84||[]).concat(n?['Parede dupla (paredes paralelas quase encostadas): '+n+' parede(s) que atravessavam foram divididas, cada lado com o seu encontro ('+log.join('; ')+').']:[]);return n;}
function undoDual(){const snap=state.geo84Undo;if(!snap)return;state.walls=JSON.parse(snap);state.geo84Undo=null;state.dual84Undo=[];CFG().dual=false;CFG().indirect=false;renderWalls();try{invalidate();}catch{}$('planStatus').textContent='Divisão da parede dupla e amarrações indiretas desfeitas (desligadas neste projeto). Gere novamente.';}
window.undoDual84=undoDual;

// ---------- 3. Encontros muito próximos → amarração indireta (grampo): a parede que chega encosta na face da outra
function indirectFor(c,lim=80){if(!CFG().indirect)return 0;let qs=[];try{qs=JunctionEngine.detect(state.walls);}catch{return 0;}const W=state.walls[c];if(!W)return 0;
 const mine=qs.filter(q=>q.a.i===c||q.b.i===c).map(q=>{const me=q.a.i===c;return {q,t:me?q.ta:q.tb,o:me?q.b.i:q.a.i,oEnd:me?q.be:q.ae,cEnd:me?q.ae:q.be};}).sort((x,y)=>x.t-y.t);
 if(!mine.length)return 0;if(mine[0].t>2)mine.unshift({t:0,free:true,oEnd:-1,cEnd:0});if(mine.at(-1).t<N(W.length)-2)mine.push({t:N(W.length),free:true,oEnd:-1,cEnd:1});
 let done=0;for(let k=0;k+1<mine.length;k++){const A=mine[k],B=mine[k+1];if(B.t-A.t>lim)continue;
  const cand=[A,B].filter(x=>x.oEnd>=0&&x.cEnd<0);// parede que termina no meio desta (T)
  if(!cand.length)continue;cand.sort((x,y)=>N(state.walls[x.o].length)-N(state.walls[y.o].length));const x=cand[0];if(trim(x.o,x.oEnd,N(W.width)/2+jh(),c))done++;}
 return done;}
function trim(o,end,tr,withIdx,note){const w=state.walls[o];if(!w?.line||N(w.length)-tr<20)return false;const k=kOf(w),u=unit(w);
 if(end===1){w.line=[{...w.line[0]},{x:w.line[1].x-u.x*tr*k,y:w.line[1].y-u.y*tr*k}];}else{w.line=[{x:w.line[0].x+u.x*tr*k,y:w.line[0].y+u.y*tr*k},{...w.line[1]}];(w.openings||[]).forEach(op=>op.start=Math.max(0,Math.round((N(op.start)-tr)*10)/10));}
 w.length=Math.round((N(w.length)-tr)*10)/10;w.indirect84=(w.indirect84||[]).concat({end,with:state.walls[withIdx].uid,tr});delete w.locked76;delete state.walls[withIdx].locked76;
 if(tr<0){w.extended86=(w.extended86||[]).concat({end,with:state.walls[withIdx].uid,ext:-tr});w.indirect84=w.indirect84.filter(x=>x.tr>0);}
 if(note!==false)state.log84=(state.log84||[]).concat([note||('Encontros muito próximos na Parede '+(withIdx+1)+': a Parede '+(o+1)+' passa a encostar na face com amarração indireta (grampo a cada 2 fiadas).')]);return true;}
// V86.2 — encontro entre espessuras diferentes (ex.: 14 × 19): amarração indireta automática; a parede mais fina encosta na face da mais grossa
function mixedWidths(){if(CFG().indirect===false)return 0;let qs=[];try{qs=JunctionEngine.detect(state.walls);}catch{return 0;}let n=0;const done=new Set();
 for(const q of qs){const A=state.walls[q.a.i],B=state.walls[q.b.i];if(!A||!B||Math.abs(N(A.width)-N(B.width))<.5)continue;const key=[A.uid,B.uid].sort().join('|');if(done.has(key))continue;done.add(key);
  const thinIs=N(A.width)<N(B.width)?'a':'b',ti=thinIs==='a'?q.a.i:q.b.i,ki=thinIs==='a'?q.b.i:q.a.i,tEnd=thinIs==='a'?q.ae:q.be,kEnd=thinIs==='a'?q.be:q.ae,T=state.walls[ti],K=state.walls[ki];
  const label='Paredes '+(ti+1)+' ('+N(T.width)+' cm) e '+(ki+1)+' ('+N(K.width)+' cm): espessuras diferentes — ';
  if(tEnd>=0){// a fina termina no encontro: encosta na face da grossa
   if(trim(ti,tEnd,N(K.width)/2+jh(),ki,label+'a Parede '+(ti+1)+' encosta na face da Parede '+(ki+1)+' com amarração indireta (grampo a cada 2 fiadas).')){n++;
    if(kEnd>=0)trim(ki,kEnd,-N(T.width)/2,ti,false);}// canto (L): a grossa avança até a face externa da fina
  }else if(kEnd>=0){// a grossa termina no meio da fina: ela encosta na face da fina
   if(trim(ki,kEnd,N(T.width)/2+jh(),ti,label+'a Parede '+(ki+1)+' encosta na face da Parede '+(ti+1)+' com amarração indireta (grampo a cada 2 fiadas).'))n++;
  }else state.log84=(state.log84||[]).concat([label+'as duas atravessam o encontro (X). Separe uma delas em duas paredes para fazer amarração indireta.']);}
 return n;}
window.mixed86=mixedWidths;
window.indirect84=indirectFor;

// ---------- 4. Ciclo da geração: antes (parede dupla) e depois (encontros próximos, corte de reforço, diagnóstico)
let run=null;const regen84=()=>{const pv=window.__noCheck71;window.__noCheck71=true;try{$('generate').click();}finally{window.__noCheck71=pv;}};
$('generate')?.addEventListener('click',()=>{if($('generate').textContent.includes('Cancelar'))return;if(!run){run={loops:0};state.log84=[];try{window.bars84?.clear();}catch{}}try{const mp=N(CFG().minPiece)||0,SR=state.savedResults;if(mp>0&&SR)for(const w of state.walls){const c=SR[w.uid];if(!c||w.locked76)continue;if((c.result?.rows||[]).some(r=>(r.pieces||[]).some(q=>!q.fill&&!q.channel&&!q.gap&&N(q.length)<mp)))delete SR[w.uid];}}catch{}try{const prev=new Set(state.unc84||[]);if(prev.size){const qs=JunctionEngine.detect(state.walls);const idx=new Map(state.walls.map((w,i)=>[w.uid,i]));let un=0;const adj=new Map();for(const q of qs){adj.set(q.a.i,(adj.get(q.a.i)||[]).concat(q.b.i));adj.set(q.b.i,(adj.get(q.b.i)||[]).concat(q.a.i));}const seen=new Set(),st=[];for(const u of prev){const k=idx.get(u);if(k!==undefined&&state.walls[k].confirmed){st.push(k);seen.add(k);}}while(st.length){const k=st.pop();for(const o of adj.get(k)||[])if(!seen.has(o)){seen.add(o);st.push(o);}}for(const o of seen){const W=state.walls[o],sr=state.savedResults?.[W.uid]?.result,manual=W.locked76&&(sr?.approvedBy78||sr?.edited86||state.results?.[o]?.approvedBy78||state.results?.[o]?.edited86);if(manual)continue;if(W.locked76){delete W.locked76;un++;}if(state.savedResults)delete state.savedResults[W.uid];}if(un)state.log84=(state.log84||[]).concat(['Paredes que acabaram de ser conferidas: '+un+' parede(s) ligadas a elas foram destravadas para os encontros serem recalculados juntos (as aprovadas à mão / editadas no editor foram preservadas).']);}}catch(e){console.error('V85 conferidas',e);}
const snap=JSON.stringify(state.walls);let ch=0;try{ch+=splitDual();}catch(e){console.error('V84 parede dupla',e);}try{ch+=mixedWidths();}catch(e){console.error('V86 espessuras',e);}try{for(let c=0;c<state.walls.length;c++)ch+=indirectFor(c,60);}catch(e){console.error('V84 indireta',e);}if(ch){if(!state.geo84Undo)state.geo84Undo=snap;try{renderWalls();}catch{}}state.unc84=state.walls.filter(w=>!w.confirmed).map(w=>w.uid);},true);
const gapStatus=()=>{try{(state.results||[]).forEach((m,i)=>{const w=state.walls[i];if(!m||!w?.inGap84)return;const nm=u=>state.walls.findIndex(x=>x.uid===u)+1;m.pending=true;m.gap84=true;m.statusReason='Parede dentro da parede dupla (entre as Paredes '+nm(w.inGap84.a)+' e '+nm(w.inGap84.b)+'): sobrepõe as duas e não entra na amarração. Confira se ela deve existir.';});}catch{}};const rr=renderResults;renderResults=function(...a){gapStatus();const r=rr.apply(this,a);gapStatus();if(!run)return r;const cur=run;
 setTimeout(()=>{if(run!==cur||!Array.isArray(state.results)||state.results.length!==state.walls.length)return;
  const msgs=[...(state.junctionReports||[]).filter(x=>x.ok===false).map(x=>x.message),...state.results.flatMap(m=>[...(m?.errors||[]),...(m?.sourceErrors||[])])];
  const close=new Set();for(const t of msgs){const mm=String(t).match(/Parede (\d+): encontros muito próximos/);if(mm)close.add(N(mm[1])-1);const m2=String(t).match(/^Parede (\d+) × Parede (\d+)/);if(m2){close.add(N(m2[1])-1);close.add(N(m2[2])-1);}}
  let changed=0;if(cur.loops<3)for(const c of close)changed+=indirectFor(c);
  const empty=state.results.some((m,i)=>m&&!m.rows?.length&&state.walls[i].confirmed&&!m.gap84&&!state.walls[i].inGap84&&!state.walls[i].locked76);
  if(changed&&cur.loops<3){cur.loops++;try{renderWalls();}catch{}setTimeout(regen84,30);return;}
  if(empty&&!boost84&&cur.loops<4){cur.loops++;boost84=true;setTimeout(regen84,30);return;}
  boost84=false;run=null;diagnose();},0);return r;};
function diagnose(){const R=state.results||[];const n=R.length;if(!n)return;let ok=0,rev=0,cuts=0,small=0,empty=0;const mp=window.__noMin84?0:(N(CFG().minPiece)||0);
 const unc=[];R.forEach((m,i)=>{if(!m)return;if(state.walls[i]?.inGap84){rev++;return;}if(state.walls[i]&&!state.walls[i].confirmed){unc.push(i+1);rev++;return;}if(!m.rows?.length){empty++;return;}const pcs=m.rows.flatMap(r=>r.pieces).filter(p=>!p.fill&&!p.channel);cuts+=pcs.filter(p=>p.cut||/_C/.test(p.code)).length;small+=pcs.filter(p=>N(p.length)<Math.max(mp,1)).length;if(m.errors?.length||m.pending)rev++;else ok++;});
 const pct=Math.round(ok/n*100),box=$('genReport57'),html='📊 <b>Diagnóstico da modulação:</b> <b>'+ok+' de '+n+'</b> paredes OK ('+pct+'%) · cortes de bloco: '+cuts+' · peças menores que '+(mp||'—')+' cm: '+small+' · para revisar: '+rev+(empty?' · sem desenho: '+empty:'')+(unc.length?'<div class="unc84">⚠ <b>'+unc.length+' parede(s) não conferida(s)</b> (Parede '+unc.join(', ')+'): ficam sem desenho e fora da amarração até serem conferidas. Alterar comprimento, altura ou espessura desmarca a conferência. <button type="button" id="dg84conf">✔ Já conferi: marcar e gerar de novo</button></div>':'')+(CFG().dual===false||CFG().indirect===false?'<div class="unc84">ℹ Parede dupla / amarração indireta automáticas estão <b>desligadas</b> neste projeto. <button type="button" id="dg84on">Religar e gerar de novo</button></div>':'');
 state.diag84={ok,n,pct,cuts,small,rev,empty};$('planStatus').textContent=$('planStatus').textContent.replace(/ · Diagnóstico:.*$/,'')+' · Diagnóstico: '+ok+'/'+n+' OK ('+pct+'%).';
 if(box){let d=box.querySelector('.dg84');if(!d){d=document.createElement('div');d.className='dg84';box.prepend(d);}d.innerHTML=html+((state.log84||[]).length?'<ul>'+state.log84.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul>':'')+(state.geo84Undo?'<button type="button" class="secondary" id="dg84undo">desfazer parede dupla / amarração indireta</button>':'');$('dg84undo')?.addEventListener('click',undoDual);$('dg84conf')?.addEventListener('click',()=>{unc.forEach(k=>{if(state.walls[k-1])state.walls[k-1].confirmed=true;});for(const w of state.walls)if(!w.locked76&&state.savedResults)delete state.savedResults[w.uid];renderWalls();regen84();});$('dg84on')?.addEventListener('click',()=>{CFG().dual=true;CFG().indirect=true;regen84();});}}
window.diagnose84=diagnose;
// nota na parede com amarração indireta
const rr2=renderResults;renderResults=function(...a){const r=rr2.apply(this,a);try{state.walls.forEach((w,i)=>{if(!w.indirect84?.length)return;const h=$('wall-result-'+i)?.querySelector('h3');if(!h||h.parentElement.querySelector('.ind84'))return;const p=document.createElement('p');p.className='ind84 note';p.innerHTML='🔗 <b>Amarração indireta</b> na '+w.indirect84.map(x=>(x.end===1?'extremidade final':'extremidade inicial')+' (encosta na Parede '+(state.walls.findIndex(v=>v.uid===x.with)+1)+')').join(' e ')+': grampo a cada 2 fiadas, sem cruzar os blocos.';h.after(p);});}catch{}return r;};
try{const cp=collectPlot26;collectPlot26=function(...a){const d=cp.apply(this,a);try{for(const it of d.items){const m=(it.title||'').match(/^Parede (\d+)/);if(!m)continue;const w=state.walls[N(m[1])-1];if(w?.indirect84?.length&&!/grampo/.test(it.title))it.title+=' · amarração indireta (grampo)';}}catch{}return d;};}catch{}

// ---------- 5. Respaldo U/J pela laje: laje dos dois lados ou de nenhum = U; de um lado só = J
const segCache={t:0,map:new Map()};
function slabFor(w){const G=window.geo74,L68=window.level68;if(!G||!w.line)return null;const lv=G.levelsData();const key=L68?.keyOf?L68.keyOf(N(w.page||1)):null;const li=lv.findIndex(l=>l.key===key||l.walls.includes(w));if(li<0)return null;
 const now=Date.now();if(now-segCache.t>800){segCache.t=now;segCache.map.clear();}if(segCache.map.has(li))return segCache.map.get(li);
 const l=lv[li],top=li===lv.length-1,S0=window.loads77?.S?.(),roofOn=S0?S0.roof?.on!==false:true;let S=null;if(!top||roofOn){try{S=G.slabCells(l.walls);}catch{}}
 // beirais lançados nesta laje
 let edges=[];try{const items=S0?.items||[];const tgtKey=top?l.key:lv[li+1]?.key,tgt=top?'cob':'piso';edges=items.filter(it=>it.kind==='edge'&&(it.tgt||'piso')===tgt&&(L68?.keyOf?L68.keyOf(N(it.page)):'')===tgtKey).map(it=>{const P=it.pts.map(Q=>window.world74(N(it.page),Q));return P;});}catch{}
 const val={S,edges,none:!S};segCache.map.set(li,val);return val;}
function inPoly(P,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>P.y)!==(b.y>P.y)&&P.x<(b.x-a.x)*(P.y-a.y)/((b.y-a.y)||1e-9)+a.x)c=!c;}return c;}
function slabSegments(w){const sl=slabFor(w);if(!sl)return null;const G=window.geo74,g=G.wallWorld(w),t=N(w.width)||14,L=g.L,k=N(w.length)/L,n=[-g.u[1],g.u[0]];
 const has=P=>{if(sl.S){const S=sl.S,ix=Math.floor((P.x-S.minX)/S.C),iy=Math.floor((P.y-S.minY)/S.C);if(ix>=0&&iy>=0&&ix<S.nx&&iy<S.ny&&S.in(iy*S.nx+ix))return true;}return sl.edges.some(pl=>inPoly(P,pl));};
 const step=10,codes=[];for(let s=step/2;s<L;s+=step){const P={x:g.A.x+g.u[0]*s,y:g.A.y+g.u[1]*s},d=t/2+12,a=has({x:P.x+n[0]*d,y:P.y+n[1]*d}),b=has({x:P.x-n[0]*d,y:P.y-n[1]*d});codes.push(a===b?'U':'J');}
 // trechos (desconsidera trechos menores que 20 cm)
 let runs=[];codes.forEach((c,i)=>{const s=i*step,e=Math.min(L,(i+1)*step);if(runs.length&&runs.at(-1).c===c)runs.at(-1).e=e;else runs.push({c,s,e});});
 for(let pass=0;pass<3;pass++){runs=runs.filter((r,i,arr)=>{if(r.e-r.s>=20||arr.length===1)return true;const nb=arr[i-1]||arr[i+1];nb.e=Math.max(nb.e,r.e);nb.s=Math.min(nb.s,r.s);return false;});const m=[];for(const r of runs){if(m.length&&m.at(-1).c===r.c){m.at(-1).e=r.e;}else m.push({...r});}runs=m;}
 if(runs.length){runs[0].s=0;runs.at(-1).e=L;}
 return runs.map(r=>({start:Math.round(r.s*k*10)/10,end:Math.round(r.e*k*10)/10,location:r.c==='J'?'Externa':'Interna',channel:r.c,slab84:true}));}
try{const base=automaticSegments24;automaticSegments24=function(w,i){try{if(CFG().respaldoSlab!==false&&!window.__noSlab84){const r=slabSegments(w);if(r&&r.length)return r;}}catch(e){console.error('V84 respaldo',e);}return base.call(this,w,i);};}catch(e){console.error('V84',e);}
// classificação muda sem destravar as paredes aprovadas
try{const ss=sourceSignature;sourceSignature=function(w){if(!w)return ss(w);const {location,locationSegments24,locationUncertain24,dual84,indirect84,...rest}=w;return ss(rest);};}catch{}

// ---------- 6. Salvar / abrir / novo
for(const id of ['newProject','example']){const b=$(id);if(!b)continue;const old=b.onclick;b.onclick=function(...a){const r=old?.apply(this,a);state.mod84=null;state.dual84Undo=[];state.geo84Undo=null;syncUI();return r;};}
{const r=$('restore');if(r){const old=r.onchange;r.onchange=async function(...a){const res=await old?.apply(this,a);try{syncUI();}catch{}return res;};}}
const st=document.createElement('style');st.textContent=`.dg84{background:#eef6ff;border:1px solid #9fb6cf;border-radius:8px;padding:8px 12px;margin:6px 0;font-size:13.5px}.dg84 .unc84{margin:6px 0;padding:6px 8px;background:#fff7e6;border:1px solid #f2c86b;border-radius:6px}.dg84 .unc84 button{margin-left:6px}.dg84 ul{margin:6px 0 4px 18px;padding:0;font-size:12.5px}.ind84{background:#fff7e6;border-left:3px solid #f2b705;padding:4px 8px}`;document.head.append(st);
setTimeout(syncUI,0);
})();
