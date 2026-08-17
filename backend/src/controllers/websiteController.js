const { prisma } = require("../lib/prisma");

let cachedPublishedPages = null;
let cachedPublishedPagesExpiresAt = 0;

let cachedPublicSettings = null;
let cachedPublicSettingsExpiresAt = 0;

const invalidatePagesCache = () => {
  cachedPublishedPages = null;
  cachedPublishedPagesExpiresAt = 0;
};

const invalidateSettingsCache = () => {
  cachedPublicSettings = null;
  cachedPublicSettingsExpiresAt = 0;
};

// ══════════════════════════════════════════════════════════════════════
// WEBSITE PAGES CRUD
// ══════════════════════════════════════════════════════════════════════

/**
 * GET /api/website/pages — Public: list published, non-deleted pages
 */
exports.getPublishedPages = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedPublishedPages && now < cachedPublishedPagesExpiresAt) {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      return res.json({ success: true, data: cachedPublishedPages });
    }

    const pages = await prisma.websitePage.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        metaTitle: true,
        metaDescription: true,
        ogImage: true,
        published: true,
        updatedAt: true,
      },
    });

    cachedPublishedPages = pages;
    cachedPublishedPagesExpiresAt = now + 60000; // 60s

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error("[WebsitePages] getPublishedPages error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pages" });
  }
};

/**
 * GET /api/website/pages/all — Admin: list all pages including drafts and soft-deleted
 */
exports.getAllPages = async (req, res) => {
  try {
    const pages = await prisma.websitePage.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, data: pages });
  } catch (error) {
    console.error("[WebsitePages] getAllPages error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch pages" });
  }
};

/**
 * GET /api/website/pages/:slug — Public: single page by slug
 */
exports.getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ success: false, message: "Invalid slug" });
    }

    const page = await prisma.websitePage.findUnique({
      where: { slug },
    });

    if (!page || page.deletedAt) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    // Public consumers only see published pages
    const isAdmin = req.user && req.user.role;
    if (!isAdmin && !page.published) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    console.error(
      `[WebsitePages] getPageBySlug error slug=${req.params.slug}:`,
      error,
    );
    res.status(500).json({ success: false, message: "Failed to fetch page" });
  }
};

/**
 * POST /api/website/pages — Admin: create a new page
 */
exports.createPage = async (req, res) => {
  try {
    const {
      slug,
      title,
      content,
      metaTitle,
      metaDescription,
      ogImage,
      published,
    } = req.body;

    // Check for duplicate slug
    const existing = await prisma.websitePage.findUnique({ where: { slug } });
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          message: `Page with slug "${slug}" already exists`,
        });
    }

    const page = await prisma.websitePage.create({
      data: {
        slug,
        title,
        content: content || {},
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        ogImage: ogImage || null,
        published: published || false,
      },
    });

    invalidatePagesCache();

    console.log(
      `✅ [WebsitePages] Created page: ${slug} by ${req.user?.name || req.user?.id}`,
    );
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    console.error("[WebsitePages] createPage error:", error);
    res.status(500).json({ success: false, message: "Failed to create page" });
  }
};

/**
 * PATCH /api/website/pages/:id — Admin: update a page
 */
exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Page ID is required" });
    }

    const existing = await prisma.websitePage.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    // If slug is being changed, check for conflicts
    if (req.body.slug && req.body.slug !== existing.slug) {
      const conflict = await prisma.websitePage.findUnique({
        where: { slug: req.body.slug },
      });
      if (conflict) {
        return res
          .status(409)
          .json({
            success: false,
            message: `Slug "${req.body.slug}" is already in use`,
          });
      }
    }

    const updateData = {};
    if (req.body.slug !== undefined) updateData.slug = req.body.slug;
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.metaTitle !== undefined)
      updateData.metaTitle = req.body.metaTitle;
    if (req.body.metaDescription !== undefined)
      updateData.metaDescription = req.body.metaDescription;
    if (req.body.ogImage !== undefined) updateData.ogImage = req.body.ogImage;
    if (req.body.published !== undefined)
      updateData.published = req.body.published;

    const page = await prisma.websitePage.update({
      where: { id },
      data: updateData,
    });

    invalidatePagesCache();

    console.log(
      `✅ [WebsitePages] Updated page: ${page.slug} by ${req.user?.name || req.user?.id}`,
    );
    res.json({ success: true, data: page });
  } catch (error) {
    console.error(
      `[WebsitePages] updatePage error id=${req.params.id}:`,
      error,
    );
    res.status(500).json({ success: false, message: "Failed to update page" });
  }
};

/**
 * DELETE /api/website/pages/:id — Admin: soft-delete a page
 */
exports.softDeletePage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Page ID is required" });
    }

    const existing = await prisma.websitePage.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found" });
    }

    await prisma.websitePage.update({
      where: { id },
      data: { deletedAt: new Date(), published: false },
    });

    invalidatePagesCache();

    console.log(
      `🗑️ [WebsitePages] Soft-deleted page: ${existing.slug} by ${req.user?.name || req.user?.id}`,
    );
    res.json({ success: true, message: "Page deleted successfully" });
  } catch (error) {
    console.error(
      `[WebsitePages] softDeletePage error id=${req.params.id}:`,
      error,
    );
    res.status(500).json({ success: false, message: "Failed to delete page" });
  }
};

// ══════════════════════════════════════════════════════════════════════
// WEBSITE SETTINGS (key-value config store)
// ══════════════════════════════════════════════════════════════════════

/**
 * GET /api/website/settings — Public: all settings as key-value map
 */
exports.getPublicSettings = async (req, res) => {
  try {
    const now = Date.now();
    if (cachedPublicSettings && now < cachedPublicSettingsExpiresAt) {
      res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      return res.json({ success: true, data: cachedPublicSettings });
    }

    const settings = await prisma.websiteSetting.findMany();

    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    cachedPublicSettings = settingsMap;
    cachedPublicSettingsExpiresAt = now + 60000; // 60s

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.json({ success: true, data: settingsMap });
  } catch (error) {
    console.error("[WebsiteSettings] getPublicSettings error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch settings" });
  }
};

/**
 * GET /api/website/settings/all — Admin: all settings with metadata
 */
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await prisma.websiteSetting.findMany({
      orderBy: { key: "asc" },
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("[WebsiteSettings] getAllSettings error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch settings" });
  }
};

/**
 * PATCH /api/website/settings/:key — Admin: upsert a single setting
 */
exports.upsertSetting = async (req, res) => {
  try {
    const { key } = req.params;
    if (!key || typeof key !== "string" || key.length > 255) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid setting key" });
    }

    const { value } = req.body;

    const setting = await prisma.websiteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    invalidateSettingsCache();

    console.log(
      `✅ [WebsiteSettings] Upserted key="${key}" by ${req.user?.name || req.user?.id}`,
    );
    res.json({ success: true, data: setting });
  } catch (error) {
    console.error(
      `[WebsiteSettings] upsertSetting error key=${req.params.key}:`,
      error,
    );
    res
      .status(500)
      .json({ success: false, message: "Failed to update setting" });
  }
};
