import { NextRequest } from "next/server";
import { getTodo, updateTodo, deleteTodo } from "@/controllers/todoController";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  return getTodo(Number(id));
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return updateTodo(req, Number(id));
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  return deleteTodo(Number(id));
}
