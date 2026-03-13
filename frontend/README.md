# Frontend — TO-DO Fullstack

Interface web para gerenciamento de tarefas (todos), construída com **Next.js 16**, **React 19**, **Tailwind CSS v4**, **SWR** para data fetching e **Zod** + **React Hook Form** para validação de formulários.

---

## Sumário

- [Stack](#stack)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Arquitetura](#arquitetura)
- [Páginas e rotas](#páginas-e-rotas)
- [Componentes](#componentes)
- [Hooks](#hooks)
- [Serviços](#serviços)
- [Tipos](#tipos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Como executar](#como-executar)
- [Scripts disponíveis](#scripts-disponíveis)

---

## Stack

| Camada           | Tecnologia                        |
|------------------|-----------------------------------|
| Framework        | Next.js 16.1.6 (App Router)       |
| UI               | React 19.2.3                      |
| Estilização      | Tailwind CSS v4                   |
| Data fetching    | SWR 2.x                           |
| Formulários      | React Hook Form 7.x               |
| Validação        | Zod 4.x + @hookform/resolvers     |
| Ícones           | lucide-react                      |
| Utilitários CSS  | tailwind-merge, class-variance-authority |
| Linguagem        | TypeScript 5                      |
| Gerenciador      | pnpm                              |

> O servidor sobe na porta **3000**. O backend é esperado na porta **3001**.

---

## Estrutura de diretórios

```
frontend/
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts                     # Gerado automaticamente pelo Next.js
├── next.config.ts
├── package.json
├── postcss.config.mjs                # Plugin Tailwind CSS v4
├── tsconfig.json
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── src/
    ├── app/
    │   ├── favicon.ico
    │   ├── globals.css               # Estilos globais + variáveis CSS
    │   ├── layout.tsx                # Root layout (fonte Geist)
    │   ├── page.tsx                  # / → redireciona para /todos
    │   └── todos/
    │       ├── page.tsx              # /todos → lista de tarefas
    │       └── create/
    │           └── page.tsx          # /todos/create → criar tarefa
    ├── components/
    │   ├── TodoForm.tsx              # Formulário de criação
    │   ├── TodoItem.tsx              # Item individual da lista
    │   └── TodoList.tsx              # Lista completa de tarefas
    ├── hooks/
    │   └── useTodos.ts               # Hooks SWR + ações de mutação
    ├── services/
    │   └── api.ts                    # Cliente HTTP centralizado
    └── types/
        └── todo.ts                   # Tipo Todo
```

---

## Arquitetura

O frontend segue o padrão do **Next.js App Router** com separação em camadas:

```
Páginas (Server Components)
        │  renderizam
        ▼
Componentes (Client Components)
        │  consomem
        ▼
Hooks (SWR + ações)
        │  chamam
        ▼
Serviços (fetch wrapper)
        │  comunicam com
        ▼
API REST (backend :3001)
```

### Fluxo de dados

```
/ ──redirect──► /todos
                  │
           TodosPage (server)
                  │ renderiza
           TodoList (client)
                  │ useTodos() → SWR → GET /api/todos
                  │
           TodoItem (client)
                  │ useTodoActions() → PUT | DELETE /api/todos/:id
                  │                  → mutate() revalida cache SWR

/todos/create
      │
CreateTodoPage (client)
      │ renderiza
TodoForm (client)
      │ react-hook-form + zod
      │ POST /api/todos → mutate() → redirect /todos
```

### Estratégia de estado

- **Leitura:** SWR com cache automático e revalidação em background.
- **Mutações:** Após cada operação (criar, toggle, deletar) é chamado `mutate(TODOS_KEY)` para revalidar a lista.
- **Sem otimistic update:** a UI aguarda a confirmação do servidor antes de atualizar.

---

## Páginas e rotas

| Rota             | Arquivo                          | Tipo   | Descrição                              |
|------------------|----------------------------------|--------|----------------------------------------|
| `/`              | `src/app/page.tsx`               | Server | Redireciona para `/todos`              |
| `/todos`         | `src/app/todos/page.tsx`         | Server | Lista todas as tarefas + botão "Nova tarefa" (`Plus` icon) |
| `/todos/create`  | `src/app/todos/create/page.tsx`  | Client | Formulário de criação de nova tarefa   |

---

## Componentes

### `TodoList`
`src/components/TodoList.tsx` — Client Component

Orquestra a exibição da lista. Gerencia três estados de UI:

| Estado      | Exibição                                          |
|-------------|---------------------------------------------------|
| Carregando  | `"Loading tasks…"`                                |
| Erro        | `"Failed to load tasks."`                         |
| Lista vazia | `"No tasks yet."` + link para `/todos/create`     |
| Com dados   | Lista de `<TodoItem>` para cada todo              |

---

### `TodoItem`
`src/components/TodoItem.tsx` — Client Component

Renderiza uma linha de tarefa com:

| Elemento         | Comportamento                                      |
|------------------|----------------------------------------------------|
| Checkbox         | Chama `toggleTodo(todo)` ao marcar/desmarcar       |
| Título           | Texto riscado (`line-through`) quando `completed`  |
| Botão de exclusão | Ícone `Trash2` (lucide-react), chama `deleteTodo(id)` |

---

### `TodoForm`
`src/components/TodoForm.tsx` — Client Component

Formulário controlado por `react-hook-form` com validação via `zod`:

```typescript
// Schema de validação
const schema = z.object({
  title: z.string().min(1, "Title is required"),
});
```

| Comportamento    | Detalhe                                              |
|------------------|------------------------------------------------------|
| Submit           | Chama `createTodo(title)`, reseta o form, dispara `onSuccess?.()` |
| Estado de envio  | Botão desabilitado com texto `"Saving…"`             |
| Erro de validação| Mensagem exibida abaixo do campo                     |

**Props:**

| Prop        | Tipo         | Descrição                                       |
|-------------|--------------|-------------------------------------------------|
| `onSuccess` | `() => void` | Callback chamado após criação bem-sucedida      |

---

## Hooks

`src/hooks/useTodos.ts`

### `useTodos()`

Busca a lista completa de todos via SWR.

```typescript
const { todos, isLoading, error } = useTodos();
```

| Retorno     | Tipo       | Descrição                                    |
|-------------|------------|----------------------------------------------|
| `todos`     | `Todo[]`   | Lista de todos (padrão: `[]`)                |
| `isLoading` | `boolean`  | `true` enquanto faz o primeiro fetch         |
| `error`     | `any`      | Erro capturado pelo SWR, `undefined` se ok   |

---

### `useTodo(id)`

Busca um único todo por ID. Não dispara fetch quando `id` é falsy.

```typescript
const { todo, isLoading, error } = useTodo(id);
```

---

### `useTodoActions()`

Retorna três funções de mutação. Cada uma chama a API e revalida o cache SWR em seguida.

```typescript
const { createTodo, toggleTodo, deleteTodo } = useTodoActions();
```

| Função                   | Operação                              |
|--------------------------|---------------------------------------|
| `createTodo(title)`      | `POST /api/todos`                     |
| `toggleTodo(todo)`       | `PUT /api/todos/:id` com `completed` invertido |
| `deleteTodo(id)`         | `DELETE /api/todos/:id`               |

---

## Serviços

`src/services/api.ts`

Cliente HTTP centralizado com um wrapper genérico `request<T>`:

- Lança erro com a mensagem retornada pelo servidor (campo `error`) ou `"Request failed: <status>"`.
- Trata HTTP 204 retornando `undefined`.
- Injeta `Content-Type: application/json` em todas as requisições.

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
```

| Método                          | HTTP                     | Endpoint           |
|---------------------------------|--------------------------|--------------------|
| `api.getTodos()`                | `GET`                    | `/todos`           |
| `api.getTodo(id)`               | `GET`                    | `/todos/:id`       |
| `api.createTodo(title)`         | `POST`                   | `/todos`           |
| `api.updateTodo(id, data)`      | `PUT`                    | `/todos/:id`       |
| `api.deleteTodo(id)`            | `DELETE`                 | `/todos/:id`       |

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

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

| Variável               | Padrão                          | Descrição                     |
|------------------------|---------------------------------|-------------------------------|
| `NEXT_PUBLIC_API_URL`  | `http://localhost:3001/api`     | URL base da API do backend    |

> Variáveis com prefixo `NEXT_PUBLIC_` são expostas no cliente (browser).

---

## Como executar

### Pré-requisitos

- Node.js 18+
- pnpm
- Backend rodando em `http://localhost:3001`

### Instalação

```bash
# 1. Instalar dependências
pnpm install

# 2. (Opcional) Configurar variável de ambiente
echo 'NEXT_PUBLIC_API_URL=http://localhost:3001/api' > .env.local

# 3. Iniciar o servidor de desenvolvimento
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`.

### Executando com o backend

Para o funcionamento completo, o backend deve estar rodando antes de iniciar o frontend:

```bash
# Terminal 1 — backend
cd ../backend && pnpm dev

# Terminal 2 — frontend
cd ../frontend && pnpm dev
```

---

## Scripts disponíveis

| Script       | Comando      | Descrição                        |
|--------------|--------------|----------------------------------|
| `pnpm dev`   | `next dev`   | Servidor de desenvolvimento      |
| `pnpm build` | `next build` | Build de produção                |
| `pnpm start` | `next start` | Servidor de produção             |
| `pnpm lint`  | `eslint`     | Verificação de lint              |
