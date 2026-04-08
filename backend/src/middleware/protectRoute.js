// import { requireAuth } from "@clerk/express";
// import User from "../models/User.js";

// // Middleware to check if user is authenticated
// export const protectRoute = [
//   requireAuth(),
//   async (req, res, next) => {
//     try {
//       const clerkId = req.auth().userId;

//       if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

//       // find user in db by clerk ID
//       const user = await User.findOne({ clerkId });

//       if (!user) return res.status(404).json({ message: "User not found" });

//       // attach user to req
//       req.user = user;

//       next();
//     } catch (error) {
//       console.error("Error in protectRoute middleware", error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   },
// ];

// // Middleware to check if user is admin
// export const adminOnly = async (req, res, next) => {
//   try {
//     // req.user should already be set by protectRoute middleware
//     if (!req.user) {
//       return res.status(401).json({ message: "Unauthorized - Please login first" });
//     }

//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Forbidden - Admin access required" });
//     }

//     next();
//   } catch (error) {
//     console.error("Error in adminOnly middleware", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };


// import { requireAuth } from "@clerk/express";
// import { clerkClient } from "@clerk/express";
// import User from "../models/User.js";

// // Middleware to check if user is authenticated
// export const protectRoute = [
//   requireAuth(),
//   async (req, res, next) => {
//     try {
//       const { userId } = req.auth();

//       if (!userId) {
//         return res.status(401).json({ message: "Unauthorized - invalid token" });
//       }

//       // Find user in DB by Clerk ID
//       let user = await User.findOne({ clerkId: userId });

//       // If user doesn't exist in DB, create them (fallback for missing webhooks)
//       if (!user) {
//         console.log(`User ${userId} not found in DB, fetching from Clerk and creating...`);
        
//         try {
//           // Fetch user details from Clerk
//           const clerkUser = await clerkClient.users.getUser(userId);
          
//           const newUser = {
//             clerkId: userId,
//             email: clerkUser.emailAddresses[0]?.emailAddress || "",
//             name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
//             profileImage: clerkUser.imageUrl || "",
//             role: "user"
//           };

//           // Try to create user, or find if already exists (race condition handling)
//           try {
//             user = await User.create(newUser);
//             console.log(`✅ Created user in MongoDB: ${user.email}`);
//           } catch (createError) {
//             // If duplicate email error, try to find by email or clerkId
//             if (createError.code === 11000) {
//               user = await User.findOne({ 
//                 $or: [{ clerkId: userId }, { email: newUser.email }] 
//               });
              
//               // Update clerkId if user was found by email
//               if (user && user.clerkId !== userId) {
//                 user.clerkId = userId;
//                 await user.save();
//                 console.log(`✅ Updated existing user with new clerkId: ${user.email}`);
//               }
//             } else {
//               throw createError;
//             }
//           }
          
//           if (!user) {
//             return res.status(500).json({ message: "Error creating user profile" });
//           }
//         } catch (fetchError) {
//           console.error("Error fetching/creating user:", fetchError);
//           return res.status(500).json({ message: "Error creating user profile" });
//         }
//       }

//       // Attach user to request
//       req.user = user;

//       next();
//     } catch (error) {
//       console.error("Error in protectRoute middleware", error);
//       res.status(500).json({ message: "Internal Server Error" });
//     }
//   },
// ];

// // Admin-only middleware
// export const adminOnly = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({ message: "Unauthorized - Please login first" });
//   }

//   if (req.user.role !== "admin") {
//     return res.status(403).json({ message: "Forbidden - Admin access required" });
//   }

//   next();
// };




import { requireAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";
import { createUserProfile } from "../services/profileService.js";

// Middleware to check if user is authenticated
export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const { userId } = req.auth();

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized - invalid token" });
      }

      // Find user in DB by Clerk ID
      let user = await User.findOne({ clerkId: userId });

      // If user doesn't exist in DB, create them (fallback for missing webhooks)
      if (!user) {
        console.log(`User ${userId} not found in DB, fetching from Clerk and creating...`);
        
        try {
          // Fetch user details from Clerk
          const clerkUser = await clerkClient.users.getUser(userId);
          
          const newUser = {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
            profileImage: clerkUser.imageUrl || "",
            role: "user"
          };

          // Try to create user, or find if already exists (race condition handling)
          try {
            user = await User.create(newUser);
            console.log(`✅ Created user in MongoDB: ${user.email}`);
          } catch (createError) {
            // If duplicate email error, try to find by email or clerkId
            if (createError.code === 11000) {
              user = await User.findOne({ 
                $or: [{ clerkId: userId }, { email: newUser.email }] 
              });
              
              // Update clerkId if user was found by email
              if (user && user.clerkId !== userId) {
                user.clerkId = userId;
                await user.save();
                console.log(`✅ Updated existing user with new clerkId: ${user.email}`);
              }
            } else {
              throw createError;
            }
          }
          
          if (!user) {
            return res.status(500).json({ message: "Error creating user profile" });
          }
        } catch (fetchError) {
          console.error("Error fetching/creating user:", fetchError);
          return res.status(500).json({ message: "Error creating user profile" });
        }
      }

      // 🆕 AUTOMATIC PROFILE CREATION
      // Check if user has a profile, create one if missing
      const existingProfile = await UserProfile.findOne({ userId: user._id });
      
      if (!existingProfile) {
        console.log(`📝 Profile not found for user ${user.email}, creating automatically...`);
        
        try {
          const newProfile = await createUserProfile(user._id.toString());
          console.log(`✅ Profile created automatically with ID: ${newProfile.publicProfileId}`);
        } catch (profileError) {
          console.error("⚠️ Error creating profile (continuing anyway):", profileError.message);
          // Don't block the request if profile creation fails
        }
      }

      // Attach user to request
      req.user = user;
req.profile = profile; // ✅ ADD THIS
      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];

// Admin-only middleware
export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - Please login first" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }

  next();
};