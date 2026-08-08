const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const DOMPurify = require("isomorphic-dompurify");
const {
  createAuditLog,
  calculateReadiness,
} = require("./travelDeskCoreController");

// Helper to check manage access
const checkManageAccess = (role) => {
  if (!["superadmin", "admin", "operations", "ticketing"].includes(role)) {
    const error = new Error("403 Forbidden: Insufficient role permissions");
    error.status = 403;
    throw error;
  }
};

// ── ARTICLES ──

exports.getArticles = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId },
    });
    if (!workspace)
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });

    // Expiry derives from expiresAt <= now
    const now = new Date();

    let articles = await prisma.travelDeskArticle.findMany({
      where: { workspaceId: workspace.id },
      include: { category: true },
    });

    // Auto-seed Inclusions & Exclusions from Trip table if empty
    const incExcCategory = await prisma.travelDeskCategory.findFirst({
      where: { workspaceId: workspace.id, slug: "inclusions-&-exclusions" },
    });

    if (incExcCategory) {
      const existingIncExc = articles.filter(
        (a) => a.categoryId === incExcCategory.id,
      );
      if (existingIncExc.length === 0) {
        // Fetch original Trip
        const trip = await prisma.trip.findFirst({
          where: { OR: [{ id: tripId }, { slug: tripId }] },
        });

        if (trip && (trip.inclusions || trip.exclusions)) {
          const seededArticles = [];
          if (
            trip.inclusions &&
            Array.isArray(trip.inclusions) &&
            trip.inclusions.length > 0
          ) {
            const contentHtml = trip.inclusions
              .map((inc) => `<li>${inc}</li>`)
              .join("\n");
            const incArt = await prisma.travelDeskArticle.create({
              data: {
                workspaceId: workspace.id,
                categoryId: incExcCategory.id,
                title: "Trip Inclusions",
                summary: "Standard inclusions package",
                content: `<ul>\n${contentHtml}\n</ul>`,
                status: "PUBLISHED",
                visibility: "PUBLIC",
                version: 1,
              },
              include: { category: true },
            });
            seededArticles.push(incArt);
          }

          if (
            trip.exclusions &&
            Array.isArray(trip.exclusions) &&
            trip.exclusions.length > 0
          ) {
            const contentHtml = trip.exclusions
              .map((exc) => `<li>${exc}</li>`)
              .join("\n");
            const excArt = await prisma.travelDeskArticle.create({
              data: {
                workspaceId: workspace.id,
                categoryId: incExcCategory.id,
                title: "Trip Exclusions",
                summary: "Standard exclusions package",
                content: `<ul>\n${contentHtml}\n</ul>`,
                status: "PUBLISHED",
                visibility: "PUBLIC",
                version: 1,
              },
              include: { category: true },
            });
            seededArticles.push(excArt);
          }

          if (seededArticles.length > 0) {
            articles = [...articles, ...seededArticles];
          }
        }
      }
    }

    // Derive effective expiry
    articles = articles.map((a) => {
      if (a.expiresAt && a.expiresAt <= now) {
        a.effectiveStatus = "EXPIRED";
      } else {
        a.effectiveStatus = a.status;
      }
      return a;
    });

    // Filter out EXPIRED or non-published for non-admins
    if (
      !["superadmin", "admin", "operations", "ticketing"].includes(
        req.user.role,
      )
    ) {
      articles = articles.filter((a) => a.effectiveStatus === "PUBLISHED");
    }

    res.json({ success: true, data: articles });
  } catch (e) {
    next(e);
  }
};

exports.createArticle = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const {
      categoryId,
      title,
      summary,
      content,
      visibility,
      effectiveFrom,
      expiresAt,
      tags,
      originLearningId,
    } = req.body;

    checkManageAccess(req.user.role);

    const workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId },
    });
    if (!workspace)
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });

    // Sanitize Rich Text
    const cleanContent = DOMPurify.sanitize(content || "");

    const article = await prisma.travelDeskArticle.create({
      data: {
        workspaceId: workspace.id,
        categoryId,
        title,
        summary,
        content: cleanContent,
        visibility: visibility || "INTERNAL",
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        tags: tags || null,
        originLearningId: originLearningId || null,
        createdById: req.user.id,
        updatedById: req.user.id,
        status: "DRAFT",
        version: 1,
      },
    });

    await createAuditLog(
      workspace.id,
      "ARTICLE",
      article.id,
      "CREATE",
      null,
      { title, status: "DRAFT" },
      req.user.id,
    );

    res.json({ success: true, data: article });
  } catch (e) {
    if (e.status === 403)
      return res.status(403).json({ success: false, message: e.message });
    next(e);
  }
};

