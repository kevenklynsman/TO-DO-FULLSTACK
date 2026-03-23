"use client";

import { useTodos } from "@/hooks/useTodos";
import TodoItem from "@/components/TodoItem";

export default function TodoList() {
  const { todos, isLoading, error } = useTodos();

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Carregando tarefas…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">Falha ao carregar tarefas.</p>;
  }

  if (todos.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
      Nenhuma tarefa ainda.{" "}
      <a href="/todos/create" className="text-blue-600 underline">
        Crie uma
      </a>
      .
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
