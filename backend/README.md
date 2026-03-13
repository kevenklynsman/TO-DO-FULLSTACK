# Backend — TO-DO Fullstack

API REST para gerenciamento de tarefas (todos), construída com **Next.js** (modo API-only), **Prisma ORM**, **MySQL** e **Zod** para validação.

---

## Sumário

- [Stack](#stack)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Arquitetura](#arquitetura)
- [Endpoints](#endpoints)
- [Modelos de dados](#modelos-de-dados)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Como executar](#como-executar)
- [Scripts disponíveis](#scripts-disponíveis)

---

## Stack

| Camada           | Tecnologia                  |
|------------------|-----------------------------|
| Framework        | Next.js 16.1.6 (API-only)   |
| ORM              | Prisma 7.x                  |
| Driver de banco  | @prisma/adapter-mariadb + mariadb |
| Banco de dados   | MySQL 8 / MariaDB           |
| Validação        | Zod 4.x                     |
| Linguagem        | TypeScript 5                |
| Gerenciador      | pnpm                        |
| Testes           | Vitest                      |

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
│   ├── schema.prisma                 # Schema do banco de dados
│   └── migrations/                   # Histórico de migrations SQL geradas
│       └── 20260313073013_init_todo_table/
│           └── migration.sql         # CREATE TABLE Todo
└── src/
    ├── app/
    │   └── api/
    │       └── todos/
    │           ├── route.ts          # GET /api/todos  |  POST /api/todos
    │           └── [id]/
    │               └── route.ts      # GET | PUT | DELETE /api/todos/:id
    ├── controllers/
    │   └── todoController.ts         # Camada HTTP: parse, validação, resposta
    ├── lib/
    │   └── prisma.ts                 # Singleton do Prisma Client
    ├── services/
    │   └── todoService.ts            # Operações no banco via Prisma
    └── validators/
        └── todoValidator.ts          # Schemas Zod + tipos inferidos
```

---

## Arquitetura

O backend segue uma arquitetura em **3 camadas** com separação clara de responsabilidades:

```
Requisição HTTP
      │
      ▼
 App Router (Next.js)          src/app/api/todos/
      │  delega para
      ▼
 Controller                    src/controllers/todoController.ts
      │  parse do body, validação Zod, montagem da resposta NextResponse
      ▼
 Service                       src/services/todoService.ts
      │  operações puras no banco, sem lógica HTTP
      ▼
 Prisma ORM → PrismaMariaDb adapter → MySQL/MariaDB
```

### Singleton do Prisma Client

O cliente Prisma é instanciado uma única vez usando o padrão global (`globalThis`) para evitar múltiplas instâncias durante o hot-reload do Next.js em desenvolvimento. O adapter `PrismaMariaDb` é inicializado com a `DATABASE_URL`:

```typescript
// src/lib/prisma.ts
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
```

### CORS

Configurado em `next.config.ts` para aceitar requisições da `FRONTEND_URL` (padrão `http://localhost:3000`):

- Métodos permitidos: `GET, POST, PUT, DELETE, OPTIONS`
- Headers permitidos: `Content-Type, Authorization`

---

## Endpoints

Base URL: `http://localhost:3001`

| Método   | Rota              | Descrição                         | Status de sucesso |
|----------|-------------------|-----------------------------------|-------------------|
| `GET`    | `/api/todos`      | Lista todos os todos              | `200`             |
| `POST`   | `/api/todos`      | Cria um novo todo                 | `201`             |
| `GET`    | `/api/todos/:id`  | Busca um todo pelo ID             | `200`             |
| `PUT`    | `/api/todos/:id`  | Atualiza um todo pelo ID          | `200`             |
| `DELETE` | `/api/todos/:id`  | Remove um todo pelo ID            | `204`             |

### Corpos de requisição

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

### Respostas de erro

| Status | Situação                         |
|--------|----------------------------------|
| `404`  | Todo não encontrado              |
| `422`  | Falha na validação do corpo      |

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

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="mysql://root:root@localhost:3306/todo_db"
FRONTEND_URL="http://localhost:3000"
```

| Variável       | Descrição                                  |
|----------------|--------------------------------------------|
| `DATABASE_URL` | String de conexão com o MySQL              |
| `FRONTEND_URL` | Origem permitida nas respostas CORS        |

---

## Como executar

### Pré-requisitos

- Node.js 18+
- pnpm
- MySQL rodando localmente

### Instalação

```bash
# 1. Instalar dependências
pnpm install

# 2. Verificar variáveis de ambiente (arquivo .env já incluso no repositório)
# DATABASE_URL="mysql://root:root@localhost:3306/todo_db"
# FRONTEND_URL="http://localhost:3000"

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

| Script       | Comando           | Descrição                          |
|--------------|-------------------|------------------------------------|
| `pnpm dev`   | `next dev -p 3001`| Servidor de desenvolvimento        |
| `pnpm build` | `next build`      | Build de produção                  |
| `pnpm start` | `next start -p 3001` | Servidor de produção            |
| `pnpm lint`  | `eslint`          | Verificação de lint                |
| `pnpm test`  | `vitest`          | Execução dos testes                |
