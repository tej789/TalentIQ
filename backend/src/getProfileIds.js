/**
 * Get all user profile IDs
 * Run with: node src/getProfileIds.js
 */

import mongoose from "mongoose";
import User from "./models/User.js";
import UserProfile from "./models/UserProfile.js";
import { connectDB } from "./lib/db.js";

async function getProfileIds() {
  try {
    await connectDB();
    console.log("\n📋 Fetching all user profile IDs...\n");

    const profiles = await UserProfile.find()
      .populate("userId", "name email")
      .lean();

    if (profiles.length === 0) {
      console.log("❌ No profiles found. Run: node src/seedProfiles.js first");
      process.exit(0);
    }

    console.log(`✅ Found ${profiles.length} profiles:\n`);
    console.log("═".repeat(80));

    profiles.forEach((profile, index) => {
      console.log(`\n${index + 1}. User: ${profile.userId.name}`);
      console.log(`   Email: ${profile.userId.email}`);
      console.log(`   Profile ID: ${profile.publicProfileId}`);
      console.log(`   Profile URL: http://localhost:5173/profile/${profile.publicProfileId}`);
      console.log(`   Stats: ${profile.stats.totalSolved} problems solved`);
    });

    console.log("\n" + "═".repeat(80));
    console.log("\n🔗 To view a profile, copy and paste the Profile URL in your browser");
    console.log("📝 Make sure your frontend is running: npm run dev (in frontend folder)\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error fetching profile IDs:", error);
    process.exit(1);
  }
}

getProfileIds();
