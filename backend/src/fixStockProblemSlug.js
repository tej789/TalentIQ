import mongoose from 'mongoose';
import Problem from './models/Problem.js';
import { ENV } from './lib/env.js';

const addSlugToStockProblem = async () => {
  try {
    await mongoose.connect(ENV.DB_URL);
    console.log('Connected to MongoDB');

    const problem = await Problem.findOne({ title: 'Best Time to Buy and Sell Stock' });
    
    if (problem) {
      problem.slug = 'best-time-to-buy-and-sell-stock';
      await problem.save();
      console.log('✅ Added slug to Best Time to Buy and Sell Stock problem');
      console.log('   Slug:', problem.slug);
      console.log('   Test Cases:', problem.testCases?.length);
    } else {
      console.log('❌ Problem not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addSlugToStockProblem();
