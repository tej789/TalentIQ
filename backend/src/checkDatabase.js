import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Problem from "./models/Problem.js";
import Session from "./models/Session.js";

dotenv.config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("✅ Connected to MongoDB\\n");

    // Check Users
    const users = await User.find().select("name email clerkId role submissions");
    console.log("👥 USERS:");
    console.log(`   Total: ${users.length}`);
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      if (user.submissions && user.submissions.length > 0) {
        console.log(`      Submissions: ${user.submissions.length}`);
        user.submissions.forEach((sub, j) => {
          console.log(`         ${j + 1}. Language: ${sub.language}, Verdict: ${sub.verdict}`);
        });
      }
    });
    console.log("");

    // Check Problems
    const problems = await Problem.find().select("title difficulty");
    console.log("📝 PROBLEMS:");
    console.log(`   Total: ${problems.length}`);
    problems.forEach((problem, i) => {
      console.log(`   ${i + 1}. ${problem.title} - ${problem.difficulty}`);
    });
    console.log("");

    // Check Sessions
    const sessions = await Session.find()
      .populate("host", "name email")
      .populate("participant", "name email");
    console.log("🎯 SESSIONS:");
    console.log(`   Total: ${sessions.length}`);
    sessions.forEach((session, i) => {
      console.log(`   ${i + 1}. ${session.problem} (${session.difficulty}) - Status: ${session.status}`);
      console.log(`      Host: ${session.host?.name || "Unknown"}`);
      console.log(`      Participant: ${session.participant?.name || "None"}`);
    });

    if (users.length === 0) {
      console.log("\\n⚠️  WARNING: No users found in database!");
      console.log("   Please login to your app to create a user.");
    }

    if ((problems?.length || 0) === 0) {
      console.log("\\n⚠️  WARNING: No problems found in database!");
      console.log("   Run: npm run seed to add sample problems");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkDatabase();
