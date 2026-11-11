// V95 — prancha: coluna da direita com NOTAS EXECUTIVAS (de cima até o carimbo) e carimbo no canto inferior direito,
// com o comprimento da legenda da NBR 10068 (A0/A1: 175 mm · A2/A3: 178 mm). A4 continua com o carimbo antigo.
(function(){
'use strict';
if(typeof plotSheetHTML26!=='function'||typeof collectPlot26!=='function')return;
const colW=()=>{const s=plotSettings26(),[W]=sheetSize26();if(W<419)return 0;return /A0|A1/.test(s.format)?175:178;};
const stampH=()=>{const s=plotSettings26();return /A0|A1/.test(s.format)?92:86;};
const GAP=6;window.noteCol95=()=>colW();
const NOTES=[
 ['GERAIS',[
  'Medidas em centímetros e níveis em metros, salvo indicação. Não medir no desenho: valem as cotas.',
  'Ler em conjunto com os projetos de arquitetura, fundações, lajes e instalações. Divergências devem ser informadas ao projetista antes da execução.',
  'Normas: ABNT NBR 16868-1, -2 e -3 (alvenaria estrutural), NBR 15270-1 (blocos cerâmicos), NBR 6118 (concreto), NBR 6120 (ações) e NBR 7480 (aço).',
  'Paredes estruturais não podem ser demolidas, cortadas ou ter vãos abertos sem autorização do projetista.']],
 ['BLOCOS',[
  'Blocos cerâmicos estruturais 14×19×39 cm, com resistência característica (fbk) indicada por pavimento, atendendo à NBR 15270-1. Recebimento por lote, com ensaios.',
  'Seguir a paginação das plantas de 1ª e 2ª fiada e das elevações. Usar as peças da família (14, 19, 29, 34, 44, 54, canaletas U e J); evitar cortes não indicados.',
  'Assentar os blocos limpos e sem umedecer em excesso; furos alinhados na vertical nos pontos de graute.']],
 ['ARGAMASSA E JUNTAS',[
  'Argamassa de assentamento com a resistência especificada, sem ultrapassar a resistência do bloco na área líquida.',
  'Juntas horizontais e verticais de 1 cm, cheias, salvo indicação. Prumo, nível e alinhamento dentro das tolerâncias da NBR 16868-2.',
  'Marcação da 1ª fiada a partir dos eixos, com esquadro e nível conferidos; usar escantilhão em todos os cantos.']],
 ['GRAUTE',[
  'Graute com resistência característica (fgk) especificada em projeto, consistência fluida (abatimento de 20 ± 3 cm) e agregado graúdo de até 9,5 mm (brita 0).',
  'Grautear só depois de a argamassa ganhar resistência (mínimo de 24 h após o assentamento).',
  'Deixar janela de inspeção e limpeza na 1ª fiada de cada furo grauteado; retirar as rebarbas de argamassa antes do lançamento.',
  'Lançar em camadas, adensando com haste ou vibração leve, sem deslocar a armadura; preencher totalmente o furo, sem vazios.']],
 ['ARMADURA VERTICAL',[
  'Aço CA-50 (NBR 7480). Barras nas posições indicadas nas elevações (N), uma por furo, salvo indicação.',
  'Esperas (arranques) da fundação ou da laje na posição exata dos furos grauteados, com o comprimento de traspasse indicado.',
  'Encaixe: posicionar a barra pela janela de inspeção e amarrá-la à espera antes do graute; manter a barra centrada no furo com espaçador e travada no topo.',
  'Não cravar a barra no graute já lançado.']],
 ['VERGAS, CINTAS E LAJES',[
  'Vergas e contravergas em canaleta U grauteada e armada, com apoio mínimo de 30 cm para cada lado do vão.',
  'Cinta de respaldo em canaleta (U/J) no topo de todas as paredes estruturais, sob a laje.',
  'Lajes conforme a planta de lajes (tipo, altura e direção). Escorar e reescorar conforme a NBR 15696; retirar as escoras só com resistência adequada.',
  'Na laje de cobertura, prever apoio deslizante (manta ou papel betumado) sobre a cinta, para reduzir fissuras por variação térmica.',
  'Cargas não previstas (caixa d’água, equipamentos) só com consulta ao projetista.']],
 ['INSTALAÇÕES E CONTROLE',[
  'Eletrodutos pelos furos verticais dos blocos; tubulações hidráulicas em shafts ou paredes não estruturais. Proibidos rasgos horizontais ou inclinados em paredes estruturais.',
  'Controle tecnológico: corpos de prova de argamassa e graute e ensaios de prisma por pavimento, conforme a NBR 16868-3.']]];
function noteGroups(){try{const g=window.notes96?.();if(g&&g.length)return g;}catch(e){console.error('V96 notas',e);}return NOTES;}
function notesHTML(G){G=G||noteGroups();let h='<div class="nt95t">NOTAS EXECUTIVAS</div>';let n=0;for(const[t,l]of G){h+='<div class="nt95g">'+t+'</div>'+l.map(x=>'<div class="nt95i"><span>'+(++n)+'.</span>'+esc(x)+'</div>').join('');}return h;}
const charsOf=G=>G.reduce((s,[t,l])=>s+t.length+40+l.reduce((a,x)=>a+x.length+25,0),0);
// V106.7 — carimbo no modelo Engenhar: faixa azul com logo e nome; projeto/título; cliente | identificação/revisão;
// responsável técnico; emissão/escalas | folha/formato; conteúdo; desenho/verificação/aprovação.
function st106(){try{const S=window.loads77?.S?.();if(S){S.stamp106??={};return S.stamp106;}}catch{}return {};}
function logo106(){const o=st106();if(o.logo)return o.logo;try{return localStorage.getItem('stamp106logo')||'';}catch{return '';}}
window.stamp106=st106;window.logo106=logo106;
function stampHTML(sheet,index,total){const s=plotSettings26(),o=st106(),date=s.date?s.date.split('-').reverse().join('/'):'____/____/______';let content='';try{content=plotContents27(sheet);}catch{}
 const proj=o.titulo||$('project').value||'Projeto de modulação',cli=o.cliente||'',lg=logo106(),prof=o.prof||'Engenheiro Civil';
 const cell=(t,v,b,cs)=>'<td'+(cs?' colspan="2"':'')+'><span>'+t+'</span>'+(b?'<b>'+v+'</b>':v)+'</td>';
 return '<div class="st95h">'+(lg?'<div class="st95lg"><img src="'+lg+'" alt=""></div>':'<div class="st95lg st95lt"><b>ENGENHAR</b><small>ENGENHARIA E PROJETOS</small></div>')+'<div class="st95n">ENGENHAR<br>ENGENHARIA E PROJETOS</div></div>'+
  '<table class="st95g">'+
  '<tr>'+cell('Projeto / título',esc(proj),1,1)+'</tr>'+
  '<tr>'+cell('Cliente',esc(cli||'____________'))+cell('Identificação / revisão',esc(s.clientNumber||'A preencher')+' / '+esc(s.revision||'00'))+'</tr>'+
  '<tr>'+cell('Responsável técnico / autor do projeto',esc(s.engineer||'')+(prof?' · '+esc(prof):'')+' · CREA '+esc(s.crea||'____________'),0,1)+'</tr>'+
  '<tr>'+cell('Emissão / escalas',date+' · Indicadas')+cell('Folha / formato',(index+1)+' / '+total+' · '+esc(s.format),1)+'</tr>'+
  '<tr>'+cell('Conteúdo / tipo de documento',esc(content||'Alvenaria estrutural · paginação, armaduras e lajes'),0,1)+'</tr>'+
  '<tr>'+cell('Desenho / verificação / aprovação',esc(o.aprov||'A preencher pelo responsável pela emissão'),0,1)+'</tr></table><div class="st95e"></div>';}
// folha: tira o carimbo antigo (faixa de baixo) e põe a coluna de notas + carimbo no canto
{const base=plotSheetHTML26;plotSheetHTML26=function(sheet,index,total,...a){let html=base.call(this,sheet,index,total,...a);const cw=colW();if(!cw)return html;
 const [W,H]=sheetSize26(),sh=stampH(),x=W-10-cw,i=html.lastIndexOf('<div class="plotStamp26">');if(i<0)return html;
 const tail=html.slice(i),end=html.length-6;// remove o carimbo antigo (último bloco antes do </div> final da folha)
 const nh=H-20-sh-3,G=noteGroups(),nf=Math.max(1.5,Math.min(3.2,nh/160,Math.sqrt((cw-6)*nh*.8/(.62*charsOf(G)))));html=html.slice(0,i)+'<div class="nt95" style="left:'+x+'mm;top:10mm;width:'+cw+'mm;height:'+nh+'mm;font-size:'+nf.toFixed(2)+'mm"><svg class="nt95l" width="1mm" height="'+nh+'mm" viewBox="0 0 1 '+nh+'" preserveAspectRatio="none"><line x1=".2" y1="0" x2=".2" y2="'+nh+'" stroke="#174a78" stroke-width=".35"/></svg>'+notesHTML(G)+'</div><div class="plotStamp26 st95" style="left:'+x+'mm;width:'+cw+'mm;height:'+sh+'mm;right:auto;bottom:10mm">'+stampHTML(sheet,index,total)+'</div></div>';
 return html;};}
// área de desenho: sem a faixa de baixo, menos a coluna da direita
{const base=collectPlot26;collectPlot26=function(...a){const cw=colW();if(!cw)return base.apply(this,a);const real=sheetSize26;sheetSize26=function(){const[W,H]=real();return [W-cw-GAP,H+36];};try{return base.apply(this,a);}finally{sheetSize26=real;}};}
{const base=plotPositionFree33;plotPositionFree33=function(sheet,item,x,y){const cw=colW();if(!cw)return base.apply(this,arguments);const[W,H]=sheetSize26();return x>=10&&y>=10&&x+item.w<=W-10-cw-GAP+.01&&y+item.h<=H-10+.01&&!sheet.items.some(q=>q!==item&&overlap25({x,y,w:item.w,h:item.h},q,0));};}
const css=document.createElement('style');css.textContent=
'.nt95{position:absolute;padding:0 0 0 4mm;font-family:Arial,sans-serif;line-height:1.34;color:#1b2b3a;overflow:hidden;box-sizing:border-box}'+
'.nt95 .nt95t{font-weight:700;font-size:1.45em;letter-spacing:.3mm;color:#102e4b;border-bottom:.3mm solid #174a78;padding-bottom:1.2mm;margin-bottom:1.5mm}'+
'.nt95 .nt95g{font-weight:700;font-size:1.1em;color:#174a78;margin:.9em 0 .25em}.nt95 .nt95i{margin:0 0 .6mm;text-align:justify;padding-left:1.9em;text-indent:-1.9em}.nt95 .nt95i span{display:inline-block;width:1.9em;text-indent:0}.nt95 .nt95l{position:absolute;left:0;top:0;overflow:visible}'+
'.plotStamp26.st95{display:flex!important;flex-direction:column;grid-template-columns:none!important;padding:0;box-sizing:border-box;font:2.5mm/1.3 Arial,sans-serif}'+
'.st95 .st95h{display:flex;align-items:center;gap:5mm;padding:2.2mm 4mm;background:#174a78;color:#fff;flex:none}.st95 .st95lg{flex:none;background:#fff;height:12mm;width:38mm;display:flex;align-items:center;justify-content:center;padding:1mm;box-sizing:border-box}.st95 .st95lg img{max-height:100%;max-width:100%;object-fit:contain}.st95 .st95lt{flex-direction:column;color:#174a78;line-height:1.05}.st95 .st95lt b{font-size:4.2mm;letter-spacing:.3mm}.st95 .st95lt small{font-size:1.5mm}.st95 .st95n{font-weight:700;font-size:2.9mm;line-height:1.25;letter-spacing:.1mm}'+
'.st95 .st95c{padding:1.5mm 3mm;border-bottom:.25mm solid #174a78;flex:1;overflow:hidden;font-size:2.2mm}'+
'.st95 table.st95g{width:100%;border-collapse:collapse;table-layout:fixed;flex:none}.st95 .st95e{flex:1;border:.25mm solid #7f93a8;border-top:0}.st95 .st95g td{padding:1.1mm 2.2mm;border:.25mm solid #7f93a8;vertical-align:top;background:none;font-size:2.4mm;text-align:left;color:#111}.st95 .st95g td{width:50%}.st95 .st95g span{display:block;font-size:2mm;color:#3d5a78;text-transform:uppercase;letter-spacing:.05mm}.st95 .st95f b{font-size:3.4mm}';
document.head.append(css);
// campos do carimbo na tela de pranchas (gravados no projeto); logo também fica guardado neste computador para os próximos projetos
{const dl=$('plotDate27')?.closest('label');if(dl&&!$('st106cli')){const mk=(id,t,ph)=>{const l=document.createElement('label');l.innerHTML=t+'<input id="'+id+'" type="text" placeholder="'+ph+'">';return l;};
 const f=[mk('st106tit','Projeto / título','igual ao nome do projeto'),mk('st106cli','Cliente','Nome do cliente'),mk('st106prof','Título profissional','Engenheiro Civil'),mk('st106apr','Desenho / verificação / aprovação','A preencher pelo responsável pela emissão')];let at=dl;for(const l of f){at.after(l);at=l;}
 const lb=document.createElement('label');lb.innerHTML='Logo do carimbo<span style="display:flex;gap:6px;align-items:center"><button type="button" id="st106lg" class="secondary" style="margin:0">Carregar logo…</button><button type="button" id="st106lgx" class="secondary" style="margin:0">✕</button><img id="st106lgv" style="height:28px;max-width:90px;object-fit:contain;background:#fff;border:1px solid #ccd"></span><input id="st106lgf" type="file" accept="image/*" hidden>';at.after(lb);
 const map={st106tit:'titulo',st106cli:'cliente',st106prof:'prof',st106apr:'aprov'};
 const load=()=>{const o=st106();for(const[id,k]of Object.entries(map))$(id).value=o[k]||'';const lg=logo106();$('st106lgv').src=lg||'';$('st106lgv').style.display=lg?'':'none';};
 for(const[id,k]of Object.entries(map))$(id).addEventListener('change',()=>{st106()[k]=$(id).value.trim();});
 $('st106lg').onclick=()=>$('st106lgf').click();$('st106lgx').onclick=()=>{delete st106().logo;try{localStorage.removeItem('stamp106logo');}catch{}load();};
 $('st106lgf').onchange=()=>{const fl=$('st106lgf').files?.[0];if(!fl)return;const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{const k=Math.min(1,600/im.width,200/im.height),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);const u=c.toDataURL('image/png');st106().logo=u;try{localStorage.setItem('stamp106logo',u);}catch{}load();};im.src=r.result;};r.readAsDataURL(fl);$('st106lgf').value='';};
 load();setInterval(()=>{if(document.activeElement&&document.activeElement.id?.startsWith('st106'))return;const o=st106();if($('st106cli')&&$('st106cli').value!==(o.cliente||''))load();},2000);}}
})();
