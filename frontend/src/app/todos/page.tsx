'use client'

import { useAuth } from '@/hooks/useAuth'
import Link from "next/link";
import TodoList from "@/components/TodoList";
import TodoLogin from "@/components/TodoLogin";
import { Plus, LogOut } from "lucide-react";

export default function TodosPage() {
  const { isAuthenticated, loading, logout, user } = useAuth()

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <TodoLogin />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Minhas Tarefas
          </h1>
          {user && (
            <p className="text-sm text-zinc-500">{user.email}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/todos/create"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Nova tarefa
          </Link>
          <button
            onClick={logout}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
      <TodoList />
    </main>
  );
}
