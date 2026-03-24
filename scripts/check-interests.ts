import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const count = await prisma.userInterest.count()
  console.log(`Total user interests: ${count}`)
  process.exit(0)
}

main()
