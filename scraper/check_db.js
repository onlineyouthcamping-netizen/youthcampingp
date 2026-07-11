const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../bD/youthcamping-backend/.env') });

async function checkDb() {
    const mongoUri = process.env.MONGODB_URI;
    console.log(`🔍 Checking DB: ${mongoUri}`);
    
    try {
        await mongoose.connect(mongoUri);
        
        // Define minimal schema to read
        const Trip = mongoose.models.Trip || mongoose.model('Trip', new mongoose.Schema({
            title: String,
            slug: String,
            updatedAt: Date
        }, { collection: 'trips' }));

        const count = await Trip.countDocuments();
        console.log(`📊 Total Trips in DB: ${count}`);

        const latest = await Trip.find().sort({ updatedAt: -1 }).limit(5);
        console.log('\n📅 Latest 5 Synced Trips:');
        latest.forEach(t => {
            console.log(`- ${t.title} (Slug: ${t.slug}) [Updated: ${t.updatedAt}]`);
        });

    } catch (err) {
        console.error(`💥 Error: ${err.message}`);
    } finally {
        await mongoose.disconnect();
    }
}

checkDb();
