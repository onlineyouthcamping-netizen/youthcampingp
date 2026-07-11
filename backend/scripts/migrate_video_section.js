const { prisma } = require('./src/lib/prisma');

async function migrate() {
  const page = await prisma.pageBuilder.findFirst({ where: { slug: 'home' } });
  if (page) {
    const updatedSections = page.draft.map(s => {
      if (s.type === 'video_section') {
        return {
          ...s,
          draft: {
            ...s.draft,
            title: 'Videos',
            subtitle: 'Exclusive footage from our expeditions',
            videos: [
              { title: 'Spiti Valley - A Cinematic Journey', id: 'j6hb-iOZalE' },
              { title: 'Winter Spiti in 4K', id: '8XJ9kU4WJTo' },
              { title: 'What to Carry for Spiti Expedition', id: 'X2X5nC5yC6w' }
            ]
          }
        };
      }
      return s;
    });
    
    await prisma.pageBuilder.update({
      where: { id: page.id },
      data: { draft: updatedSections }
    });
    console.log("Migrated video_section data");
  }
  await prisma.$disconnect();
}

migrate();
