import { NextRequest } from "next/server";
import { listTodos, createTodo } from "@/controllers/todoController";

export async function GET(req: NextRequest) {
  return listTodos(req);
}

export async function POST(req: NextRequest) {
  return createTodo(req);
}
