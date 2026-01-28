const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const connectDB = require('./config/db');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123';

    const userExists = await User.findOne({ email: adminEmail });

    if (userExists) {
      console.log('Super Admin already exists');
      process.exit();
    }

    const user = await User.create({
      email: adminEmail,
      password: adminPassword,
      role: 'super_admin',
    });

    console.log(`Super Admin Created: ${user.email} / ${adminPassword}`);
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedSuperAdmin();
