const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Get workspace for MKA-1
    const workspace = await prisma.travelDeskWorkspace.findFirst({
      where: { tripId: 'MKA-1' }
    });
    if (!workspace) {
      console.error('Workspace for MKA-1 not found');
      return;
    }

    // 2. Find category "customer-faqs"
    const category = await prisma.travelDeskCategory.findFirst({
      where: {
        workspaceId: workspace.id,
        slug: 'customer-faqs'
      }
    });
    if (!category) {
      console.error('Category customer-faqs not found');
      return;
    }

    // 3. Create or update the FAQ article
    const title = "What Will Be the Group Size for This Himachal Tour?";
    const content = "We like to keep our groups small, with just 40 to 50 people. This way, everyone can get to know each other better and work together more easily. Smaller groups make it easier to coordinate the trip and have a more collaborative experience. It's simpler to bond with everyone when there aren't too many people around.";
    
    // Check if it already exists
    const existing = await prisma.travelDeskArticle.findFirst({
      where: {
        categoryId: category.id,
        title: title
      }
    });

    if (existing) {
      const updated = await prisma.travelDeskArticle.update({
        where: { id: existing.id },
        data: {
          content: content,
          status: 'PUBLISHED',
          visibility: 'PUBLIC'
        }
      });
      console.log('Updated existing FAQ:', updated.id);
    } else {
      const created = await prisma.travelDeskArticle.create({
        data: {
          workspaceId: workspace.id,
          categoryId: category.id,
          title: title,
          content: content,
          status: 'PUBLISHED',
          visibility: 'PUBLIC',
          version: 1
        }
      });
      console.log('Created new FAQ:', created.id);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
