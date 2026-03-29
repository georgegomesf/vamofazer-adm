import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { prisma } from '../src/lib/prisma';

const DATA_DIR = '/hd2/george/Projetos/RedeFilosofica/data';

const parseDate = (dateStr: string | null | undefined) => {
  if (!dateStr || dateStr.trim() === '' || dateStr === 'null') return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

async function updateIssueDates() {
  try {
    console.log('--- Updating Issue Publication Dates ---');

    const issuesFile = fs.readFileSync(path.join(DATA_DIR, 'datafilo_edicoes_export_2026-03-28_160720.csv'), 'utf8');
    const issuesDataRaw = parse(issuesFile, { columns: true, skip_empty_lines: true });

    console.log(`Found ${issuesDataRaw.length} issues in CSV.`);

    let count = 0;
    const BATCH_SIZE = 100; // Small batch for individual updates if necessary, or use a more efficient way
    
    // To make it faster, we can filter for issues that actually have a date in CSV
    const issuesWithDate = issuesDataRaw.filter((row: any) => {
        const date = parseDate(row.data_publicacao);
        return date !== null;
    });

    console.log(`${issuesWithDate.length} issues have valid dates in CSV. Updating...`);

    for (const row of issuesWithDate) {
      const datePublished = parseDate(row.data_publicacao);
      
      try {
        await prisma.issue.update({
          where: { id: row.id },
          data: { datePublished },
        });
        count++;
        if (count % 100 === 0) {
          console.log(`Updated ${count} issues...`);
        }
      } catch (err) {
        // Skip if issue doesn't exist in DB
      }
    }

    console.log(`--- Finished! Updated ${count} issues. ---`);
  } catch (error: any) {
    console.error('Update failed:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

updateIssueDates();
