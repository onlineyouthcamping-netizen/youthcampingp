require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./src/models/Admin');

const requireEnvironmentValue = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = requireEnvironmentValue('ADMIN_EMAIL');
    const password = requireEnvironmentValue('ADMIN_PASSWORD');

    console.log(`Resetting admin: ${email}`);

    // Delete existing
    await Admin.deleteOne({ email: email.toLowerCase().trim() });
    console.log('Old admin deleted');

    // Create fresh
    const newAdmin = await Admin.create({
      name: 'Super Admin',
      email: email.toLowerCase().trim(),
      password: password,
      role: 'superadmin'
    });

    console.log('Fresh admin created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin:', error);
    process.exit(1);
  }
}

resetAdmin();
