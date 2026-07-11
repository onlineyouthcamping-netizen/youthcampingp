require('dotenv').config();
const mongoose = require('mongoose');
const Page = require('./models/Page');

const pages = [
  {
    title: 'Home',
    slug: 'home',
    sections: [
      {
        id: 'hero-1',
        type: 'videohero',
        data: {
          title: 'The World Awaits',
          subtitle: 'Experience Travel Like Never Before',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'
        }
      },
      {
        id: 'trips-1',
        type: 'trips',
        data: {
          title: 'Trending Trips'
        }
      },
      {
        id: 'banner-1',
        type: 'banner',
        data: {
          title: 'Winter Trips',
          subtitle: 'Kashmir • Spiti Valley • Kasol Manali',
          image: 'https://images.unsplash.com/photo-1544621245-09893d567909'
        }
      },
      {
        id: 'blogs-1',
        type: 'blogs',
        data: {
          title: 'Watch & Read',
          count: 4
        }
      }
    ],
    status: 'published'
  },
  {
    title: 'About Us',
    slug: 'about',
    sections: [
      {
        id: 'content-1',
        type: 'content',
        data: {
          title: 'Our Story',
          html: '<p>YouthCamping was founded with a passion for adventure and a commitment to creating unforgettable experiences for young travelers.</p>'
        }
      }
    ],
    status: 'published'
  }
];

const seedPages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected for Page Seeding...');

    // Only seed if home doesn't exist to avoid overwriting user changes in future
    const homeExists = await Page.findOne({ slug: 'home' });
    if (homeExists) {
        console.log('Home page already exists. Skipping seed to preserve data.');
    } else {
        await Page.insertMany(pages);
        console.log('Default Pages Seeded Successfully!');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedPages();
