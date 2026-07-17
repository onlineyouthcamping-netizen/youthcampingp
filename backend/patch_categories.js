const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const defaultCategories = [
    'Trip Overview', 'Sales Guide', 'Customer FAQs', 'Inclusions & Exclusions', 
    'Ticketing Info', 'Visa & Entry', 'Destination Guide', 'Packing Guide', 
    'SOPs & Processes', 'Emergency Center', 'Pricing & Policy', 'Past Learnings'
  ];

  const workspaces = await prisma.travelDeskWorkspace.findMany({ include: { categories: true } });
  let added = 0;
  for (const ws of workspaces) {
    const existingNames = ws.categories.map(c => c.name);
    for (const [i, cat] of defaultCategories.entries()) {
      if (!existingNames.includes(cat) && cat !== 'Ticketing Information') { // handle rename
        await prisma.travelDeskCategory.create({
          data: {
            workspaceId: ws.id,
            name: cat,
            slug: cat.toLowerCase().replace(/\s+/g, '-'),
            sortOrder: i,
            isRequired: true,
            isActive: true
          }
        });
        added++;
      }
    }
  }
  console.log(`Added ${added} missing categories across ${workspaces.length} workspaces.`);
  process.exit(0);
}
run();
