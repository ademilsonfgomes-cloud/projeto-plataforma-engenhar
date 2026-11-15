// V145 — MEDIR OS DESENHOS FORA DA TELA PRINCIPAL: para montar as pranchas e exportar (DXF/PDF), cada quadro é colocado
// num lugar escondido e medido (tamanho dos textos, recortes, alinhamentos). Antes ele ia para o próprio documento do
// programa, que num projeto grande tem ~160 mil elementos (elevações, fiadas, tabelas): cada medida obrigava o navegador
// a recalcular tudo — 60 mil medidas = 70 s de tela congelada. Agora as medidas são feitas num documento à parte
// (moldura invisível) com os mesmos estilos: mesmo resultado, sem arrastar o resto da tela junto.
(function () {
  'use strict';
  let fr = null, sujo = true, nCorpo = -1, corpoSt = null;
  new MutationObserver(() => { sujo = true; }).observe(document.head, { childList: true, subtree: true, characterData: true });
  function estilos(doc) {
    doc.head.replaceChildren();
    const m = doc.createElement('meta'); m.setAttribute('charset', 'utf-8'); doc.head.append(m);
    for (const s of document.querySelectorAll('style,link[rel="stylesheet"]')) doc.head.append(doc.importNode(s, true));
  }
  function iso() {
    if (window.__v145off) return document.body;
    try {
      if (!fr || !fr.isConnected || !fr.contentDocument?.body) {
        fr = document.createElement('iframe'); fr.id = 'iso145'; fr.setAttribute('aria-hidden', 'true'); fr.tabIndex = -1;
        fr.style.cssText = 'position:fixed;left:-300000px;top:0;width:4000px;height:3000px;border:0;visibility:hidden;pointer-events:none';
        document.documentElement.append(fr);
        const d = fr.contentDocument; d.open(); d.write('<!doctype html><html><head></head><body></body></html>'); d.close();
        sujo = true;
      }
      const d = fr.contentDocument, nb = (corpoSt ??= document.body.getElementsByTagName('style')).length;
      if (sujo || nb !== nCorpo) { estilos(d); sujo = false; nCorpo = nb; }
      d.documentElement.className = document.documentElement.className;
      d.body.className = document.body.className;
      for (const [k, v] of Object.entries(document.body.dataset)) d.body.dataset[k] = v;
      d.body.style.cssText = 'margin:0;' ;
      return d.body;
    } catch (e) { console.error('V145', e); return document.body; }
  }
  window.iso145 = iso;
  // V146 — durante a montagem as folhas eram desenhadas na tela duas vezes (a montagem e a organização guardada);
  // agora só uma, no fim
  try { const p0 = previewPlot26; previewPlot26 = function (...a) { if (window.__semPrevia146) { window.__previaPend146 = true; return; } return p0.apply(this, a); }; } catch (e) { console.error('V146', e); }
})();
