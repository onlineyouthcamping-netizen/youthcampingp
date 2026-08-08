const { prisma } = require("../lib/prisma");

// --------------------------------------------------
// 1. Notifications Center
// --------------------------------------------------

exports.getNotifications = async (req, res, next) => {
  try {
    const { tenantId = "default" } = req.query;
    if (!prisma.notification) {
      return res.json({ success: true, data: [] });
    }
    const notifications = await prisma.notification.findMany({
      where: {
        recipientUserId: req.user.id,
        tenantId,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Map to frontend ErpNotification format
    const formatted = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message || "",
      priority: n.priority, // e.g. 'Low', 'Medium', 'High'
      module: n.module || "System",
      link: n.actionUrl || "#",
      read: n.readAt !== null,
      createdAt: n.createdAt.toISOString(),
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, recipientUserId: req.user.id },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const { tenantId = "default" } = req.body;
    // role filter was in mock, but usually we just mark all for user
    await prisma.notification.updateMany({
      where: { recipientUserId: req.user.id, tenantId, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 2. Global Search
// --------------------------------------------------

exports.searchAll = async (req, res, next) => {
  try {
    const { q = "", tenantId = "default" } = req.query;
    const term = q.toLowerCase().trim();
    if (!term || term.length < 2) {
      return res.json({ success: true, data: {} });
    }

    const results = {};
    const permissions = req.user.permissions || [];
    const isSuper = req.user.role === "superadmin";

    // 1. Search Bookings
    if (permissions.includes("bookings.view")) {
      const bookings = await prisma.booking.findMany({
        where: {
          tenantId,
          OR: [
            { bookingId: { contains: term, mode: "insensitive" } },
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { phone: { contains: term, mode: "insensitive" } },
          ],
          ...(!isSuper ? { salesAdminId: req.user.id } : {}),
        },
        take: 5,
        include: { tripRef: true },
      });
      if (bookings.length > 0) {
        results["Bookings"] = bookings.map((b) => ({
          title: `${b.bookingId} - ${b.name} (${b.tripRef?.title || b.tripName})`,
          path: `/admin/bookings/${b.id}`,
        }));
      }
    }

    // 2. Customers Search (using User table with role 'user' or 'customer' if that applies, wait, User table usually is for auth. Let's just search Bookings again and group as Customers? Actually, customers might just be Users with role 'user')
    if (permissions.includes("customers.view") || isSuper) {
      const customers = await prisma.user.findMany({
        where: {
          tenantId,
          role: "user", // Assuming users who book are registered as role='user'
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { phone: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
      if (customers.length > 0) {
        results["Customers"] = customers.map((c) => ({
          title: `${c.name} (Customer Profile)`,
          path: `/admin/customers/${c.id}`,
        }));
      }
    }

    // 3. Trips Search
    if (permissions.includes("trips.view")) {
      const trips = await prisma.trip.findMany({
        where: {
          tenantId,
          OR: [
            { code: { contains: term, mode: "insensitive" } },
            { title: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
      if (trips.length > 0) {
        results["Trips"] = trips.map((t) => ({
          title: `${t.code} - ${t.title}`,
          path: `/admin/trips/${t.id}`,
        }));
      }
    }

    // 4. Inquiries Search
    if (permissions.includes("inquiries.view")) {
      const inquiries = await prisma.inquiry.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { phone: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
      if (inquiries.length > 0) {
        results["Inquiries"] = inquiries.map((i) => ({
          title: `Inquiry from ${i.name || i.phone}`,
          path: `/admin/inquiries/${i.id}`,
        }));
      }
    }

    // 5. Employees / Admins Search
    if (permissions.includes("users.view") || isSuper) {
      const admins = await prisma.admin.findMany({
        where: {
          tenantId,
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
      if (admins.length > 0) {
        results["Employees"] = admins.map((a) => ({
          title: `${a.name} (${a.role})`,
          path: `/admin/settings/users/${a.id}`,
        }));
      }
    }

    // 6. Company Documents Search
    if (permissions.includes("company_documents.view")) {
      const docs = await prisma.companyDocument.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { documentNumber: { contains: term, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
      if (docs.length > 0) {
        results["Company Documents"] = docs.map((d) => ({
          title: `${d.documentNumber || "DOC"} - ${d.title}`,
          path: `/admin/company-documents/${d.id}`,
        }));
      }
    }

    // Departures, Quotations, Vendors, Invoices, Payments can be added here if the models exist.
    // E.g., Vendors:
    if (permissions.includes("vendors.view")) {
      const vendors = await prisma.vendor
        .findMany({
          where: {
            tenantId,
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { contactPerson: { contains: term, mode: "insensitive" } },
              { phone: { contains: term, mode: "insensitive" } },
            ],
          },
          take: 5,
        })
        .catch(() => []); // Ignore if model differs
      if (vendors.length > 0) {
        results["Vendors"] = vendors.map((v) => ({
          title: `${v.name} (Vendor)`,
          path: `/admin/vendors/${v.id}`,
        }));
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 3. Company Documents
// --------------------------------------------------

exports.getCompanyDocuments = async (req, res, next) => {
  try {
    const { tenantId = "default" } = req.query;
    let docs = [];
    try {
      docs = await prisma.companyDocument.findMany({
        where: { tenantId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
      });
    } catch (dbErr) {
      console.warn("CompanyDocument DB query fallback:", dbErr.message);
      docs = [];
    }

    const formatted = docs.map((d) => {
      const latestVersion = d.versions?.[0];
      return {
        id: d.id,
        name: d.title,
        identifier: d.documentNumber || `DOC-${d.id.substring(0, 4)}`,
        category: d.category,
        type: latestVersion ? latestVersion.mimeType.split("/")[1] : "PDF",
        uploadedBy: latestVersion
          ? latestVersion.uploadedByUserId
          : "Hemal Patel",
        uploadedDate: (latestVersion ? latestVersion.createdAt : d.createdAt)
          .toISOString()
          .split("T")[0],
        expiryDate: d.expiryDate
          ? d.expiryDate.toISOString().split("T")[0]
          : "N/A",
        status: d.isArchived
          ? "Archived"
          : d.expiryDate && d.expiryDate < new Date()
            ? "Expired"
            : "Active",
        size: latestVersion
          ? `${Math.round(latestVersion.sizeBytes / 1024)} KB`
          : "2.0 MB",
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
};

exports.createCompanyDocument = async (req, res, next) => {
  try {
    const { name, category, expiryDate, documentNumber } = req.body;
    const { tenantId = "default" } = req.user || { tenantId: "default" };
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    const cloudinary = require("cloudinary").v2;

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "company_documents",
          resource_type: "auto",
          type: "authenticated",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(file.buffer);
    });

    const doc = await prisma.companyDocument.create({
      data: {
        tenantId,
        title: name,
        category,
        documentNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        versions: {
          create: {
            versionNumber: 1,
            storageKey: uploadResult.public_id,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            uploadedByUserId: req.user.id,
          },
        },
      },
    });

    const { publishEvent } = require("../utils/eventBus");
    await publishEvent("document.uploaded", {
      entityType: "CompanyDocument",
      entityId: doc.id,
      actorUserId: req.user.id,
      actorName: req.user.name || "Admin",
      title: `Document Uploaded: ${name}`,
      description: `Version 1 of ${name} was uploaded to category ${category}.`,
      moduleName: "Operations",
      priority: "Low",
      actionUrl: `/admin/company-documents/${doc.id}`,
      notify: false,
    });

    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

exports.deleteCompanyDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.companyDocument.update({
      where: { id },
      data: { isArchived: true },
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 4. Recurring Tasks
// --------------------------------------------------

exports.getRecurringTasks = async (req, res, next) => {
  try {
    const { tenantId = "default" } = req.query;
    const tasks = await prisma.recurringTask.findMany({
      where: { tenantId },
      orderBy: { nextOccurrence: "asc" },
    });

    const formatted = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      schedule: t.recurrenceType,
      department: t.module || "General",
      assignedTo: t.assigneeUserId || "Unassigned",
      nextOccurrence: t.nextOccurrence
        ? t.nextOccurrence.toISOString().split("T")[0]
        : "N/A",
      status: t.isActive ? "Active" : "Paused",
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

exports.createRecurringTask = async (req, res, next) => {
  try {
    const { title, schedule, department, assignedTo } = req.body;
    const { tenantId = "default" } = req.body;

    // Set mock next occurrence (tomorrow)
    const nextOccur = new Date();
    nextOccur.setDate(nextOccur.getDate() + 1);

    const task = await prisma.recurringTask.create({
      data: {
        tenantId,
        title,
        recurrenceType: schedule,
        module: department,
        assigneeUserId: assignedTo,
        createdById: req.user.id,
        nextOccurrence: nextOccur,
      },
    });
    res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

exports.completeRecurringTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Just mock completing it by pushing the date forward
    const task = await prisma.recurringTask.findUnique({ where: { id } });
    if (task && task.nextOccurrence) {
      const next = new Date(task.nextOccurrence);
      next.setDate(next.getDate() + 7); // mock 1 week
      await prisma.recurringTask.update({
        where: { id },
        data: { nextOccurrence: next },
      });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// --------------------------------------------------
// 5. Employee Mistakes (mock preserved for now, or adapt if schema changes)
// --------------------------------------------------
exports.getEmployeeMistakes = async (req, res, next) => {
  res.json({ success: true, data: [] });
};
exports.logEmployeeMistake = async (req, res, next) => {
  res.json({ success: true, data: req.body });
};

// --------------------------------------------------
// 6. Activity Timelines
// --------------------------------------------------

exports.getActivityTimeline = async (req, res, next) => {
  try {
    const { id: entityId } = req.params;
    const { tenantId = "default" } = req.query;

    const events = await prisma.activityEvent.findMany({
      where: { tenantId, entityId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = events.map((e) => ({
      time: e.createdAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: e.createdAt.toLocaleDateString(),
      user: e.actorName || "System",
      type: "Action",
      action: e.title,
      comments: e.comments || "",
      notes: e.description || "",
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

exports.getCustomerTimeline = async (req, res, next) => {
  try {
    const { id: customerId } = req.params;
    const { tenantId = "default" } = req.query;

    const events = await prisma.activityEvent.findMany({
      where: {
        tenantId,
        OR: [
          { entityId: customerId, entityType: "Customer" },
          { relatedId: customerId, relatedType: "Customer" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = events.map((e) => ({
      time: e.createdAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: e.createdAt.toLocaleDateString(),
      user: e.actorName || "System",
      type: "CustomerEvent",
      action: e.title,
      comments: e.comments || "",
      notes: e.description || "",
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
};

exports.getDocumentAccessUrl = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doc = await prisma.companyDocument.findUnique({
      where: { id, tenantId: req.user?.tenantId || "default" },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (!doc || doc.isArchived) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found or archived" });
    }

    // Role check logic based on category
    let requiredPerm = "company_documents.view";
    if (doc.category === "legal") requiredPerm = "company_documents.view_legal";
    if (doc.category === "hr") requiredPerm = "company_documents.view_hr";
    if (doc.category === "brand") requiredPerm = "company_documents.view_brand";

    const hasPerm =
      req.user.permissions?.includes(requiredPerm) || req.user.role === "admin";
    if (!hasPerm) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const version = doc.versions[0];
    if (!version)
      return res
        .status(404)
        .json({ success: false, message: "No versions found" });

    const cloudinary = require("cloudinary").v2;
    // For authenticated delivery, generate an expiring URL (e.g. 1 hour)
    const accessUrl = cloudinary.utils.private_download_url(
      version.storageKey,
      version.originalFilename.split(".").pop(),
      { expires_at: Math.floor(Date.now() / 1000) + 3600 },
    );

    const { publishEvent } = require("../utils/eventBus");
    await publishEvent("document.accessed", {
      entityType: "CompanyDocument",
      entityId: doc.id,
      actorUserId: req.user.id,
      title: `Document Accessed`,
      description: `Document ${doc.title} was accessed.`,
      moduleName: "Operations",
      priority: "Low",
      notify: false,
    });

    res.json({ success: true, url: accessUrl });
  } catch (err) {
    next(err);
  }
};
