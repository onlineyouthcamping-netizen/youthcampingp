const { prisma } = require("../lib/prisma");

const DEFAULT_SEED_REVIEWS = [
  {
    userName: "Kathan Patel",
    city: "Ahmedabad",
    tripName: "Spiti Valley Bike Trip",
    tripType: "Joined Group Trip",
    rating: 5,
    comment:
      "I travelled with YouthCamping Spiti Valley Bike Trip this June first week. My experience was very thrilling with them. The management was super awesome. Marshal Abhinav and Dhruvil sir were extremely supportive throughout!",
    userImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80",
      "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=600&q=80",
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80",
    ],
    isFeatured: true,
    isActive: true,
    tenantId: "default",
  },
  {
    userName: "Bhumit Rabadiya",
    city: "Ahmedabad",
    tripName: "Thailand Explorer Exp",
    tripType: "Joined Group Trip",
    rating: 5,
    comment:
      "Thank you for crafting a trip that perfectly matched our style and interests. Your attention to detail made all the difference! Will definitely book another trip soon.",
    userImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
    ],
    isFeatured: true,
    isActive: true,
    tenantId: "default",
  },
  {
    userName: "Janak Chauhan",
    city: "Surat",
    tripName: "Hampta Pass Trek",
    tripType: "Joined Group Trip",
    rating: 5,
    comment:
      "Just few weeks back I took the trip to Spiti Valley with YouthCamping and believe me I had an amazing expedition of a lifetime. The captains were top class!",
    userImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600&q=80",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80",
    ],
    isFeatured: true,
    isActive: true,
    tenantId: "default",
  },
  {
    userName: "Utsav Nathvani",
    city: "Rajkot",
    tripName: "Kedarkantha Winter Trek",
    tripType: "Joined Group Trip",
    rating: 5,
    comment:
      "It won't be wrong to say YouthCamping is synonymous with great experiences. And it also won't be wrong to say that you can trust them blindly!",
    userImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    photos: [
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80",
    ],
    isFeatured: true,
    isActive: true,
    tenantId: "default",
  },
];

exports.getReviews = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const where = { tenantId };

    const isAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "superadmin");
    if (!isAdmin) {
      where.isActive = true;
    } else {
      if (req.query.status === "active") {
        where.isActive = true;
      } else if (req.query.status === "pending") {
        where.isActive = false;
      }
    }

    let reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (reviews.length === 0) {
      try {
        await prisma.review.createMany({ data: DEFAULT_SEED_REVIEWS });
        reviews = await prisma.review.findMany({
          where,
          orderBy: { createdAt: "desc" },
        });
      } catch (seedErr) {
        console.warn("⚠️ Could not seed default reviews:", seedErr.message);
      }
    }

    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * Public review-card data. Photos are retained because the existing review card
 * and modal actively render them; internal tenant and activity metadata is omitted.
 */
exports.getPublicReviewCards = async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const take = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 100))
      : undefined;
    const reviews = await prisma.review.findMany({
      where: { tenantId: "default", isActive: true },
      select: {
        id: true,
        userName: true,
        instagram: true,
        city: true,
        tripName: true,
        tripType: true,
        userImage: true,
        comment: true,
        rating: true,
        photos: true,
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=600");
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.photo) {
      if (!Array.isArray(updateData.photos)) {
        updateData.photos = [];
      }
      if (!updateData.photos.includes(updateData.photo)) {
        updateData.photos = [updateData.photo, ...updateData.photos];
      }
      delete updateData.photo;
    }

    const isAdmin =
      req.user && (req.user.role === "admin" || req.user.role === "superadmin");
    if (!isAdmin) {
      updateData.isActive = false;
    }

    const review = await prisma.review.create({
      data: { ...updateData, tenantId: req.user?.tenantId || "default" },
    });
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error("🔥 [REVIEW CREATE ERROR]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    console.log("🔄 Updating Review:", req.params.id);
    console.log("📦 Data:", JSON.stringify(req.body, null, 2));

    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (updateData.photo) {
      if (!Array.isArray(updateData.photos)) {
        updateData.photos = [];
      }
      if (!updateData.photos.includes(updateData.photo)) {
        updateData.photos = [updateData.photo, ...updateData.photos];
      }
      delete updateData.photo;
    }

    const tenantId = req.user?.tenantId || "default";
    const review = await prisma.review.updateMany({
      where: { id: req.params.id, tenantId },
      data: updateData,
    });

    if (review.count === 0) {
      // Fallback update without tenantId check if admin
      await prisma.review.updateMany({
        where: { id: req.params.id },
        data: updateData,
      });
    }

    res.json({ success: true, message: "Review updated" });
  } catch (error) {
    console.error("🔥 [REVIEW UPDATE ERROR]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId || "default";
    const result = await prisma.review.deleteMany({
      where: { id: req.params.id, tenantId },
    });
    if (result.count === 0) {
      await prisma.review.deleteMany({
        where: { id: req.params.id },
      });
    }
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    next(error);
  }
};
