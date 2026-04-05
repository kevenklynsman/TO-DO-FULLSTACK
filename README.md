# TO-DO-FULLSTACK

Aplicação fullstack de lista de tarefas (To-Do) em arquitetura monorepo, com backend e frontend separados, banco de dados MySQL via Docker e gerenciamento de pacotes com pnpm workspaces.

---

## Índice

- [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Pré-requisitos](#pré-requisitos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Instalação e Configuração](#instalação-e-configuração)
  - [1. Clonar o repositório](#1-clonar-o-repositório)
  - [2. Instalar dependências](#2-instalar-dependências)
  - [3. Configurar variáveis de ambiente](#3-configurar-variáveis-de-ambiente)
  - [4. Subir o banco de dados com Docker](#4-subir-o-banco-de-dados-com-docker)
  - [5. Executar as migrations do Prisma](#5-executar-as-migrations-do-prisma)
  - [6. Rodar o projeto em desenvolvimento](#6-rodar-o-projeto-em-desenvolvimento)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura de Pastas Detalhada](#estrutura-de-pastas-detalhada)
- [API REST — Endpoints](#api-rest--endpoints)
- [Banco de Dados](#banco-de-dados)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Ferramentas e Tecnologias Instaladas](#ferramentas-e-tecnologias-instaladas)

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        MONOREPO                             │
│                                                             │
│   frontend/ (Next.js)          backend/ (Next.js API)       │
│   port: 3000                   port: 3001                   │
│                                     │                       │
│                                     ▼                       │
│                              infra/ (Docker)                │
│                              MariaDB LTS — port: 3306          │
│                              Adminer — port: 8080           │
└─────────────────────────────────────────────────────────────┘
```

O **backend** é um servidor Next.js que expõe apenas API Routes (REST). Ele se comunica com o banco MySQL via **Prisma ORM**. O **frontend** é um app Next.js com React 19, consumindo a API do backend via SWR.

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Gerenciador de pacotes | pnpm (workspaces) | 10.32.1 |
| Linguagem | TypeScript | ^5 |
| Backend framework | Next.js (App Router, API Routes) | 16.1.6 |
| ORM | Prisma | 7.5.0 |
| Driver de banco | @prisma/adapter-mariadb + mariadb | ^7.5.0 / ^3.5.2 |
| Validação (backend) | Zod | ^4.3.6 |
| Testes (backend) | Vitest | ^4.1.0 |
| Frontend framework | Next.js (App Router) | 16.1.6 |
| UI | React + react-dom | 19.2.3 |
| Estilização | TailwindCSS + tw-animate-css | ^4 |
| Componentes UI | shadcn/ui (radix-ui) | ^4.0.8 / ^1.4.3 |
| Ícones | lucide-react | ^0.577.0 |
| Data fetching | SWR | ^2.4.1 |
| Formulários | react-hook-form | ^7.71.2 |
| Resolvers de validação | @hookform/resolvers | ^5.2.2 |
| Validação (frontend) | Zod | ^4.3.6 |
| Utilitários CSS | class-variance-authority, tailwind-merge, clsx | latest |
| Banco de dados | MySQL / MariaDB | lts (Docker) |
| Admin de banco | Adminer | latest (Docker) |
| Linting | ESLint 9 + eslint-config-next | 16.1.6 |

---

## Pré-requisitos

Antes de começar, certifique-se de ter instalado na sua máquina:

- **Node.js** >= 20.x — [nodejs.org](https://nodejs.org)
- **pnpm** >= 10.x — `npm install -g pnpm`
- **Docker** e **Docker Compose** — [docker.com](https://www.docker.com)
- **Git** — [git-scm.com](https://git-scm.com)

Verificar versões:

```bash
node -v
pnpm -v
docker -v
docker compose version
```

---

## Estrutura do Projeto

```
TO-DO-FULLSTACK/
├── .env                        # Variáveis de ambiente raiz (compartilhadas)
├── .npmrc                      # Configuração pnpm (approve-builds=true)
├── package.json                # Scripts e configuração do monorepo raiz
├── pnpm-lock.yaml              # Lockfile unificado do monorepo
├── pnpm-workspace.yaml         # Declaração dos workspaces pnpm
├── README.md                   # Esta documentação
│
├── backend/                    # Servidor Next.js — API REST
│   ├── .env                    # Variáveis de ambiente do backend
│   ├── eslint.config.mjs       # Configuração ESLint (flat config)
│   ├── next.config.ts          # Configuração Next.js (CORS headers)
│   ├── next-env.d.ts
│   ├── prisma.config.ts        # Configuração do Prisma CLI
│   ├── tsconfig.json           # Configuração TypeScript
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma       # Schema do banco (modelos Todo + User)
│   │   └── migrations/         # Histórico de migrations SQL geradas
│   └── src/
│       ├── app/
│       │   └── api/
│       │       ├── auth/
│       │       │   ├── login/route.ts    # POST /api/auth/login
│       │       │   ├── register/route.ts # POST /api/auth/register
│       │       │   ├── logout/route.ts   # POST /api/auth/logout
│       │       │   ├── me/route.ts       # GET  /api/auth/me
│       │       │   └── google/route.ts   # POST /api/auth/google
│       │       └── todos/
│       │           ├── route.ts          # GET /api/todos, POST /api/todos
│       │           └── [id]/route.ts     # GET, PUT, DELETE /api/todos/:id
│       ├── controllers/
│       │   ├── authController.ts         # Handlers de autenticação
│       │   └── todoController.ts         # Handlers de todos com paginação
│       ├── lib/
│       │   └── prisma.ts                 # Singleton do cliente Prisma (MariaDB adapter)
│       ├── proxy.ts                      # Proxy de configuração de ambiente
│       ├── services/
│       │   ├── authService.ts            # Lógica de registro, login e Google OAuth
│       │   └── todoService.ts            # CRUD + paginação de todos via Prisma
│       └── validators/
│           ├── authValidator.ts          # Schemas Zod para auth
│           └── todoValidator.ts          # Schemas Zod para todos
│
├── frontend/                   # App Next.js — Interface do usuário
│   ├── components.json         # Configuração do shadcn/ui
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── next-env.d.ts
│   ├── postcss.config.mjs      # TailwindCSS v4 via PostCSS
│   ├── tsconfig.json
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── globals.css              # Design system CSS (oklch, dark mode, shadcn tokens)
│       │   ├── layout.tsx               # Layout raiz (Providers + Toaster + fontes)
│       │   ├── page.tsx                 # / → redireciona para /todos
│       │   ├── register/
│       │   │   └── page.tsx             # /register → tela de criação de conta
│       │   └── todos/
│       │       ├── page.tsx             # /todos → guarda auth + TodoTableList
│       │       └── create/
│       │           └── page.tsx         # /todos/create → formulário de criação
│       ├── components/
│       │   ├── Providers.tsx            # GoogleOAuthProvider + AuthProvider
│       │   ├── TodoEditDialog.tsx       # Dialog de edição do título (controlado/não-controlado)
│       │   ├── TodoForm.tsx             # Formulário de criação (react-hook-form + zod)
│       │   ├── TodoLogin.tsx            # Tela de login (email/senha + Google OAuth)
│       │   ├── TodoRegister.tsx         # Tela de registro de conta
│       │   ├── TodoTableList.tsx        # Tabela principal (TanStack Table + paginação server-side)
│       │   ├── TodoUserNav.tsx          # Popover do usuário autenticado + logout
│       │   └── ui/                      # 57 componentes base do shadcn/ui
│       │       ├── alert-dialog.tsx     # Dialog de confirmação destrutiva
│       │       ├── button.tsx           # Botão com variantes CVA
│       │       ├── checkbox.tsx         # Checkbox acessível (Radix UI)
│       │       ├── dialog.tsx           # Dialog Radix UI
│       │       ├── dropdown-menu.tsx    # Menu dropdown (Radix UI)
│       │       ├── input.tsx            # Campo de texto
│       │       ├── popover.tsx          # Popover Radix UI
│       │       ├── skeleton.tsx         # Skeleton de carregamento
│       │       ├── sonner.tsx           # Toaster Sonner com tema integrado
│       │       ├── spinner.tsx          # Spinner de carregamento
│       │       ├── table.tsx            # Primitivos de tabela HTML estilizados
│       │       └── ...                  # Demais primitivos shadcn
│       ├── contexts/
│       │   └── AuthContext.tsx          # Contexto React de autenticação
│       ├── hooks/
│       │   ├── useAuth.ts               # Hook de autenticação (login, register, logout)
│       │   ├── use-mobile.ts            # Hook de detecção de viewport mobile
│       │   └── useTodos.ts              # useTodos (paginado), useTodo, useTodoActions
│       ├── lib/
│       │   └── utils.ts                 # Utilitário cn() (clsx + tailwind-merge)
│       ├── services/
│       │   └── api.ts                   # Cliente HTTP centralizado (todos + auth)
│       └── types/
│           └── todo.ts                  # Tipo TypeScript Todo
│
└── infra/
    ├── docker-compose.yml      # MariaDB LTS + Adminer
    └── seed.sql                # Script de seed do banco (placeholder)
```

---

## Instalação e Configuração

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd TO-DO-FULLSTACK
```

### 2. Instalar dependências

O projeto usa **pnpm workspaces**. Um único comando instala as dependências de todos os pacotes (raiz, backend e frontend):

```bash
pnpm install
```

Isso instalará:

**Backend** (`backend/package.json`):
- `next` — framework do servidor de API
- `prisma` — ORM e CLI para migrations
- `@prisma/client` — cliente gerado do Prisma
- `@prisma/adapter-mariadb` + `mariadb` — driver adapter para MariaDB/MySQL
- `zod` — validação dos dados de entrada
- `vitest` — framework de testes
- `typescript`, `@types/node` — suporte TypeScript
- `eslint`, `eslint-config-next` — linting

**Frontend** (`frontend/package.json`):
- `next`, `react`, `react-dom` — framework de UI
- `tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css` — estilização utility-first com animações
- `radix-ui`, `shadcn` — sistema de componentes acessíveis (Dialog, Slot, etc.)
- `lucide-react` — biblioteca de ícones
- `swr` — data fetching com cache e revalidação
- `react-hook-form`, `@hookform/resolvers` — gerenciamento de formulários
- `zod` — validação dos formulários
- `class-variance-authority`, `tailwind-merge`, `clsx` — utilitários de classes CSS
- `typescript`, `@types/node`, `@types/react`, `@types/react-dom` — suporte TypeScript
- `eslint`, `eslint-config-next` — linting

### 3. Configurar variáveis de ambiente

O projeto já possui os arquivos `.env` configurados. Verifique se os valores estão corretos para o seu ambiente.

**Raiz — `.env`:**
```env
DATABASE_URL="mysql://root:root@localhost:3306/todo_db"
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

**Backend — `backend/.env`:**
```env
DATABASE_URL="mysql://root:root@localhost:3306/todo_db"
FRONTEND_URL="http://localhost:3000"
```

> **Nota:** `NEXT_PUBLIC_API_URL` é lido pelo frontend para saber onde está a API. `FRONTEND_URL` é lido pelo backend para configurar os headers CORS.

### 4. Subir o banco de dados com Docker

Na pasta `infra/`, há um `docker-compose.yml` que sobe o **MariaDB LTS** e o **Adminer** (interface web de administração do banco):

```bash
docker compose -f infra/docker-compose.yml up -d
```

Serviços iniciados:
- `todo_mysql` — MariaDB LTS na porta `3306`
  - Usuário: `root`
  - Senha: `root`
  - Banco: `todo_db`
- `adminer` — Interface web na porta `8080` (acesse `http://localhost:8080`)

Verificar se os containers estão rodando:

```bash
docker ps
```

Parar os containers:

```bash
docker compose -f infra/docker-compose.yml down
```

### 5. Executar as migrations do Prisma

Com o banco de dados rodando, execute as migrations para criar as tabelas:

```bash
pnpm --filter backend exec prisma migrate dev
```

Isso irá:
1. Conectar ao MySQL com a `DATABASE_URL` configurada
2. Criar o banco `todo_db` caso não exista
3. Aplicar as migrations e criar a tabela `Todo`
4. Gerar o cliente Prisma (`@prisma/client`)

Schema da tabela `Todo`:

```prisma
model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Para apenas gerar o cliente Prisma (sem criar migrations):

```bash
pnpm --filter backend exec prisma generate
```

Para visualizar o banco via Prisma Studio:

```bash
pnpm --filter backend exec prisma studio
```

### 6. Rodar o projeto em desenvolvimento

**Rodar backend e frontend simultaneamente:**

```bash
pnpm dev
```

**Rodar separadamente:**

```bash
# Apenas o backend (porta 3001)
pnpm dev:backend

# Apenas o frontend (porta 3000)
pnpm dev:frontend
```

Acesse:
- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001/api/todos](http://localhost:3001/api/todos)
- **Adminer (DB):** [http://localhost:8080](http://localhost:8080)

---

## Scripts Disponíveis

Executados na raiz do monorepo:

| Comando | Descrição |
|---------|-----------|
| `pnpm install` | Instala todas as dependências do monorepo |
| `pnpm dev` | Roda backend e frontend em modo desenvolvimento |
| `pnpm dev:backend` | Roda apenas o backend (porta 3001) |
| `pnpm dev:frontend` | Roda apenas o frontend (porta 3000) |
| `pnpm build` | Gera o build de produção de todos os pacotes |
| `pnpm test` | Executa os testes de todos os pacotes |

---

## API REST — Endpoints

Base URL: `http://localhost:3001/api`

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| `GET` | `/todos` | Lista todas as tarefas (ordenadas por `createdAt desc`) | — |
| `POST` | `/todos` | Cria uma nova tarefa | `{ "title": "string" }` |
| `GET` | `/todos/:id` | Retorna uma tarefa pelo ID | — |
| `PUT` | `/todos/:id` | Atualiza uma tarefa | `{ "title"?: "string", "completed"?: boolean }` |
| `DELETE` | `/todos/:id` | Remove uma tarefa | — |

**Respostas de status:**
- `200 OK` — sucesso em leituras e atualizações
- `201 Created` — tarefa criada com sucesso
- `204 No Content` — tarefa deletada com sucesso
- `404 Not Found` — tarefa não encontrada
- `422 Unprocessable Entity` — dados inválidos (falha na validação Zod)

---

## Banco de Dados

- **SGBD:** MariaDB LTS (compatível com MySQL)
- **Porta:** 3306
- **Banco:** `todo_db`
- **Usuário:** `root` / **Senha:** `root`
- **ORM:** Prisma 7

O schema Prisma está em `backend/prisma/schema.prisma`. Toda alteração no modelo deve ser seguida de:

```bash
pnpm --filter backend exec prisma migrate dev --name <nome-da-migration>
```

---

## Variáveis de Ambiente

| Variável | Onde é usada | Valor padrão |
|----------|-------------|--------------|
| `DATABASE_URL` | Backend (Prisma) | `mysql://root:root@localhost:3306/todo_db` |
| `NEXT_PUBLIC_API_URL` | Frontend (fetch) | `http://localhost:3001/api` |
| `FRONTEND_URL` | Backend (CORS) | `http://localhost:3000` |

---

## Ferramentas e Tecnologias Instaladas

### Gerenciamento do monorepo
- **pnpm workspaces** — gerencia `frontend/` e `backend/` como pacotes independentes dentro de um único repositório, compartilhando `node_modules` na raiz quando possível.
- **`.npmrc`** (`approve-builds=true`) — permite que pacotes nativos como `@prisma/engines` e `sharp` executem scripts de build pós-instalação sem prompts interativos.
- **`pnpm.onlyBuiltDependencies`** no `package.json` raiz — lista explícita dos pacotes autorizados a executar scripts de instalação (`@prisma/engines`, `prisma`, `sharp`, `unrs-resolver`), aumentando a segurança do ambiente.

### Backend
- **Next.js 16 (App Router)** — usado exclusivamente como servidor HTTP para as API Routes. Não renderiza páginas.
- **Prisma 7** — ORM type-safe com migrations, client gerado e Prisma Studio. Configurado via `prisma.config.ts` com driver adapter.
- **@prisma/adapter-mariadb + mariadb** — driver adapter nativo para MariaDB/MySQL, usado no singleton `PrismaMariaDb` em `lib/prisma.ts`.
- **Zod 4** — validação e tipagem dos dados recebidos nas requisições.
- **Vitest** — framework de testes unitários compatível com TypeScript e ESM.

### Frontend
- **Next.js 16 (App Router)** — renderiza páginas React com roteamento baseado em sistema de arquivos, Server e Client Components.
- **React 19** — biblioteca de UI com o novo modelo de renderização.
- **TailwindCSS 4** — estilização utility-first configurada via PostCSS (`@tailwindcss/postcss`). Inclui `tw-animate-css` para animações CSS.
- **shadcn/ui** — sistema de componentes de baixo acoplamento baseado em `radix-ui`. Os componentes (`Button`, `Dialog`, `Skeleton`) vivem em `src/components/ui/` e são totalmente customizáveis.
- **radix-ui** — primitivos de UI acessíveis (Dialog, Slot) que servem de base para os componentes shadcn.
- **SWR 2** — data fetching com cache, revalidação automática e mutação otimista.
- **react-hook-form 7** — gerenciamento de formulários performático e sem re-renders desnecessários.
- **Zod 4** + **@hookform/resolvers** — integração entre react-hook-form e Zod para validação de formulários.
- **lucide-react** — ícones SVG como componentes React.
- **class-variance-authority** + **tailwind-merge** + **clsx** — utilitários para composição segura de classes Tailwind via a função `cn()`.

### Infraestrutura
- **Docker Compose** — orquestra os containers de desenvolvimento.
- **MariaDB LTS** — banco de dados relacional compatível com MySQL.
- **Adminer** — interface web para inspecionar e gerenciar o banco de dados.
