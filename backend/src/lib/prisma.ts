import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const { hostname, port, username, password, pathname } = new URL(
  process.env.DATABASE_URL!
);

const adapter = new PrismaMariaDb({
  host: hostname,
  port: parseInt(port || "3306"),
  user: username,
  password,
  database: pathname.slice(1),
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
