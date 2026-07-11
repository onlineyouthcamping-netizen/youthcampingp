const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Trip = require('../src/models/Trip');
const Blog = require('../src/models/Blog');
const Review = require('../src/models/Review');
const Page = require('../src/models/Page');
const Settings = require('../src/models/Settings');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const uploadDir = path.join(__dirname, '../public/uploads/trips');
  if (!fs.existsSync(uploadDir)) {
    console.log('No local trips upload directory found.');
    process.exit(0);
  }

  const files = fs.readdirSync(uploadDir);
  const mapping = {};

  console.log(`Found ${files.length} files in local uploads...`);

  for (const file of files) {
    if (file === '.DS_Store') continue;
    const filePath = path.join(uploadDir, file);
    try {
      console.log(`Uploading ${file}...`);
      const res = await cloudinary.uploader.upload(filePath, {
        folder: 'youthcamping/trips',
        use_filename: true,
        unique_filename: false,
        overwrite: true
      });
      mapping[`/uploads/trips/${file}`] = res.secure_url;
      console.log(`Uploaded to: ${res.secure_url}`);
    } catch (e) {
      console.error(`Failed to upload ${file}:`, e.message);
    }
  }

  console.log('--- Updating Database ---');
  
  async function updateCollection(Model, name) {
    const docs = await Model.find();
    for (const doc of docs) {
      const originalStr = JSON.stringify(doc.toObject());
      let newStr = originalStr;
      
      for (const [localPath, cloudUrl] of Object.entries(mapping)) {
        newStr = newStr.split(localPath).join(cloudUrl);
      }
      
      if (newStr !== originalStr) {
        await Model.findByIdAndUpdate(doc._id, JSON.parse(newStr));
        console.log(`Updated ${name} document: ${doc._id}`);
      }
    }
  }

  await updateCollection(Trip, 'Trip');
  await updateCollection(Blog, 'Blog');
  await updateCollection(Review, 'Review');
  await updateCollection(Page, 'Page');
  await updateCollection(Settings, 'Settings');

  console.log('Migration completed successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
