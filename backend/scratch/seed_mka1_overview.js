const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId: 'MKA-1' },
      include: { categories: true }
    });
    
    if (!workspace) {
      console.error('Workspace not found for MKA-1');
      return;
    }
    
    const cat = workspace.categories.find(c => c.slug === 'trip-overview');
    if (!cat) {
      console.error('trip-overview category not found');
      return;
    }
    
    const title = 'Northern India Expedition Overview';
    const summary = 'Get ready for an unforgettable journey through Northern India starting with Jalandhar, Amritsar, Kasol, and Manali!';
    const content = '• Train journey from your city to Jalandhar.\n' +
      '• Explore the cultural richness at Wagah Border.\n' +
      '• Visit the serene Golden Temple in Amritsar.\n' +
      '• Relaxing riverside camping in Kasol & explore vibrant Kasol markets.\n' +
      '• Visit Manikaran Gurudwara & trek to Chalal village.\n' +
      '• Bijli Mahadev Trek: Breathtaking views, green meadows & dense forests.\n' +
      '• Manali sightseeing: Hadimba Temple, Jogini Waterfall & Vashisht Hot Springs.\n' +
      '• Solang Valley landscapes & Atal Tunnel traversal.\n' +
      '• Explore Sissu village nestled in Lahaul-Spiti valley.\n' +
      '• Kullu river rafting adventure.\n' +
      '• Conclude with a scenic drive back to Jalandhar.\n\n' +
      'Note: Only people aged 12 to 35 years are allowed to join this trip as it is a complete backpacking itinerary.';

    const existing = await prisma.travelDeskArticle.findFirst({
      where: {
        workspaceId: workspace.id,
        categoryId: cat.id
      }
    });

    let article;
    if (existing) {
      article = await prisma.travelDeskArticle.update({
        where: { id: existing.id },
        data: {
          title,
          summary,
          content,
          tags: 'overview, northern-india, backpack',
          visibility: 'INTERNAL',
          status: 'PUBLISHED'
        }
      });
      console.log('Successfully updated overview article in DB:', article.id);
    } else {
      article = await prisma.travelDeskArticle.create({
        data: {
          workspaceId: workspace.id,
          categoryId: cat.id,
          title,
          summary,
          content,
          tags: 'overview, northern-india, backpack',
          visibility: 'INTERNAL',
          status: 'PUBLISHED'
        }
      });
      console.log('Successfully created new overview article in DB:', article.id);
    }
  } catch (err) {
    console.error('Error seeding database overview:', err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
