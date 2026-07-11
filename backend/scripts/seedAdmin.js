require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');

    // Delete existing admins
    await Admin.deleteMany();
    console.log('Deleted existing admins.');

    // Create admin from env vars
    const admin = await Admin.create({
      name: 'Super Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'superadmin'
    });

    console.log('Admin user created successfully!');
    console.log(`Email: ${admin.email}`);
    
    process.exit();
  } catch (error) {
    console.error(`Error with seeding: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
