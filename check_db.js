const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.activity.count();
    console.log("Total activities:", count);
    const last = await prisma.activity.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
    console.log("Last activities:", JSON.stringify(last, null, 2));
  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
