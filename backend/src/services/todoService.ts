import { prisma } from "@/lib/prisma";
import type { CreateTodoInput, UpdateTodoInput } from "@/validators/todoValidator";

export type PaginatedTodosResult = {
  todos: Awaited<ReturnType<typeof prisma.todo.findMany>>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  openCount: number;
  doneCount: number;
};

export async function getPaginatedTodos(
  page: number,
  limit: number,
): Promise<PaginatedTodosResult> {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safeLimit = Number.isFinite(limit)
    ? Math.min(100, Math.max(1, Math.floor(limit)))
    : 15;

  const skip = (safePage - 1) * safeLimit;

  const [todos, total, openCount] = await prisma.$transaction([
    prisma.todo.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
    }),
    prisma.todo.count(),
    prisma.todo.count({ where: { completed: false } }),
  ]);

  const doneCount = total - openCount;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    todos,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    openCount,
    doneCount,
  };
}

export async function getTodoById(id: number) {
  return prisma.todo.findUnique({ where: { id } });
}

export async function createTodo(data: CreateTodoInput) {
  return prisma.todo.create({ data });
}

export async function updateTodo(id: number, data: UpdateTodoInput) {
  return prisma.todo.update({ where: { id }, data });
}

export async function deleteTodo(id: number) {
  return prisma.todo.delete({ where: { id } });
}
