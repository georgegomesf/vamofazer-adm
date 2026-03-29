import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const DATABASE_URL = process.env.DATABASE_URL
const PROJECT_ID = "ckx7m9a0b0004w3e7r1t9y5u2"

if (!DATABASE_URL) {
  console.error("DATABASE_URL not found in .env")
  process.exit(1)
}

function createPrismaClient() {
  const pool = new Pool({ connectionString: DATABASE_URL, max: 20 })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const prisma = createPrismaClient()

async function main() {
  console.log("Starting Optimized Import for project:", PROJECT_ID)

  // 1. Ensure categories exist for THIS project
  const categoriesData = [
    { title: "Revistas", slugId: "revistas", type: "Biblioteca", dominantType: "JOURNAL", dateFormat: "DEFAULT" },
    { title: "Edições", slugId: "edicoes", type: "Biblioteca", dominantType: "ISSUE", dateFormat: "DEFAULT" },
    { title: "Artigos", slugId: "artigos", type: "Biblioteca", dominantType: "ARTICLE", dateFormat: "DEFAULT" }
  ]

  const categories: Record<string, string> = {}

  for (const cat of categoriesData) {
    let category = await prisma.category.findFirst({
      where: { title: cat.title, projectId: PROJECT_ID }
    })

    if (category) {
      categories[cat.title] = category.id
      console.log(`Category ${cat.title} already exists:`, category.id)
    } else {
      let slug = cat.slugId
      const slugExists = await prisma.category.findUnique({ where: { slug } })
      if (slugExists) slug = `${cat.slugId}-${PROJECT_ID.substring(0, 5)}`

      category = await prisma.category.create({
        data: {
          title: cat.title,
          slug: slug,
          type: cat.type,
          dominantType: cat.dominantType,
          dateFormat: cat.dateFormat,
          projectId: PROJECT_ID
        }
      })
      categories[cat.title] = category.id
      console.log(`Category ${cat.title} created:`, category.id)
    }
  }

  const BATCH_SIZE = 50

  // 2. Import Journals
  console.log("Processing Journals...")
  const journals = await prisma.journal.findMany()
  for (let i = 0; i < journals.length; i += BATCH_SIZE) {
    const batch = journals.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(async (journal) => {
      const existing = await prisma.postJournal.findFirst({
        where: { journalId: journal.id, post: { projectId: PROJECT_ID } }
      })
      if (!existing) {
        await prisma.post.create({
          data: {
            title: journal.title,
            slug: `revista-${journal.id}`,
            content: journal.description || `Revista: ${journal.title}`,
            projectId: PROJECT_ID,
            publishedAt: journal.createdAt,
            categories: { create: { categoryId: categories["Revistas"] } },
            postJournals: { create: { journalId: journal.id } }
          }
        })
      }
    }))
    console.log(`Processing Journals: ${i + batch.length}/${journals.length}`)
  }

  // 3. Import Issues
  console.log("Processing Issues...")
  const issues = await prisma.issue.findMany({ 
    include: { journal: { select: { title: true } } } 
  })
  for (let i = 0; i < issues.length; i += BATCH_SIZE) {
    const batch = issues.slice(i, i + BATCH_SIZE)
    await Promise.all(batch.map(async (issue) => {
      const existing = await prisma.postIssue.findFirst({
        where: { issueId: issue.id, post: { projectId: PROJECT_ID } }
      })
      if (!existing) {
        await prisma.post.create({
          data: {
            title: issue.title,
            slug: `edicao-${issue.id}`,
            content: issue.description || `Edição: ${issue.title} - ${issue.journal.title}`,
            imageUrl: issue.coverUrl,
            projectId: PROJECT_ID,
            publishedAt: issue.datePublished || issue.createdAt,
            categories: { create: { categoryId: categories["Edições"] } },
            postIssues: { create: { issueId: issue.id } }
          }
        })
      }
    }))
    console.log(`Processing Issues: ${i + batch.length}/${issues.length}`)
  }

  // 4. Import Articles
  console.log("Processing Articles...")
  const totalArticles = await prisma.article.count()
  console.log(`Total Articles to process: ${totalArticles}`)
  
  // Articles are too many, fetch in chunks
  for (let i = 0; i < totalArticles; i += BATCH_SIZE * 5) {
    const articles = await prisma.article.findMany({
      skip: i,
      take: BATCH_SIZE * 5,
      include: { issue: { include: { journal: { select: { title: true } } } } }
    })
    
    for (let j = 0; j < articles.length; j += BATCH_SIZE) {
      const batch = articles.slice(j, j + BATCH_SIZE)
      await Promise.all(batch.map(async (article) => {
        const existing = await prisma.postArticle.findFirst({
          where: { articleId: article.id, post: { projectId: PROJECT_ID } }
        })
        if (!existing) {
          const content = `**Referência:**\n\n${article.authors}. "${article.title}". *${article.issue.journal.title}*, v. ${article.issue.volume}, n. ${article.issue.number}, p. ${article.pages}, ${article.issue.year}.\n\n` +
            (article.doi ? `**DOI:** [${article.doi}](https://doi.org/${article.doi})\n\n` : '') +
            (article.abstract ? `**Resumo:**\n\n${article.abstract}\n\n` : '') +
            (article.keywords ? `**Palavras-chave:** ${article.keywords}\n\n` : '') +
            (article.bibliography ? `**Referências:**\n\n${article.bibliography}` : '')

          await prisma.post.create({
            data: {
              title: article.title,
              slug: `artigo-${article.id}`,
              summary: article.abstract ? (article.abstract.substring(0, 200) + "...") : null,
              content: content,
              projectId: PROJECT_ID,
              authorName: article.authors,
              publishedAt: article.datePublished || article.createdAt,
              categories: { create: { categoryId: categories["Artigos"] } },
              postArticles: { create: { articleId: article.id } }
            }
          })
        }
      }))
      console.log(`Processed Articles: ${i + j + batch.length}/${totalArticles}`)
    }
  }

  console.log("Finished optimized import successfully.")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
