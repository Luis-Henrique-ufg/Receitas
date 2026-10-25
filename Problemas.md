## Heatmap: acabamento

1. **Os cortes vêm do scroll.** Os rótulos "Out" e "Nov" estão sobrepostos e cortados ("utNov"), o texto de ajuda perdeu o começo ("o cursor ou toque…") e os rótulos Seg/Qua/Sex sumiram. Tudo isso está dentro do container que rola, e ele está rolado até o fim. Correções:
   - Medir o container com ResizeObserver e calcular o lado da célula como `(largura − gaps) / nº de semanas`, limitado a ~11–20 px. Em 52 semanas cabe sem rolar. Só abaixo do mínimo (celular) deixe rolar, com a barra escondida e `scrollLeft = scrollWidth` ao montar.
   - Tire os rótulos de dia e o texto de ajuda do scroller, ou use `position: sticky; left: 0`.
   - Omita o rótulo do primeiro mês se ele tiver menos de 3 colunas antes do próximo.
2. **Confira a data de "hoje".** Hoje é domingo (25/10), mas a célula com contorno está na linha de sábado e a última coluna não tem célula de domingo. Se o print é de hoje, as datas estão sendo agrupadas errado. A causa clássica é gravar o dia em UTC: você está em UTC−3, então qualquer estudo depois das 21h cai no dia seguinte e pode quebrar a sequência. Teste estudando às 22h e vendo em qual célula cai. A correção é usar a data local (America/Sao_Paulo) no backend, ou o cliente enviar a data local.
3. **Contraste.** A célula de ontem (nível 1) ainda quase não se distingue do nível 0. Suba a luminosidade do nível 1.
4. **Select de cursos.** "Todos os cursos" ocupa ~490 px para um texto curto. Deixe com largura do conteúdo, junto do controle 14 sem/Ano.
5. **"+36 min" na semana** não é comparação, é o próprio total, porque a semana anterior foi 0. Esconda o delta nesse caso.

## Inconsistências nos novos prints

- **"Em foco" aparece nos quatro cards.** Deveria aparecer só no curso do hero.
- **"Aula 1 de 218" contradiz os 11% concluídos** (~25 aulas feitas). Provavelmente é o índice dentro do módulo; use o índice global ("Aula 26 de 218").
- **O ícone do livro ficou sozinho numa linha acima do caminho.** Coloque ícone e texto num flex com `items-center`, `min-w-0` e truncate.
- **O caminho repete o nome:** "031 - Criando Apresentacoes - Parte 1 › Criando Apresentacoes - Parte 1". Mostre só um quando módulo e aula têm o mesmo nome e tire o prefixo numérico na exibição. Como as pastas vêm sem acento ("Comecando", "Apresentacoes"), um nome de exibição editável por curso e aula ajudaria.
- **"Em andamento" nos quatro cards continua sem informação.** Use badge só para estados que fogem do padrão (Concluído, Não iniciado, Pausado).
- **"sem previsão ainda" repetido quatro vezes é ruído.** Esconda o trecho até haver dados.
- **"última aula há X dias" sumiu dos cards.** No plano, `viewedAt` fica no localStorage, então em outro navegador ou dispositivo fica vazio. Mova para o backend.

## Próximas melhorias de rastreabilidade

- **Defina a métrica de tempo estudado.** "Hoje: 36 min" com 1 pomodoro (25 min) sugere que vídeo e pomodoro podem estar se sobrepondo. Use a união dos intervalos como fonte única, e conte heartbeat só com o vídeo tocando e a aba visível.
- **Meta diária** com um anel no painel direito e **meta semanal** ("4 de 5 dias") que tolera um dia de descanso, em vez de só sequência diária.
- **Detalhe do dia:** clicar numa célula abre uma linha do tempo com aulas vistas, pomodoros e tempo por curso.
- **Mapa dia da semana × hora**, para ver quando você rende mais, usando os dados de heartbeat que você já coleta.
- **Pomodoro:** intenção da sessão ("o que vou estudar"), pausas curta e longa, e pausa automática se o vídeo ficar pausado.
- **Revisão espaçada** (3, 7 e 21 dias) para Estatística e Lógica.
- **Backup e exportação** do SQLite em JSON ou CSV. Como é self-hosted, o histórico de estudo é o dado mais difícil de recuperar.