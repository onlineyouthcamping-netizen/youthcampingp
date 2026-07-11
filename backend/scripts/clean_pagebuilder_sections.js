
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanPageBuilder() {
  try {
    const pages = await prisma.pageBuilder.findMany();
    
    for (const page of pages) {
      console.log(`Processing page: ${page.name}`);
      let sections = page.sections || [];
      let draft = page.draft || [];
      
      const cleanSections = (sectionArray) => {
        if (!Array.isArray(sectionArray)) return sectionArray;
        
        // 1. Convert all 'testimonials' to 'reviews'
        let updated = sectionArray.map(s => {
          if (s.type === 'testimonials') {
            return { ...s, type: 'reviews' };
          }
          return s;
        });
        
        // 2. Deduplicate consecutive or multiple reviews sections if they are identical in type
        // Actually, let's just keep the FIRST 'reviews' section and remove subsequent ones 
        // IF they are adjacent or if there are multiple.
        // Usually, a page shouldn't have two master review sections unless intentional.
        // Given the user's screenshot, it's definitely an error of duplication.
        
        let final = [];
        let hasReviews = false;
        
        for (const s of updated) {
          if (s.type === 'reviews') {
            if (!hasReviews) {
              final.push(s);
              hasReviews = true;
            } else {
              console.log(`  Removing duplicate reviews section in ${page.name}`);
            }
          } else {
            final.push(s);
          }
        }
        return final;
      };

      const newSections = cleanSections(sections);
      const newDraft = cleanSections(draft);

      await prisma.pageBuilder.update({
        where: { id: page.id },
        data: {
          sections: newSections,
          draft: newDraft
        }
      });
      console.log(`  Done cleaning ${page.name}`);
    }
  } catch (error) {
    console.error("Error cleaning PageBuilder:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanPageBuilder();
