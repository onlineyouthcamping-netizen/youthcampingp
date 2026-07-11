const mongoose = require('mongoose');
require('dotenv').config();
const PageLayout = require('../src/models/PageLayout');
const Trip = require('../src/models/Trip');

const updateLayout = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const trips = await Trip.find({
      title: { $in: [
        "Manali Kasol Amritsar Backpacking Trip",
        "Winter Spiti Road Trip",
        "Kedarnath Badrinath - Tungnath & Rishikesh",
        "Leh Ladakh Bike Expedition 2026",
        "Spiti Valley Road Trip"
      ]}
    });

    const tripIds = trips.map(t => t._id.toString());
    console.log('Found Trip IDs:', tripIds);

    const layout = await PageLayout.findOne({ name: 'home' });
    if (!layout) {
      console.log('Home layout not found');
      process.exit(1);
    }

    // Update featured_trips and trending_trips sections
    layout.sections = layout.sections.map(section => {
      if (section.type === 'featured_trips' || section.type === 'trending_trips') {
        return {
          ...section,
          draft: {
            ...section.draft,
            tripIds: tripIds,
            title: section.type === 'featured_trips' ? 'Featured Expeditions' : 'Trending Now'
          },
          content: {
            ...section.content,
            tripIds: tripIds,
            title: section.type === 'featured_trips' ? 'Featured Expeditions' : 'Trending Now'
          }
        };
      }
      return section;
    });

    layout.isDraft = false;
    layout.publishedAt = new Date();
    await layout.save();

    console.log('Home layout updated and published with new trip IDs!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating layout:', err);
    process.exit(1);
  }
};

updateLayout();
