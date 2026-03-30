import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const cats = await prisma.category.findMany({
        select: { id: true, title: true, projectId: true }
    });
    console.log(JSON.stringify(cats, null, 2));
}

main().finally(() => prisma.$disconnect());
