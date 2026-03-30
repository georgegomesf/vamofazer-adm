const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

/**
 * Slugify function matching the project's logic
 */
function slugify(text) {
  if (!text) return 'post'
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

async function main() {
  // Increased pool size for batch processing
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 20 
  })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  const projectId = "ckx7m9a0b0004w3e7r1t9y5u2"

  console.log(`Starting optimized slug upgrade for project: ${projectId}`)

  try {
    const posts = await prisma.post.findMany({
      where: { projectId: projectId },
      select: { id: true, title: true, slug: true }
    })

    const totalPosts = posts.length
    console.log(`Found ${totalPosts} posts.`)

    let updatedCount = 0
    const batchSize = 25 // Reasonable batch size for parallel updates
    
    for (let i = 0; i < totalPosts; i += batchSize) {
      const batch = posts.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (post) => {
        const baseSlug = slugify(post.title)
        // Add ID suffix to ensure uniqueness as requested
        const uniqueSuffix = post.id.slice(-6)
        const newSlug = `${baseSlug}-${uniqueSuffix}`
        
        // Skip if already updated or slug hasn't changed
        if (post.slug === newSlug) return

        const oldSlug = post.slug;

        try {
          // 1. Update Post Slug
          await prisma.post.update({
            where: { id: post.id },
            data: { slug: newSlug }
          })
          
          // 2. Update references in Activity feed to keep links working
          const oldUrl = `/p/${oldSlug}`
          const newUrl = `/p/${newSlug}`
          
          await prisma.activity.updateMany({
            where: { projectId, url: oldUrl },
            data: { url: newUrl }
          })

          // 3. Update hardcoded Menu Items
          await prisma.menuItem.updateMany({
            where: { url: oldUrl },
            data: { url: newUrl }
          })

          updatedCount++
        } catch (updateError) {
          // Log errors but keep processing others
          console.error(`\n  [Error] Post ${post.id}: ${updateError.message.substring(0, 100)}`)
        }
      }))
      
      // Update progress in the same line
      if (i % 100 === 0 || i + batchSize >= totalPosts) {
        process.stdout.write(`\rProgress: ${Math.min(i + batchSize, totalPosts)} / ${totalPosts} posts processed. Updates: ${updatedCount}   `)
      }
    }

    console.log(`\n\nUpgrade completed successfully!`)
    console.log(`Total posts checked: ${totalPosts}`)
    console.log(`Total slugs updated: ${updatedCount}`)
    
  } catch (err) {
    console.error("\nMigration failed:", err)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
