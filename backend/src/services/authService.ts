import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

  if (!user.password) {
    throw new Error("Esta conta usa login com Google. Use o botão 'Entrar com Google'.");
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

export const googleLogin = async (credential: string) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error("Token do Google inválido");
  }

  const { sub: googleId, email, name, picture } = payload;

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId }, { email }],
    },
  });

  if (user) {
    if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          avatarUrl: picture ?? user.avatarUrl,
          name: user.name ?? name,
        },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        email,
        name: name ?? null,
        googleId,
        avatarUrl: picture ?? null,
      },
    });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });

  return token;
};
