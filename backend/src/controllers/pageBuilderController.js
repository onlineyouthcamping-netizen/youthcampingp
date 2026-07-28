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
      where: { name }
    });

    const defaultSecs = getDefaultSectionsForPage(name);
    const rawSections = (page?.sections && Array.isArray(page.sections) && page.sections.length > 0)
      ? page.sections
      : (page?.draft && Array.isArray(page.draft) && page.draft.length > 0)
        ? page.draft
        : defaultSecs;

    const sections = rawSections
      .filter((s) => s && s.visible !== false)
      .map((s) => ({
        id: s.id || `sec-${Math.random().toString(36).substring(2, 9)}`,
        type: s.type,
        visible: s.visible !== false,
        data: sanitizeObjectData(s.draft ?? s.content ?? s.data ?? s)
      }));

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({ success: true, data: { name: page?.name || name, sections } });
  } catch (error) {
    console.error(`Public PageBuilder fetch error name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: 'Failed to fetch published layout' });
  }
};

const getDefaultSectionsForPage = (name) => {
  switch (name) {
    case 'home':
      return [
        {
          id: 'sec-hero-main',
          type: 'hero',
          name: 'Hero Header',
          visible: true,
          draft: {
            tagline: 'EXPLORE. CONNECT. BELONG.',
            headlinePrefix: 'Trips for the',
            strikethroughWord: 'Ordinary',
            rotatingWords: ['Adventurous', 'Curious', 'Wanderlust-Struck', 'Colleagues', 'Strangers'],
            subheadline: 'Pick a month and explore group adventures that bring stories to life',
            backgroundImage: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1800&q=85'
          }
        },
        {
          id: 'sec-featured_trips-main',
          type: 'featured_trips',
          name: 'Upcoming Group Trips',
          visible: true,
          draft: {}
        },
        {
          id: 'sec-destinations-main',
          type: 'destinations',
          name: 'Popular Destinations',
          visible: true,
          draft: {}
        },
        {
          id: 'sec-cta_slider-main',
          type: 'cta_slider',
          name: 'Media Banner Slider',
          visible: true,
          draft: {}
        },
        {
          id: 'sec-reviews-main',
          type: 'reviews',
          name: 'What Travelers Say',
          visible: true,
          draft: {}
        },
        {
          id: 'sec-recent_photos-main',
          type: 'recent_photos',
          name: 'Recent Photos From Our Trips',
          visible: true,
          draft: {}
        }
      ];
    case 'about-us':
      return [
        {
          id: 'sec-about-hero',
          type: 'hero',
          name: 'Hero Header',
          visible: true,
          draft: {
            tagline: 'OUR STORY & PHILOSOPHY',
            headlinePrefix: 'REDEFINING THE',
            strikethroughWord: 'ORDINARY',
            rotatingWords: ['MOUNTAIN JOURNEY', 'GROUP EXPEDITIONS', 'HIGH PASS TRAILS'],
            subheadline: 'YouthCamping was born from a passion for raw, untouched landscapes and authentic group travels across India and beyond.',
            backgroundImage: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=1600'
          }
        },
        {
          id: 'sec-about-[#D4541A]',
          type: 'rich_text',
          name: 'Story & Philosophy',
          visible: true,
          draft: {
            title: 'More Than A Travel Company — A Community Of Explorers',
            body: `<p>Founded in 2018, YouthCamping started as a group of passionate mountain enthusiasts exploring the high passes of Himachal Pradesh and Ladakh. Today, we are one of India's leading experiential travel platforms.</p><p>We believe that the best stories are written off the beaten path — sipping hot chai at 14,000 feet, stargazing at remote high-altitude campsites, or exploring ancient Himalayan villages.</p><p>Every itinerary is designed with meticulous detail — from handpicked cozy homestays to experienced local drivers and certified trip captains who ensure 100% safety and top-tier hospitality.</p>`
          }
        }
      ];
    case 'terms-and-conditions':
      return [
        {
          id: 'sec-terms-hero',
          type: 'hero',
          name: 'Hero Header',
          visible: true,
          draft: {
            tagline: 'LEGAL POLICIES & GUIDELINES',
            headlinePrefix: 'TERMS &',
            strikethroughWord: '',
            rotatingWords: ['CONDITIONS', 'POLICIES', 'AGREEMENTS'],
            subheadline: 'Please read these terms carefully before booking any adventure expedition with YouthCamping.',
            backgroundImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600'
          }
        },
        {
          id: 'sec-terms-content',
          type: 'rich_text',
          name: 'Terms & Conditions Document',
          visible: true,
          draft: {
            title: 'Terms & Conditions',
            body: `<h2>01. Declaration & Voluntary Participation</h2><p>By booking a trip with YouthCamping, you declare that you are participating in this adventure & leisure trip on your own free will and at your own risk. Remote mountain exploration carries inherent terrain and climate risks.</p><p>YouthCamping, its trip captains, and affiliated partners shall not be held liable for personal injury, illness, or loss/damage to personal baggage resulting from participant negligence or unapproved hazardous activities.</p><h2>02. Booking & Payment Terms</h2><p>A minimum deposit is required at time of booking to reserve seats. Full remaining balance must be cleared at least 7 days prior to departure date.</p><h2>03. Code of Conduct & Captain Authority</h2><p>Participants are expected to respect local mountain cultures, environmental guidelines, and fellow group travelers. The decision of the assigned trip captain is final in all matters of group safety.</p>`
          }
        }
      ];
    case 'cancellation-policy':
      return [
        {
          id: 'sec-cancel-hero',
          type: 'hero',
          name: 'Hero Header',
          visible: true,
          draft: {
            tagline: 'TRANSPARENT REFUND TIMELINES',
            headlinePrefix: 'CANCELLATION',
            strikethroughWord: '',
            rotatingWords: ['POLICY', 'REFUNDS', 'CREDITS'],
            subheadline: 'We understand plans can change. Here is our transparent refund and cancellation policy.',
            backgroundImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=1600'
          }
        },
        {
          id: 'sec-cancel-content',
          type: 'rich_text',
          name: 'Cancellation & Refund Terms',
          visible: true,
          draft: {
            title: 'Cancellation Policy',
            body: `<h2>01. Cancellation Request Timelines</h2><p>Cancellation 30+ days before trip start: 90% refund or 100% trip voucher.</p><p>Cancellation 15-30 days before trip start: 50% refund or 75% trip voucher.</p><p>Cancellation less than 15 days before trip start: Non-refundable due to pre-booked hotel, transport & permit commitments.</p><h2>02. Unforeseen Weather & Natural Calamities</h2><p>In case of trip cancellation due to unexpected landslides, snow blockages, or government advisories, a trip credit voucher of equal value will be issued for future travel within 12 months.</p>`
          }
        }
      ];
    case 'contact':
      return [
        {
          id: 'sec-contact-hero',
          type: 'hero',
          name: 'Hero Header',
          visible: true,
          draft: {
            tagline: '24/7 EXPEDITION SUPPORT',
            headlinePrefix: 'CONTACT',
            strikethroughWord: '',
            rotatingWords: ['US', 'OUR TEAM', 'CAPTAINS'],
            subheadline: 'Have questions about an upcoming trek or need custom group planning? Talk to our destination experts.',
            backgroundImage: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=1600'
          }
        },
        {
          id: 'sec-contact-details',
          type: 'rich_text',
          name: 'Contact Info & Office Address',
          visible: true,
          draft: {
            title: 'Office & Support Details',
            body: `<h2>Headquarters Address</h2><p>Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470</p><h2>Call & WhatsApp Hotline</h2><p>+91 99242 46267 (Available 10 AM - 8 PM IST)</p><h2>Email Assistance</h2><p>youthcampingmedia@gmail.com</p>`
          }
        }
      ];
    default:
      return [];
  }
};

