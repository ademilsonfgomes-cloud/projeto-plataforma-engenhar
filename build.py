#!/usr/bin/env python3
"""Monta o programa em um único arquivo .html a partir da pasta src/.

Uso:  python3 build.py
Saída: dist/Modulacao_Alvenaria_Engenhar.html

O modelo src/index.template.html contém marcadores:
  {{include:caminho}}  -> substituído pelo conteúdo do arquivo (texto)
  {{base64:caminho}}   -> substituído pelo arquivo em base64 (imagens, pdf.js)
Os caminhos são relativos a src/.
"""
import base64, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'
DIST = ROOT / 'dist'
OUT = DIST / 'Modulacao_Alvenaria_Engenhar.html'
MARK = re.compile(r'\{\{(include|base64):([^}]+)\}\}')


def expand(text, depth=0):
    if depth > 5:
        raise RuntimeError('includes aninhados demais')

    def repl(m):
        kind, rel = m.group(1), m.group(2)
        path = SRC / rel
        if not path.is_file():
            raise FileNotFoundError(f'arquivo não encontrado: src/{rel}')
        if kind == 'base64':
            return base64.b64encode(path.read_bytes()).decode('ascii')
        return expand(path.read_text(encoding='utf-8'), depth + 1)

    return MARK.sub(repl, text)


def main():
    html = expand((SRC / 'index.template.html').read_text(encoding='utf-8'))
    DIST.mkdir(exist_ok=True)
    OUT.write_text(html, encoding='utf-8', newline='')
    print(f'ok: {OUT.relative_to(ROOT)} ({len(html.encode("utf-8")) / 1e6:.2f} MB)')


if __name__ == '__main__':
    sys.exit(main())
