"use client";

import { Trash2 } from "lucide-react";
import type { Todo } from "@/types/todo";
import { useTodoActions } from "@/hooks/useTodos";
import EditTodoDialog from "@/components/EditTodoDialog";

type Props = { todo: Todo };

export default function TodoItem({ todo }: Props) {
  const { toggleTodo, deleteTodo } = useTodoActions();

  return (
    <li className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm transition-colors dark:border-zinc-700 dark:bg-zinc-900">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo)}
        className="h-4 w-4 cursor-pointer accent-blue-600"
      />
      <span
        className={`flex-1 text-sm ${
          todo.completed
            ? "text-zinc-400 line-through"
            : "text-zinc-800 dark:text-zinc-100"
        }`}
      >
        {todo.title}
      </span>

      <EditTodoDialog todo={todo} />

      <button
        onClick={() => deleteTodo(todo.id)}
        className="text-zinc-400 transition-colors hover:text-red-500"
        aria-label="Excluir tarefa"
      >
        <Trash2 size={16} />
      </button>
    </li>
  );
}
