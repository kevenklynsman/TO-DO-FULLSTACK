import Link from "next/link";
import TodoList from "@/components/TodoList";
import { Plus } from "lucide-react";

export const metadata = { title: "My Todos" };

export default function TodosPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Minhas Tarefas
        </h1>
        <Link
          href="/todos/create"
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus size={16} />
          Nova tarefa
        </Link>
      </div>
      <TodoList />
    </main>
  );
}
