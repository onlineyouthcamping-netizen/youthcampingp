const { prisma } = require('../lib/prisma');
const { sanitizeHtml } = require('../utils/sanitizer');

const sanitizeStringData = (val) => {
  if (typeof val !== 'string') return val;
  if (val.includes('<')) {
    return sanitizeHtml(val);
  }
  return val;
};

const sanitizeObjectData = (obj) => {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectData);
  }
  if (typeof obj === 'object') {
    const clean = {};
    for (const key in obj) {
      clean[key] = sanitizeObjectData(obj[key]);
    }
    return clean;
  }
  return sanitizeStringData(obj);
};

const sanitizeSection = (section) => {
  if (!section) return section;
  const cleanSection = { ...section };
  if (section.content) cleanSection.content = sanitizeObjectData(section.content);
  if (section.draft) cleanSection.draft = sanitizeObjectData(section.draft);
  if (section.data) cleanSection.data = sanitizeObjectData(section.data);

  for (const key in section) {
    if (!['id', 'name', 'order', 'visible', 'locked', 'type', 'content', 'draft', 'data'].includes(key)) {
      cleanSection[key] = sanitizeObjectData(section[key]);
    }
  }
  return cleanSection;
};

const toPublicSection = (section = {}) => {
  const {
    id: _id,
    name: _name,
    order: _order,
    visible: _visible,
    locked: _locked,
    draft,
    content,
    data,
    type,
    ...inlineData
  } = section;

  return {
    type,
    data: draft ?? content ?? data ?? inlineData,
  };
};

const getUniqueVisibleSections = (sections) => {
  const seenIds = new Set();

  return sections.filter((section) => {
    if (!section || section.visible === false) return false;
    if (!section.id) return true;
    if (seenIds.has(section.id)) return false;
    seenIds.add(section.id);
    return true;
  });
};

// Get the published version of a page layout
exports.getPublishedLayout = async (req, res) => {
  try {
    const { name } = req.params;
    console.log(`🔍 [PageBuilder] Fetching published layout for: ${name}`);

    const page = await prisma.pageBuilder.findUnique({
      where: { name }
    });

    if (!page) {
      console.log(`⚠️ [PageBuilder] No record found for ${name}, returning empty defaults`);
      return res.json({ success: true, data: { sections: [] } });
    }

    res.json({
      success: true,
      data: {
        ...page,
        sections: page.sections || []
      }
    });
  } catch (error) {
    console.error(`🔥 [PageBuilder Fetch Error] name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: "Failed to fetch published layout", error: error.message });
  }
};

/**
 * Published public page shape. This deliberately excludes the PageBuilder row,
 * draft tree, tenant metadata, editor-only fields, and duplicate section data.
 * The existing /api/page-builder/:name contract remains unchanged.
 */
exports.getPublicPublishedLayout = async (req, res) => {
  try {
    const { name } = req.params;
    const page = await prisma.pageBuilder.findUnique({
      where: { name },
      select: { sections: true }
    });

    const sections = Array.isArray(page?.sections)
      ? getUniqueVisibleSections(page.sections).map(toPublicSection).map(s => ({
          ...s,
          data: sanitizeObjectData(s.data)
        }))
      : [];

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=60');
    res.json({ success: true, data: { sections } });
  } catch (error) {
    console.error(`Public PageBuilder fetch error name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: 'Failed to fetch published layout' });
  }
};

exports.getDraftLayout = async (req, res) => {
  try {
    const { name } = req.params;
    console.log(`🔍 [PageBuilder] Fetching draft layout for: ${name}`);

    const page = await prisma.pageBuilder.findUnique({
      where: { name }
    });

    if (!page) {
      console.log(`⚠️ [PageBuilder] No draft found for ${name}`);
      return res.json({ success: true, data: { sections: [] } });
    }

    res.json({
      success: true,
      data: {
        ...page,
        sections: page.draft || page.sections || []
      }
    });
  } catch (error) {
    console.error(`🔥 [PageBuilder Draft Error] name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: "Failed to fetch draft layout", error: error.message });
  }
};

exports.updateAllSections = async (req, res) => {
  try {
    const { name } = req.params;
    const { sections } = req.body;

    if (!name) throw new Error("Page name is required");

    const sanitizedSections = Array.isArray(sections) ? sections.map(sanitizeSection) : [];

    console.log(`💾 [PageBuilder] Updating draft for ${name} with ${sanitizedSections.length} sections`);

    const page = await prisma.pageBuilder.upsert({
      where: { name },
      update: {
        draft: sanitizedSections,
        updatedAt: new Date()
      },
      create: {
        name,
        draft: sanitizedSections,
        sections: []
      }
    });

    res.json({ success: true, data: page });
  } catch (error) {
    console.error(`🔥 [PageBuilder Update Error] name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: "Failed to save draft", error: error.message });
  }
};

exports.publishLayout = async (req, res) => {
  try {
    const { name } = req.params;
    console.log(`🚀 [PageBuilder] Publishing layout for: ${name}`);

    const page = await prisma.pageBuilder.findUnique({
      where: { name }
    });

    if (!page) {
      return res.status(404).json({ success: false, message: "Page not found to publish" });
    }

    const sectionsToPublish = page.draft || [];

    const updatedPage = await prisma.pageBuilder.update({
      where: { name },
      data: {
        sections: sectionsToPublish,
        updatedAt: new Date()
      }
    });

    console.log(`✅ [PageBuilder] Published ${sectionsToPublish.length} sections for ${name}`);
    res.json({ success: true, data: updatedPage });
  } catch (error) {
    console.error(`🔥 [PageBuilder Publish Error] name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: "Failed to publish layout", error: error.message });
  }
};

// Stubs for other granular operations if needed by the UI
exports.updateSection = async (req, res) => res.json({ success: true });
exports.reorderSections = async (req, res) => res.json({ success: true });
exports.toggleSectionVisibility = async (req, res) => res.json({ success: true });
exports.duplicateSection = async (req, res) => res.json({ success: true });
