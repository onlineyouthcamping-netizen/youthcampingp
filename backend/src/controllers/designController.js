const { prisma } = require('../lib/prisma');

// Helper to get raw active theme config (which acts as a fallback)
const getThemeFallback = async () => {
  try {
    const theme = await prisma.theme.findUnique({
      where: { name: 'primary' }
    });
    return theme?.config || {};
  } catch (err) {
    console.error('Error fetching fallback theme:', err);
    return {};
  }
};

const getConfig = async (req, res) => {
  try {
    const { scope } = req.params;
    const status = req.query.status || 'draft'; // 'draft' | 'published'

    const configRecord = await prisma.designConfig.findUnique({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status
        }
      }
    });

    res.json({
      success: true,
      data: configRecord ? configRecord.config : {}
    });
  } catch (error) {
    console.error('Error getting design config:', error);
    res.status(500).json({ success: false, message: 'Error getting design config' });
  }
};

const getMergedConfig = async (req, res) => {
  try {
    const { scope } = req.params; // e.g. "section:homepage:hero" or "page:homepage" or "global"
    
    // Fetch fallback theme config first
    const themeFallback = await getThemeFallback();

    // Fetch published configs in order: global, page, section
    const globalConfigRecord = await prisma.designConfig.findUnique({
      where: { tenantId_scope_status: { tenantId: 'default', scope: 'global', status: 'published' } }
    });
    const globalConfig = globalConfigRecord?.config || {};

    let pageConfig = {};
    let sectionConfig = {};

    if (scope.startsWith('page:') || scope.startsWith('section:')) {
      const pageSlug = scope.split(':')[1];
      const pageConfigRecord = await prisma.designConfig.findUnique({
        where: { tenantId_scope_status: { tenantId: 'default', scope: `page:${pageSlug}`, status: 'published' } }
      });
      pageConfig = pageConfigRecord?.config || {};
    }

    if (scope.startsWith('section:')) {
      const parts = scope.split(':');
      const pageSlug = parts[1];
      const sectionId = parts[2];
      const sectionConfigRecord = await prisma.designConfig.findUnique({
        where: { tenantId_scope_status: { tenantId: 'default', scope: `section:${pageSlug}:${sectionId}`, status: 'published' } }
      });
      sectionConfig = sectionConfigRecord?.config || {};
    }

    // Merge configurations in order of increasing specificity
    const merged = {
      ...themeFallback,
      ...globalConfig,
      ...pageConfig,
      ...sectionConfig
    };

    res.json({
      success: true,
      data: merged
    });
  } catch (error) {
    console.error('Error getting merged design config:', error);
    res.status(500).json({ success: false, message: 'Error getting merged design config' });
  }
};

const saveDraft = async (req, res) => {
  try {
    const { scope } = req.params;
    const config = req.body;
    const adminUser = req.user;

    // Get current draft version if exists
    const currentDraft = await prisma.designConfig.findUnique({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'draft'
        }
      }
    });

    const nextVersion = currentDraft ? currentDraft.version : 1;

    // Upsert draft configuration
    const draftRecord = await prisma.designConfig.upsert({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'draft'
        }
      },
      update: {
        config,
        version: nextVersion,
        createdBy: adminUser?.name || 'Admin'
      },
      create: {
        scope,
        config,
        status: 'draft',
        version: nextVersion,
        createdBy: adminUser?.name || 'Admin'
      }
    });

    // Write a draft log to DesignVersion
    await prisma.designVersion.create({
      data: {
        scope,
        config,
        version: nextVersion,
        action: 'draft_saved',
        changedBy: adminUser?.id,
        changedByName: adminUser?.name || 'Admin',
        changeSummary: `Saved draft configuration for ${scope}`,
        affectedPages: scope.startsWith('page:') ? [scope.split(':')[1]] : scope.startsWith('section:') ? [scope.split(':')[1]] : ['global'],
        affectedSections: scope.startsWith('section:') ? [scope.split(':')[2]] : []
      }
    });

    res.json({
      success: true,
      data: draftRecord.config
    });
  } catch (error) {
    console.error('Error saving draft design config:', error);
    res.status(500).json({ success: false, message: 'Error saving draft design config' });
  }
};

