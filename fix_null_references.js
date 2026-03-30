const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

async function main() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10 
  })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  const projectId = "ckx7m9a0b0004w3e7r1t9y5u2"

  console.log(`Starting cleanup of "null" references in Post content for project: ${projectId}`)

  try {
    // We'll process in batches to be safe
    const posts = await prisma.post.findMany({
      where: { 
        projectId: projectId,
        content: { contains: 'null' }
      },
      select: { id: true, content: true }
    })

    console.log(`Found ${posts.length} posts with "null" in content.`)

    let updatedCount = 0
    const batchSize = 50
    
    for (let i = 0; i < posts.length; i += batchSize) {
      const batch = posts.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (post) => {
        let newContent = post.content;
        
        // Patterns to remove
        const patterns = [
          /,\s*[vp]\.\s*null/gi,  // Matches ", v. null" or ", p. null"
          /,\s*n\.\s*null/gi,      // Matches ", n. null"
          /,\s*null(?=\s*\.)/g,    // Matches ", null" before a period (year case)
          /,\s*null(?=,)/g         // Matches ", null" before another comma
        ];

        let modified = false;
        for (const pattern of patterns) {
          if (pattern.test(newContent)) {
            newContent = newContent.replace(pattern, '');
            modified = true;
          }
        }

        if (modified) {
          await prisma.post.update({
            where: { id: post.id },
            data: { content: newContent }
          });
          updatedCount++;
        }
      }));
      
      process.stdout.write(`\rProgress: ${Math.min(i + batchSize, posts.length)} / ${posts.length} checked. Updated: ${updatedCount}`);
    }

    console.log(`\n\nCleanup completed! Total posts updated: ${updatedCount}`);
    
  } catch (err) {
    console.error("\nCleanup failed:", err)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
