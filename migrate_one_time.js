const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  const projectId = "ckx7m9a0b0004w3e7r1t9y5u2"

  console.log(`Starting link update for project: ${projectId}`)

  try {
    const posts = await prisma.post.findMany({
      where: {
        projectId: projectId,
        postArticles: {
          some: {}
        }
      },
      include: {
        postArticles: {
          include: {
            article: {
              include: {
                issue: {
                  include: {
                    journal: true
                  }
                }
              }
            }
          }
        },
        postIssues: true,
        postJournals: true
      }
    })

    console.log(`Found ${posts.length} posts with articles.`)

    let issueLinksCreated = 0
    let journalLinksCreated = 0

    for (const post of posts) {
      for (const pa of post.postArticles) {
        const article = pa.article
        if (!article) continue
        const issue = article.issue
        if (!issue) continue
        const journal = issue.journal
        if (!journal) continue

        // Link to Issue
        const existingIssueLink = post.postIssues.find(pi => pi.issueId === issue.id)
        if (!existingIssueLink) {
          console.log(`Post: ${post.title} -> Linking to Issue: ${issue.title}`)
          try {
            await prisma.postIssue.create({
              data: {
                postId: post.id,
                issueId: issue.id
              }
            })
            issueLinksCreated++
          } catch (err) {
            console.log(`  Failed to link issue ${issue.id} to post ${post.id}: ${err.message}`)
          }
        }

        // Link to Journal
        const existingJournalLink = post.postJournals.find(pj => pj.journalId === journal.id)
        if (!existingJournalLink) {
          console.log(`Post: ${post.title} -> Linking to Journal: ${journal.title}`)
          try {
            await prisma.postJournal.create({
              data: {
                postId: post.id,
                journalId: journal.id
              }
            })
            journalLinksCreated++
          } catch (err) {
            console.log(`  Failed to link journal ${journal.id} to post ${post.id}: ${err.message}`)
          }
        }
      }
    }

    console.log(`Done! Created ${issueLinksCreated} issue links and ${journalLinksCreated} journal links.`)
  } catch (err) {
    console.error("Migration failed:", err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
