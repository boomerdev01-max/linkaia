// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

// ✅ Singleton du pool pg — crucial en serverless
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    // ✅ Limites strictes pour Supabase free + Vercel serverless
    max: 1, // 1 connexion max par instance serverless
    idleTimeoutMillis: 10_000, // Libérer après 10s d'inactivité
    connectionTimeoutMillis: 10_000, // Timeout si pas de connexion dispo
  });

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => new PrismaClient({ adapter });

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
