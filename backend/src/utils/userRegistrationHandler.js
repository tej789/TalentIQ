/**
 * Webhook Handler for User Registration
 * 
 * Automatically creates profile when new user registers via Clerk.
 * Add this to your Clerk webhook handler or user creation flow.
 */

import User from "./models/User.js";
import { createUserProfile } from "./services/profileService.js";

/**
 * Handle new user registration
 * Call this when a new user is created
 */
export async function handleUserCreated(clerkUserId, userData) {
  try {
    console.log("👤 New user registered:", clerkUserId);
    
    // Create user in database
    const user = new User({
      clerkId: clerkUserId,
      name: userData.name || userData.email.split("@")[0],
      email: userData.email,
      profileImage: userData.profileImage || "",
    });
    
    await user.save();
    console.log("✅ User created in database");
    
    // Create profile automatically
    const profile = await createUserProfile(user._id.toString());
    console.log(`✅ Profile created with ID: ${profile.publicProfileId}`);
    
    return {
      user,
      profile,
    };
  } catch (error) {
    console.error("❌ Error handling user creation:", error);
    throw error;
  }
}

/**
 * Example: Clerk Webhook Handler
 * Add this to your webhook routes
 */
export async function clerkWebhookHandler(req, res) {
  try {
    const { type, data } = req.body;
    
    if (type === "user.created") {
      const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = data;
      
      const userData = {
        email: email_addresses[0]?.email_address,
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        profileImage: image_url,
      };
      
      await handleUserCreated(clerkUserId, userData);
      
      return res.status(200).json({ success: true });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Alternative: Manual Profile Creation
 * Call this endpoint from frontend after user logs in for first time
 */
export async function ensureUserHasProfile(userId) {
  try {
    const user = await User.findById(userId).populate("profile");
    
    // Check if profile already exists
    if (user.profile) {
      return user.profile;
    }
    
    // Create profile if missing
    console.log("Creating missing profile for user:", userId);
    const profile = await createUserProfile(userId);
    
    return profile;
  } catch (error) {
    console.error("Error ensuring profile:", error);
    throw error;
  }
}
