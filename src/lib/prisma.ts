import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL!,
    max: 2, // Limite de 2 conexões por instância serverless
    idleTimeoutMillis: 1000, // Encerra conexões ociosas em 1 segundo
    connectionTimeoutMillis: 15000, // Espera até 15s antes de dar timeout
  })
  // @ts-ignore - Minor pg type version mismatch, safe to ignore
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma



