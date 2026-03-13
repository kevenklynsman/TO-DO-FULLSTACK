import { NextRequest, NextResponse } from "next/server";
import * as todoService from "@/services/todoService";
import { createTodoSchema, updateTodoSchema } from "@/validators/todoValidator";

export async function listTodos() {
  const todos = await todoService.getAllTodos();
  return NextResponse.json(todos);
}

export async function getTodo(id: number) {
  const todo = await todoService.getTodoById(id);
  if (!todo) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }
  return NextResponse.json(todo);
}

export async function createTodo(req: NextRequest) {
  const body = await req.json();
  const parsed = createTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const todo = await todoService.createTodo(parsed.data);
  return NextResponse.json(todo, { status: 201 });
}

export async function updateTodo(req: NextRequest, id: number) {
  const body = await req.json();
  const parsed = updateTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }
  const existing = await todoService.getTodoById(id);
  if (!existing) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }
  const todo = await todoService.updateTodo(id, parsed.data);
  return NextResponse.json(todo);
}

export async function deleteTodo(id: number) {
  const existing = await todoService.getTodoById(id);
  if (!existing) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }
  await todoService.deleteTodo(id);
  return new NextResponse(null, { status: 204 });
}
