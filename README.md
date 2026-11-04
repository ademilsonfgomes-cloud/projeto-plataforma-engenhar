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

Fórmulas de cálculo ficam em `src/calculo/`, separadas da tela, para poderem ser testadas:
`alvenaria.js` (compressão simples, flexo-compressão, hef/tef, fbk, fgk), `vento.js`
(vento NBR 6123, desaprumo, rigidez, verificação das paredes de contraventamento, γz e
armadura dos trechos tracionados) e `vergas.js` (flexão e cisalhamento das vergas).
O quadro das vergas está em `src/js/51-vergas.js` (botão "🪟 Vergas").
O quadro de vento está em `src/js/50-vento-e-contraventamento.js` (botão
"🌬 Vento e contraventamento" no quadro "Resistências por pavimento"). O memorial de cálculo está em
`src/js/52-memorial-de-calculo.js` (botão no quadro "Resistências por pavimento").

## Tela

A tela segue o estilo dos programas de CAD (`src/js/53-tela-estilo-cad.js`): menus no topo,
barra do fluxo do projeto, barra lateral de desenho, abas das vistas e linha de comando no
rodapé, fundo da área de desenho escuro (troca no rodapé ou em Ver). **As barras são
personalizáveis**: arraste um ícone para outro lugar ou para fora; Ver → Personalizar barras
abre a paleta com todas as ferramentas. A arrumação fica salva no navegador de cada pessoa.

## Depois de alterar o código

```bash
python3 build.py                  # monta dist/Modulacao_Alvenaria_Engenhar.html
node --test tests/*.test.js    # fórmulas, com casos conferidos à mão
node tests/teste-basico.js        # abre no navegador e confere modulação, cargas,
                                  # fbk/fgk e memorial com a referência gravada
node tests/teste-tela.js          # tela: barras, arrastar, menus, linha de comando
node tests/teste-encaixe.js       # paredes fora do eixo no encontro: nenhum vão nas fiadas
```

O teste no navegador precisa do Node.js e do Playwright (`npm install playwright`).
Se uma mudança **deve** alterar os resultados (por exemplo, um cálculo novo), confira
os números e grave a nova referência com `node tests/teste-basico.js --gravar-referencia`.

## Histórico

- **V108.8 original**: primeiro commit do branch `main`, exatamente como recebido.
- **Organização do código**: separação em `src/`. O arquivo montado é idêntico,
  byte a byte, ao original da V108.8 (SHA-256 `41191e99b9363890ad57…`).
