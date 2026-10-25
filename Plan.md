# Avaliação do painel de estudos

**Veredito:** a base funcional é boa (progresso por curso, heatmap, pomodoro flutuante, busca com Ctrl+K). O problema agora é hierarquia e identidade. A tela prioriza o que ainda está vazio (o heatmap) em vez do que você faz todo dia (continuar uma aula).

## O que está funcionando
- O pomodoro como widget fixo no canto é a decisão certa: está sempre à mão sem ocupar a tela.
- A sequência (2 dias) bate com as duas células preenchidas no heatmap, então os dados estão coerentes.
- Barra de progresso mais contagem de aulas restantes dá uma noção concreta de quanto falta.

## Problemas, por prioridade

**1. O heatmap ocupa ~40% da primeira tela e está quase vazio.**
Um ano inteiro com 2 células acesas é mais espaço do que dado.

**2. A ação principal dos cards está errada.**
"Assistir" tem o mesmo peso visual que "Editar" e "Apagar", e o vermelho de "Apagar" chama mais atenção que tudo. Sugestões:
- Um único botão principal: **Continuar: Aula 27 · nome da aula**.
- Editar e Apagar vão para um menu "⋯", e apagar pede confirmação.
- Ordenar os cursos por último acesso, não por ordem de cadastro.

**3. Informação repetida e sem valor.**
- "EM ANDAMENTO" aparece nos quatro cards, então não informa nada. Só vale como selo se existirem outros estados (não iniciado, concluído, pausado), o que é o caso, talvez não tenha "pausado".
- "11% concluído" e "193 de 218 restantes" dizem quase a mesma coisa. Troque a segunda linha por algo novo: "~14 h restantes · última aula há 2 dias".
- Estimativa de término ao ritmo atual ("termina em ~março") é muito mais útil que o percentual.

**4. As estatísticas do topo têm o recorte errado.**
"Total: 25 min" é acumulado de toda a vida, e isso diz pouco no dia a dia. Prefira Hoje / Semana, com meta diária (por exemplo, anel de progresso). Defina também de onde vem esse tempo: só pomodoros, ou também tempo de vídeo assistido? O ideal é unificar as duas fontes.

**5. Identidade e coerência.**
- Caixa-alta em tudo (botões, badges, menu) cansa e achata a hierarquia. Reserve para no máximo um nível.

**6. Acessibilidade.**
Textos cinza pequenos sobre fundo escuro (como "Passe o cursor sobre os dias…") têm contraste baixo. O detalhe do heatmap só aparece no hover, o que não funciona no celular nem no teclado; precisa de foco e toque.

## Direção visual
- **Tipografia:** uma família sans de personalidade para títulos e uma mono apenas para números e tempos (cronômetro, durações). Hoje a mono aparece em rótulos que não precisam dela.
- **Cards:** raios e sombras diferentes por nível de hierarquia. O card "Continuar de onde parei" deve ser maior que os demais.

## Roadmap para virar ambiente de estudos completo
Em ordem de retorno:

1. **Retomar de onde parou:** posição por aula.
2. **Vincular pomodoro a curso e aula:** assim o tooltip do heatmap mostra "1h10 · Estatística, Linguagem C".
3. **Metas semanais** em vez de só sequência diária. Sequência diária pune descanso e gera ansiedade; "4 de 5 dias esta semana" é mais saudável.
4. **Anotações com timestamp** no vídeo, pesquisáveis pelo Ctrl+K.
5. **Revisão espaçada** para conteúdos como Estatística e Lógica: o app sugere rever a aula X após 3, 7 e 21 dias.
6. **Prazos:** datas de prova, com contagem regressiva no card.
7. **Filtro do heatmap por curso** e resumo semanal ("você estudou 6h20, +1h10 vs. semana passada").