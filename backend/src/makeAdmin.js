import mongoose from 'mongoose';
import User from './models/User.js';
import { ENV } from './lib/env.js';

const makeAdmin = async (email) => {
  try {
    await mongoose.connect(ENV.DB_URL);
    console.log('Connected to MongoDB');

    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
    } else {
      console.log(`✅ Successfully made ${user.email} an admin!`);
      console.log('User details:', {
        name: user.fullName,
        email: user.email,
        role: user.role
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Replace with your email
const emailToMakeAdmin = process.argv[2] || 'pujandesai450@gmail.com';
makeAdmin(emailToMakeAdmin);
