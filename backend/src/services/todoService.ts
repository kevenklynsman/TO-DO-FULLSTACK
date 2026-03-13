import { prisma } from "@/lib/prisma";
import type { CreateTodoInput, UpdateTodoInput } from "@/validators/todoValidator";

export async function getAllTodos() {
  return prisma.todo.findMany({ orderBy: { createdAt: "desc" } });
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
