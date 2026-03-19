"use client";

import useSWR, { mutate } from "swr";
import { api } from "@/services/api";
import type { Todo } from "@/types/todo";

const TODOS_KEY = "/todos";

export function useTodos() {
  const { data, error, isLoading } = useSWR<Todo[]>(TODOS_KEY, api.getTodos);
  return { todos: data ?? [], error, isLoading };
}

export function useTodo(id: number) {
  const { data, error, isLoading } = useSWR<Todo>(
    id ? `/todos/${id}` : null,
    () => api.getTodo(id)
  );
  return { todo: data, error, isLoading };
}

export function useTodoActions() {
  async function createTodo(title: string) {
    const todo = await api.createTodo(title);
    await mutate(TODOS_KEY);
    return todo;
  }

  async function toggleTodo(todo: Todo) {
    await api.updateTodo(todo.id, { completed: !todo.completed });
    await mutate(TODOS_KEY);
  }

  async function editTodo(id: number, title: string) {
    await api.updateTodo(id, { title });
    await mutate(TODOS_KEY);
  }

  async function deleteTodo(id: number) {
    await api.deleteTodo(id);
    await mutate(TODOS_KEY);
  }

  return { createTodo, toggleTodo, editTodo, deleteTodo };
}
