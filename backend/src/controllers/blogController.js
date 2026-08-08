const { prisma } = require("../lib/prisma");
const { sanitizeHtml } = require("../utils/sanitizer");

const stripHtml = (value = "") => String(value).replace(/<[^>]*>/g, "");

const hasEmbeddedVideo = (blog) => {
  const content = String(blog.content || "");
  return Boolean(
    content.includes("youtube.com") ||
    content.includes("youtu.be") ||
    content.includes("iframe"),
  );
};

const DEFAULT_SEED_BLOGS = [
  {
    title: "The Winter Beauty of Kashmir",
    slug: "winter-beauty-of-kashmir",
    content:
      "Discover snow-covered valleys, frozen lakes, and warm Kashmiri hospitality in our comprehensive winter guide.",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200",
    author: "Aditi Raval",
    authorImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
    readTime: "7 min read",
    status: "published",
    isActive: true,
    tenantId: "default",
  },
  {
    title: "8-Day Dubai Adventure: A Journey of Thrills & Luxury",
    slug: "dubai-adventure",
    content:
      "From desert safaris and skyscraper views to luxury cruises, explore the ultimate 8-day Dubai itinerary.",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200",
    author: "Harsh Patel",
    authorImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300",
    readTime: "6 min read",
    status: "published",
    isActive: true,
    tenantId: "default",
  },
  {
    title: "Winter Spiti Valley Experience",
    slug: "winter-spiti-experience",
    content:
      "Trek through frozen rivers, ancient monasteries, and snowcapped peaks in the middle land of Spiti.",
    image:
      "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=1200",
    author: "Avdhesh Patel",
    authorImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300",
    readTime: "5 min read",
    status: "published",
    isActive: true,
    tenantId: "default",
  },
  {
    title: "Bhrigu Lake Trek – High Altitude Serenity",
    slug: "bhrigu-lake-trek",
    content:
      "Experience alpine meadows, glacial lakes, and breathtaking Himalayan views on the famous Bhrigu Lake trek.",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
    author: "Priya Shah",
    authorImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300",
    readTime: "8 min read",
    status: "published",
    isActive: true,
    tenantId: "default",
  },
];

const FALLBACK_BLOG_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1200",
  "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=1200",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200",
];

exports.getBlogs = async (req, res, next) => {
  try {
    let blogs = await prisma.blog.findMany({
      where: { tenantId: req.user?.tenantId || "default", isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (blogs.length === 0) {
      try {
        await prisma.blog.createMany({ data: DEFAULT_SEED_BLOGS });
        blogs = await prisma.blog.findMany({
          where: { tenantId: req.user?.tenantId || "default", isActive: true },
          orderBy: { createdAt: "desc" },
        });
      } catch (seedErr) {
        console.warn("⚠️ Could not seed default blogs:", seedErr.message);
      }
    }

    const sanitizedBlogs = blogs.map((b, idx) => ({
      ...b,
      image:
        b.image && b.image.trim() !== ""
          ? b.image
          : FALLBACK_BLOG_IMAGES[idx % FALLBACK_BLOG_IMAGES.length],
    }));

    res.json({ success: true, data: sanitizedBlogs });
  } catch (error) {
    next(error);
  }
};

/**
 * Lightweight published blog cards for public list and homepage rendering.
 */
exports.getPublicBlogCards = async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const take = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 100))
      : undefined;
    let blogs = await prisma.blog.findMany({
      where: { tenantId: "default", isActive: true, status: "published" },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        image: true,
        author: true,
        authorImage: true,
        readTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    if (blogs.length === 0) {
      try {
        await prisma.blog.createMany({ data: DEFAULT_SEED_BLOGS });
        blogs = await prisma.blog.findMany({
          where: { tenantId: "default", isActive: true, status: "published" },
          select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            image: true,
            author: true,
            authorImage: true,
            readTime: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: "desc" },
          take,
        });
      } catch (e) {
        console.warn("⚠️ Could not seed public blogs:", e.message);
      }
    }

    const data = blogs.map((blog, idx) => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: stripHtml(blog.content).slice(0, 160),
      image:
        blog.image && blog.image.trim() !== ""
          ? blog.image
          : FALLBACK_BLOG_IMAGES[idx % FALLBACK_BLOG_IMAGES.length],
      author: blog.author,
      authorImage: blog.authorImage,
      readTime: blog.readTime || "5 min read",
      hasVideo: hasEmbeddedVideo(blog),
      createdAt: blog.createdAt,
    }));

    res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=600");
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Lightweight published blog cards for public list and homepage rendering.
 * The existing /api/blogs response remains unchanged.
 */
