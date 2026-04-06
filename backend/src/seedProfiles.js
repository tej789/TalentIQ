/**
 * Seed Script for User Profiles
 * 
 * Creates profiles for existing users and seeds test data.
 * Run with: node src/seedProfiles.js
 */

import mongoose from "mongoose";
import User from "./models/User.js";
import Problem from "./models/Problem.js";
import UserProfile from "./models/UserProfile.js";
import UserPreferences from "./models/UserPreferences.js";
import SolvedProblem from "./models/SolvedProblem.js";
import Submission from "./models/Submission.js";
import { connectDB } from "./lib/db.js";
import { generateProfileId } from "./utils/profileUtils.js";
import { formatDateKey } from "./utils/dateUtils.js";

async function seedProfiles() {
  try {
    await connectDB();
    console.log("🌱 Starting profile seeding...");

    // Get all users
    const users = await User.find();
    console.log(`📊 Found ${users.length} users`);

    for (const user of users) {
      // Check if profile already exists
      let profile = await UserProfile.findOne({ userId: user._id });

      if (!profile) {
        // Generate unique profile ID
        let publicProfileId;
        let attempts = 0;

        do {
          publicProfileId = generateProfileId();
          const existing = await UserProfile.findOne({ publicProfileId });
          if (!existing) break;
          attempts++;
        } while (attempts < 10);

        // Create profile
        profile = new UserProfile({
          userId: user._id,
          publicProfileId,
          displayName: user.name,
          stats: {
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
          },
          submissionStats: {
            totalSubmissions: 0,
            acceptedSubmissions: 0,
          },
          languageStats: {
            javascript: 0,
            python: 0,
            java: 0,
          },
          streak: {
            current: 0,
            max: 0,
          },
          totalActiveDays: 0,
          activeDates: [],
        });

        await profile.save();
        console.log(`✅ Created profile for ${user.name} (${publicProfileId})`);

        // Update user document
        user.profile = profile._id;
        await user.save();
      } else {
        console.log(`⏭️  Profile already exists for ${user.name}`);
      }

      // Create preferences if not exists
      let preferences = await UserPreferences.findOne({ userId: user._id });
      if (!preferences) {
        preferences = new UserPreferences({
          userId: user._id,
          theme: {
            mode: "dark",
            heatmapColor: "#10b981",
            accentColor: "#3b82f6",
          },
        });
        await preferences.save();
        console.log(`✅ Created preferences for ${user.name}`);
      }

      // Migrate existing submissions from User model
      if (user.submissions && user.submissions.length > 0) {
        console.log(`📝 Migrating ${user.submissions.length} submissions for ${user.name}`);

        for (const sub of user.submissions) {
          // Check if submission already exists
          const existingSubmission = await Submission.findOne({
            user: user._id,
            problem: sub.problemId,
            submittedAt: sub.submittedAt,
          });

          if (!existingSubmission) {
            const newSubmission = new Submission({
              user: user._id,
              problem: sub.problemId,
              code: sub.code,
              language: sub.language,
              verdict: sub.verdict || "Accepted",
              submittedAt: sub.submittedAt,
            });
            await newSubmission.save();

            // Update profile stats
            profile.submissionStats.totalSubmissions++;
            if (newSubmission.verdict === "Accepted") {
              profile.submissionStats.acceptedSubmissions++;

              // Check if problem already solved
              const problem = await Problem.findById(sub.problemId);
              if (problem) {
                let solvedProblem = await SolvedProblem.findOne({
                  userId: user._id,
                  problemId: sub.problemId,
                });

                if (!solvedProblem) {
                  solvedProblem = new SolvedProblem({
                    userId: user._id,
                    problemId: sub.problemId,
                    difficulty: problem.difficulty,
                    primaryLanguage: sub.language,
                    languagesSolved: [sub.language],
                    firstSolvedAt: sub.submittedAt,
                    lastSubmissionAt: sub.submittedAt,
                  });
                  await solvedProblem.save();

                  // Update stats
                  profile.stats.totalSolved++;
                  if (problem.difficulty === "Easy") profile.stats.easySolved++;
                  else if (problem.difficulty === "Medium") profile.stats.mediumSolved++;
                  else if (problem.difficulty === "Hard") profile.stats.hardSolved++;

                  profile.languageStats[sub.language]++;
                } else {
                  if (!solvedProblem.languagesSolved.includes(sub.language)) {
                    solvedProblem.languagesSolved.push(sub.language);
                    profile.languageStats[sub.language]++;
                  }
                  solvedProblem.lastSubmissionAt = sub.submittedAt;
                  await solvedProblem.save();
                }

                // Add active date
                const dateKey = formatDateKey(sub.submittedAt);
                if (!profile.activeDates.includes(dateKey)) {
                  profile.activeDates.push(dateKey);
                  profile.totalActiveDays++;
                }
              }
            }
          }
        }

        await profile.save();
        console.log(`✅ Migration complete for ${user.name}`);
      }
    }

    console.log("\n🎉 Profile seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`Total users: ${users.length}`);
    console.log(`Total profiles: ${await UserProfile.countDocuments()}`);
    console.log(`Total submissions: ${await Submission.countDocuments()}`);
    console.log(`Total solved problems: ${await SolvedProblem.countDocuments()}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding profiles:", error);
    process.exit(1);
  }
}

seedProfiles();
