"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
{
  /* 
        {import TodoList from "@/components/TodoList";}
        */
}
import TodoLogin from "@/components/TodoLogin";
import TodoTableList from "@/components/TodoTableList";
import { Plus } from "lucide-react";
import { TodoUserNav } from "@/components/TodoUserNav";

export default function TodosPage() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12 flex items-center justify-center min-h-screen">
        <TodoLogin />
      </main>
    );
  }

  return (
    <main>
      <nav className="mb-6 py-4 px-20 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Minhas Tarefas
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <TodoUserNav />
        </div>
      </nav>
     

      {/* <TodoList /> */}
      <TodoTableList />
    </main>
  );
}
