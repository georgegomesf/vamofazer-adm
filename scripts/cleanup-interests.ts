import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe('DELETE FROM "UserInterest"')
  console.log('Deleted all user interests.')
  process.exit(0)
}

main()
