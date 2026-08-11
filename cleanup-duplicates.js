const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('Cleaning up duplicate clients...');
  const clients = await prisma.client.findMany();
  console.log('Total clients found:', clients.length);

  const seen = new Set();
  let duplicates = 0;

  for (const client of clients) {
    // Determine uniqueness by name and email (if present)
    const key = `${client.name}-${client.email || ''}-${client.phone || ''}`;
    
    if (seen.has(key)) {
      // Duplicate, delete it
      await prisma.client.delete({ where: { id: client.id } });
      duplicates++;
    } else {
      seen.add(key);
    }
  }

  console.log(`Deleted ${duplicates} duplicate clients.`);

  // Let's also check Filings just in case
  const filings = await prisma.filing.findMany();
  console.log('Total filings found:', filings.length);
  const seenFilings = new Set();
  let duplicateFilings = 0;

  for (const f of filings) {
    const key = `${f.title}-${f.clientId}-${f.court}`; // some proxy for uniqueness
    if (seenFilings.has(key)) {
      await prisma.filing.delete({ where: { id: f.id } });
      duplicateFilings++;
    } else {
      seenFilings.add(key);
    }
  }
  console.log(`Deleted ${duplicateFilings} duplicate filings.`);

}

clean().catch(console.error).finally(() => prisma.$disconnect());
