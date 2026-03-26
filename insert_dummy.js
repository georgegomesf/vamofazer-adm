const { PrismaClient } = require("./node_modules/@prisma/client");
const prisma = new PrismaClient();

async function addDummy() {
  const projectId = "cmmvobjo80001pcoifi6iawc3";
  try {
    const activity = await prisma.activity.create({
      data: {
        projectId,
        type: "POST_PUBLISHED",
        title: "Atividade de Teste",
        description: "Esta é uma atividade de teste inserida manualmente para verificar o mural.",
        url: "/test",
        createdAt: new Date(),
      }
    });
    console.log("Activity created:", activity.id);
  } catch (err) {
    console.error("Error creating dummy activity:", err);
  } finally {
    await prisma.$disconnect();
  }
}

addDummy();
