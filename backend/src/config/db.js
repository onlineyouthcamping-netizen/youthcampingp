const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas or Local instance
 * Includes failover for development environments
 */
const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;

    if (!dbUri) {
      console.error('❌ FATAL: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    console.log('📡 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 8000, // Timeout after 8s
      heartbeatFrequencyMS: 2000,
    });

    console.log(`✅ DB Connected: ${conn.connection.host}`);
    
    // Log database name for verification
    console.log(`📂 Database Name: ${conn.connection.name}`);

  } catch (error) {
    console.error(`❌ DB Connection Error: ${error.message}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🛑 Critical failure in production - exiting...');
      process.exit(1);
    }

    console.warn('⚠️ SERVER RUNNING IN DEGRADED MODE: Database is unreachable.');
    console.warn('💡 Tip: Check if your IP is whitelisted in MongoDB Atlas or if the service is down.');
    
    // We don't exit in development to allow the developer to fix the issue or use mock data
  }
};

module.exports = connectDB;
