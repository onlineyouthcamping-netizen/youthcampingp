const { prisma } = require('../backend/src/lib/prisma');

async function audit() {
  console.log('--- DB DOMAINS AUDIT START ---');
  
  // 1. Audit PageBuilder
  console.log('\nChecking PageBuilder table...');
  const pages = await prisma.pageBuilder.findMany();
  for (const page of pages) {
    const str = JSON.stringify(page);
    if (str.includes('vercel.app') || str.includes('localhost') || str.includes('onrender.com')) {
      console.log(`⚠️ Found match in PageBuilder: "${page.name}"`);
      // Find matches in sections/draft
      const matchRegex = /(https?:\/\/[^\s"',]+)/g;
      const matches = str.match(matchRegex) || [];
      const badMatches = matches.filter(m => m.includes('vercel.app') || m.includes('localhost') || m.includes('onrender.com'));
      console.log('  URLs:', [...new Set(badMatches)]);
    }
  }
  
  // 2. Audit Settings
  console.log('\nChecking Setting table...');
  const settings = await prisma.setting.findMany();
  for (const setting of settings) {
    const str = JSON.stringify(setting);
    if (str.includes('vercel.app') || str.includes('localhost') || str.includes('onrender.com')) {
      console.log(`⚠️ Found match in Setting key: "${setting.key}"`);
      const matchRegex = /(https?:\/\/[^\s"',]+)/g;
      const matches = str.match(matchRegex) || [];
      const badMatches = matches.filter(m => m.includes('vercel.app') || m.includes('localhost') || m.includes('onrender.com'));
      console.log('  URLs:', [...new Set(badMatches)]);
    }
  }

  // 3. Audit Theme
  console.log('\nChecking Theme table...');
  const themes = await prisma.theme.findMany();
  for (const theme of themes) {
    const str = JSON.stringify(theme);
    if (str.includes('vercel.app') || str.includes('localhost') || str.includes('onrender.com')) {
      console.log(`⚠️ Found match in Theme name: "${theme.name}"`);
    }
  }

  // 4. Audit Trip
  console.log('\nChecking Trip table...');
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    const str = JSON.stringify(trip);
    if (str.includes('vercel.app') || str.includes('localhost') || str.includes('onrender.com')) {
      console.log(`⚠️ Found match in Trip title: "${trip.title}" (${trip.id})`);
      const matchRegex = /(https?:\/\/[^\s"',]+)/g;
      const matches = str.match(matchRegex) || [];
      const badMatches = matches.filter(m => m.includes('vercel.app') || m.includes('localhost') || m.includes('onrender.com'));
      console.log('  URLs:', [...new Set(badMatches)]);
    }
  }

  // 5. Audit Quotation
  console.log('\nChecking Quotation table...');
  const quotations = await prisma.quotation.findMany();
  for (const q of quotations) {
    const str = JSON.stringify(q);
    if (str.includes('vercel.app') || str.includes('localhost') || str.includes('onrender.com')) {
      console.log(`⚠️ Found match in Quotation: "${q.title}" for client "${q.clientName}" (${q.id})`);
      const matchRegex = /(https?:\/\/[^\s"',]+)/g;
      const matches = str.match(matchRegex) || [];
      const badMatches = matches.filter(m => m.includes('vercel.app') || m.includes('localhost') || m.includes('onrender.com'));
      console.log('  URLs:', [...new Set(badMatches)]);
    }
  }

  console.log('\n--- DB DOMAINS AUDIT END ---');
}

audit().catch(console.error).finally(() => prisma.$disconnect());
