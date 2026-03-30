import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const count = await prisma.post.count({
        where: { projectId: 'ckx7m9a0b0004w3e7r1t9y5u2' }
    });
    console.log("Post count for Project ckx7m9a0b0004w3e7r1t9y5u2:", count);
}

main().finally(() => prisma.$disconnect());
