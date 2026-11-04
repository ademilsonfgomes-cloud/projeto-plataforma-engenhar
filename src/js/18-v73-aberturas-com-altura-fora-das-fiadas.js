// V73 — aberturas com altura fora das fiadas, pranchas DXF em layouts e quantitativos em planilha Excel com perdas.
(function(){
'use strict';
const N=v=>Number(v);
const step73=()=>(N(state.blocks.find(b=>b.active!==false&&b.type!=='Canaleta')?.height)||19)+(num($('jv').value)||1);
const f1=v=>Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1});

// ---------- 1. Aberturas com altura fora das fiadas
// A abertura guarda a medida real (o.real73) e o vão de alvenaria vai para a fiada que envolve a abertura:
// peitoril desce para a fiada de baixo e o topo sobe para a fiada de cima. A diferença vira complemento hachurado.
function norm73(list){const st=step73(),changed=[];if(!(st>0))return changed;
 for(const w of list||[])for(const o of w.openings||[]){
  const b=N(o.bottom)||0,h=N(o.height);if(!(h>0))continue;
  if(o.real73){const m=o.real73.mod;if(m&&Math.abs(m.bottom-b)<.001&&Math.abs(m.height-h)<.001)continue;delete o.real73;}
  const off=v=>Math.abs(v/st-Math.round(v/st))>.001;if(!off(b)&&!off(b+h))continue;
  const H=N(w.height)||Infinity,mb=Math.max(0,Math.floor(b/st+1e-6)*st);let mt=Math.ceil((b+h)/st-1e-6)*st;if(mt>H+.001)mt=H;
  if(!(mt-mb>0))continue;
  o.real73={bottom:b,height:h,mod:{bottom:mb,height:Math.round((mt-mb)*1000)/1000}};o.bottom=mb;o.height=o.real73.mod.height;
  delete w.manualRows;changed.push({w,o});}
 return changed;}
const allWalls=()=>window.level68?.all?.()||state.walls;
window.norm73=()=>norm73(allWalls());
window.real73=o=>o?.real73?{bottom:o.real73.bottom,height:o.real73.height}:{bottom:N(o?.bottom)||0,height:N(o?.height)};
let busy=false;
const rw=renderWalls;renderWalls=function(...a){if(!busy){busy=true;try{const ch=norm73(allWalls());if(ch.length){try{invalidate();}catch{}const t=ch.map(({o})=>(o.tag58||o.type||'Abertura')+' '+f1(o.real73.height)+' cm → vão '+f1(o.height)).join(', ');if(!window.__quietNorm73)setTimeout(()=>{const s=$('planStatus');if(s)s.textContent='Abertura fora das fiadas: '+t+' (complemento hachurado na elevação). A medida real fica guardada.';},0);}}catch(e){console.error(e);}finally{busy=false;}}return rw.apply(this,a);};
try{const gp=generationPayload;generationPayload=function(...a){try{norm73(allWalls());}catch{}return gp.apply(this,a);};}catch{}
// editor de abertura manual: mostra a medida real
try{const rop=renderOpeningPanel;renderOpeningPanel=function(...a){const r=rop.apply(this,a);try{const i=openingSelection?state.walls.findIndex(w=>w.uid===openingSelection.uid):-1,o=openingSelection?.k>=0?state.walls[i]?.openings?.[openingSelection.k]:null;if(o?.real73){$('openingBottom').value=o.real73.bottom;$('openingHeight').value=o.real73.height;}}catch{}return r;};}catch{}
// hachura do complemento dentro da abertura (elevação)
const sv=svgWall;svgWall=function(w,m,which,...rest){const html=sv(w,m,which,...rest);const ops=(w?.openings||[]).filter(o=>o.real73);if(which!=='elevation'||!ops.length)return html;
 try{const box=document.createElement('div');box.innerHTML=html;const svg=box.querySelector('svg');if(!svg)return html;
  const rects=[...svg.querySelectorAll('rect[stroke-dasharray="1 .8"]')];let g='',k=0;const id='hatch73-'+(state.walls.indexOf(w)+1);
  for(const o of ops){const r=rects.find(r=>{const s=N(r.getAttribute('width'))/N(o.width);return s>0&&Math.abs(N(r.getAttribute('height'))-N(o.height)*s)<.01*Math.max(1,s);});if(!r)continue;
   const s=N(r.getAttribute('width'))/N(o.width),x=N(r.getAttribute('x')),y=N(r.getAttribute('y')),wd=N(r.getAttribute('width')),hh=N(r.getAttribute('height'));
   const top=(o.real73.mod.bottom+o.real73.mod.height)-(o.real73.bottom+o.real73.height),bot=o.real73.bottom-o.real73.mod.bottom;
   const band=(yy,bh,cm,where)=>{if(!(bh>0))return;const lab='Complemento '+f1(cm)+' cm'+(where==='top'?' · '+(o.type==='Porta'?'porta ':'janela ')+f1(o.width)+'×'+f1(o.real73.height):' · peitoril '+f1(o.real73.bottom));const fs=Math.min(1.9,Math.max(.9,wd/(lab.length*.58)));g+=`<rect x="${x}" y="${yy}" width="${wd}" height="${bh}" fill="url(#${id})" stroke="#b5651d" stroke-width=".2"/><text x="${x+wd/2}" y="${where==='top'?yy+bh+fs+.5:yy-.7}" text-anchor="middle" font-size="${fs}" fill="#7a3d0a" paint-order="stroke" stroke="#fff" stroke-width=".5">${lab}</text>`;k++;};
   band(y,top*s,top,'top');band(y+hh-bot*s,bot*s,bot,'bottom');}
  if(!k)return html;
  svg.insertAdjacentHTML('beforeend',`<defs><pattern id="${id}" width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="2" stroke="#b5651d" stroke-width=".25"/></pattern></defs><g data-complement73="1">${g}</g>`);return box.innerHTML;}catch(e){console.error('V73 hachura',e);return html;}};
