const { prisma } = require("../lib/prisma");

async function fixAllMediaAssets() {
  console.log("📸 Repairing broken Cloudinary image links in Blogs and Reviews...");

  // 1. Fix Blogs
  const blogs = await prisma.blog.findMany();
  for (const b of blogs) {
    let img = b.image;
    let authorImg = b.authorImage;

    if (b.title.includes("Kasol")) {
      img = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200";
      authorImg = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300";
    } else if (b.title.includes("Spiti")) {
      img = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200";
      authorImg = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300";
    } else if (b.title.includes("Zanskar") || b.title.includes("Chadar")) {
      img = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200";
      authorImg = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300";
    }

    await prisma.blog.update({
      where: { id: b.id },
      data: {
        image: img,
        authorImage: authorImg || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
      },
    });
  }
  console.log(`✅ Cleaned up ${blogs.length} blogs.`);

  // 2. Fix Reviews
  const reviews = await prisma.review.findMany();
  for (const r of reviews) {
    const validPhotos = [];

    if (r.userName.includes("Bhumit")) {
      validPhotos.push(
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200",
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200"
      );
    } else if (r.userName.includes("Priya")) {
      validPhotos.push(
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200"
      );
    } else if (r.userName.includes("Janak")) {
      validPhotos.push(
        "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=1200",
        "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200",
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200"
      );
    } else {
      validPhotos.push(
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200"
      );
    }

    await prisma.review.update({
      where: { id: r.id },
      data: {
        photos: validPhotos,
        userImage:
          r.userImage ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
        isActive: true,
      },
    });
  }
  console.log(`✅ Cleaned up ${reviews.length} reviews.`);

  console.log("✨ All media assets repaired!");
}

fixAllMediaAssets()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
