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

---

## Como rodar o projeto (Guia para Iniciantes)

A forma mais simples de subir a plataforma (Frontend + Backend) em qualquer computador é utilizando o **Docker**. Como esse projeto é dividido em duas partes (Front e Back), vamos colocá-las juntas em uma mesma pasta para facilitar.

### 1. Preparando os arquivos
Baixe o repositório principal no seu computador. 

No terminal, você pode fazer assim:
```bash
git clone https://github.com/Luis-Henrique-ufg/Receitas.git
cd Receitas
```

### 2. Criando o arquivo Docker Compose
Dentro dessa pasta principal `Receitas`, crie um arquivo chamado `docker-compose.yml` e cole o seguinte conteúdo dentro dele:

```yml
name: receitas

services:
  front-end:
    container_name: front-end
    build: ./frontend
    ports:
      - 5050:4173
    depends_on:
      - back-end
    restart: always

  back-end:
    container_name: back-end
    build: ./backend
    restart: always
    ports:
      - 9823:9823
    volumes:
      - ./courses:/courses:ro
```
> **Onde ficam os meus cursos?**
> A linha `- ./courses:/courses:ro` significa que o sistema vai procurar os cursos numa pasta chamada `courses` junto dos seus arquivos. 
> Se os seus vídeos estiverem na pasta de Downloads (por exemplo, de arquivos baixados via Torrent), basta mudar essa linha para apontar para lá. Exemplo no Windows:
> `- C:\Users\SEU_NOME_DE_USUARIO\Downloads:/courses:ro`

### 3. Subindo a Plataforma
Agora é só abrir o terminal na pasta principal `Receitas` (onde está o seu `docker-compose.yml`) e rodar:

```bash
docker compose up -d --build
```
Aguarde alguns minutos enquanto o sistema prepara tudo. Quando terminar, acesse **`http://localhost:5050`** no seu navegador!

---

## Desenvolvimento Local (Sem Docker)

Se preferir rodar manualmente para fazer alterações no código (modo desenvolvedor):

1. Garanta que o backend esteja rodando primeiro na porta `9823`. (Siga o README do backend).
2. Entre na pasta do frontend:
```bash
cd frontend
```
3. Instale as dependências:
```bash
npm install
```
4. Inicie o servidor:
```bash
npm run dev -- --host 0.0.0.0
```
5. Acesse **`http://localhost:5173`** no seu navegador.

---

## Como adicionar cursos

1. Acesse a tela **Meus Cursos**.
2. Clique em **Adicionar manualmente**.
3. Informe o nome do curso.
4. Informe o caminho da pasta do curso.
5. Se quiser, adicione uma capa por URL ou arquivo.
6. Confirme para cadastrar.

> **Dica:** Se você colar um caminho completo do Windows, a interface usa automaticamente a última pasta do caminho como nome da pasta do curso.

## Como configurar a API

Se o backend não estiver em `http://localhost:9823`, abra **Configurações** no menu da interface e ajuste a URL da API para o endereço correto.

## Scripts Úteis para Desenvolvedores

```bash
npm run dev      # Roda o servidor local
npm run build    # Compila o projeto para produção
npm run preview  # Pre-visualiza o build de produção
```