exports.updateArticle = async (req, res, next) => {
  try {
    const { tripId, articleId } = req.params;
    checkManageAccess(req.user.role);

    const oldArticle = await prisma.travelDeskArticle.findUnique({
      where: { id: articleId },
    });
    if (!oldArticle)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });

    const workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId },
    });

    // Unpacking payload
    const {
      title,
      summary,
      content,
      visibility,
      effectiveFrom,
      expiresAt,
      tags,
      status,
    } = req.body;

    // Sanitize Rich Text
    const cleanContent = DOMPurify.sanitize(content || oldArticle.content);

    // If editing a published article, create a snapshot of the published one, and revert the main article to DRAFT/bump version
    let newStatus = status || oldArticle.status;
    let newVersion = oldArticle.version;

    if (
      oldArticle.status === "PUBLISHED" &&
      newStatus !== "PUBLISHED" &&
      newStatus !== "ARCHIVED"
    ) {
      // Create version snapshot of the currently published state
      await prisma.travelDeskArticleVersion.create({
        data: {
          articleId: oldArticle.id,
          version: oldArticle.version,
          title: oldArticle.title,
          summary: oldArticle.summary,
          content: oldArticle.content,
          categoryId: oldArticle.categoryId,
          tags: oldArticle.tags,
          visibility: oldArticle.visibility,
          status: oldArticle.status,
          effectiveFrom: oldArticle.effectiveFrom,
          expiresAt: oldArticle.expiresAt,
          ownerId: oldArticle.ownerId,
          authorId: oldArticle.updatedById,
          changeComment: "Snapshot taken before new edit revision",
        },
      });
      newStatus = "DRAFT";
      newVersion += 1;
    }

    const updated = await prisma.travelDeskArticle.update({
      where: { id: articleId },
      data: {
        title: title || oldArticle.title,
        summary: summary !== undefined ? summary : oldArticle.summary,
        content: cleanContent,
        visibility: visibility || oldArticle.visibility,
        effectiveFrom:
          effectiveFrom !== undefined
            ? effectiveFrom
              ? new Date(effectiveFrom)
              : null
            : oldArticle.effectiveFrom,
        expiresAt:
          expiresAt !== undefined
            ? expiresAt
              ? new Date(expiresAt)
              : null
            : oldArticle.expiresAt,
        tags: tags !== undefined ? tags : oldArticle.tags,
        status: newStatus,
        version: newVersion,
        updatedById: req.user.id,
      },
    });

    await createAuditLog(
      workspace.id,
      "ARTICLE",
      articleId,
      "UPDATE",
      { version: oldArticle.version, status: oldArticle.status },
      { version: updated.version, status: updated.status },
      req.user.id,
    );
    await calculateReadiness(workspace.id, tripId);

    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.status === 403)
      return res.status(403).json({ success: false, message: e.message });
    next(e);
  }
};

exports.requestChangesArticle = async (req, res, next) => {
  try {
    const { tripId, articleId } = req.params;
    const { comment } = req.body;
    checkManageAccess(req.user.role);

    if (!comment || comment.trim() === "") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Mandatory comment required for requesting changes",
        });
    }

    const article = await prisma.travelDeskArticle.findUnique({
      where: { id: articleId },
    });
    if (!article)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });

    if (article.status !== "UNDER_REVIEW") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Only articles UNDER_REVIEW can have changes requested.",
        });
    }

    const updated = await prisma.travelDeskArticle.update({
      where: { id: articleId },
      data: { status: "CHANGES_REQUESTED", updatedById: req.user.id },
    });

    const workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId },
    });
    await createAuditLog(
      workspace.id,
      "ARTICLE",
      articleId,
      "CHANGES_REQUESTED",
      { status: "UNDER_REVIEW" },
      { status: "CHANGES_REQUESTED", comment },
      req.user.id,
    );

    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.status === 403)
      return res.status(403).json({ success: false, message: e.message });
    next(e);
  }
};

