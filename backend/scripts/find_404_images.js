const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Searching database for res.cloudinary.com URLs...");

  // 1. Trips
  const trips = await prisma.trip.findMany();
  trips.forEach(trip => {
    if (trip.images && Array.isArray(trip.images)) {
      trip.images.forEach((img, i) => {
        if (img && img.includes('res.cloudinary.com')) {
          console.log(`[TRIP IMAGE] Trip: "${trip.title}" (Slug: ${trip.slug}) index ${i} has URL: ${img}`);
        }
      });
    }
    if (trip.heroImage && trip.heroImage.includes('res.cloudinary.com')) {
      console.log(`[TRIP HERO] Trip: "${trip.title}" has URL: ${trip.heroImage}`);
    }
    if (trip.itinerary && Array.isArray(trip.itinerary)) {
      trip.itinerary.forEach((day, d) => {
        if (day.description && day.description.includes('res.cloudinary.com')) {
          console.log(`[TRIP ITINERARY DESC] Trip: "${trip.title}" Day ${day.day} has URL in desc`);
        }
        if (day.photos && Array.isArray(day.photos)) {
          day.photos.forEach((photo, p) => {
            if (photo && photo.includes('res.cloudinary.com')) {
              console.log(`[TRIP ITINERARY PHOTO] Trip: "${trip.title}" Day ${day.day} photo ${p} has URL: ${photo}`);
            }
          });
        }
      });
    }
  });

  // 2. Blogs
  const blogs = await prisma.blog.findMany();
  blogs.forEach(blog => {
    if (blog.image && blog.image.includes('res.cloudinary.com')) {
      console.log(`[BLOG IMAGE] Blog: "${blog.title}" (Slug: ${blog.slug}) has URL: ${blog.image}`);
    }
    if (blog.authorImage && blog.authorImage.includes('res.cloudinary.com')) {
      console.log(`[BLOG AUTHOR] Blog: "${blog.title}" has URL: ${blog.authorImage}`);
    }
  });

  // 3. Reviews
  const reviews = await prisma.review.findMany();
  reviews.forEach(review => {
    if (review.userImage && review.userImage.includes('res.cloudinary.com')) {
      console.log(`[REVIEW IMAGE] Review by: "${review.name}" has URL: ${review.userImage}`);
    }
  });

  // 4. Settings
  const settings = await prisma.settings.findMany();
  settings.forEach(setting => {
    const str = JSON.stringify(setting);
    if (str.includes('res.cloudinary.com')) {
      console.log(`[SETTINGS] Setting ID: ${setting.id} has reference to res.cloudinary.com`);
      // Print keys containing it
      Object.keys(setting).forEach(key => {
        const val = setting[key];
        if (typeof val === 'string' && val.includes('res.cloudinary.com')) {
          console.log(`  - Key "${key}": ${val}`);
        } else if (val && typeof val === 'object') {
          const innerStr = JSON.stringify(val);
          if (innerStr.includes('res.cloudinary.com')) {
            console.log(`  - Key "${key}" (object): ${innerStr.substring(0, 150)}...`);
          }
        }
      });
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
