import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { prisma } from '../src/lib/prisma';

const PROJECT_ROOT = '/hd2/george/Projetos/RedeFilosofica/redefilosofica-adm';
const CAPAS_CSV = '/hd2/george/Projetos/RedeFilosofica/data/datafilo_producoes_capas_1-2026-03-28_71129.csv';
const MAPPING_JSON = path.join(PROJECT_ROOT, 'scripts/covers_mapping.json');

async function syncCovers() {
  try {
    console.log('--- Syncing Issue Covers with Vercel Blob URLs ---');

    // 1. Load Blob Mapping (filename -> URL)
    if (!fs.existsSync(MAPPING_JSON)) {
      throw new Error('Mapping file covers_mapping.json not found. Run upload_covers.ts first.');
    }
    const mappingRaw = JSON.parse(fs.readFileSync(MAPPING_JSON, 'utf8'));
    const blobMap = new Map<string, string>();
    for (const item of mappingRaw) {
      if (item.success) {
        blobMap.set(item.fileName, item.url);
      }
    }
    console.log(`Loaded ${blobMap.size} blob mappings.`);

    // 2. Load Covers Source CSV (Issue ID -> filename)
    const coversFile = fs.readFileSync(CAPAS_CSV, 'utf8');
    const coversData = parse(coversFile, { columns: true, skip_empty_lines: true });
    console.log(`Found ${coversData.length} entries in covers CSV.`);

    // 3. Update Database
    let updated = 0;
    let skipped = 0;
    
    // Batch updates to avoid overwhelming the DB
    const BATCH_SIZE = 100;
    for (let i = 0; i < coversData.length; i += BATCH_SIZE) {
      const batch = coversData.slice(i, i + BATCH_SIZE);
      
      const updatePromises = batch.map(async (row: any) => {
        const issueId = row.edicoes_id;
        const fileName = row.arquivo;
        const blobUrl = blobMap.get(fileName);

        if (blobUrl) {
          try {
            await prisma.issue.update({
              where: { id: issueId },
              data: { coverUrl: blobUrl },
            });
            return true;
          } catch (err: any) {
            // Likely issueId doesn't exist in current DB yet
            return false;
          }
        }
        return false;
      });

      const results = await Promise.all(updatePromises);
      updated += results.filter(r => r).length;
      skipped += results.filter(r => !r).length;

      if (i % 1000 === 0 && i > 0) {
        console.log(`Processed ${i} rows... (${updated} updated, ${skipped} skipped)`);
      }
    }

    console.log(`--- Sync Complete ---`);
    console.log(`Total rows processed: ${coversData.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Skipped (not found in mapping or DB): ${skipped}`);

  } catch (error: any) {
    console.error('Sync failed:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

syncCovers();
