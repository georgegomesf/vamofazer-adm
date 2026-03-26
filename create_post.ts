import { PrismaClient } from '@prisma/client';
import { put } from '@vercel/blob';
import fs from 'fs';

const prisma = new PrismaClient();

const sourceUrl = "https://encontro.anpof.org.br/prorrogado-o-prazo-para-submissao-de-trabalhos-com-desconto-no-xxi-encontro-anpof/";

async function main() {
    const data = JSON.parse(fs.readFileSync('/tmp/anpof_parsed.json', 'utf8'));
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || process.env.PROJECT_ID;

    if (!projectId) {
        throw new Error("NEXT_PUBLIC_PROJECT_ID not found in env");
    }

    // Download image
    console.log("Downloading image...");
    let blobUrl = null;
    if (data.image_url) {
        try {
            const response = await fetch(data.image_url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const ext = data.image_url.split('.').pop() || 'png';
            const filename = `anpof-event-${Date.now()}.${ext}`;
            
            console.log("Uploading to Vercel Blob...");
            const blob = await put(filename, buffer, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN
            });
            blobUrl = blob.url;
            console.log("Uploaded to", blobUrl);
        } catch (e) {
            console.error("Failed to upload image:", e.message);
        }
    }

    // Find or create category
    let categoryTitle = "Anpof - Novidades";
    let categorySlug = "anpof-novidades";
    
    let category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
        category = await prisma.category.create({
            data: {
                title: categoryTitle,
                slug: categorySlug,
                projectId
            }
        });
    }

    // Find or create tag
    let tagTitle = "Anpof";
    let tagSlug = "anpof";
    let tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
    if (!tag) {
        tag = await prisma.tag.create({
            data: {
                title: tagTitle,
                slug: tagSlug,
                projectId
            }
        });
    }

    const uniqueSuffix = Date.now().toString(36);
    const slugBase = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${uniqueSuffix}`;

    const content = data.content + `\n\n**Fonte:** [Anpof](${sourceUrl})`;

    console.log("Creating Post...");
    const post = await prisma.post.create({
        data: {
            title: data.title,
            slug: slug,
            content: content,
            imageUrl: blobUrl,
            projectId: projectId,
            publishedAt: null, // Draft
            categories: {
                create: {
                    category: { connect: { id: category.id } }
                }
            },
            tags: {
                create: {
                    tag: { connect: { id: tag.id } }
                }
            }
        }
    });

    console.log("Creating Attachment...");
    // Attachment link (Type: Site)
    const attachment = await prisma.attachment.create({
        data: {
            title: "Fonte Original: " + data.title.substring(0, 50),
            url: sourceUrl,
            type: "Site",
            projectId: projectId,
            posts: {
                create: {
                    post: { connect: { id: post.id } }
                }
            }
        }
    });

    console.log("Operations completed successfully.");
    console.log("Post ID:", post.id);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
