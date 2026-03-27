import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    senha: z.string().min(5, "A senha deve conter no mínimo 5 caracteres"),
})

export const registerSchema = z.object({
    name: z.string().min(1, "O nome é obrigatório"),
    email: z.string().email("Email inválido"),
    senha: z.string().min(5, "A senha deve conter no mínimo 5 caracteres"),
})

export const googleLoginSchema = z.object({
    credential: z.string().min(1, "Credential do Google é obrigatória"),
})

