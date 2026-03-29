import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { put } from '@vercel/blob';

const COVERS_DIR = '/hd2/george/Projetos/RedeFilosofica/data/capas';
const CONCURRENCY = 5;

async function uploadFiles() {
  try {
    console.log('--- Starting Covers Upload to Vercel Blob ---');
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('BLOB_READ_WRITE_TOKEN is missing in environment.');
    }

    const files = fs.readdirSync(COVERS_DIR);
    console.log(`Found ${files.length} files to upload.`);

    let completed = 0;
    const results: any[] = [];
    
    // Process in batches
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY);
      
      const uploadBatch = batch.map(async (fileName) => {
        const filePath = path.join(COVERS_DIR, fileName);
        const fileContent = fs.readFileSync(filePath);
        
        try {
          const blob = await put(`capas/${fileName}`, fileContent, {
            access: 'public',
            addRandomSuffix: false, // Maintain IDs if possible for mapping
          });
          
          completed++;
          if (completed % 50 === 0) console.log(`Uploaded ${completed}/${files.length} covers...`);
          return { fileName, url: blob.url, success: true };
        } catch (err: any) {
          console.error(`Failed to upload ${fileName}:`, err.message);
          return { fileName, success: false, error: err.message };
        }
      });

      const batchResults = await Promise.all(uploadBatch);
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`--- Upload Complete ---`);
    console.log(`Successfully uploaded: ${successCount}/${files.length}`);
    
    // Save mapping for future use (important to link to issues later!)
    const mappingPath = path.join(process.cwd(), 'scripts/covers_mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(results, null, 2));
    console.log(`Mapping saved to ${mappingPath}`);
    
  } catch (error: any) {
    console.error('Upload failed:', error.message || error);
  }
}

uploadFiles();
