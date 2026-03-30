import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PROJECT_ID = 'ckx7m9a0b0004w3e7r1t9y5u2';

async function main() {
    const tese = await prisma.category.upsert({
        where: { slug: 'teses' },
        update: { projectId: PROJECT_ID },
        create: {
            title: 'Teses',
            slug: 'teses',
            projectId: PROJECT_ID,
            isVisible: true,
            type: 'Postagens',
            viewType: 'grid'
        }
    });
    console.log("Created/Updated Tese category:", tese.id);

    const dissertacao = await prisma.category.upsert({
        where: { slug: 'dissertacoes' },
        update: { projectId: PROJECT_ID },
        create: {
            title: 'Dissertações',
            slug: 'dissertacoes',
            projectId: PROJECT_ID,
            isVisible: true,
            type: 'Postagens',
            viewType: 'grid'
        }
    });
    console.log("Created/Updated Dissertação category:", dissertacao.id);
}

main().finally(() => prisma.$disconnect());
