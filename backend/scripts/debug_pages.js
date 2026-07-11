const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const pages = await prisma.pageBuilder.findMany();
  for (const page of pages) {
    console.log(`Page: ${page.name}`);
    const draft = typeof page.draft === 'string' ? JSON.parse(page.draft) : page.draft;
    if (draft) {
      console.log(`  Draft Sections: ${draft.length}`);
      draft.forEach(s => {
        if (s.type === 'testimonials' || s.type === 'reviews') {
          console.log(`    Section Type: ${s.type}`);
          console.log(`    Draft Keys:`, Object.keys(s.draft || {}));
          if (s.draft?.items) console.log(`    Items:`, s.draft.items.length);
          if (s.draft?.testimonials) console.log(`    Testimonials:`, s.draft.testimonials.length);
        }
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
