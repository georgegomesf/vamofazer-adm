import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const theses = await prisma.thesis.findMany({
        take: 5,
        select: { datePublished: true, year: true, title: true }
    });
    console.log(JSON.stringify(theses, null, 2));
}

main().finally(() => prisma.$disconnect());
