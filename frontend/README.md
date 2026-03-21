# Frontend — TO-DO Fullstack

Interface web para gerenciamento de tarefas (todos), construída com **Next.js 16**, **React 19**, **Tailwind CSS v4**, **shadcn/ui** como sistema de componentes, **SWR** para data fetching e **Zod** + **React Hook Form** para validação de formulários.

---

## Sumário

- [Stack](#stack)
- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Arquitetura](#arquitetura)
- [Páginas e rotas](#páginas-e-rotas)
- [Componentes](#componentes)
- [UI Components (shadcn)](#ui-components-shadcn)
- [Hooks](#hooks)
- [Serviços](#serviços)
- [Tipos](#tipos)
- [Utilitários](#utilitários)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Como executar](#como-executar)
- [Scripts disponíveis](#scripts-disponíveis)

---

## Stack

| Camada           | Tecnologia                        |
|------------------|-----------------------------------|
| Framework        | Next.js 16.1.6 (App Router)       |
| UI               | React 19.2.3                      |
| Estilização      | Tailwind CSS v4 + tw-animate-css  |
| Componentes UI   | shadcn/ui (radix-ui)              |
| Data fetching    | SWR 2.x                           |
| Formulários      | React Hook Form 7.x               |
| Validação        | Zod 4.x + @hookform/resolvers     |
| Ícones           | lucide-react                      |
| Utilitários CSS  | tailwind-merge, class-variance-authority, clsx |
| Linguagem        | TypeScript 5                      |
| Gerenciador      | pnpm                              |

> O servidor sobe na porta **3000**. O backend é esperado na porta **3001**.

---

## Estrutura de diretórios

```
frontend/
├── .gitignore
├── components.json                   # Configuração do shadcn/ui
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
    │   ├── globals.css               # Estilos globais + design system CSS (oklch, dark mode)
    │   ├── layout.tsx                # Root layout (fontes Geist + Inter)
    │   ├── page.tsx                  # / → redireciona para /todos
    │   └── todos/
    │       ├── page.tsx              # /todos → lista de tarefas
    │       └── create/
    │           └── page.tsx          # /todos/create → criar tarefa
    ├── components/
    │   ├── EditTodoDialog.tsx        # Dialog de edição de título (Radix UI)
    │   ├── TodoForm.tsx              # Formulário de criação
    │   ├── TodoItem.tsx              # Item individual da lista
    │   ├── TodoList.tsx              # Lista completa de tarefas
    │   └── ui/                       # Componentes base do shadcn/ui
    │       ├── button.tsx            # Botão com variantes CVA
    │       ├── dialog.tsx            # Dialog Radix UI
    │       └── skeleton.tsx          # Skeleton de carregamento
    ├── hooks/
    │   └── useTodos.ts               # Hooks SWR + ações de mutação
    ├── lib/
    │   └── utils.ts                  # Utilitário cn() (clsx + tailwind-merge)
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
                  ├── useTodoActions().toggleTodo() → PUT /api/todos/:id → mutate()
                  ├── useTodoActions().deleteTodo() → DELETE /api/todos/:id → mutate()
                  └── <EditTodoDialog>
                        └── useTodoActions().editTodo() → PUT /api/todos/:id → mutate()

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
- **Mutações:** Após cada operação (criar, toggle, editar, deletar) é chamado `mutate(TODOS_KEY)` para revalidar a lista.
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

| Elemento         | Comportamento                                           |
|------------------|---------------------------------------------------------|
| Checkbox         | Chama `toggleTodo(todo)` ao marcar/desmarcar            |
| Título           | Texto riscado (`line-through`) quando `completed`; primeira letra capitalizada |
| Botão de edição  | Ícone `Pencil` abre `<EditTodoDialog>` para editar o título |
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

### `EditTodoDialog`
`src/components/EditTodoDialog.tsx` — Client Component

Modal de edição do título de uma tarefa, construído sobre o `<Dialog>` do shadcn/ui.

| Comportamento       | Detalhe                                                        |
|---------------------|----------------------------------------------------------------|
| Abertura            | Ícone `Pencil` em cada `<TodoItem>` abre o dialog             |
| Reset ao abrir      | Ao abrir, o input é resetado com o título atual da tarefa      |
| Salvar              | Chama `editTodo(id, title)`, fecha o dialog e revalida o cache |
| Cancelar            | Fecha o dialog sem salvar alterações                           |
| Enter               | Pressionar Enter no input dispara o save                       |
| Botão desabilitado  | Desabilitado enquanto salva ou se o campo estiver vazio        |

**Props:**

| Prop   | Tipo   | Descrição       |
|--------|--------|-----------------|
| `todo` | `Todo` | Tarefa a editar |

---

## UI Components (shadcn)

Componentes base localizados em `src/components/ui/`, gerados via **shadcn** com estilo `radix-vega` e primitivos do `radix-ui`. Todos usam o utilitário `cn()` para composição de classes.

### `Button`
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

Sizes disponíveis: `default`, `xs`, `sm`, `lg`, `icon`, `icon-xs`, `icon-sm`, `icon-lg`.

Suporta `asChild` via `Slot.Root` do `radix-ui` para polimorfismo de elemento.

---

### `Dialog`
`src/components/ui/dialog.tsx`

Wrapper completo do primitivo `Dialog` do `radix-ui`. Exports:

| Export            | Descrição                                              |
|-------------------|--------------------------------------------------------|
| `Dialog`          | Root do dialog (controla estado aberto/fechado)        |
| `DialogTrigger`   | Elemento que dispara a abertura                        |
| `DialogContent`   | Container do modal com overlay e botão X padrão        |
| `DialogHeader`    | Cabeçalho com `flex flex-col gap-2`                    |
| `DialogFooter`    | Rodapé responsivo (`flex-col-reverse` → `sm:flex-row`) |
| `DialogTitle`     | Título acessível do dialog                             |
| `DialogClose`     | Botão de fechar                                        |

---

### `Skeleton`
`src/components/ui/skeleton.tsx`

Placeholder animado para estados de carregamento. Usa `animate-pulse` com `bg-muted`.

```tsx
<Skeleton className="h-4 w-full" />
```

---

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

Retorna quatro funções de mutação. Cada uma chama a API e revalida o cache SWR em seguida.

```typescript
const { createTodo, toggleTodo, editTodo, deleteTodo } = useTodoActions();
```

| Função                        | Operação                                      |
|-------------------------------|-----------------------------------------------|
| `createTodo(title)`           | `POST /api/todos`                             |
| `toggleTodo(todo)`            | `PUT /api/todos/:id` com `completed` invertido |
| `editTodo(id, title)`         | `PUT /api/todos/:id` atualizando o título      |
| `deleteTodo(id)`              | `DELETE /api/todos/:id`                       |

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