const publishConfig = async (req, res) => {
  try {
    const { scope } = req.params;
    const adminUser = req.user;

    // Fetch the draft config to publish
    const draftRecord = await prisma.designConfig.findUnique({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'draft'
        }
      }
    });

    if (!draftRecord) {
      return res.status(400).json({
        success: false,
        message: 'No draft configuration found to publish.'
      });
    }

    const nextPubVersion = draftRecord.version + 1;

    // Copy draft config to published status
    const publishedRecord = await prisma.designConfig.upsert({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'published'
        }
      },
      update: {
        config: draftRecord.config,
        version: nextPubVersion,
        createdBy: adminUser?.name || 'Admin'
      },
      create: {
        scope,
        config: draftRecord.config,
        status: 'published',
        version: nextPubVersion,
        createdBy: adminUser?.name || 'Admin'
      }
    });

    // Increment draft record version too so next edits start clean
    await prisma.designConfig.update({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'draft'
        }
      },
      data: {
        version: nextPubVersion
      }
    });

    // Create DesignVersion for publish event
    await prisma.designVersion.create({
      data: {
        scope,
        config: draftRecord.config,
        version: nextPubVersion,
        action: 'published',
        changedBy: adminUser?.id,
        changedByName: adminUser?.name || 'Admin',
        changeSummary: `Published configuration for ${scope}`,
        affectedPages: scope.startsWith('page:') ? [scope.split(':')[1]] : scope.startsWith('section:') ? [scope.split(':')[1]] : ['global'],
        affectedSections: scope.startsWith('section:') ? [scope.split(':')[2]] : []
      }
    });

    // Backward compatibility sync:
    // If scope is global, write global config keys back to Theme model config so older pages still receive updates
    if (scope === 'global') {
      const currentTheme = await prisma.theme.findUnique({
        where: { name: 'primary' }
      });
      const themeConfig = currentTheme?.config || {};
      const mergedConfig = { ...themeConfig, ...draftRecord.config };
      await prisma.theme.upsert({
        where: { name: 'primary' },
        update: { config: mergedConfig },
        create: { name: 'primary', config: mergedConfig }
      });
    }

    res.json({
      success: true,
      data: publishedRecord.config,
      version: nextPubVersion
    });
  } catch (error) {
    console.error('Error publishing design config:', error);
    res.status(500).json({ success: false, message: 'Error publishing design config' });
  }
};

const discardDraft = async (req, res) => {
  try {
    const { scope } = req.params;

    // Delete draft
    await prisma.designConfig.deleteMany({
      where: {
        tenantId: 'default',
        scope,
        status: 'draft'
      }
    });

    res.json({
      success: true,
      message: 'Draft discarded successfully'
    });
  } catch (error) {
    console.error('Error discarding draft:', error);
    res.status(500).json({ success: false, message: 'Error discarding draft' });
  }
};

const getVersions = async (req, res) => {
  try {
    const { scope } = req.params;

    const versions = await prisma.designVersion.findMany({
      where: {
        tenantId: 'default',
        scope
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(500).json({ success: false, message: 'Error getting version history' });
  }
};

const restoreVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    const versionRecord = await prisma.designVersion.findUnique({
      where: { id }
    });

    if (!versionRecord) {
      return res.status(404).json({
        success: false,
        message: 'Version record not found'
      });
    }

    const { scope, config, version } = versionRecord;
    const restoredVersion = version + 1;

    // Set published config to the version's config
    const publishedRecord = await prisma.designConfig.upsert({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'published'
        }
      },
      update: {
        config,
        version: restoredVersion,
        createdBy: adminUser?.name || 'Admin'
      },
      create: {
        scope,
        config,
        status: 'published',
        version: restoredVersion,
        createdBy: adminUser?.name || 'Admin'
      }
    });

    // Also update draft to match this configuration
    await prisma.designConfig.upsert({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'draft'
        }
      },
      update: {
        config,
        version: restoredVersion,
        createdBy: adminUser?.name || 'Admin'
      },
      create: {
        scope,
        config,
        status: 'draft',
        version: restoredVersion,
        createdBy: adminUser?.name || 'Admin'
      }
    });

    // Create DesignVersion for restoration event
    await prisma.designVersion.create({
      data: {
        scope,
        config,
        version: restoredVersion,
        action: 'restored',
        changedBy: adminUser?.id,
        changedByName: adminUser?.name || 'Admin',
        changeSummary: `Restored to version ${version} config for ${scope}`,
        affectedPages: scope.startsWith('page:') ? [scope.split(':')[1]] : scope.startsWith('section:') ? [scope.split(':')[1]] : ['global'],
        affectedSections: scope.startsWith('section:') ? [scope.split(':')[2]] : []
      }
    });

    // If global, update Theme table too
    if (scope === 'global') {
      const currentTheme = await prisma.theme.findUnique({
        where: { name: 'primary' }
      });
      const themeConfig = currentTheme?.config || {};
      const mergedConfig = { ...themeConfig, ...config };
      await prisma.theme.upsert({
        where: { name: 'primary' },
        update: { config: mergedConfig },
        create: { name: 'primary', config: mergedConfig }
      });
    }

    res.json({
      success: true,
      data: publishedRecord.config,
      version: restoredVersion
    });
  } catch (error) {
    console.error('Error restoring design version:', error);
    res.status(500).json({ success: false, message: 'Error restoring design version' });
  }
};

const compareVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const { compareTo } = req.query;

    const versionA = await prisma.designVersion.findUnique({ where: { id } });
    if (!versionA) {
      return res.status(404).json({ success: false, message: 'Version A not found' });
    }

    let versionB = null;
    if (compareTo) {
      versionB = await prisma.designVersion.findUnique({ where: { id: compareTo } });
    } else {
      // Find the previous version for this scope
      versionB = await prisma.designVersion.findFirst({
        where: {
          tenantId: 'default',
          scope: versionA.scope,
          version: { lt: versionA.version }
        },
        orderBy: {
          version: 'desc'
        }
      });
    }

    res.json({
      success: true,
      data: {
        versionA,
        versionB
      }
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({ success: false, message: 'Error comparing versions' });
  }
};

const getPresets = async (req, res) => {
  try {
    const { category } = req.query;

    const query = { tenantId: 'default' };
    if (category) query.category = category;

    const presets = await prisma.designPreset.findMany({
      where: query,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: presets
    });
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ success: false, message: 'Error fetching presets' });
  }
};

const savePreset = async (req, res) => {
  try {
    const { name, category, config } = req.body;
    const adminUser = req.user;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Preset name is required' });
    }

    const preset = await prisma.designPreset.upsert({
      where: {
        tenantId_name: {
          tenantId: 'default',
          name
        }
      },
      update: {
        category: category || 'global',
        config,
        createdBy: adminUser?.name || 'Admin'
      },
      create: {
        name,
        category: category || 'global',
        config,
        createdBy: adminUser?.name || 'Admin'
      }
    });

    res.json({
      success: true,
      data: preset
    });
  } catch (error) {
    console.error('Error saving preset:', error);
    res.status(500).json({ success: false, message: 'Error saving preset' });
  }
};

const deletePreset = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.designPreset.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Preset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ success: false, message: 'Error deleting preset' });
  }
};

const applyPreset = async (req, res) => {
  try {
    const { id } = req.params;
    const { scope } = req.body;
    const adminUser = req.user;

    const preset = await prisma.designPreset.findUnique({
      where: { id }
    });

    if (!preset) {
      return res.status(404).json({ success: false, message: 'Preset not found' });
    }

    const currentDraft = await prisma.designConfig.findUnique({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'draft'
        }
      }
    });

    const nextVersion = currentDraft ? currentDraft.version : 1;

    const draftRecord = await prisma.designConfig.upsert({
      where: {
        tenantId_scope_status: {
          tenantId: 'default',
          scope,
          status: 'draft'
        }
      },
      update: {
        config: preset.config,
        version: nextVersion,
        createdBy: adminUser?.name || 'Admin'
      },
      create: {
        scope,
        config: preset.config,
        status: 'draft',
        version: nextVersion,
        createdBy: adminUser?.name || 'Admin'
      }
    });

    res.json({
      success: true,
      data: draftRecord.config
    });
  } catch (error) {
    console.error('Error applying preset:', error);
    res.status(500).json({ success: false, message: 'Error applying preset' });
  }
};

module.exports = {
  getConfig,
  getMergedConfig,
  saveDraft,
  publishConfig,
  discardDraft,
  getVersions,
  restoreVersion,
  compareVersions,
  getPresets,
  savePreset,
  deletePreset,
  applyPreset
};
