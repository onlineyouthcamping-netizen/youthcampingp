const mongoose = require('mongoose');
const Page = require('../src/models/Page');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pages = [
  { title: 'Home', slug: 'home', isSystem: true },
  { title: 'Explore', slug: 'explore', isSystem: true },
  { title: 'Tour Packages', slug: 'tour-packages', isSystem: true },
  { title: 'Group Trips', slug: 'group-trips', isSystem: true },
  { title: 'About Us', slug: 'about-us', isSystem: true },
  { title: 'Contact Us', slug: 'contact-us', isSystem: true },
  { title: 'Terms & Conditions', slug: 'terms-conditions', isSystem: true },
  { title: 'Privacy Policy', slug: 'privacy-policy', isSystem: true }
];

async function seedPages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-crm');
    console.log('Connected to MongoDB');

    for (const pageData of pages) {
      const existingPage = await Page.findOne({ slug: pageData.slug });
      if (!existingPage) {
        const newPage = new Page({
          ...pageData,
          status: 'published',
          sections: [] // Empty initial sections
        });
        await newPage.save();
        console.log(`Created page: ${pageData.title}`);
      } else {
        console.log(`Page already exists: ${pageData.title}`);
      }
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding pages:', error);
    process.exit(1);
  }
}

seedPages();
