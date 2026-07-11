const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('Fetching active trips...');
  const trips = await prisma.trip.findMany({
    select: { id: true, title: true }
  });
  const tripIds = trips.map(t => t.id);
  console.log('Active Trip IDs:', tripIds);

  const page = await prisma.pageBuilder.findUnique({
    where: { name: 'home' }
  });

  if (!page) {
    console.log('Home page builder not found!');
    return;
  }

  console.log('Updating page sections and draft...');
  
  // Fix sections
  let sections = [];
  if (page.sections) {
    sections = typeof page.sections === 'string' ? JSON.parse(page.sections) : page.sections;
  }
  
  sections = sections.map(section => {
    if (section.type === 'upcoming_trips') {
      if (section.draft) {
        section.draft.tripIds = tripIds;
      }
      if (section.content) {
        section.content.tripIds = tripIds;
      }
    }
    return section;
  });

  // Fix draft
  let draft = [];
  if (page.draft) {
    draft = typeof page.draft === 'string' ? JSON.parse(page.draft) : page.draft;
  }
  
  draft = draft.map(section => {
    if (section.type === 'upcoming_trips') {
      if (section.draft) {
        section.draft.tripIds = tripIds;
      }
      if (section.content) {
        section.content.tripIds = tripIds;
      }
    }
    return section;
  });

  await prisma.pageBuilder.update({
    where: { name: 'home' },
    data: {
      sections: sections,
      draft: draft
    }
  });

  console.log('✅ Home page builder trip IDs successfully updated to active database IDs!');
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
