"use client";

import { useTodos } from "@/hooks/useTodos";
import TodoItem from "@/components/TodoItem";

export default function TodoList() {
  const { todos, isLoading, error } = useTodos();

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading tasks…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">Failed to load tasks.</p>;
  }

  if (todos.length === 0) {
    return (
      <p className="text-sm text-zinc-400">
        No tasks yet.{" "}
        <a href="/todos/create" className="text-blue-600 underline">
          Create one
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
