const { prisma } = require('../lib/prisma');

const SETTINGS_KEY = 'global_settings';

const defaultFooterConfig = {
  brandName: "YOUTHCAMPING",
  address: "Money Plant High Street, A 738, Jagatpur Rd, Gota, Ahmedabad, Gujarat 382470",
  phone: "+91-99242 46267",
  email: "info@youthcamping.com",
  website: "youthcamping.in",
  copyright: "ALL RIGHTS RESERVED.",
  logoUrl: "/logo-stacked.png",
  showSocial: true,
  showAddress: true,
  showContact: true,
  showCopyright: true,
  socialLinks: [
    { platform: "facebook", url: "https://facebook.com/youthcamping" },
    { platform: "instagram", url: "https://instagram.com/youthcamping" },
    { platform: "linkedin", url: "https://linkedin.com/company/youthcamping" },
    { platform: "youtube", url: "https://youtube.com/youthcamping" }
  ],
  columns: [
    {
      id: "col-intl",
      title: "International Trips",
      visible: true,
      links: [
        { id: "l-intl-1", label: "Europe", href: "/trips", visible: true },
        { id: "l-intl-2", label: "Bali", href: "/trips", visible: true },
        { id: "l-intl-3", label: "Vietnam", href: "/trips", visible: true },
        { id: "l-intl-4", label: "Thailand", href: "/trips", visible: true },
        { id: "l-intl-5", label: "Kazakhstan", href: "/trips", visible: true },
        { id: "l-intl-6", label: "Singapore", href: "/trips", visible: true },
        { id: "l-intl-7", label: "Bhutan", href: "/trips", visible: true },
        { id: "l-intl-8", label: "Maldives", href: "/trips", visible: true },
        { id: "l-intl-9", label: "Dubai", href: "/trips", visible: true },
        { id: "l-intl-10", label: "Malaysia", href: "/trips", visible: true }
      ]
    },
    {
      id: "col-india",
      title: "India Trips",
      visible: true,
      links: [
        { id: "l-ind-1", label: "Ladakh", href: "/trips", visible: true },
        { id: "l-ind-2", label: "Spiti Valley", href: "/trips", visible: true },
        { id: "l-ind-3", label: "Meghalaya", href: "/trips", visible: true },
        { id: "l-ind-4", label: "Kashmir", href: "/trips", visible: true },
        { id: "l-ind-5", label: "Himachal Pradesh", href: "/trips", visible: true },
        { id: "l-ind-6", label: "Andaman", href: "/trips", visible: true },
        { id: "l-ind-7", label: "Kerala", href: "/trips", visible: true },
        { id: "l-ind-8", label: "Rajasthan", href: "/trips", visible: true },
        { id: "l-ind-9", label: "Nagaland", href: "/trips", visible: true }
      ]
    },
    {
      id: "col-special",
      title: "YouthCamping Special",
      visible: true,
      links: [
        { id: "l-sp-1", label: "Community Trips", href: "/trips", visible: true },
        { id: "l-sp-2", label: "Honeymoon Trips", href: "/trips", visible: true },
        { id: "l-sp-3", label: "Corporate Trips", href: "/trips", visible: true },
        { id: "l-sp-4", label: "Weekend Getaways", href: "/trips", visible: true }
      ]
    },
    {
      id: "col-quick",
      title: "Quick Links",
      visible: true,
      links: [
        { id: "l-ql-1", label: "About Us", href: "/about-us", visible: true },
        { id: "l-ql-2", label: "Privacy Policy", href: "/privacy", visible: true },
        { id: "l-ql-3", label: "Terms & Conditions", href: "/terms", visible: true },
        { id: "l-ql-4", label: "Customer Success & Support", href: "/questions", visible: true },
        { id: "l-ql-5", label: "Disclaimer", href: "/terms#disclaimer", visible: true },
        { id: "l-ql-6", label: "Careers", href: "/contact", visible: true },
        { id: "l-ql-7", label: "Blogs", href: "/blogs", visible: true },
        { id: "l-ql-8", label: "Payments", href: "/trips", visible: true }
      ]
    }
  ]
};

const settingsCache = new Map();
const SETTINGS_CACHE_TTL = 10 * 60 * 1000;

