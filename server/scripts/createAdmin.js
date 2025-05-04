const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const adminData = {
    name: 'Admin',
    email: 'faizan@gmail.com',
    password: 'taylor1', // You should change this in production
    role: 'admin'
};

async function createAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Check if admin already exists
        console.log('Checking for existing admin...');
        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.email);
            process.exit(0);
        }

        // Create admin user - don't hash the password here, the User model will handle it
        console.log('Creating admin user...');
        const admin = await User.create(adminData);

        console.log('Admin user created successfully:', admin.email);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdmin(); 