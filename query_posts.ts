import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: 'desc' },
  })
  console.log(posts.slice(0, 5))
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