exports.getSettings = async (req, res) => {
  try {
    const cached = settingsCache.get('settings');
    if (cached && Date.now() < cached.expiresAt) {
      return res.json({ success: true, data: cached.data });
    }

    const setting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY }
    });

    if (!setting) {
      const defaultData = {
        bookingForm: {
          roomSharingOptions: [
            { label: 'Triple Sharing', priceAdjustment: 0 },
            { label: 'Twin Sharing', priceAdjustment: 1500 },
            { label: 'Quad Sharing', priceAdjustment: -1000 }
          ],
          trainOptions: [
            { label: 'Non AC', priceAdjustment: 0 },
            { label: '3AC', priceAdjustment: 2500 },
            { label: 'No', priceAdjustment: -1500 }
          ],
          submitButtonText: 'Confirm Booking',
          gstOption: 'full'
        },
        inquiryPopup: {
          enabled: true,
          delay: 12,
          title: "Plan Your Next Trip",
          description: "Connect with our destination experts"
        }
      };
      settingsCache.set('settings', { data: defaultData, expiresAt: Date.now() + SETTINGS_CACHE_TTL });
      return res.json({ success: true, data: defaultData });
    }

    settingsCache.set('settings', { data: setting.value, expiresAt: Date.now() + SETTINGS_CACHE_TTL });
    res.json({ success: true, data: setting.value });
  } catch (error) {
    console.error("Settings Fetch Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicSettings = async (req, res) => {
  try {
    const cached = settingsCache.get('public_settings');
    if (cached && Date.now() < cached.expiresAt) {
      res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=600');
      return res.json({ success: true, data: cached.data });
    }

    const setting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY },
      select: { value: true }
    });
    const value = setting?.value && typeof setting.value === 'object'
      ? setting.value
      : {};

    const data = {
      navbar: value.navbar,
      footer: value.footer,
      footerConfig: value.footerConfig || defaultFooterConfig,
      contactPhone: value.contactPhone,
      contactEmail: value.contactEmail,
      address: value.address,
      inquiryPopup: value.inquiryPopup,
      theme: value.theme,
    };

    settingsCache.set('public_settings', { data, expiresAt: Date.now() + SETTINGS_CACHE_TTL });
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=600');
    res.json({ success: true, data });
  } catch (error) {
    console.error('Public Settings Fetch Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const settingsData = req.body;

    const setting = await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: settingsData },
      create: {
        key: SETTINGS_KEY,
        value: settingsData
      }
    });

    res.json({ success: true, data: setting.value });
  } catch (error) {
    console.error("Settings Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDraftSettings = async (req, res) => {
  // For now, settings don't have a draft state in this implementation
  // but we can add it later if needed.
  return exports.getSettings(req, res);
};

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

exports.uploadHeroVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file provided' });
    }

    const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    let uploadResult;

    if (isCloudinaryConfigured) {
      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'video',
            folder: 'youthcamping/hero',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });
    } else {
      // Fallback local storage
      const uploadDir = path.join(__dirname, '../../public/uploads/hero');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filename = Date.now() + '-' + req.file.originalname.replace(/\s+/g, '-');
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      uploadResult = {
        secure_url: `/uploads/hero/${filename}`,
        public_id: `local_${filename}`
      };
    }

    const videoUrl = uploadResult.secure_url;
    const publicId = uploadResult.public_id;
    const posterUrl = videoUrl.startsWith('http')
      ? videoUrl.replace(/\.[^/.]+$/, '.jpg')
      : '';

    // Fetch existing settings
    const existingSetting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY }
    });

    const settingsData = existingSetting && existingSetting.value ? { ...existingSetting.value } : {};

    // Set video fields
    settingsData.heroVideoUrl = videoUrl;
    settingsData.heroVideoPublicId = publicId;
    settingsData.heroVideoPosterUrl = posterUrl;
    settingsData.heroVideoEnabled = true; // Auto-enable on successful upload

    const updatedSetting = await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: settingsData },
      create: {
        key: SETTINGS_KEY,
        value: settingsData
      }
    });

    res.json({ success: true, data: updatedSetting.value });
  } catch (error) {
    console.error("Hero Video Upload Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to upload video" });
  }
};

exports.deleteHeroVideo = async (req, res) => {
  try {
    const existingSetting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY }
    });

    if (!existingSetting || !existingSetting.value) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    const settingsData = { ...existingSetting.value };
    const publicId = settingsData.heroVideoPublicId;

    if (publicId) {
      if (publicId.startsWith('local_')) {
        const filename = publicId.replace(/^local_/, '');
        const filePath = path.join(__dirname, '../../public/uploads/hero', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } else {
        const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
        if (isCloudinaryConfigured) {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
        }
      }
    }

    // Clear video fields
    settingsData.heroVideoUrl = null;
    settingsData.heroVideoPublicId = null;
    settingsData.heroVideoPosterUrl = null;
    settingsData.heroVideoEnabled = false;

    const updatedSetting = await prisma.setting.update({
      where: { key: SETTINGS_KEY },
      data: { value: settingsData }
    });

    res.json({ success: true, data: updatedSetting.value });
  } catch (error) {
    console.error("Hero Video Delete Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to delete video" });
  }
};

exports.toggleHeroVideo = async (req, res) => {
  try {
    const existingSetting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY }
    });

    if (!existingSetting || !existingSetting.value) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    const settingsData = { ...existingSetting.value };
    settingsData.heroVideoEnabled = !settingsData.heroVideoEnabled;

    const updatedSetting = await prisma.setting.update({
      where: { key: SETTINGS_KEY },
      data: { value: settingsData }
    });

    res.json({ success: true, data: updatedSetting.value });
  } catch (error) {
    console.error("Hero Video Toggle Error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to toggle video status" });
  }
};

const sanitizeUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('/')) {
    if (/[<>"'`]/.test(trimmed)) {
      return '/';
    }
    return trimmed;
  }

  if (trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch (_) {
      return '';
    }
  }

  if (trimmed.startsWith('mailto:')) {
    const emailPart = trimmed.slice(7);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailPart)) {
      return trimmed;
    }
    return '';
  }

  if (trimmed.startsWith('tel:')) {
    const phonePart = trimmed.slice(4);
    if (/^[+\d\s-]+$/.test(phonePart)) {
      return trimmed;
    }
    return '';
  }

  return '';
};

const sanitizeFooterPayload = (payload) => {
  const sanitized = {};

  sanitized.brandName = String(payload.brandName || 'YOUTHCAMPING').trim().slice(0, 100);
  sanitized.address = String(payload.address || '').trim().slice(0, 500);
  sanitized.phone = String(payload.phone || '').trim().slice(0, 50);
  sanitized.email = String(payload.email || '').trim().slice(0, 100);
  sanitized.website = String(payload.website || '').trim().slice(0, 100);
  sanitized.copyright = String(payload.copyright || '').trim().slice(0, 200);
  sanitized.logoUrl = sanitizeUrl(payload.logoUrl) || '/logo-stacked.png';

  sanitized.showSocial = Boolean(payload.showSocial);
  sanitized.showAddress = Boolean(payload.showAddress);
  sanitized.showContact = Boolean(payload.showContact);
  sanitized.showCopyright = Boolean(payload.showCopyright);

  sanitized.socialLinks = [];
  if (Array.isArray(payload.socialLinks)) {
    const linksToSanitize = payload.socialLinks.slice(0, 20);
    for (const item of linksToSanitize) {
      if (item && typeof item === 'object') {
        const platform = String(item.platform || '').toLowerCase().trim().slice(0, 50);
        const url = sanitizeUrl(item.url);
        if (platform && url) {
          sanitized.socialLinks.push({ platform, url });
        }
      }
    }
  }

  sanitized.columns = [];
  if (Array.isArray(payload.columns)) {
    const colsToSanitize = payload.columns.slice(0, 6);
    for (const col of colsToSanitize) {
      if (col && typeof col === 'object') {
        const colId = String(col.id || `col-${Date.now()}-${Math.random()}`).trim().slice(0, 50);
        const colTitle = String(col.title || '').trim().slice(0, 100);
        const colVisible = Boolean(col.visible !== false);

        const colLinks = [];
        if (Array.isArray(col.links)) {
          const linksToSanitize = col.links.slice(0, 15);
          for (const link of linksToSanitize) {
            if (link && typeof link === 'object') {
              const linkId = String(link.id || `l-${Date.now()}-${Math.random()}`).trim().slice(0, 50);
              const linkLabel = String(link.label || '').trim().slice(0, 100);
              const linkHref = sanitizeUrl(link.href);
              const linkVisible = Boolean(link.visible !== false);

              if (linkLabel && linkHref) {
                colLinks.push({
                  id: linkId,
                  label: linkLabel,
                  href: linkHref,
                  visible: linkVisible
                });
              }
            }
          }
        }

        sanitized.columns.push({
          id: colId,
          title: colTitle,
          visible: colVisible,
          links: colLinks
        });
      }
    }
  }

  return sanitized;
};

exports.getFooterSettings = async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY }
    });

    if (!setting || !setting.value || !setting.value.footerConfig) {
      return res.json({ success: true, data: defaultFooterConfig });
    }

    res.json({ success: true, data: setting.value.footerConfig });
  } catch (error) {
    console.error("Footer Settings Fetch Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFooterSettings = async (req, res) => {
  try {
    const rawPayload = req.body;
    const sanitized = sanitizeFooterPayload(rawPayload);

    // Fetch existing settings
    const existingSetting = await prisma.setting.findUnique({
      where: { key: SETTINGS_KEY }
    });

    const settingsData = existingSetting && existingSetting.value ? { ...existingSetting.value } : {};

    settingsData.footerConfig = sanitized;
    settingsData.footer = {
      logoUrl: sanitized.logoUrl,
      tagline: settingsData.footer?.tagline || '',
      email: sanitized.email,
      phone: sanitized.phone,
      copyright: sanitized.copyright,
      address: sanitized.address,
      links: (sanitized.columns.find(c => c.title === 'Quick Links' || c.id === 'col-quick')?.links || []).map(l => ({
        label: l.label,
        href: l.href
      }))
    };
    settingsData.contactPhone = sanitized.phone;
    settingsData.contactEmail = sanitized.email;
    settingsData.address = sanitized.address;

    const updatedSetting = await prisma.setting.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: settingsData },
      create: {
        key: SETTINGS_KEY,
        value: settingsData
      }
    });

    res.json({ success: true, data: updatedSetting.value.footerConfig });
  } catch (error) {
    console.error("Footer Settings Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
