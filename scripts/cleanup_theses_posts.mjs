import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PROJECT_ID = 'ckx7m9a0b0004w3e7r1t9y5u2';

async function main() {
    console.log("Limpando postagens de teses anteriores para reinício limpo...");
    
    // Find posts in this project that are linked to theses
    const postsToDelete = await prisma.post.findMany({
        where: {
            projectId: PROJECT_ID,
            postTheses: {
                some: {}
            }
        },
        select: { id: true }
    });

    console.log(`Encontradas ${postsToDelete.length} postagens vinculadas a teses.`);

    if (postsToDelete.length > 0) {
        const ids = postsToDelete.map(p => p.id);
        const deleted = await prisma.post.deleteMany({
            where: {
                id: { in: ids }
            }
        });
        console.log(`Excluídas ${deleted.count} postagens.`);
    }
}

main().finally(() => prisma.$disconnect());
