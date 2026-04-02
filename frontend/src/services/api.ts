import type { Todo } from "@/types/todo";

export type PaginatedTodosResponse = {
  todos: Todo[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  openCount: number;
  doneCount: number;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };


  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getTodos: (page: number, limit: number) =>
    request<PaginatedTodosResponse>(`/todos?page=${page}&limit=${limit}`),
  getTodo: (id: number) => request<Todo>(`/todos/${id}`),
  createTodo: (title: string) =>
    request<Todo>("/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  updateTodo: (id: number, data: Partial<Pick<Todo, "title" | "completed">>) =>
    request<Todo>(`/todos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteTodo: (id: number) =>
    request<void>(`/todos/${id}`, { method: "DELETE" }),
  login: (email: string, password: string) =>
    request<{ ok: true }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha: password }),
    }),
  register: (name: string, email: string, password: string) =>
    request<{ id: number; name: string; email: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, senha: password }),
    }),
  me: () =>
    request<{ id: number; name: string; email: string }>("/auth/me"),
  logout: () =>
    request<{ ok: true }>("/auth/logout", { method: "POST" }),
  googleLogin: (credential: string) =>
    request<{ ok: true }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
};

