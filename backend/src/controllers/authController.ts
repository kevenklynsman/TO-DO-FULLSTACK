import { NextResponse } from "next/server";
import { loginSchema, registerSchema } from "@/validators/authValidator";
import * as authService from "@/services/authService";

export async function registerController(req: Request) {
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);

    if(!parsed.success) {
        return NextResponse.json({ error: "input invalido" }, { status: 422 });
    }

    try {
        const { name, email, senha } = parsed.data;
        const user = await authService.register(name, email, senha);
        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao registrar";
        return NextResponse.json({ error: message }, { status: 409 });
    }
}

export async function loginController(req: Request) {
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);

    if(!parsed.success) {
        return NextResponse.json({ error: "input invalido" }, { status: 422 });
    }

    try {
        const { email, senha } = parsed.data;
        const token = await authService.login(email, senha);
        return NextResponse.json({ token });
    } catch {
        return NextResponse.json({ error: "credenciais inválidas" }, { status: 401 });
    }

}