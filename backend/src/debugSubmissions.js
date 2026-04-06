import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Problem from "./models/Problem.js";

dotenv.config();

async function debugSubmissions() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB\n");

    // Get all users with submissions
    const users = await User.find().select("name email submissions");
    
    for (const user of users) {
      if (user.submissions && user.submissions.length > 0) {
        console.log(`👤 User: ${user.name} (${user.email})`);
        console.log(`   Total Submissions: ${user.submissions.length}\n`);
        
        for (let i = 0; i < user.submissions.length; i++) {
          const sub = user.submissions[i];
          console.log(`   Submission ${i + 1}:`);
          console.log(`   - ProblemId (ObjectId): ${sub.problemId}`);
          console.log(`   - Language: ${sub.language}`);
          console.log(`   - Verdict: ${sub.verdict}`);
          console.log(`   - Code Length: ${sub.code?.length || 0} chars`);
          
          // Try to find the problem
          const problem = await Problem.findById(sub.problemId);
          if (problem) {
            console.log(`   - Problem Found: ${problem.title} (slug: ${problem.slug})`);
          } else {
            console.log(`   - ⚠️  Problem NOT found for this ObjectId!`);
          }
          console.log("");
        }
      }
    }

    // List all problems with their IDs
    console.log("\n📝 ALL PROBLEMS:");
    const problems = await Problem.find().select("title slug _id");
    problems.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title}`);
      console.log(`      - Slug: ${p.slug}`);
      console.log(`      - ObjectId: ${p._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

debugSubmissions();
