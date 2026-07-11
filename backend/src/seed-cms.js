require('dotenv').config();
const mongoose = require('mongoose');
const PageLayout = require('./models/PageLayout');
const Trip = require('./models/Trip');

const seedCMS = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for PageLayout Seeding...');

    const allTrips = await Trip.find({});
    const vietnamTrips = allTrips.filter(t => t.category === 'vietnam').map(t => t._id);
    const baliTrips = allTrips.filter(t => t.category === 'bali').map(t => t._id);
    const himalayanTrips = allTrips.filter(t => t.category === 'himalayan' || t.category === 'spiritual').map(t => t._id);

    const homeLayout = {
      name: 'home',
      isDraft: false,
      publishedAt: new Date(),
      sections: [
        {
          id: 'hero-slider-1',
          name: 'Hero Slider',
          type: 'hero',
          order: 0,
          visible: true,
          content: {
            slides: [
              {
                image: 'https://images.unsplash.com/photo-1595054350563-397193f8e5b4',
                subtitle: 'Experiences for',
                title: '[s]Tourist[/s] Explorers'
              },
              {
                image: 'https://images.unsplash.com/photo-1528127269322-539801943592',
                subtitle: 'Discover the',
                title: 'Hidden Vietnam'
              },
              {
                image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4',
                subtitle: 'Adventure in',
                title: 'Bali Paradise'
              }
            ]
          }
        },
        {
          id: 'vietnam-sec-1',
          name: 'Vietnam Packages',
          type: 'featured',
          order: 1,
          visible: true,
          content: {
            title: 'Vietnam Tour Packages',
            tripIds: vietnamTrips
          }
        },
        {
          id: 'bali-sec-1',
          name: 'Bali Packages',
          type: 'featured',
          order: 2,
          visible: true,
          content: {
            title: 'Bali Tour Packages',
            tripIds: baliTrips
          }
        },
        {
          id: 'himalayan-sec-1',
          name: 'Himalayan Escapes',
          type: 'featured',
          order: 3,
          visible: true,
          content: {
            title: 'Himalayan Escapes',
            tripIds: himalayanTrips
          }
        }
      ]
    };

    await PageLayout.findOneAndUpdate({ name: 'home' }, homeLayout, { upsert: true, new: true });
    console.log('PageLayout Seeded successfully! Home page should now show the slider.');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedCMS();
