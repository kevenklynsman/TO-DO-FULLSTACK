import type { Todo } from "@/types/todo";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getTodos: () => request<Todo[]>("/todos"),

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
};