// avisos na parede
const rr=renderResults;renderResults=function(...a){try{(Array.isArray(a[1])?a[1]:state.results||[]).forEach((m,i)=>{const w=state.walls[i];if(!m||!w)return;for(const o of w.openings||[]){if(!o.real73)continue;const t=(o.tag58||o.type||'Abertura')+': medida real '+f1(o.width)+' × '+f1(o.real73.height)+(o.real73.bottom?' (peitoril '+f1(o.real73.bottom)+')':'')+' cm fora das fiadas — vão de alvenaria '+f1(o.real73.mod.height)+(o.real73.mod.bottom?' (peitoril '+f1(o.real73.mod.bottom)+')':'')+' cm, complemento hachurado a definir em obra (enchimento, requadro ou ajuste do batente).';m.warnings??=[];if(!m.warnings.includes(t))m.warnings.push(t);}});}catch{}
 const r=rr.apply(this,a);try{addXlsBar();}catch(e){console.error(e);}return r;};

// ---------- 2. Pranchas DXF: cada folha num layout (aba) do CAD
window.layouts73=function(head,model,papers,tail,W,H){
 const n=papers.length;if(!n)return head+model.join('\n')+'\n'+tail;
 const hx=v=>v.toString(16).toUpperCase(),hd=k=>k?{rec:hx(0x800+k*4),beg:hx(0x801+k*4),end:hx(0x802+k*4),lay:hx(0x803+k*4)}:{rec:'1B',lay:'1E'};
 const names=papers.map((_,k)=>'Prancha '+String(k+1).padStart(2,'0'));
 let recs='',blocks='';
 for(let k=1;k<n;k++){const h=hd(k),nm='*Paper_Space'+(k-1);
  recs+=`  0\nBLOCK_RECORD\n  5\n${h.rec}\n330\n9\n100\nAcDbSymbolTableRecord\n100\nAcDbBlockTableRecord\n  2\n${nm}\n340\n${h.lay}\n 70\n0\n280\n1\n281\n0\n`;
  blocks+=`  0\nBLOCK\n  5\n${h.beg}\n330\n${h.rec}\n100\nAcDbEntity\n 67\n1\n  8\n0\n100\nAcDbBlockBegin\n  2\n${nm}\n 70\n0\n 10\n0.0\n 20\n0.0\n 30\n0.0\n  3\n${nm}\n  1\n\n`+(papers[k].length?papers[k].join('\n')+'\n':'')+`  0\nENDBLK\n  5\n${h.end}\n330\n${h.rec}\n100\nAcDbEntity\n 67\n1\n  8\n0\n100\nAcDbBlockEnd\n`;}
 const recA='  2\n*Paper_Space\n340\n1E\n 70\n0\n280\n1\n281\n0\n';if(!head.includes(recA))throw Error('Modelo DXF sem espaço de papel.');
 head=head.replace(recA,recA+recs).replace('  2\nBLOCK_RECORD\n  5\n9\n330\n0\n100\nAcDbSymbolTable\n 70\n2\n','  2\nBLOCK_RECORD\n  5\n9\n330\n0\n100\nAcDbSymbolTable\n 70\n'+(n+1)+'\n');
 const entA='  0\nENDSEC\n  0\nSECTION\n  2\nENTITIES\n',ei=head.lastIndexOf(entA);head=head.slice(0,ei)+blocks+head.slice(ei);
 tail=tail.replace('  3\nLayout1\n350\n1E\n',names.map((nm,k)=>`  3\n${nm}\n350\n${hd(k).lay}\n`).join(''));
 const li=tail.indexOf('  0\nLAYOUT\n  5\n1E\n'),lj=tail.indexOf('  0\n',li+4);if(li<0||lj<0)throw Error('Modelo DXF sem layout.');
 const iso={'1189x841':'A0','841x594':'A1','594x420':'A2','420x297':'A3','297x210':'A4'}[Math.round(W)+'x'+Math.round(H)]||'';
 const base=tail.slice(li,lj).replace(/\n 44\n[^\n]+\n 45\n[^\n]+\n/,`\n 44\n${W}\n 45\n${H}\n`).replace(/\n 11\n[^\n]+\n 21\n[^\n]+\n/,`\n 11\n${W}\n 21\n${H}\n`).replace(/\n  4\n[^\n]*\n/,`\n  4\n${iso}\n`);
 const lays=names.map((nm,k)=>{const h=hd(k);return base.replace('  5\n1E\n','  5\n'+h.lay+'\n').replace('  1\nLayout1\n','  1\n'+nm+'\n').replace(/\n 71\n1\n/,'\n 71\n'+(k+1)+'\n').replace(/330\n1B\n$/,'330\n'+h.rec+'\n');}).join('');
 tail=tail.slice(0,li)+lays+tail.slice(lj);
 return head+model.concat(papers[0]).join('\n')+'\n'+tail;};
