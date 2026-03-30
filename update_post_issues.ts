import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Iniciando conversão de vinculações de edição para portais de artigos...");

  // Identificar a categoria "Edições"
  const category = await prisma.category.findFirst({
    where: {
      title: {
        contains: "ediç",
        mode: "insensitive",
      },
    },
  });

  if (!category) {
    console.log("Categoria 'Edições' não encontrada!");
    return;
  }

  console.log(`Categoria encontrada: ${category.title} (ID: ${category.id})`);

  // Atualizar todas as vinculações PostIssue (includeArticles = true)
  // onde o post relacionado possui a categoria "Edições"
  const updateResult = await prisma.postIssue.updateMany({
    where: {
      post: {
        categories: {
          some: {
            categoryId: category.id,
          },
        },
      },
    },
    data: {
      includeArticles: true,
    },
  });

  console.log(`Processo concluído! Foram atualizadas ${updateResult.count} vinculações para atuarem como portais.`);
}

main()
  .catch((e) => {
    console.error("Erro durante a execução:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
