const { PrismaClient } = require("./../../develop/redefilosofica/src/generated/prisma");

async function main() {
  const prismaOld = new PrismaClient({});

  const categories = await prismaOld.category.findMany({
    where: { blogId: "cmmvobjo80001pcoifi6iawc3" }
  });

  console.log("Categories in old DB for cmmvobjo80001pcoifi6iawc3:");
  console.log(categories);
  
  await prismaOld.$disconnect();
}

main().catch(console.error);
