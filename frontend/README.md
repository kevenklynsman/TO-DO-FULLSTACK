# Frontend — TO-DO Fullstack

Interface web para gerenciamento de tarefas (todos), construída com **Next.js 16**, **React 19**, **Tailwind CSS v4**, **shadcn/ui** como sistema de componentes, **SWR** para data fetching, **Zod** + **React Hook Form** para validação, **TanStack React Table v8** para a tabela de tarefas, **Sonner** para notificações e autenticação via **JWT + Google OAuth**.

---

## Sumário

- [Stack](#stack)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Arquitetura](#arquitetura)
- [Páginas e rotas](#páginas-e-rotas)
- [Componentes de negócio](#componentes-de-negócio)
- [Componentes de autenticação](#componentes-de-autenticação)
- [UI Components (shadcn)](#ui-components-shadcn)
- [Hooks](#hooks)
- [Serviços](#serviços)
- [Tipos](#tipos)
- [Utilitários](#utilitários)
- [Sistema de notificações (Sonner)](#sistema-de-notificações-sonner)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Como executar](#como-executar)
- [Scripts disponíveis](#scripts-disponíveis)

---

## Stack

| Camada           | Tecnologia                                              |
|------------------|---------------------------------------------------------|
| Framework        | Next.js 16.1.6 (App Router)                            |
| UI               | React 19.2.3                                           |
| Estilização      | Tailwind CSS v4 + tw-animate-css                       |
| Componentes UI   | shadcn/ui (radix-ui)                                   |
| Tabela           | TanStack React Table v8                                |
| Data fetching    | SWR 2.x                                                |
| Formulários      | React Hook Form 7.x                                    |
| Validação        | Zod 4.x + @hookform/resolvers                          |
| Notificações     | Sonner 2.x                                             |
| Ícones           | lucide-react                                           |
| Google OAuth     | @react-oauth/google                                    |
| Temas            | next-themes                                            |
| Utilitários CSS  | tailwind-merge, class-variance-authority, clsx          |
| Linguagem        | TypeScript 5                                           |
| Gerenciador      | pnpm                                                   |

> O servidor sobe na porta **3000**. O backend é esperado na porta **3001**.

---

## Estrutura de diretórios

```
frontend/
├── components.json                   # Configuração do shadcn/ui
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs                # Plugin Tailwind CSS v4
├── tsconfig.json
├── public/
└── src/
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css               # Design system CSS (oklch, dark mode, shadcn tokens)
    │   ├── layout.tsx                # Root layout (fontes Geist + Inter + Providers + Toaster)
    │   ├── page.tsx                  # / → redireciona para /todos
    │   └── todos/
    │       ├── page.tsx              # /todos → guarda rota com useAuth + TodoTableList
    │       └── create/
    │           └── page.tsx          # /todos/create → criar tarefa (legado)
    ├── components/
    │   ├── Providers.tsx             # GoogleOAuthProvider + AuthProvider
    │   ├── TodoEditDialog.tsx        # Dialog de edição do título (modo controlado/não-controlado)
    │   ├── TodoForm.tsx              # Formulário de criação
    │   ├── TodoItem.tsx              # Item individual da lista (legado)
    │   ├── TodoList.tsx              # Lista simples com SWR (legado)
    │   ├── TodoLogin.tsx             # Tela de login (email/senha + Google)
    │   ├── TodoRegister.tsx          # Tela de registro
    │   ├── TodoTableList.tsx         # Tabela principal com TanStack Table
    │   ├── TodoUserNav.tsx           # Menu de usuário autenticado (popover + logout)
    │   └── ui/                       # 57 componentes base do shadcn/ui
    │       ├── alert-dialog.tsx      # Dialog de confirmação destrutiva
    │       ├── button.tsx            # Botão com variantes CVA
    │       ├── dialog.tsx            # Dialog Radix UI
    │       ├── dropdown-menu.tsx     # Menu dropdown
    │       ├── input.tsx             # Campo de texto
    │       ├── skeleton.tsx          # Skeleton de carregamento
    │       ├── sonner.tsx            # Toaster do Sonner com tema integrado
    │       └── ...                   # Demais primitivos shadcn
    ├── hooks/
    │   ├── useAuth.ts                # Hook de autenticação (login, register, logout, me)
    │   └── useTodos.ts               # Hooks SWR: useTodos (paginado), useTodo, useTodoActions
    ├── lib/
    │   └── utils.ts                  # Utilitário cn() (clsx + tailwind-merge)
    ├── services/
    │   └── api.ts                    # Cliente HTTP centralizado (todos + auth)
    └── types/
        └── todo.ts                   # Tipo Todo
```

---

## Arquitetura

O frontend segue o padrão do **Next.js App Router** com separação em camadas:

```
Root Layout (Server)
    │  monta
    ▼
Providers (Client)
    │  fornece GoogleOAuthProvider + AuthContext
    ▼
Páginas (Server Components)
    │  renderizam
    ▼
Componentes (Client Components)
    │  consomem
    ▼
Hooks (SWR / Auth / Ações)
    │  chamam
    ▼
Serviços (fetch wrapper com credentials)
    │  comunicam com
    ▼
API REST (backend :3001)
```

### Fluxo de dados — Todos

```
/todos
  │
  ▼ useAuth() verifica cookie JWT
  ├── não autenticado → <TodoLogin />
  └── autenticado →
        <nav> (título + <TodoUserNav />)
        <TodoTableList />
              │
              ├── useTodos(page, limit) → SWR → GET /api/todos?page=&limit=
              │       retorna: { todos, total, totalPages, openCount, doneCount }
              │
              ├── "Nova Tarefa" (Dialog + <TodoForm onSuccess=.../>)
              │       └── createTodo(title) → POST /api/todos → mutate()
              │
              ├── Checkbox → toggleTodo(todo) → PUT /api/todos/:id → mutate()
              │
              ├── Ícone Pencil → <TodoEditDialog open controlado>
              │       └── editTodo(id, title) → PUT /api/todos/:id → mutate()
              │
              └── Ícone Trash → <AlertDialog> confirmação
                      └── deleteTodo(id) → DELETE /api/todos/:id → mutate()
```

### Estratégia de estado e cache

- **Leitura:** SWR com chave `["/todos", page, limit]`. Cache separado por página.
- **Mutações:** Após cada operação, `mutate((key) => Array.isArray(key) && key[0] === "/todos")` invalida **todas** as páginas do cache simultaneamente.
- **Autenticação:** `useAuth` armazena o usuário no estado React e consulta `/api/auth/me` via SWR. O cookie `httpOnly` é gerenciado pelo servidor; todas as requisições usam `credentials: "include"`.

---

## Páginas e rotas

| Rota             | Arquivo                          | Tipo   | Descrição                                                       |
|------------------|----------------------------------|--------|-----------------------------------------------------------------|
| `/`              | `src/app/page.tsx`               | Server | Redireciona para `/todos`                                       |
| `/todos`         | `src/app/todos/page.tsx`         | Client | Guarda autenticação → exibe `<TodoLogin>` ou `<TodoTableList>` |
| `/todos/create`  | `src/app/todos/create/page.tsx`  | Client | Formulário de criação (rota legado — funcionalidade migrada para dialog) |

---

## Componentes de negócio

### `TodoTableList`
`src/components/TodoTableList.tsx` — Client Component

Componente principal da aplicação. Gerencia a listagem, busca, filtro, ordenação, paginação e todas as ações CRUD sobre as tarefas.

**Configuração TanStack Table:**

| Modelo de linha    | Uso                                              |
|--------------------|--------------------------------------------------|
| `getCoreRowModel`  | Modelo base de linhas                            |
| `getFilteredRowModel` | Filtragem client-side por título              |
| `getSortedRowModel`| Ordenação client-side por qualquer coluna        |

> A paginação é **server-side** — não usa `getPaginationRowModel`. Os botões "Anterior" / "Próximo" alteram o estado `page` que é passado para `useTodos(page, PAGE_SIZE)`.

**Colunas da tabela:**

| Coluna       | Comportamento                                                    |
|--------------|------------------------------------------------------------------|
| `completed`  | Checkbox que chama `toggleTodo(todo)`. Desabilitado durante request em andamento (rastreado via `updatingIds: Set<number>`) |
| `title`      | Texto com `line-through` quando `completed: true`                |
| `createdAt`  | Data formatada em pt-BR                                          |
| `actions`    | Ícones `Pencil` (editar) e `Trash2` (excluir com `AlertDialog`) |

**Funcionalidades de filtro e ordenação:**

| Controle               | Opções                                                  |
|------------------------|---------------------------------------------------------|
| Campo de busca         | Filtra por título (TanStack `columnFilters`)            |
| Botões de status       | "Tudo", "Abertas", "Concluídas" (`combinedFilter` state)|
| Botões de ordenação    | "Data de criação", "Ordem alfabética", "Sem ordenação"  |

**Feedback visual:**
- `toast.success` / `toast.error` (Sonner) para todas as ações
- Checkbox desabilitado durante toggle em andamento
- Botões de paginação desabilitados na primeira/última página

---

### `TodoEditDialog`
`src/components/TodoEditDialog.tsx` — Client Component

Modal de edição do título de uma tarefa. Suporta dois modos de operação:

| Modo           | Quando usar                                                        |
|----------------|--------------------------------------------------------------------|
| **Controlado** | Pai passa `open` e `onOpenChange` — usado pelo `TodoTableList`    |
| **Não-controlado** | Estado interno gerenciado pelo próprio dialog — `showTrigger: true` exibe o botão `Pencil` |

**Props:**

| Prop           | Tipo                        | Padrão  | Descrição                          |
|----------------|-----------------------------|---------|------------------------------------|
| `todo`         | `Todo`                      | —       | Tarefa a editar                    |
| `open`         | `boolean`                   | `undefined` | Controle externo do estado aberto |
| `onOpenChange` | `(open: boolean) => void`   | `undefined` | Callback para fechar externamente |
| `showTrigger`  | `boolean`                   | `true`  | Exibe botão `Pencil` interno       |

**Comportamento:**
- Ao abrir, reseta o input com o `todo.title` atual
- `Enter` no input dispara o salvamento
- Botão "Salvar" desabilitado enquanto processando ou com campo vazio
- Não emite toasts — feedbacks são responsabilidade do componente pai

---

### `TodoForm`
`src/components/TodoForm.tsx` — Client Component

Formulário de criação de nova tarefa, controlado por `react-hook-form` com validação via `zod`:

```typescript
const schema = z.object({
  title: z.string().min(1, "Title is required"),
});
```

**Props:**

| Prop        | Tipo         | Descrição                                      |
|-------------|--------------|------------------------------------------------|
| `onSuccess` | `() => void` | Callback chamado após criação bem-sucedida     |

| Comportamento    | Detalhe                                               |
|------------------|-------------------------------------------------------|
| Submit           | Chama `createTodo(title)`, reseta o form, dispara `onSuccess?.()` |
| Estado de envio  | Botão desabilitado com texto `"Saving…"`              |
| Erro de validação| Mensagem exibida abaixo do campo                      |

---

### `TodoUserNav`
`src/components/TodoUserNav.tsx` — Client Component (named export)

Componente de navegação do usuário autenticado exibido no topo da página de todos.

- Exibe o nome do usuário logado
- Popover com botão de logout que chama `useAuth().logout()`
- Após logout, redireciona para `/todos` (que voltará a exibir `<TodoLogin>`)

---

## Componentes de autenticação

### `Providers`
`src/components/Providers.tsx`

Wrapper de contexto carregado pelo `layout.tsx`. Envolve toda a aplicação com:

1. `GoogleOAuthProvider` (`clientId` via `NEXT_PUBLIC_GOOGLE_CLIENT_ID`)
2. `AuthProvider` (contexto interno de autenticação)

### `TodoLogin`
`src/components/TodoLogin.tsx` — Client Component

Tela de login exibida quando o usuário não está autenticado.

| Funcionalidade    | Detalhe                                                        |
|-------------------|----------------------------------------------------------------|
| Login com email   | Formulário simples, chama `useAuth().login(email, password)`   |
| Login com Google  | Componente `<GoogleLogin>` do `@react-oauth/google`            |
| Persistência      | Último email digitado salvo em `localStorage`                  |
| Pós-autenticação  | Redireciona para `/todos`                                      |
| Link para registro| Exibe o componente `<TodoRegister>` inline via state           |

### `TodoRegister`
`src/components/TodoRegister.tsx` — Client Component

Formulário de criação de conta (nome, email, senha). Chama `useAuth().register(name, email, password)` e redireciona para `/todos` em caso de sucesso.

---

## UI Components (shadcn)

Componentes base localizados em `src/components/ui/`, gerados via **shadcn** CLI. **57 componentes** disponíveis. Todos usam o utilitário `cn()` para composição de classes.

### Componentes mais utilizados no projeto

#### `Button`
`src/components/ui/button.tsx`

Botão com variantes geradas por `class-variance-authority`:

| Variante      | Uso                                      |
|---------------|------------------------------------------|
| `default`     | Ação primária (bg-primary)               |
| `outline`     | Ação secundária com borda                |
| `secondary`   | Ação de menor ênfase                     |
| `ghost`       | Sem fundo, hover sutil                   |
| `destructive` | Ações destrutivas (bg-destructive/10)    |
| `link`        | Estilo de link com underline             |

Sizes: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.
Suporta `asChild` via `Slot.Root` do `radix-ui`.

#### `Dialog`
`src/components/ui/dialog.tsx`

Primitivo `Dialog` do `radix-ui`. Usado por `TodoEditDialog` e "Nova Tarefa". Exports: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogClose`.

#### `AlertDialog`
`src/components/ui/alert-dialog.tsx`

Dialog de confirmação para ações destrutivas. Usado pelo `TodoTableList` antes de deletar uma tarefa.

#### `Skeleton`
`src/components/ui/skeleton.tsx`

Placeholder animado para estados de carregamento. Usa `animate-pulse` com `bg-muted`.

#### `Sonner` (Toaster)
`src/components/ui/sonner.tsx`

Wrapper do `Toaster` da lib Sonner. Integrado com `next-themes` para suporte automático a dark/light mode. Ícones customizados via `lucide-react`. Montado no `layout.tsx`.

---

## Hooks

### `useAuth()`
`src/hooks/useAuth.ts`

Hook de autenticação. Provê o estado do usuário e as ações de auth via Context.

```typescript
const { user, isLoading, login, register, logout } = useAuth();
```

| Retorno/Ação     | Tipo                                          | Descrição                            |
|------------------|-----------------------------------------------|--------------------------------------|
| `user`           | `{ id, name, email } \| null`                | Usuário autenticado ou `null`        |
| `isLoading`      | `boolean`                                    | Verificação inicial do cookie em curso |
| `login`          | `(email, password) => Promise<void>`         | Login com email/senha                |
| `register`       | `(name, email, password) => Promise<void>`   | Cria conta e autentica               |
| `logout`         | `() => Promise<void>`                        | Remove cookie e limpa estado         |

---

### `useTodos(page, limit)`
`src/hooks/useTodos.ts`

Busca tarefas paginadas via SWR. A chave SWR é `["/todos", page, limit]`.

```typescript
const { todos, page, limit, total, totalPages, openCount, doneCount, isLoading, error } = useTodos(1, 15);
```

| Retorno      | Tipo      | Descrição                                      |
|--------------|-----------|------------------------------------------------|
| `todos`      | `Todo[]`  | Tarefas da página atual                        |
| `page`       | `number`  | Página atual retornada pelo servidor           |
| `limit`      | `number`  | Itens por página                               |
| `total`      | `number`  | Total de tarefas no banco                      |
| `totalPages` | `number`  | Número total de páginas                        |
| `openCount`  | `number`  | Quantidade de tarefas não concluídas           |
| `doneCount`  | `number`  | Quantidade de tarefas concluídas               |
| `isLoading`  | `boolean` | `true` enquanto faz o primeiro fetch           |
| `error`      | `any`     | Erro do SWR, `undefined` se ok                 |

---

### `useTodo(id)`

Busca um único todo por ID. Não dispara fetch quando `id` é falsy.

---

### `useTodoActions()`

Retorna quatro funções de mutação. Após cada operação, invalida **todas** as entradas do cache SWR cujo primeiro elemento seja `"/todos"`.

```typescript
const { createTodo, toggleTodo, editTodo, deleteTodo } = useTodoActions();
```

| Função                | Operação                                         |
|-----------------------|--------------------------------------------------|
| `createTodo(title)`   | `POST /api/todos`                                |
| `toggleTodo(todo)`    | `PUT /api/todos/:id` com `completed` invertido   |
| `editTodo(id, title)` | `PUT /api/todos/:id` atualizando o título         |
| `deleteTodo(id)`      | `DELETE /api/todos/:id`                          |

---

## Serviços

`src/services/api.ts`

Cliente HTTP centralizado. Todas as requisições usam `credentials: "include"` para envio automático do cookie JWT.

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
```

**Tipo exportado:**

```typescript
export type PaginatedTodosResponse = {
  todos: Todo[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  openCount: number;
  doneCount: number;
};
```

**Métodos disponíveis:**

| Método                          | HTTP     | Endpoint             |
|---------------------------------|----------|----------------------|
| `api.getTodos(page, limit)`     | `GET`    | `/todos?page=&limit=`|
| `api.getTodo(id)`               | `GET`    | `/todos/:id`         |
| `api.createTodo(title)`         | `POST`   | `/todos`             |
| `api.updateTodo(id, data)`      | `PUT`    | `/todos/:id`         |
| `api.deleteTodo(id)`            | `DELETE` | `/todos/:id`         |
| `api.login(email, password)`    | `POST`   | `/auth/login`        |
| `api.register(name, email, pw)` | `POST`   | `/auth/register`     |
| `api.me()`                      | `GET`    | `/auth/me`           |
| `api.logout()`                  | `POST`   | `/auth/logout`       |
| `api.googleLogin(credential)`   | `POST`   | `/auth/google`       |

> O campo de senha é enviado como `senha` (não `password`) para o backend.

---

## Tipos

`src/types/todo.ts`

```typescript
export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
};
```

---

## Utilitários

`src/lib/utils.ts`

Função `cn()` que combina `clsx` (condicional de classes) com `tailwind-merge` (deduplicação de classes Tailwind conflitantes). Usada em todos os componentes do `ui/`.

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Sistema de notificações (Sonner)

O `Toaster` do Sonner é montado uma única vez no `src/app/layout.tsx`. Os toasts são disparados via `import { toast } from "sonner"` em qualquer componente.

**Padrão de uso no `TodoTableList`:**

```typescript
// Sucesso
toast.success("Tarefa concluída!");

// Erro
toast.error("Erro ao atualizar tarefa.");
```

O componente `src/components/ui/sonner.tsx` aplica automaticamente o tema correto (claro/escuro) via `next-themes` e adiciona ícones customizados de `lucide-react`.

---

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do pacote `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
```

| Variável                      | Padrão                          | Descrição                              |
|-------------------------------|---------------------------------|----------------------------------------|
| `NEXT_PUBLIC_API_URL`         | `http://localhost:3001/api`     | URL base da API do backend             |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`| —                               | Client ID do Google OAuth (obrigatório para login com Google) |

> Variáveis com prefixo `NEXT_PUBLIC_` são expostas no cliente (browser).

---

## Como executar

### Pré-requisitos

- Node.js 20+
- pnpm
- Backend rodando em `http://localhost:3001`

### Instalação

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
# Crie .env.local com NEXT_PUBLIC_API_URL e NEXT_PUBLIC_GOOGLE_CLIENT_ID

# 3. Iniciar o servidor de desenvolvimento
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`.

### Executando com o backend

```bash
# Terminal 1 — backend
cd ../backend && pnpm dev

# Terminal 2 — frontend
cd ../frontend && pnpm dev
```

Ou, pela raiz do monorepo:

```bash
pnpm dev
```

---

## Scripts disponíveis

| Script       | Comando      | Descrição                        |
|--------------|--------------|----------------------------------|
| `pnpm dev`   | `next dev`   | Servidor de desenvolvimento      |
| `pnpm build` | `next build` | Build de produção                |
| `pnpm start` | `next start` | Servidor de produção             |
| `pnpm lint`  | `eslint`     | Verificação de lint              |
