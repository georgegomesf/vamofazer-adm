import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.postThesis.count();
        console.log("PostThesis count:", count);
    } catch (e) {
        console.error("Error accessing postThesis:", e.message);
    }
}

main().finally(() => prisma.$disconnect());
