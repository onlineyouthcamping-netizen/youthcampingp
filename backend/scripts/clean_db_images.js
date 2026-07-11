const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Trip = require('../src/models/Trip');
const Blog = require('../src/models/Blog');
const Review = require('../src/models/Review');
const Page = require('../src/models/Page');
const Settings = require('../src/models/Settings');

const FALLBACK_URL = "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=2070";

function needsReplacement(url) {
  if (!url || typeof url !== 'string') return false;
  
  // 1. Block WordPress hotlinked images (403 forbidden)
  if (url.includes('youthcamping.in/wp-content')) return true;
  
  // 2. Remove /uploads/ local paths
  if (url.startsWith('/uploads/')) return true;
  
  // 3. Broken Unsplash templates without ID
  if (url === "https://images.unsplash.com/photo-" || url === "https://images.unsplash.com/photo-?q=80&w=2070") return true;
  
  // 4. Partial string IDs (like "photo-xxxx") that cause ORB
  if (url.startsWith("photo-") && !url.startsWith("http")) return true;
  
  return false;
}

function processObject(obj) {
  let changed = false;
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      if (needsReplacement(obj[key])) {
        console.log(`Replacing bad URL: ${obj[key]}`);
        obj[key] = FALLBACK_URL;
        changed = true;
      }
    } else if (Array.isArray(obj[key])) {
      for (let i = 0; i < obj[key].length; i++) {
        if (typeof obj[key][i] === 'string') {
          if (needsReplacement(obj[key][i])) {
            console.log(`Replacing bad URL in array: ${obj[key][i]}`);
            obj[key][i] = FALLBACK_URL;
            changed = true;
          }
        } else if (typeof obj[key][i] === 'object' && obj[key][i] !== null) {
          if (processObject(obj[key][i])) changed = true;
        }
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (processObject(obj[key])) changed = true;
    }
  }
  return changed;
}

async function clean() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const models = [
    { model: Trip, name: 'Trip' },
    { model: Blog, name: 'Blog' },
    { model: Review, name: 'Review' },
    { model: Page, name: 'Page' },
    { model: Settings, name: 'Settings' }
  ];

  for (const { model, name } of models) {
    const docs = await model.find();
    let count = 0;
    for (const doc of docs) {
      const obj = doc.toObject();
      const changed = processObject(obj);
      if (changed) {
        // Need to use findByIdAndUpdate to bypass pre-save hooks and just update the schema directly
        await model.findByIdAndUpdate(doc._id, obj, { new: true, runValidators: false, overwrite: true });
        count++;
      }
    }
    console.log(`Cleaned ${count} ${name} documents.`);
  }

  console.log('DB cleaning complete!');
  process.exit(0);
}

clean().catch(console.error);