exports.getPublicBlogCards = async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const take = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 100))
      : undefined;
    const blogs = await prisma.blog.findMany({
      where: { tenantId: "default", isActive: true, status: "published" },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        image: true,
        author: true,
        authorImage: true,
        readTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    const data = blogs.map((blog) => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: stripHtml(blog.content).slice(0, 160),
      image: blog.image,
      author: blog.author,
      authorImage: blog.authorImage,
      readTime: blog.readTime,
      hasVideo: hasEmbeddedVideo(blog),
      status: blog.status,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    }));

    res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=600");
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Full content for one published public article. The legacy detail endpoint is
 * unchanged so existing admin and preview consumers retain their contract.
 */
exports.getPublicBlogDetail = async (req, res, next) => {
  try {
    const blog = await prisma.blog.findFirst({
      where: {
        slug: req.params.slug,
        tenantId: "default",
        isActive: true,
        status: "published",
      },
    });

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    if (blog.content) {
      blog.content = sanitizeHtml(blog.content);
    }

    res.set("Cache-Control", "public, max-age=600, stale-while-revalidate=600");
    res.json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

exports.getBlog = async (req, res, next) => {
  try {
    const blog = await prisma.blog.findFirst({
      where: {
        OR: [{ id: req.params.id }, { slug: req.params.id }],
        tenantId: req.user?.tenantId || "default",
      },
    });
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    res.json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create blog
 * @route   POST /api/blogs
 */
const slugify = require("slugify");

exports.createBlog = async (req, res, next) => {
  try {
    const {
      title,
      content,
      image,
      author,
      authorImage,
      status,
      readTime,
      hasVideo,
      slug,
    } = req.body;

    // Generate slug if not provided
    const finalSlug =
      slug || slugify(title || "untitled", { lower: true, strict: true });

    const blog = await prisma.blog.create({
      data: {
        title: title || "Untitled Story",
        content: content ? sanitizeHtml(content) : "",
        image: image || null,
        author: author || "Expedition Team",
        authorImage: authorImage || null,
        status: status || "draft",
        readTime: readTime || "5 MIN READ",
        hasVideo: !!hasVideo,
        slug: finalSlug,
        tenantId: req.user?.tenantId || "default",
      },
    });
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({
          success: false,
          message: "A blog with this title/slug already exists",
        });
    }
    next(error);
  }
};

/**
 * @desc    Update blog
 * @route   PUT /api/blogs/:id
 */
exports.updateBlog = async (req, res, next) => {
  try {
    const {
      title,
      content,
      image,
      author,
      authorImage,
      status,
      readTime,
      hasVideo,
      slug,
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = sanitizeHtml(content);
    if (image !== undefined) updateData.image = image;
    if (author !== undefined) updateData.author = author;
    if (authorImage !== undefined) updateData.authorImage = authorImage;
    if (status !== undefined) updateData.status = status;
    if (readTime !== undefined) updateData.readTime = readTime;
    if (hasVideo !== undefined) updateData.hasVideo = !!hasVideo;
    if (slug !== undefined) updateData.slug = slug;

    const tenantId = req.user?.tenantId || "default";
    let blog = await prisma.blog.updateMany({
      where: { id: req.params.id, tenantId },
      data: updateData,
    });

    if (blog.count === 0) {
      await prisma.blog.updateMany({
        where: { id: req.params.id },
        data: updateData,
      });
    }

    res.json({ success: true, message: "Blog updated" });
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({
          success: false,
          message: "A blog with this title/slug already exists",
        });
    }
    next(error);
  }
};

/**
 * @desc    Delete blog
 * @route   DELETE /api/blogs/:id
 */
exports.deleteBlog = async (req, res, next) => {
  try {
    const result = await prisma.blog.deleteMany({
      where: { id: req.params.id, tenantId: req.user?.tenantId || "default" },
    });
    if (result.count === 0)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    res.json({ success: true, message: "Blog deleted" });
  } catch (error) {
    next(error);
  }
};
