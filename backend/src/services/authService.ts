import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (name: string, email: string, senha: string) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email já cadastrado");
  }

  const hashedPassword = await bcrypt.hash(senha, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return { id: user.id, name: user.name, email: user.email };
};

export const login = async (email: string, senha: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  const isPasswordValid = await bcrypt.compare(senha, user.password);
  if (!isPasswordValid) {
    throw new Error("Senha inválida");
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });

  return token;
};
