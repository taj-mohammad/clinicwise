import { PrismaClient, Prisma } from '@prisma/client';

export * from '@prisma/client';
export { Prisma, PrismaClient };

const globalForPrisma = globalThis as unknown as { cliniqxPrisma?: PrismaClient };

/** Single client per process; hot reload in dev must not open a new pool each time. */
export const prisma: PrismaClient =
  globalForPrisma.cliniqxPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.cliniqxPrisma = prisma;
