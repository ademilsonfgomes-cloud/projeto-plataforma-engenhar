# Engenhar · Modulação de Alvenaria

Programa de modulação e projeto de **alvenaria estrutural** que roda no navegador:
importação de plantas (PDF, DXF, IFC), modulação de blocos por fiada, elevações,
armaduras, lajes, cargas, resistências (fbk/fgk) por pavimento, pranchas, exportação
DXF, quantitativos em Excel e vista 3D.

Versão atual: **V108.8**

## Como usar

Abra o arquivo **`dist/Modulacao_Alvenaria_Engenhar.html`** no navegador.
É um arquivo único, que funciona sem internet e sem instalar nada.

## Como o código está organizado

O programa original era um único arquivo de 6,4 MB. Agora o código fica separado
em partes menores dentro de `src/`, e o arquivo único é **montado** a partir delas.

```
src/
  index.template.html   estrutura da tela (HTML) com marcadores {{include:...}}
  css/                  estilos
  js/                   código, na ordem em que é executado
                        01 e 02  = núcleo do programa
                        03 a 49  = recursos adicionados em cada versão (V48 → V108.6)
                        50       = inicialização do leitor de PDF
  data/                 modelos da planilha Excel e do arquivo DXF
  assets/logo.png       logotipo
  vendor/pdfjs/         leitor de PDF (pdf.js 5.6.205), biblioteca de terceiros
build.py                monta o arquivo único em dist/
tests/teste-basico.js   teste automático no navegador
dist/                   programa pronto para usar
```

A ordem dos arquivos em `src/js/` importa: eles são executados na sequência
numérica, como eram no arquivo original.

## Depois de alterar o código

```bash
python3 build.py              # monta dist/Modulacao_Alvenaria_Engenhar.html
node tests/teste-basico.js    # abre no navegador e confere se tudo funciona
```

O teste precisa do Node.js e do Playwright (`npm install playwright`).

## Histórico

- **V108.8 original**: primeiro commit do branch `main`, exatamente como recebido.
- **Organização do código**: separação em `src/`. O arquivo montado é idêntico,
  byte a byte, ao original da V108.8 (SHA-256 `41191e99b9363890ad57…`).
