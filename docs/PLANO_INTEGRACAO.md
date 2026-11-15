# Plano de integração dos programas Engenhar

**Situação:** planejado, não iniciado. Registrado em 15/11/2026 a pedido do Eng. Ademilson, para ser desenvolvido mais adiante.

## Objetivo

Os programas Engenhar (e os próximos que forem criados) devem trabalhar **integrados**. Um mesmo projeto pode ter partes em concreto (contenção), alvenaria estrutural e estrutura metálica, e os programas precisam compartilhar geometria, níveis, cargas e dados de solo.

Programas existentes:

| Programa | Arquivo / local | Conversa |
|---|---|---|
| Engenhar Muros (contenções) | `muros/Engenhar_Muros.html` | "Engenhar Contenções" |
| Modulação de Alvenaria Engenhar | `Modulacao_Alvenaria_Engenhar_V108_8.html` | "Engenhar Modulação" |
| Engenhar Metálicas | fora deste repositório | "Engenhar Metálicas" |
| Relatório de sondagem | ainda não enviado (HTML) | — |

Recomendação: reunir todos no mesmo repositório (`muros/`, `modulacao/`, `metalicas/`, `sondagem/`, `compartilhado/`).

## Peças da integração

### 1. Formato comum de intercâmbio ("Engenhar Projeto")
Arquivo JSON com regras únicas para todos os programas:
- identificação do projeto, revisão, disciplina de origem e data;
- origem, eixos e unidades (cm; níveis em relação ao ±0,00 do projeto);
- níveis (pavimentos, topo de muro, fundo de viga…);
- elementos de cada disciplina com geometria em planta e cotas;
- **apoios e cargas** (reações exportadas por um programa e importadas por outro, com a revisão de origem);
- **dados geotécnicos** (sondagens: furo, cota, camadas, SPT por metro, nível d'água).

A especificação ficará em `compartilhado/` e cada programa a implementa.

### 2. Botões em cada programa
- **Exportar para compatibilização**: gera o arquivo da disciplina.
- **Importar referência**: mostra os elementos das outras disciplinas como fundo (sem editar) e/ou recebe cargas. Avisa quando o arquivo de origem mudou de revisão.

Exemplos:
- Metálica apoiada no topo do muro → Muros recebe cargas nos pilares.
- Alvenaria estrutural sobre a viga do muro → carga distribuída na VB/VT.
- Modulação abre o muro como referência para posicionar as paredes.

### 3. Painel de compatibilização (opcional, depois)
Programa pequeno que **não projeta**: abre os arquivos das disciplinas juntos, sobrepõe em planta, aponta interferências (pilar × parede, níveis divergentes, cargas exportadas e não importadas) e junta quantitativos e índice de pranchas.

## Relatório de sondagem → Engenhar Muros (prioridade quando começar)

O programa de relatório de sondagem (HTML) deve exportar os dados no formato comum, ou o Muros deve ler o arquivo do relatório diretamente, reconhecendo:
- furos, cotas da boca e coordenadas;
- camadas (descrição e classificação do solo) e **SPT por metro**;
- nível d'água;
- (para vários furos) média ou escolha do furo, como hoje é feito manualmente.

No Engenhar Muros isso alimenta o painel de cálculo: SPT e solo da fundação, nível d'água do empuxo e, se houver, parâmetros de resistência. Hoje o Muros aceita **um único tipo de solo** no perfil; a importação por camadas exigirá ampliar a capacidade vertical para solo estratificado.

Primeiro passo quando for iniciado: receber o HTML do relatório de sondagem para ver como ele guarda os dados.

## Ordem sugerida
1. Especificar o formato comum.
2. Importação da sondagem no Engenhar Muros.
3. Exportar/importar referência nos três programas.
4. Troca de cargas entre disciplinas.
5. Painel de compatibilização, se fizer falta.
