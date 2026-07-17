<!-- prettier-ignore -->
<div align="center">

# Plataforma de Receitas (Front-end)

[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-blue?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-purple?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

[Visão Geral](#visão-geral) • [Funcionalidades](#funcionalidades) • [Começando](#começando) • [Adicionando Cursos](#adicionando-novos-cursos)
</div>

Este é o front-end oficial da **Plataforma de Receitas**, uma aplicação robusta de cursos em vídeo construída com **React**, **TypeScript** e **Vite**. A interface consome a API do back-end para gerenciar cursos, reproduzir aulas, salvar anotações e baixar anexos.

> [!NOTE]
> Esta aplicação consome uma API externa. Para executar o projeto localmente com sucesso, certifique-se de que o back-end esteja rodando paralelamente.

## Visão Geral

A Plataforma de Receitas foi desenhada para oferecer uma experiência de aprendizado focada e limpa. A aplicação não só reproduz os vídeos das aulas, como também permite anotações vinculadas ao tempo do vídeo (timestamps), suporte a anexos (PDFs) e acompanhamento em tempo real do progresso de cada módulo e curso.

## Funcionalidades

- **Gerenciamento de Cursos**: Listagem dinâmica de cursos com acompanhamento de progresso.
- **Player Inteligente**: Reprodutor de aulas com memória de tempo assistido e marcação de conclusão.
- **Anotações**: Sistema de anotações com suporte a timestamps interativos.
- **Materiais**: Suporte a downloads de anexos por aula.
- **Customização e Edição**: Cadastro manual de cursos (nome, caminho e capa), edição, exclusão e reordenação (drag and drop).
- **Configuração Simples**: Ajuste rápido da URL da API diretamente na aba de preferências.

## Começando

Você pode executar o projeto de duas maneiras: utilizando Docker Compose (ideal para subir todo o ecossistema rapidamente) ou executando o ambiente de desenvolvimento local (ideal para modificações).

### Opção 1: Execução com Docker (Recomendada)

Caso queira executar a plataforma de forma simples:

1. Certifique-se de ter o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.
2. Crie um arquivo chamado `docker-compose.yml` e adicione a seguinte configuração:

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

> [!IMPORTANT]
> Substitua `your-courses` pelo caminho absoluto no seu disco local onde os vídeos dos cursos estão armazenados.
>
> Exemplo correto: `- C:\Users\myuser\Downloads\courses:/courses:ro`  
> Exemplo incorreto: `- C:\Users\myuser\Downloads\courses/courses:ro`

3. Inicialize os containers:

```bash
docker compose up -d
```

4. Acesse a aplicação no navegador em `http://localhost:5050`.

### Opção 2: Desenvolvimento Local

Caso deseje fazer modificações na interface, você pode iniciar o servidor de desenvolvimento do Vite:

1. Garanta que o back-end da aplicação esteja em execução, tipicamente em `http://localhost:9823`. Se necessário, acesse as **Configurações** no front-end para redefinir a URL da API.
2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor do Vite:

```bash
npm run dev -- --host 0.0.0.0
```

4. O Vite iniciará o servidor, geralmente disponível em `http://localhost:5173`.

## Adicionando Novos Cursos

Para importar um curso local para dentro da plataforma:

1. Navegue até a tela **Meus Cursos**.
2. Clique no botão **Adicionar manualmente**.
3. Preencha os campos de nome e o caminho exato da pasta do curso.
4. (Opcional) Forneça uma URL ou um arquivo local para a capa.
5. Salve as alterações.

> [!TIP]
> Ao colar o caminho completo de uma pasta no Windows, a interface utilizará automaticamente o nome da última pasta como sugestão para o nome do curso.

## Scripts

Você pode utilizar os seguintes comandos Node.js (disponíveis no `package.json`):

- `npm run dev`: Inicia o servidor local de desenvolvimento com Hot-Reload.
- `npm run build`: Compila a aplicação para arquivos estáticos otimizados para produção.
- `npm run preview`: Inicia um servidor simples para visualizar a versão compilada.
