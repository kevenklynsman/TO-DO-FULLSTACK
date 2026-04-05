# Backend — TO-DO Fullstack

API REST para gerenciamento de tarefas (todos) com autenticação JWT, construída com **Next.js** (modo API-only), **Prisma ORM**, **MariaDB/MySQL**, **Zod** para validação, **bcryptjs** para hash de senhas e **Google OAuth** via `google-auth-library`.

---

## Sumário

- [Stack](#stack)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Arquitetura](#arquitetura)
- [Endpoints](#endpoints)
  - [Autenticação](#autenticação)
  - [Todos](#todos)
- [Modelos de dados](#modelos-de-dados)
- [Paginação](#paginação)
- [Autenticação e JWT](#autenticação-e-jwt)
- [CORS](#cors)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Como executar](#como-executar)
- [Scripts disponíveis](#scripts-disponíveis)

---

## Stack

| Camada           | Tecnologia                              |
|------------------|-----------------------------------------|
| Framework        | Next.js 16.1.6 (API-only)              |
| ORM              | Prisma 7.x                             |
| Driver de banco  | @prisma/adapter-mariadb + mariadb       |
| Banco de dados   | MySQL 8 / MariaDB LTS                  |
| Validação        | Zod 4.x                                |
| Autenticação     | jsonwebtoken (JWT) + bcryptjs           |
| Google OAuth     | google-auth-library                    |
| Linguagem        | TypeScript 5                           |
| Gerenciador      | pnpm                                   |
| Testes           | Vitest                                 |

> O servidor sobe na porta **3001**.

---

## Estrutura de diretórios

```
backend/
├── .env                              # Variáveis de ambiente
├── .gitignore
├── eslint.config.mjs                 # Configuração do ESLint
├── next-env.d.ts                     # Gerado automaticamente pelo Next.js
├── next.config.ts                    # Configuração do Next.js (CORS)
├── package.json
├── prisma.config.ts                  # Configuração da CLI do Prisma
├── tsconfig.json
├── prisma/
│   ├── schema.prisma                 # Schema do banco de dados (Todo + User)
│   └── migrations/                   # Histórico de migrations SQL geradas
└── src/
    ├── app/
    │   └── api/
    │       ├── auth/
    │       │   ├── login/route.ts    # POST /api/auth/login
    │       │   ├── register/route.ts # POST /api/auth/register
    │       │   ├── logout/route.ts   # POST /api/auth/logout
    │       │   ├── me/route.ts       # GET  /api/auth/me
    │       │   └── google/route.ts   # POST /api/auth/google
    │       └── todos/
    │           ├── route.ts          # GET /api/todos  |  POST /api/todos
    │           └── [id]/
    │               └── route.ts      # GET | PUT | DELETE /api/todos/:id
    ├── controllers/
    │   ├── authController.ts         # Handlers de autenticação
    │   └── todoController.ts         # Handlers de todos com paginação
    ├── lib/
    │   └── prisma.ts                 # Singleton do Prisma Client (MariaDB adapter)
    ├── services/
    │   ├── authService.ts            # Lógica de registro, login e Google OAuth
    │   └── todoService.ts            # CRUD + paginação de todos via Prisma
    └── validators/
        ├── authValidator.ts          # Schemas Zod para auth
        └── todoValidator.ts          # Schemas Zod para todos
```

---

## Arquitetura

O backend segue uma arquitetura em **3 camadas** com separação clara de responsabilidades:

```
Requisição HTTP
      │
      ▼
 App Router (Next.js)          src/app/api/
      │  delega para
      ▼
 Controller                    src/controllers/
      │  parse do body, validação Zod, montagem da resposta NextResponse
      ▼
 Service                       src/services/
      │  lógica de negócio, operações no banco sem lógica HTTP
      ▼
 Prisma ORM → PrismaMariaDb adapter → MySQL/MariaDB
```

### Singleton do Prisma Client

O cliente Prisma é instanciado uma única vez usando o padrão global (`globalThis`) para evitar múltiplas instâncias durante o hot-reload do Next.js em desenvolvimento. A `DATABASE_URL` é parseada via `new URL()` para extrair os parâmetros do adapter `PrismaMariaDb`:

```typescript
// src/lib/prisma.ts
const { hostname, port, username, password, pathname } = new URL(
  process.env.DATABASE_URL!
);
const adapter = new PrismaMariaDb({
  host: hostname,
  port: parseInt(port || "3306"),
  user: username,
  password,
  database: pathname.slice(1),
});
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
```

### CORS

Configurado em `next.config.ts` para aceitar requisições da `FRONTEND_URL` (padrão `http://localhost:3000`):

- Métodos permitidos: `GET, POST, PUT, DELETE, OPTIONS`
- Headers permitidos: `Content-Type`
- Credentials: `true` (necessário para cookies `httpOnly`)

---

## Endpoints

Base URL: `http://localhost:3001`

### Autenticação

| Método   | Rota                   | Descrição                                      | Auth necessária |
|----------|------------------------|------------------------------------------------|-----------------|
| `POST`   | `/api/auth/register`   | Cria uma nova conta com email e senha          | Não             |
| `POST`   | `/api/auth/login`      | Autentica com email e senha, define cookie JWT | Não             |
| `POST`   | `/api/auth/logout`     | Remove o cookie `token`                        | Não             |
| `GET`    | `/api/auth/me`         | Retorna o usuário autenticado via JWT          | Sim             |
| `POST`   | `/api/auth/google`     | Autentica via Google OAuth (credential token)  | Não             |

**`POST /api/auth/register`**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "minhasenha"
}
```

**`POST /api/auth/login`**
```json
{
  "email": "joao@exemplo.com",
  "senha": "minhasenha"
}
```
Em caso de sucesso, define um cookie `httpOnly` chamado `token` com o JWT (validade de 1 dia).

**`POST /api/auth/google`**
```json
{
  "credential": "<id_token_do_google>"
}
```

**`GET /api/auth/me`** — requer cookie `token` válido. Retorna:
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@exemplo.com"
}
```

#### Respostas de erro — Auth

| Status | Situação                                      |
|--------|-----------------------------------------------|
| `401`  | Token ausente, inválido ou credenciais erradas |
| `404`  | Usuário não encontrado                        |
| `409`  | Email já cadastrado                           |
| `422`  | Dados de entrada inválidos (falha Zod)        |

---

### Todos

| Método   | Rota              | Descrição                         | Status de sucesso |
|----------|-------------------|-----------------------------------|-------------------|
| `GET`    | `/api/todos`      | Lista todos paginados             | `200`             |
| `POST`   | `/api/todos`      | Cria um novo todo                 | `201`             |
| `GET`    | `/api/todos/:id`  | Busca um todo pelo ID             | `200`             |
| `PUT`    | `/api/todos/:id`  | Atualiza um todo pelo ID          | `200`             |
| `DELETE` | `/api/todos/:id`  | Remove um todo pelo ID            | `204`             |

**`GET /api/todos`** — aceita query params de paginação:

| Param   | Padrão | Descrição                          |
|---------|--------|------------------------------------|
| `page`  | `1`    | Número da página (começa em 1)     |
| `limit` | `15`   | Itens por página (máximo 100)      |

Exemplo: `GET /api/todos?page=2&limit=15`

Resposta:
```json
{
  "todos": [...],
  "page": 2,
  "limit": 15,
  "total": 42,
  "totalPages": 3,
  "openCount": 18,
  "doneCount": 24
}
```

**`POST /api/todos`**
```json
{
  "title": "Minha tarefa"
}
```

**`PUT /api/todos/:id`** — todos os campos são opcionais
```json
{
  "title": "Novo título",
  "completed": true
}
```

#### Respostas de erro — Todos

| Status | Situação                         |
|--------|----------------------------------|
| `404`  | Todo não encontrado              |
| `422`  | Falha na validação do corpo (Zod)|

---

## Modelos de dados

### `Todo`

| Campo       | Tipo      | Descrição                           |
|-------------|-----------|-------------------------------------|
| `id`        | `Int`     | Chave primária, auto-incremento     |
| `title`     | `String`  | Título da tarefa                    |
| `completed` | `Boolean` | Status de conclusão (padrão: false) |
| `createdAt` | `DateTime`| Data de criação (automática)        |
| `updatedAt` | `DateTime`| Data de atualização (automática)    |

### `User`

| Campo       | Tipo      | Descrição                                        |
|-------------|-----------|--------------------------------------------------|
| `id`        | `Int`     | Chave primária, auto-incremento                  |
| `email`     | `String`  | Email único do usuário                           |
| `name`      | `String?` | Nome do usuário (nullable)                       |
| `password`  | `String?` | Hash bcrypt da senha (nullable — Google accounts)|
| `googleId`  | `String?` | ID único do Google OAuth (nullable)              |
| `avatarUrl` | `String?` | URL da foto de perfil (nullable)                 |
| `createdAt` | `DateTime`| Data de criação (automática)                     |
| `updatedAt` | `DateTime`| Data de atualização (automática)                 |

---

## Paginação

O endpoint `GET /api/todos` suporta paginação server-side via query params `page` e `limit`. A implementação usa `prisma.$transaction` para executar em paralelo:

1. `findMany` com `skip` e `take` para a página atual
2. `count()` para o total geral
3. `count({ where: { completed: false } })` para o total de tarefas abertas

O `doneCount` é derivado de `total - openCount`, sem query adicional.

Os parâmetros são sanitizados com `Math.max`, `Math.min` e `Math.floor` para garantir valores válidos (mínimo 1, máximo 100 por página).

---

## Autenticação e JWT

O fluxo de autenticação usa cookies `httpOnly` (não acessíveis pelo JavaScript do browser):

1. Cliente envia credenciais para `/api/auth/login` (ou `/api/auth/google`)
2. Backend valida, assina um JWT com `JWT_SECRET` (expiração: 1 dia) e define o cookie `token`
3. Requisições subsequentes enviam o cookie automaticamente (`credentials: "include"` no fetch)
4. `/api/auth/me` lê o cookie, verifica o JWT com `jwt.verify` e retorna o usuário

**Google OAuth:** O `credential` (ID Token) recebido é verificado via `google-auth-library`'s `OAuth2Client.verifyIdToken()`. Se o email já existir com login local, o `googleId` é vinculado à conta existente. Caso contrário, uma nova conta é criada.

**Hash de senhas:** `bcryptjs.hash(senha, 10)` no registro; `bcryptjs.compare(senha, hash)` no login.

---

## CORS

Configurado via `next.config.ts`. O header `Access-Control-Allow-Credentials: true` é essencial para que os cookies `httpOnly` sejam enviados nas requisições cross-origin do frontend.

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do pacote `backend/`:

```env
DATABASE_URL="mysql://root:root@localhost:3306/todo_db"
FRONTEND_URL="http://localhost:3000"
JWT_SECRET="sua-chave-secreta-aqui"
GOOGLE_CLIENT_ID="seu-client-id.apps.googleusercontent.com"
```

| Variável          | Descrição                                         |
|-------------------|---------------------------------------------------|
| `DATABASE_URL`    | String de conexão com o MySQL/MariaDB             |
| `FRONTEND_URL`    | Origem permitida nas respostas CORS               |
| `JWT_SECRET`      | Chave secreta para assinar e verificar JWTs       |
| `GOOGLE_CLIENT_ID`| Client ID do projeto no Google Cloud Console      |

---

## Como executar

### Pré-requisitos

- Node.js 20+
- pnpm
- MySQL ou MariaDB rodando localmente (ou via Docker — veja `infra/`)

### Instalação

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
# Edite o arquivo .env com suas credenciais

# 3. Executar as migrations e gerar o Prisma Client
pnpm prisma migrate dev

# 4. Iniciar o servidor de desenvolvimento
pnpm dev
```

A API estará disponível em `http://localhost:3001`.

### Banco de dados

```bash
# Criar e aplicar uma nova migration
pnpm prisma migrate dev --name <nome-da-migration>

# Abrir o Prisma Studio (interface visual do banco)
pnpm prisma studio

# Gerar/atualizar o Prisma Client manualmente
pnpm prisma generate
```

---

## Scripts disponíveis

| Script        | Comando              | Descrição                          |
|---------------|----------------------|------------------------------------|
| `pnpm dev`    | `next dev -p 3001`   | Servidor de desenvolvimento        |
| `pnpm build`  | `next build`         | Build de produção                  |
| `pnpm start`  | `next start -p 3001` | Servidor de produção               |
| `pnpm lint`   | `eslint`             | Verificação de lint                |
| `pnpm test`   | `vitest`             | Execução dos testes                |
