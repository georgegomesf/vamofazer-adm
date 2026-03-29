import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function cleanupCovers() {
  try {
    console.log('--- Cleaning up invalid cover URLs ---');
    
    // Find count first for logging
    const count = await prisma.issue.count({
      where: {
        coverUrl: {
          contains: 'true'
        }
      }
    });
    
    console.log(`Found ${count} issues with "true" in coverUrl.`);
    
    if (count > 0) {
      const result = await prisma.issue.updateMany({
        where: {
          coverUrl: {
            contains: 'true'
          }
        },
        data: {
          coverUrl: null
        }
      });
      console.log(`Successfully updated ${result.count} entries to null.`);
    } else {
      console.log('No records found to update.');
    }
    
  } catch (error: any) {
    console.error('Cleanup failed:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCovers();
