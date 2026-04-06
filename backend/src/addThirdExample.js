import mongoose from 'mongoose';
import Problem from './models/Problem.js';
import { ENV } from './lib/env.js';

const addThirdExample = async () => {
  try {
    await mongoose.connect(ENV.DB_URL);
    console.log('Connected to MongoDB');

    const problem = await Problem.findOne({ title: 'Best Time to Buy and Sell Stock' });
    
    if (problem) {
      // Add the third example
      problem.examples.push({
        input: 'prices = [2,4,1]',
        output: '2',
        explanation: 'Buy on day 1 (price = 2) and sell on day 2 (price = 4) Profit = 4 - 2 = 2'
      });
      
      await problem.save();
      
      console.log('✅ Added third example to Best Time to Buy and Sell Stock');
      console.log('Total examples:', problem.examples.length);
      console.log('\nExample 3:');
      console.log('  Input:', problem.examples[2].input);
      console.log('  Output:', problem.examples[2].output);
      console.log('  Explanation:', problem.examples[2].explanation);
    } else {
      console.log('❌ Problem not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addThirdExample();