window.psHandle73=k=>k?(0x800+k*4).toString(16).toUpperCase():'1B';

// ---------- 3. Quantitativos em planilha Excel (.xlsx) com perdas
const LS='loss73';let loss={blocks:5,steel:10};try{Object.assign(loss,JSON.parse(localStorage.getItem(LS)||'{}'));}catch{}
const saveLoss=()=>{try{localStorage.setItem(LS,JSON.stringify(loss));}catch{}};
const repOfPage=pg=>N((state.levels53||[]).find(l=>String(l.page)===String(pg))?.rep)||1;
const nameOfGroup=g=>{const v=(g.value>=0?'+':'')+g.value.toFixed(2).replace('.',',')+' m';return g.label?g.label+' ('+v+')':'Nível '+v;};
async function gather(){const L=window.level68,cur=L?.current?.()||'all';if(cur!=='all')await L.switchTo('all',true);
 try{if(!Array.isArray(state.results)||state.results.length!==state.walls.length)throw Error('Gere a modulação de todos os níveis antes de baixar a planilha (escolha cada nível em “Nível em trabalho” e clique em Gerar modulação).');
  const gs=levelGroups54();if(!gs.length)throw Error('Ainda não há paredes moduladas.');
  return gs.map(g=>{let blocks={},rows=[];withLevel54(g,()=>{blocks=blockTotals26();rows=steelSchedule();});let rep=1;for(const i of g.walls)rep=Math.max(rep,repOfPage(state.walls[i]?.page||1));return {name:nameOfGroup(g),rep,blocks,rows,walls:g.walls.size};});}
 finally{if(cur!=='all')await L.switchTo(cur,true);}}
