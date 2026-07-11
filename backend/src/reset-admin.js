require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const connectDB = require('./config/db');

const requireEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const resetAdmin = async () => {
  try {
    await connectDB();
    
    const email = requireEnvironmentValue('ADMIN_EMAIL');
    const password = requireEnvironmentValue('ADMIN_PASSWORD');

    console.log(`Resetting admin credentials for: ${email}`);
    
    // Find existing admin or create new one
    let admin = await Admin.findOne({ email });
    
    if (admin) {
      admin.password = password;
      await admin.save();
      console.log('✅ Admin password updated successfully!');
    } else {
      await Admin.create({
        name: 'Super Admin',
        email,
        password,
        role: 'superadmin'
      });
      console.log('✅ Admin account created successfully!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting admin:', err.message);
    process.exit(1);
  }
};

resetAdmin();
