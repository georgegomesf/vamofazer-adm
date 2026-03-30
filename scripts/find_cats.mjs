import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const catsForProject = await prisma.category.findMany({
        where: { projectId: 'ckx7m9a0b0004w3e7r1t9y5u2' },
        select: { id: true, title: true }
    });
    console.log(JSON.stringify(catsForProject, null, 2));
}

main().finally(() => prisma.$disconnect());
