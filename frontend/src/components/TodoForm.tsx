"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTodoActions } from "@/hooks/useTodos";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  onSuccess?: () => void;
};

export default function TodoForm({ onSuccess }: Props) {
  const { createTodo } = useTodoActions();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await createTodo(values.title);
    reset();
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Task title
        </label>
        <input
          id="title"
          type="text"
          placeholder="e.g. Buy groceries"
          {...register("title")}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none ring-blue-500 transition placeholder:text-zinc-400 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {errors.title && (
          <p className="text-xs text-red-500">{errors.title.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Add task"}
      </button>
    </form>
  );
}
