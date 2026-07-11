const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Comprehensive Testimonials to Reviews migration...");
  
  let count = 0;
  let skipped = 0;

  // 1. Migrate from PageBuilder (sections and draft)
  const pages = await prisma.pageBuilder.findMany();
  for (const page of pages) {
    const sectionFields = ['sections', 'draft'];
    
    for (const field of sectionFields) {
      const sections = typeof page[field] === 'string' ? JSON.parse(page[field]) : page[field];
      if (!sections || !Array.isArray(sections)) continue;

      for (const section of sections) {
        if (section.type === 'testimonials' || section.type === 'reviews') {
          // In PageBuilderPage.tsx, data is stored in 'draft' key INSIDE the section object for the draft field
          // or in 'data' key for the sections field.
          const data = section.draft || section.data || {};
          const items = data.items || data.testimonials || [];
          
          if (items.length > 0) {
            console.log(`Found ${items.length} items in "${field}" -> section "${section.type}" on page "${page.name}"`);
          }

          for (const item of items) {
            const userName = item.author || item.authorName || item.userName || "Happy Traveler";
            const comment = item.quote || item.comment || "";
            
            if (!comment || comment.length < 5) {
              skipped++;
              continue;
            }

            const existing = await prisma.review.findFirst({
              where: { userName, comment, tenantId: page.tenantId || "default" }
            });

            if (existing) {
              skipped++;
              continue;
            }

            await prisma.review.create({
              data: {
                userName,
                comment,
                tripName: item.location || item.tripName,
                city: item.city,
                instagram: item.instagramId || item.instagram,
                userImage: item.image || item.travelerPhoto || item.userImage,
                photos: item.locationImages || [],
                rating: item.rating || 5,
                isFeatured: true,
                isActive: true,
                tenantId: page.tenantId || "default"
              }
            });
            count++;
            console.log(`✅ Migrated from PageBuilder: ${userName}`);
          }
        }
      }
    }
  }

  // 2. Migrate from Trip reviews field
  const trips = await prisma.trip.findMany();
  for (const trip of trips) {
    if (!trip.tripReviews) continue;
    
    const reviews = typeof trip.tripReviews === 'string' ? JSON.parse(trip.tripReviews) : trip.tripReviews;
    if (!Array.isArray(reviews)) continue;

    for (const rev of reviews) {
      const userName = rev.userName || rev.author || "Traveler";
      const comment = rev.comment || rev.quote || "";
      
      if (!comment || comment.length < 5) continue;

      const existing = await prisma.review.findFirst({
        where: { userName, comment, tenantId: trip.tenantId || "default" }
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.review.create({
        data: {
          userName,
          comment,
          tripName: trip.title,
          tripId: trip.id,
          city: rev.city,
          instagram: rev.instagram || rev.instagramId,
          userImage: rev.userImage || rev.image,
          photos: rev.photos || rev.locationImages || [],
          rating: rev.rating || 5,
          isFeatured: true,
          isActive: true,
          tenantId: trip.tenantId || "default"
        }
      });
      count++;
      console.log(`✅ Migrated from Trip "${trip.title}": ${userName}`);
    }
  }

  console.log("\n-------------------------------------------");
  console.log(`🎉 Migration complete!`);
  console.log(`✅ Total Migrated: ${count}`);
  console.log(`⏭️ Total Skipped: ${skipped}`);
  console.log("-------------------------------------------\n");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