exports.getDraftLayout = async (req, res) => {
  try {
    const { name } = req.params;
    console.log(`🔍 [PageBuilder] Fetching draft layout for: ${name}`);

    const page = await prisma.pageBuilder.findUnique({
      where: { name }
    });

    const defaultSections = getDefaultSectionsForPage(name);
    const existingSections = page?.draft || page?.sections || [];
    const sections = (existingSections && existingSections.length > 0) ? existingSections : defaultSections;

    res.json({
      success: true,
      data: {
        ...(page || {}),
        name: page?.name || name,
        sections: sections
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

// Granular section update — merge content into a single section in the draft array
exports.updateSection = async (req, res) => {
  try {
    const { name, sectionId } = req.params;
    const { content, draft: draftContent, visible, name: sectionName } = req.body;

    const page = await prisma.pageBuilder.findUnique({ where: { name } });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const sections = Array.isArray(page.draft) ? [...page.draft] : [];
    const idx = sections.findIndex((s) => s && s.id === sectionId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    // Merge provided fields
    if (content !== undefined) sections[idx].content = content;
    if (draftContent !== undefined) sections[idx].draft = draftContent;
    if (visible !== undefined) sections[idx].visible = visible;
    if (sectionName !== undefined) sections[idx].name = sectionName;

    const updated = await prisma.pageBuilder.update({
      where: { name },
      data: { draft: sections, updatedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(`🔥 [PageBuilder updateSection] name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: 'Failed to update section', error: error.message });
  }
};

// Reorder sections — accept [{ id, order }], sort draft array accordingly
exports.reorderSections = async (req, res) => {
  try {
    const { name } = req.params;
    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ success: false, message: 'Orders array is required' });
    }

    const page = await prisma.pageBuilder.findUnique({ where: { name } });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const sections = Array.isArray(page.draft) ? [...page.draft] : [];

    // Build order map: sectionId → desired order index
    const orderMap = new Map();
    for (const entry of orders) {
      orderMap.set(entry.id, entry.order);
    }

    // Sort sections by the provided order; sections not in orderMap keep their current position at the end
    sections.sort((a, b) => {
      const orderA = orderMap.has(a?.id) ? orderMap.get(a.id) : Infinity;
      const orderB = orderMap.has(b?.id) ? orderMap.get(b.id) : Infinity;
      return orderA - orderB;
    });

    const updated = await prisma.pageBuilder.update({
      where: { name },
      data: { draft: sections, updatedAt: new Date() },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(`🔥 [PageBuilder reorderSections] name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: 'Failed to reorder sections', error: error.message });
  }
};

// Toggle section visibility — flip the `visible` boolean
exports.toggleSectionVisibility = async (req, res) => {
  try {
    const { name, sectionId } = req.params;

    const page = await prisma.pageBuilder.findUnique({ where: { name } });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const sections = Array.isArray(page.draft) ? [...page.draft] : [];
    const idx = sections.findIndex((s) => s && s.id === sectionId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    sections[idx].visible = sections[idx].visible === false ? true : false;

    const updated = await prisma.pageBuilder.update({
      where: { name },
      data: { draft: sections, updatedAt: new Date() },
    });

    res.json({ success: true, data: updated, toggled: sections[idx].visible });
  } catch (error) {
    console.error(`🔥 [PageBuilder toggleVisibility] name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: 'Failed to toggle section visibility', error: error.message });
  }
};

// Duplicate section — deep clone with new unique ID, insert right after original
exports.duplicateSection = async (req, res) => {
  try {
    const { name, sectionId } = req.params;

    const page = await prisma.pageBuilder.findUnique({ where: { name } });
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const sections = Array.isArray(page.draft) ? [...page.draft] : [];
    const idx = sections.findIndex((s) => s && s.id === sectionId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Section not found' });
    }

    const original = sections[idx];
    const clone = JSON.parse(JSON.stringify(original));
    clone.id = `sec-${original.type || 'dup'}-${Date.now()}`;
    clone.name = `${clone.name || 'Section'} (Copy)`;

    // Insert clone right after the original
    sections.splice(idx + 1, 0, clone);

    const updated = await prisma.pageBuilder.update({
      where: { name },
      data: { draft: sections, updatedAt: new Date() },
    });

    res.json({ success: true, data: updated, duplicatedSection: clone });
  } catch (error) {
    console.error(`🔥 [PageBuilder duplicateSection] name=${req.params.name}:`, error);
    res.status(500).json({ success: false, message: 'Failed to duplicate section', error: error.message });
  }
};

