import mongoose from 'mongoose';
import Problem from './models/Problem.js';
import { ENV } from './lib/env.js';

const checkStockProblem = async () => {
  try {
    await mongoose.connect(ENV.DB_URL);
    console.log('Connected to MongoDB');

    const problem = await Problem.findOne({ title: 'Best Time to Buy and Sell Stock' });
    
    if (problem) {
      console.log('\n=== Best Time to Buy and Sell Stock ===\n');
      console.log('Title:', problem.title);
      console.log('Slug:', problem.slug);
      console.log('\n--- Examples (shown in UI) ---');
      console.log('Count:', problem.examples?.length || 0);
      problem.examples?.forEach((ex, idx) => {
        console.log(`\nExample ${idx + 1}:`);
        console.log('  Input:', ex.input);
        console.log('  Output:', ex.output);
        console.log('  Explanation:', ex.explanation);
      });
      
      console.log('\n--- Test Cases (for validation) ---');
      console.log('Count:', problem.testCases?.length || 0);
      problem.testCases?.forEach((tc, idx) => {
        console.log(`\nTest Case ${idx + 1}:`);
        console.log('  Input:', tc.input);
        console.log('  Expected Output:', tc.expectedOutput);
        console.log('  Hidden:', tc.isHidden);
      });
    } else {
      console.log('❌ Problem not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkStockProblem();
