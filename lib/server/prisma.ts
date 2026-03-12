import { PrismaClient } from "@prisma/client";

declare global {
  var __novoriqPrisma__: PrismaClient | undefined;
}

export function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const prisma =
    globalThis.__novoriqPrisma__ ||
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });

  if (process.env.NODE_ENV !== "production") {
    globalThis.__novoriqPrisma__ = prisma;
  }

  return prisma;
}