const descOf=c=>{const b=state.blocks.find(b=>b.code===c)||state.blocks.find(b=>c.startsWith(b.code+'_'));if(!b)return /_C/.test(c)?'Bloco cortado':'';const d=[b.length,b.height,b.width].filter(v=>Number.isFinite(N(v))&&v!=='').map(f1).join(' × ');return (b.type||'Bloco')+(d?' '+d+' cm':'')+(/_C/.test(c)?' (cortado)':'');};
// --- gerador xlsx mínimo (zip sem compressão)
const crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=crcT[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
function zip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;
 for(const[name,text]of files){const nb=enc.encode(name),data=enc.encode(text),crc=crc32(data),h=new DataView(new ArrayBuffer(30));
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,0,true);h.setUint16(12,0x21,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nb.length,true);h.setUint16(28,0,true);
  parts.push(new Uint8Array(h.buffer),nb,data);
  const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,0,true);c.setUint16(14,0x21,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,nb.length,true);c.setUint32(42,off,true);
  cen.push(new Uint8Array(c.buffer),nb);off+=30+nb.length+data.length;}
 const cs=cen.reduce((s,u)=>s+u.length,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
 const all=[...parts,...cen,new Uint8Array(e.buffer)],out=new Uint8Array(all.reduce((s,u)=>s+u.length,0));let p=0;for(const u of all){out.set(u,p);p+=u.length;}return out;}
