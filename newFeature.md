Calendário com **agenda própria** do app, e o vínculo com um curso como um campo opcional.

## Como fica

**Evento livre**
- Título, data, horário opcional e categoria (prova, entrega, revisão, lembrete, ou uma que você crie), com cor por categoria.
- Notas e um estado de concluído.
- Campo **"Curso relacionado"**, vazio por padrão. Só quando preenchido o evento ganha os extras ligados ao curso.

**Calendário**
- Visão mensal com os eventos e, na mesma grade, um indicador discreto dos dias estudados, usando os dados que o heatmap já tem. Você vê de uma vez se estudou antes da prova.
- Clicar num dia vazio cria um evento. Clicar num dia estudado mostra o detalhe do dia.
- Uma lista "Próximos prazos" ao lado, ordenada por data.

**Painel inicial**
- Uma faixa pequena ou um bloco ao lado do heatmap com os próximos 3 prazos e a contagem regressiva ("Prova de Estatística · em 26 dias"). Assim o calendário aparece no dashboard sem depender dos cards de curso.

**Extras que dependem do vínculo (opcionais)**
- Se o evento estiver ligado a um curso, o card dele pode mostrar "~4 h/dia até a prova", usando as horas restantes. Sem vínculo, nada disso aparece, e o evento funciona normalmente.

## Modelo de dados

Uma tabela `Event` com: `id`, `title`, `date`, `time` (nulo), `category`, `notes`, `done` e `course_id` (nulo). Sem chave obrigatória para curso, então apagar um curso não apaga nem quebra o evento (só zera o vínculo).

Guarde `date` como **data local sem fuso** (um dia inteiro), não como timestamp UTC. É o mesmo cuidado do bug de datas que apontei no heatmap: uma prova no dia 20 deve continuar no dia 20 independente do horário em que você a cadastra.

## Decisões em aberto

- **Recorrência:** útil para coisas semanais ("revisar C toda quinta"), mas aumenta a complexidade. Sugiro deixar para uma segunda fase.
- **Lembretes:** notificação do navegador no dia anterior e na manhã do evento. É simples de fazer e é o que faz o calendário ser usado de verdade.
- **Exportar `.ics`:** deixa você abrir os prazos no Google Calendar ou no celular. Para um app self-hosted, essa é uma saída barata e prática.

Se quiser, escrevo isso no formato do plano V2 que você já usa: modelo, endpoints, componentes do frontend e plano de testes. Quer incluir recorrência e lembretes já na primeira versão, ou começar só com eventos simples?