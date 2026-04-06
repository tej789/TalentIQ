import mongoose from 'mongoose';
import Problem from './models/Problem.js';
import { ENV } from './lib/env.js';

const checkTestCases = async () => {
  try {
    await mongoose.connect(ENV.DB_URL);
    console.log('Connected to MongoDB');

    const problems = await Problem.find().select('title slug testCases');
    
    console.log('\n=== Problems and Test Cases ===\n');
    problems.forEach(problem => {
      console.log(`📝 ${problem.title} (${problem.slug || 'no-slug'})`);
      console.log(`   Test Cases: ${problem.testCases?.length || 0}`);
      if (problem.testCases?.length > 0) {
        problem.testCases.forEach((tc, idx) => {
          console.log(`   Test ${idx + 1}:`);
          console.log(`     Input: ${tc.input?.substring(0, 50)}...`);
          console.log(`     Expected: ${tc.expectedOutput}`);
          console.log(`     Hidden: ${tc.isHidden}`);
        });
      }
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkTestCases();
