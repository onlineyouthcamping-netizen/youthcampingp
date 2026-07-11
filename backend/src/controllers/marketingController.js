const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, '..', '..', 'marketingData.json');

// Helper to read data
const getMarketingData = () => {
  try {
    if (!fs.existsSync(dataFile)) {
      return { ideas: [], campaigns: [], learnings: {}, assets: {}, reports: [] };
    }
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (e) {
    return { ideas: [], campaigns: [], learnings: {}, assets: {}, reports: [] };
  }
};

// Helper to save data
const saveMarketingData = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

exports.getOverview = async (req, res, next) => {
  try {
    const data = getMarketingData();
    // Return MKA overview specifically
    res.json({
      success: true,
      data: {
        spend: 5234500,
        leads: 4823,
        bookings: 362,
        revenue: 6248000,
        roas: 11.94,
        campaigns: data.campaigns,
        bestCreatives: data.learnings.campaign_2?.bestCreatives || [],
        recentLearnings: data.learnings.campaign_2?.whatWorked.slice(0, 3) || []
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getContentStudio = async (req, res, next) => {
  try {
    const data = getMarketingData();
    res.json({
      success: true,
      data: {
        ideas: data.ideas,
        stats: {
          ideas: data.ideas.length + 21, // Seeded 28 total
          inProduction: 14,
          readyToReview: 6,
          readyToPublish: 5,
          published: 22
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createIdea = async (req, res, next) => {
  try {
    const { title, description, trip, category, priority, status, assignedTo, ...rest } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Idea Title is required' });
    }

    const data = getMarketingData();
    const newIdea = {
      id: `idea_${Date.now()}`,
      title,
      description: description || '',
      trip: trip || 'All Trips',
      category: category || 'Reel',
      priority: priority || 'Medium',
      status: status || 'New Idea',
      assignedTo: assignedTo || 'Vidhi Patel',
      addedOn: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      ...rest
    };

    data.ideas.unshift(newIdea);
    saveMarketingData(data);

    res.json({ success: true, data: newIdea });
  } catch (error) {
    next(error);
  }
};

exports.updateIdea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = getMarketingData();
    const idx = data.ideas.findIndex(i => i.id === id);
    if (idx !== -1) {
      data.ideas[idx] = { ...data.ideas[idx], ...req.body };
      saveMarketingData(data);
      res.json({ success: true, data: data.ideas[idx] });
    } else {
      res.status(404).json({ success: false, message: 'Idea not found' });
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteIdea = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = getMarketingData();
    data.ideas = data.ideas.filter(i => i.id !== id);
    saveMarketingData(data);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const data = getMarketingData();
    res.json({ success: true, data: data.campaigns });
  } catch (error) {
    next(error);
  }
};

exports.getLearnings = async (req, res, next) => {
  try {
    const data = getMarketingData();
    const campaignId = req.params.campaignId || 'campaign_2';
    const learnings = data.learnings[campaignId] || data.learnings['campaign_2'];
    res.json({ success: true, data: learnings });
  } catch (error) {
    next(error);
  }
};

exports.getAssets = async (req, res, next) => {
  try {
    const data = getMarketingData();
    const campaignId = req.params.campaignId || 'campaign_2';
    const assets = data.assets[campaignId] || data.assets['campaign_2'];
    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const data = getMarketingData();
    res.json({ success: true, data: data.reports });
  } catch (error) {
    next(error);
  }
};
