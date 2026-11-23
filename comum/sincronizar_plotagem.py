#!/usr/bin/env python3
"""Copia o módulo comum de plotagem (comum/engenhar_plotagem.js) para dentro de cada programa da Engenhar.

Cada programa (arquivo HTML único) guarda uma cópia do módulo entre os marcadores
/* ENG_PLOT:inicio ... */ e /* ENG_PLOT:fim */. Edite só o arquivo comum e rode:

    python3 comum/sincronizar_plotagem.py arquivo1.html arquivo2.html ...

Sem argumentos, atualiza todos os .html da pasta do repositório que já tenham os marcadores.
"""
import glob
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
MODULO = os.path.join(AQUI, 'engenhar_plotagem.js')
PADRAO = re.compile(r'/\* ENG_PLOT:inicio.*?/\* ENG_PLOT:fim \*/', re.S)


def main(arquivos):
    modulo = open(MODULO, encoding='utf-8').read().strip()
    if not arquivos:
        arquivos = glob.glob(os.path.join(RAIZ, '*.html')) + glob.glob(os.path.join(RAIZ, '*', '*.html'))
    feitos = 0
    for caminho in arquivos:
        texto = open(caminho, encoding='utf-8').read()
        if not PADRAO.search(texto):
            continue
        novo = PADRAO.sub(lambda m: modulo, texto, count=1)
        if novo != texto:
            open(caminho, 'w', encoding='utf-8').write(novo)
            print('atualizado:', os.path.relpath(caminho, RAIZ))
        else:
            print('já igual:', os.path.relpath(caminho, RAIZ))
        feitos += 1
    if not feitos:
        print('Nenhum arquivo com os marcadores ENG_PLOT encontrado.')


if __name__ == '__main__':
    main(sys.argv[1:])
