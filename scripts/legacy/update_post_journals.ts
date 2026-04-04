import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Iniciando conversão de vinculações de revistas para portais de edições...");

  // Identificar a categoria "Revistas"
  const category = await prisma.category.findFirst({
    where: {
      title: {
        contains: "evista",
        mode: "insensitive",
      },
    },
  });

  if (!category) {
    console.log("Categoria 'Revistas' não encontrada!");
    return;
  }

  console.log(`Categoria encontrada: ${category.title} (ID: ${category.id})`);

  // Atualizar todas as vinculações PostJournal (includeIssues = true)
  // onde o post relacionado possui a categoria "Revistas"
  const updateResult = await prisma.postJournal.updateMany({
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
      includeIssues: true,
    },
  });

  console.log(`Processo concluído! Foram atualizadas ${updateResult.count} vinculações de revistas para atuarem como portais.`);
}

main()
  .catch((e) => {
    console.error("Erro durante a execução:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
