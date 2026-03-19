"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TodoForm from "@/components/TodoForm";

export default function CreateTodoPage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <Link
        href="/todos"
        className="mb-6 flex cursor-pointer items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        <ArrowLeft size={14} />
        Voltar para tarefas 
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Nova tarefa
      </h1>
      <TodoForm onSuccess={() => router.push("/todos")} />
    </main>
  );
}
