const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const resetData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Dynamically clear all models
    const modelsDir = path.join(__dirname, '../src/models');
    const modelFiles = fs.readdirSync(modelsDir);
    
    const deletePromises = modelFiles.map(file => {
      if (file.endsWith('.js')) {
        const Model = require(path.join(modelsDir, file));
        if (Model.deleteMany) {
          console.log(`Clearing collection: ${file.replace('.js', '')}`);
          return Model.deleteMany({});
        }
      }
      return Promise.resolve();
    });

    await Promise.all(deletePromises);
    
    console.log('\n✅ SUCCESS: All data has been removed from everywhere.');
    process.exit(0);
  } catch (err) {
    console.error('❌ ERROR resetting data:', err.message);
    process.exit(1);
  }
};

resetData();
