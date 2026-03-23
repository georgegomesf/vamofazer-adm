import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const postId = 'cmn29b4u20001e6oid1eicr6j'
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      categories: { include: { category: true } },
      actions: { include: { action: true } }
    }
  })

  console.log(JSON.stringify(post, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