const xe=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const col=n=>{let s='';n++;while(n){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;};
// estilos: 0 normal, 1 cabeçalho, 2 decimal, 3 percentual, 4 título, 5 total inteiro, 6 total decimal, 7 inteiro
const STY={head:1,dec:2,pct:3,title:4,tot:5,totd:6,int:7,note:8,gen:9};
const cv=c=>typeof c==='number'?c:c&&typeof c==='object'?(Number.isFinite(c.v)?c.v:Number.isFinite(c.n)?c.n:0):0;
const sumCol=(rows,ci,r0,r1)=>{let t=0;for(let r=r0;r<=r1;r++)t+=cv(rows[r-1]?.[ci]);return t;};
function sheetXML(rows,widths){let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>'+widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols><sheetData>';
 rows.forEach((r,ri)=>{if(!r)return;x+=`<row r="${ri+1}">`;r.forEach((c,ci)=>{if(c==null||c==='')return;const ref=col(ci)+(ri+1);let v=c,s=0;if(typeof c==='object'){s=c.s||0;v=c;}
  if(typeof v==='number'){x+=`<c r="${ref}"${s?` s="${s}"`:''}><v>${v}</v></c>`;}
  else if(typeof v==='string'){x+=`<c r="${ref}" t="inlineStr"${s?` s="${s}"`:''}><is><t xml:space="preserve">${xe(v)}</t></is></c>`;}
  else if(v.f!=null){x+=`<c r="${ref}"${s?` s="${s}"`:''}><f>${xe(v.f)}</f>${Number.isFinite(v.v)?`<v>${v.v}</v>`:''}</c>`;}
  else if(typeof v.t==='string'){x+=`<c r="${ref}" t="inlineStr"${s?` s="${s}"`:''}><is><t xml:space="preserve">${xe(v.t)}</t></is></c>`;}
  else if(Number.isFinite(v.n)){x+=`<c r="${ref}"${s?` s="${s}"`:''}><v>${v.n}</v></c>`;}});x+='</row>';});
 return x+'</sheetData><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="landscape"/></worksheet>';}
const STYLES='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF174A78"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF174A78"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF4DC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFB7C6D6"/></left><right style="thin"><color rgb="FFB7C6D6"/></right><top style="thin"><color rgb="FFB7C6D6"/></top><bottom style="thin"><color rgb="FFB7C6D6"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="10"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center" horizontal="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="9" fontId="3" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="3" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/><xf numFmtId="164" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/><xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="0"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
const sheetName=(s,used)=>{let n=String(s).replace(/[\[\]:*?\/\\]/g,'-').slice(0,31).trim()||'Nível';let k=2,b=n;while(used.has(n.toLowerCase())){n=(b.slice(0,27)+' ('+k+++')');}used.add(n.toLowerCase());return n;};
const qn=n=>"'"+n.replace(/'/g,"''")+"'";
const up=(v)=>Math.ceil(v-1e-9);
function buildXlsx(levels){const pb=loss.blocks/100,ps=loss.steel/100,mass=d=>steelMassPerMetre(d),r2=v=>Math.round(v*100)/100;
 const used=new Set(['resumo']),sheets=[];const RES="Resumo";const LB=`${RES}!$B$5`,LSt=`${RES}!$B$6`;
 const diams=[...new Set(levels.flatMap(l=>l.rows.map(r=>N(r.diameter))))].sort((a,b)=>a-b);
 const codes=[...new Set(levels.flatMap(l=>Object.keys(l.blocks)))].sort((a,b)=>{const ca=/_C/.test(a),cb=/_C/.test(b);return ca-cb||a.localeCompare(b,'pt',{numeric:true});});
 // folhas por nível
 for(const L of levels){const nm=sheetName(L.name,used);L.sheet=nm;const rows=[];
  rows.push([{t:'Quantitativo — '+L.name,s:STY.title}]);
  rows.push(['Paredes moduladas',{n:L.walls,s:STY.int}]);
  rows.push(['Repetições do pavimento',{n:L.rep,s:STY.int},{t:'(altere aqui ou no programa)',s:STY.note}]);
  rows.push(['Perda de blocos',{f:LB,v:pb,s:STY.pct},'Perda de aço',{f:LSt,v:ps,s:STY.pct},{t:'(as perdas são definidas na aba Resumo)',s:STY.note}]);
  rows.push(null);
  rows.push([{t:'Blocos',s:STY.title}]);
  rows.push(['Peça','Descrição','Qtde por pavimento','Repetições','Total','Total com perda (un)'].map(t=>({t,s:STY.head})));
  const b0=rows.length+1;const ent=codes.filter(c=>L.blocks[c]);
  for(const c of ent){const r=rows.length+1,q=L.blocks[c];rows.push([c,descOf(c),{n:q,s:STY.int},{f:'$B$3',v:L.rep,s:STY.int},{f:`C${r}*D${r}`,v:q*L.rep,s:STY.int},{f:`ROUNDUP(E${r}*(1+$B$4),0)`,v:up(q*L.rep*(1+pb)),s:STY.int}]);}
  const b1=rows.length;L.blockRows=Object.fromEntries(ent.map((c,k)=>[c,b0+k]));
  if(ent.length)rows.push([{t:'Total',s:STY.tot},'',{f:`SUM(C${b0}:C${b1})`,v:ent.reduce((s,c)=>s+L.blocks[c],0),s:STY.tot},'',{f:`SUM(E${b0}:E${b1})`,v:ent.reduce((s,c)=>s+L.blocks[c]*L.rep,0),s:STY.tot},{f:`SUM(F${b0}:F${b1})`,v:ent.reduce((s,c)=>s+up(L.blocks[c]*L.rep*(1+pb)),0),s:STY.tot}]);
  else rows.push(['Sem blocos desenhados neste nível.']);
  rows.push(null);
  rows.push([{t:'Aço por bitola',s:STY.title}]);
  rows.push(['Bitola (mm)','Comprimento por pavimento (m)','Repetições','Comprimento total (m)','Barras de 12 m','Barras com perda','Peso com perda (kg)'].map(t=>({t,s:STY.head})));
  const byD=new Map();L.rows.forEach(r=>byD.set(N(r.diameter),(byD.get(N(r.diameter))||0)+r.total));const s0=rows.length+1;L.steelRows={};
  for(const d of diams){if(!byD.has(d))continue;const r=rows.length+1,l=r2(byD.get(d)),kg=mass(d);L.steelRows[d]=r;rows.push([{n:d,s:STY.gen},{n:l,s:STY.dec},{f:'$B$3',v:L.rep,s:STY.int},{f:`B${r}*C${r}`,v:l*L.rep,s:STY.dec},{f:`D${r}/12`,v:l*L.rep/12,s:STY.dec},{f:`ROUNDUP(E${r}*(1+$D$4),0)`,v:up(l*L.rep/12*(1+ps)),s:STY.int},{f:`F${r}*12*${kg}`,v:up(l*L.rep/12*(1+ps))*12*kg,s:STY.dec}]);}
  const s1=rows.length;if(s1>=s0)rows.push([{t:'Total',s:STY.tot},'','',...[3,4,5,6].map(c=>({f:`SUM(${col(c)}${s0}:${col(c)}${s1})`,v:sumCol(rows,c,s0,s1),s:c===5?STY.tot:STY.totd}))]);
  rows.push(null);
  rows.push([{t:'Detalhamento por posição (1 pavimento)',s:STY.title}]);
  rows.push(['Posição','Bitola (mm)','Comprimento unitário (cm)','Quantidade','Comprimento total (m)'].map(t=>({t,s:STY.head})));
  for(const r of L.rows)rows.push([r.n,{n:N(r.diameter),s:STY.gen},{n:r2(N(r.length)),s:STY.dec},{n:r.quantity,s:STY.int},{n:r2(r.total),s:STY.dec}]);
  rows.push(null);rows.push([{t:'Quantidades conforme os desenhos gerados; perdas aplicadas só nas colunas “com perda”. Arredondamento para cima.',s:STY.note}]);
  sheets.push({name:nm,xml:sheetXML(rows,[24,30,22,14,20,20,20])});}
 // resumo
 const R=[];const proj=($('project')?.value||'').trim();
 R.push([{t:'Quantitativos — Modulação de Alvenaria Estrutural',s:STY.title}]);
 R.push(['Projeto',proj||'—']);R.push(['Gerado em',new Date().toLocaleString('pt-BR')]);R.push(null);
 R.push(['Perda de blocos',{n:pb,s:STY.pct},{t:'← altere aqui: todas as abas recalculam',s:STY.note}]);
 R.push(['Perda de aço',{n:ps,s:STY.pct}]);R.push(null);
 R.push([{t:'Níveis',s:STY.title}]);R.push(['Nível','Paredes','Repetições','Aba'].map(t=>({t,s:STY.head})));
 for(const L of levels)R.push([L.name,{n:L.walls,s:STY.int},{f:qn(L.sheet)+'!$B$3',v:L.rep,s:STY.int},L.sheet]);
 R.push(null);R.push([{t:'Blocos — total da obra (com repetições)',s:STY.title}]);
 R.push(['Peça','Descrição',...levels.map(l=>l.name),'Total','Total com perda (un)'].map(t=>({t,s:STY.head})));
 const nL=levels.length,cT=2+nL,t0=R.length+1;
 for(const c of codes){const r=R.length+1,row=[c,descOf(c)];let tot=0;levels.forEach(L=>{const br=L.blockRows[c];const v=br?L.blocks[c]*L.rep:0;tot+=v;row.push(br?{f:qn(L.sheet)+'!E'+br,v,s:STY.int}:{n:0,s:STY.int});});row.push({f:`SUM(${col(2)}${r}:${col(cT-1)}${r})`,v:tot,s:STY.tot},{f:`ROUNDUP(${col(cT)}${r}*(1+$B$5),0)`,v:up(tot*(1+pb)),s:STY.tot});R.push(row);}
 const t1=R.length;if(codes.length){const row=[{t:'Total',s:STY.tot},''];for(let k=0;k<=nL+1;k++)row.push({f:`SUM(${col(2+k)}${t0}:${col(2+k)}${t1})`,v:sumCol(R,2+k,t0,t1),s:STY.tot});R.push(row);}
 R.push(null);R.push([{t:'Aço — total da obra (com repetições)',s:STY.title}]);
 R.push(['Bitola (mm)','kg/m',...levels.map(l=>l.name+' (m)'),'Comprimento total (m)','Barras de 12 m','Barras com perda','Peso com perda (kg)'].map(t=>({t,s:STY.head})));
 const a0=R.length+1;
 for(const d of diams){const r=R.length+1,row=[{n:d,s:STY.gen},{n:mass(d),s:STY.dec}];let tot=0;levels.forEach(L=>{const sr=L.steelRows[d];const l=sr?r2(L.rows.filter(x=>N(x.diameter)===d).reduce((s,x)=>s+x.total,0))*L.rep:0;tot+=l;row.push(sr?{f:qn(L.sheet)+'!D'+sr,v:l,s:STY.dec}:{n:0,s:STY.dec});});
  const cTot=col(2+nL),cB=col(3+nL),cP=col(4+nL);row.push({f:`SUM(${col(2)}${r}:${col(1+nL)}${r})`,v:tot,s:STY.totd},{f:`${cTot}${r}/12`,v:tot/12,s:STY.dec},{f:`ROUNDUP(${cB}${r}*(1+$B$6),0)`,v:up(tot/12*(1+ps)),s:STY.tot},{f:`${cP}${r}*12*B${r}`,v:up(tot/12*(1+ps))*12*mass(d),s:STY.totd});R.push(row);}
 const a1=R.length;if(diams.length){const row=[{t:'Total',s:STY.tot},''];for(let k=2;k<=nL+5;k++)row.push({f:`SUM(${col(k)}${a0}:${col(k)}${a1})`,v:sumCol(R,k,a0,a1),s:k===nL+4?STY.tot:STY.totd});R.push(row);}
 R.push(null);R.push([{t:'Engenhar Engenharia e Projetos · Modulação de Alvenaria',s:STY.note}]);
 const all=[{name:RES,xml:sheetXML(R,[20,28,...levels.map(()=>22),20,18,18,20])},...sheets];
 const files=[['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+all.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>'],
  ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
  ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+all.map((s,i)=>`<sheet name="${xe(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>'],
  ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+all.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+`<Relationship Id="rId${all.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
  ['xl/styles.xml',STYLES],...all.map((s,i)=>['xl/worksheets/sheet'+(i+1)+'.xml',s.xml])];
 return zip(files);}
window.xlsx73={gather,build:buildXlsx};window.xlsxKit73={zip,sheetXML,STYLES,STY,col};
window.exportXlsx73=async function(btn){const st=$('xlStatus73');try{if(btn)btn.disabled=true;if(st)st.textContent='Montando a planilha…';const levels=await gather();const data=buildXlsx(levels);
 const nm='Quantitativos_Modulacao_Engenhar_V87'+(($('project')?.value||'').trim()?'_'+$('project').value.trim().replace(/[^\w\-]+/g,'_').slice(0,40):'')+'.xlsx';
 download(nm,data,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');const s2=$('xlStatus73');if(s2)s2.textContent='Planilha pronta: '+levels.length+' nível(is) + aba Resumo, perdas de '+f1(loss.blocks)+'% (blocos) e '+f1(loss.steel)+'% (aço).';}
 catch(e){const s2=$('xlStatus73');if(s2)s2.textContent=e.message;else alert(e.message);}finally{if(btn)btn.disabled=false;}};
function addXlsBar(){const out=$('output');if(!out||out.querySelector('.xl73')||!Array.isArray(state.results)||!state.results.some(m=>m?.rows?.length))return;
 const bar=document.createElement('div');bar.className='xl73';
 bar.innerHTML=`<button type="button" id="xlBtn73">📊 Baixar quantitativos (Excel)</button><label>Perda de blocos <input id="lossB73" type="number" min="0" max="50" step="0.5" value="${loss.blocks}"> %</label><label>Perda de aço <input id="lossS73" type="number" min="0" max="50" step="0.5" value="${loss.steel}"> %</label><span id="xlStatus73" class="note">Uma aba por nível (com repetições) e uma aba Resumo com o total da obra.</span>`;
 const h=out.querySelector('h2');if(h)h.after(bar);else out.prepend(bar);
 bar.querySelector('#xlBtn73').onclick=e=>window.exportXlsx73(e.currentTarget);
 bar.querySelector('#lossB73').onchange=e=>{loss.blocks=Math.max(0,Math.min(50,N(e.target.value)||0));saveLoss();};
 bar.querySelector('#lossS73').onchange=e=>{loss.steel=Math.max(0,Math.min(50,N(e.target.value)||0));saveLoss();};}
const css=document.createElement('style');css.textContent='.xl73{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;margin:6px 0 12px;padding:10px 12px;background:#eef6ee;border:1px solid #b9d8bb;border-radius:8px}.xl73 button{background:#1d7a3a;color:#fff;font-weight:600}.xl73 label{display:inline-flex;align-items:center;gap:6px;font-size:13px;margin:0}.xl73 input{width:70px}.xl73 .note{flex:1 1 260px;margin:0}';document.head.append(css);
})();
