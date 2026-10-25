import { PrismaClient } from "../../generated/prisma/client";

const createPrismaClient = () => {
  return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}