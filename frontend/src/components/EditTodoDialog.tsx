"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import type { Todo } from "@/types/todo";
import { useTodoActions } from "@/hooks/useTodos";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = { todo: Todo };

export default function EditTodoDialog({ todo }: Props) {
  const { editTodo } = useTodoActions();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(todo.title);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!value.trim()) return;
    setIsSaving(true);
    await editTodo(todo.id, value.trim());
    setIsSaving(false);
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setValue(todo.title);
      }}
    >
      <DialogTrigger asChild>
        <button
          className="cursor-pointer text-zinc-400 transition-colors hover:text-blue-500"
          aria-label="Editar tarefa"
        >
          <Pencil size={16} />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tarefa</DialogTitle>
        </DialogHeader>

        <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
          {todo.title.charAt(0).toUpperCase() + todo.title.slice(1)}
        </p>

        <input
          type="text"
          value={value.charAt(0).toUpperCase() + value.slice(1)}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Título da tarefa"
          className="w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:text-zinc-100"
        />

        <DialogFooter className="flex gap-2 justify-end">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="bg-red-500 text-white hover:bg-red-600 hover:text-white cursor-pointer border-0"
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={isSaving || !value.trim()}
            className="bg-blue-500 text-white hover:bg-blue-600 hover:text-white cursor-pointer border-0"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