exports.changeArticleStatus = async (req, res, next) => {
  try {
    const { tripId, articleId } = req.params;
    const { status } = req.body;
    checkManageAccess(req.user.role);

    const article = await prisma.travelDeskArticle.findUnique({
      where: { id: articleId },
    });
    if (!article)
      return res
        .status(404)
        .json({ success: false, message: "Article not found" });

    // Validate Backend Transitions
    const current = article.status;
    let allowed = false;

    if (current === "DRAFT" && status === "UNDER_REVIEW") allowed = true;
    if (current === "CHANGES_REQUESTED" && status === "UNDER_REVIEW")
      allowed = true;
    if (current === "UNDER_REVIEW" && status === "APPROVED") allowed = true;
    if (current === "APPROVED" && status === "PUBLISHED") allowed = true;
    if (current === "PUBLISHED" && status === "ARCHIVED") allowed = true;
    if (current === "EXPIRED" && status === "DRAFT") allowed = true; // Renewal
    if (status === "ARCHIVED") allowed = true; // Hard override for admins

    if (!allowed) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Invalid transition from ${current} to ${status}`,
        });
    }

    const updateData = { status, updatedById: req.user.id };
    if (status === "APPROVED") updateData.approvedById = req.user.id;
    if (status === "PUBLISHED") updateData.publishedById = req.user.id;

    const updated = await prisma.travelDeskArticle.update({
      where: { id: articleId },
      data: updateData,
    });

    const workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId },
    });
    await createAuditLog(
      workspace.id,
      "ARTICLE",
      articleId,
      `STATUS_${status}`,
      { status: current },
      { status },
      req.user.id,
    );
    await calculateReadiness(workspace.id, tripId);

    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.status === 403)
      return res.status(403).json({ success: false, message: e.message });
    next(e);
  }
};

// ── APPROVAL CENTER ──
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    checkManageAccess(req.user.role);

    const workspace = await prisma.travelDeskWorkspace.findUnique({
      where: { tripId },
    });
    if (!workspace)
      return res
        .status(404)
        .json({ success: false, message: "Workspace not found" });

    // Fetch Articles Under Review or Expired
    const now = new Date();
    const articles = await prisma.travelDeskArticle.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { status: "UNDER_REVIEW" },
          { status: "CHANGES_REQUESTED" },
          { status: "APPROVED" },
          { expiresAt: { lte: now } },
        ],
      },
      include: { category: true },
    });

    const mappedArticles = articles.map((a) => {
      a.effectiveStatus =
        a.expiresAt && a.expiresAt <= now ? "EXPIRED" : a.status;
      return a;
    });

    // TODO: Include SOPs and Documents when those controllers are expanded

    res.json({ success: true, data: { articles: mappedArticles } });
  } catch (e) {
    next(e);
  }
};

// ── NOTICES & ACKNOWLEDGEMENTS ──
exports.acknowledgeNotice = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notice = await prisma.travelDeskNotice.findUnique({ where: { id } });
    if (!notice)
      return res
        .status(404)
        .json({ success: false, message: "Notice not found" });

    // Idempotent Acknowledgement (Upsert using unique constraints or findFirst)
    const existing = await prisma.travelDeskNoticeAck.findUnique({
      where: { noticeId_userId: { noticeId: id, userId: req.user.id } },
    });

    if (existing) {
      return res.json({
        success: true,
        data: existing,
        message: "Already acknowledged",
      });
    }

    const ack = await prisma.travelDeskNoticeAck.create({
      data: {
        noticeId: id,
        userId: req.user.id,
      },
    });

    res.json({ success: true, data: ack });
  } catch (e) {
    next(e);
  }
};
exports.getWorkspaceNotices = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const workspace = await prisma.travelDeskWorkspace.findFirst({
      where: {
        OR: [{ tripId }, { id: tripId }],
      },
    });
    if (!workspace) return res.json({ success: true, data: [] });

    const notices = await prisma.travelDeskNotice.findMany({
      where: { workspaceId: workspace.id, status: "ACTIVE" },
      orderBy: { publishedAt: "desc" },
      take: 10,
    });

    res.json({ success: true, data: notices });
  } catch (e) {
    console.error("getWorkspaceNotices error:", e);
    res.json({ success: true, data: [] });
  }
};
