/**
 * Webhook Routes
 * 
 * Handles webhook operations from Clerk for user management
 */

import express from "express";
import User from "../models/User.js";
import { createUserProfile } from "../services/profileService.js";

const router = express.Router();

/**
 * POST /api/webhooks/clerk
 * 
 * Clerk webhook handler for user lifecycle events
 */
router.post("/clerk", express.json(), async (req, res) => {
  try {
    const { type, data } = req.body;
    
    console.log("📨 Webhook received:", type);
    
    if (type === "user.created") {
      const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = data;
      
      console.log("👤 New user registered:", clerkUserId);

      // Check if user already exists
      let user = await User.findOne({ clerkId: clerkUserId });
      
      if (!user) {
        // Create user in database
        user = new User({
          clerkId: clerkUserId,
          name: `${first_name || ""} ${last_name || ""}`.trim() || email_addresses[0]?.email_address?.split("@")[0] || "User",
          email: email_addresses[0]?.email_address,
          profileImage: image_url || "",
        });

        await user.save();
        console.log("✅ User created in database");
      }

      // Create profile automatically with random ID
      const profile = await createUserProfile(user._id.toString());
      console.log(`✅ Profile created with ID: ${profile.publicProfileId}`);

      return res.status(200).json({ 
        success: true, 
        message: "User and profile created",
        profileId: profile.publicProfileId 
      });
    }

    if (type === "user.updated") {
      const { id: clerkUserId, image_url, first_name, last_name, email_addresses } = data;
      
      console.log("👤 User updated:", clerkUserId);

      // Update user in database
      const updateData = {};
      if (image_url !== undefined) updateData.profileImage = image_url;
      if (first_name || last_name) {
        updateData.name = `${first_name || ""} ${last_name || ""}`.trim();
      }
      if (email_addresses && email_addresses[0]) {
        updateData.email = email_addresses[0].email_address;
      }

      await User.findOneAndUpdate({ clerkId: clerkUserId }, updateData);
      console.log("✅ User updated in database");

      return res.status(200).json({ success: true, message: "User updated" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
