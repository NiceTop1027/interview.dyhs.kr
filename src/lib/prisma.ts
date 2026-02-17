import { PrismaClient } from '@prisma/client'

const connectionString = "postgresql://postgres:postgres@127.0.0.1:25432/nicetop_ai?schema=public&sslmode=disable"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: connectionString
    }
  },
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
