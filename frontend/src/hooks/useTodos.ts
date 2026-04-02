"use client";

import useSWR, { mutate } from "swr";
import { api } from "@/services/api";
import type { Todo } from "@/types/todo";

const TODOS_KEY = "/todos";

export function useTodos(page: number, limit: number) {
  const { data, error, isLoading } = useSWR(
    [TODOS_KEY, page, limit],
    ([, currentPage, currentLimit]) => api.getTodos(currentPage, currentLimit),
  );

  return {
    todos: data?.todos ?? [],
    page: data?.page ?? page,
    limit: data?.limit ?? limit,
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    openCount: data?.openCount ?? 0,
    doneCount: data?.doneCount ?? 0,
    error,
    isLoading,
  };
}

export function useTodo(id: number) {
  const { data, error, isLoading } = useSWR<Todo>(
    id ? `/todos/${id}` : null,
    () => api.getTodo(id)
  );
  return { todo: data, error, isLoading };
}

export function useTodoActions() {
  const revalidateTodos = () =>
    mutate((key) => Array.isArray(key) && key[0] === TODOS_KEY);

  async function createTodo(title: string) {
    const todo = await api.createTodo(title);
    await revalidateTodos();
    return todo;
  }

  async function toggleTodo(todo: Todo) {
    await api.updateTodo(todo.id, { completed: !todo.completed });
    await revalidateTodos();
  }

  async function editTodo(id: number, title: string) {
    await api.updateTodo(id, { title });
    await revalidateTodos();
  }

  async function deleteTodo(id: number) {
    await api.deleteTodo(id);
    await revalidateTodos();
  }

  return { createTodo, toggleTodo, editTodo, deleteTodo };
}
