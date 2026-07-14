# Plataforma de Receitas

Frontend da plataforma de cursos em vídeo. A aplicação é feita com React, TypeScript e Vite e conversa com a API do backend para listar cursos, abrir aulas, registrar progresso, guardar anotações e baixar anexos.

## Funcionalidades

- Listagem de cursos com capa e progresso.
- Reordenação por arrastar e soltar.
- Cadastro manual de cursos com nome, caminho e capa opcional.
- Edição e exclusão de cursos.
- Player de aula com progresso de tempo assistido.
- Anotações com timestamp.
- Anexos por aula.
- Configuração da URL da API nas preferências.

## Arquivos Do Repositório

### Necessários para o front-end

- `package.json`
- `package-lock.json`
- `vite.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `tsconfig.json`
- `tsconfig.node.json`
- `components.json`

### Opcionais, dependendo do deploy

- `vercel.json`

### Não fazem parte do app e devem ficar fora do GitHub

- `design system/`
- `public/cookie.svg`
- `public/cookie.png`

## Instalação E Execução

Há duas formas de rodar o projeto: com Docker Compose ou localmente para desenvolvimento.

### Opção 1: Docker Compose

Essa é a forma mais simples quando você quer subir front-end e backend juntos.

1. Instale o [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Crie um arquivo chamado `docker-compose.yml` em uma pasta qualquer e use este conteúdo:

```yml
name: receitas

services:
  front-end:
    container_name: front-end
    image: ghcr.io/ryanrpj/frontend-plataforma-de-receitas:latest
    ports:
      - 5050:4173
    depends_on:
      - back-end
    restart: always

  back-end:
    container_name: back-end
    image: ghcr.io/ryanrpj/backend-plataforma-de-receitas:latest
    restart: always
    ports:
      - 9823:9823
    volumes:
      - your-courses:/courses:ro
```

3. Substitua `your-courses` pelo caminho real da pasta onde seus cursos estão. Esse passo só existe para a execução via Docker Compose.

Exemplo correto:

```yml
- C:\Users\myuser\Downloads\courses:/courses:ro
```

Exemplo incorreto:

```yml
- C:\Users\myuser\Downloads\courses/courses:ro
```

4. Abra um terminal na pasta do `docker-compose.yml` e rode:

```bash
docker compose up -d
```

5. Aguarde os containers subirem e acesse `http://localhost:5050`.

### Opção 2: Desenvolvimento local

Use essa opção se você quiser alterar o código e testar no navegador rapidamente.

1. Garanta que o backend esteja rodando em `http://localhost:9823`.

   O backend é um projeto separado deste front-end. Se você quiser rodar tudo localmente, abra o repositório do backend e inicie a API conforme o README dele. A regra aqui é simples: a API precisa estar disponível na porta 9823 antes de abrir esta aplicação.

   Se você já tiver o backend em uma pasta local, entre nela e suba o serviço com o comando indicado pelo projeto. Em geral, isso é feito com Docker Compose ou com o comando de desenvolvimento do próprio backend.

2. Instale as dependências do front-end:

```bash
npm install
```

3. Inicie o front-end:

```bash
npm run dev -- --host 0.0.0.0
```

4. Abra `http://localhost:5173`.

## Como adicionar cursos

1. Acesse a tela **Meus Cursos**.
2. Clique em **Adicionar manualmente**.
3. Informe o nome do curso.
4. Informe o caminho da pasta do curso.
5. Se quiser, adicione uma capa por URL ou arquivo.
6. Confirme para cadastrar.

Se você colar um caminho completo do Windows, a interface usa a última pasta do caminho como nome da pasta do curso.

## Como configurar a API

Se o backend não estiver em `http://localhost:9823`, abra **Configurações** e ajuste a URL da API.

## Scripts Úteis

```bash
npm run dev
npm run build
npm run preview
```

## Observações

- O diretório mapeado em `/courses` precisa conter as pastas dos cursos.
- O front-end só lista cursos que o backend consegue enxergar.
- Se a API não responder, a interface mostra o estado vazio e as mensagens de erro de conexão.
