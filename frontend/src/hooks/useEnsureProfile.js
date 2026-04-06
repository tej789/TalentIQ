/**
 * useEnsureProfile Hook
 * 
 * Ensures that the logged-in user has a profile created
 * This is a fallback for existing users who may not have profiles yet
 */

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Global flag to prevent duplicate profile creation
let isCreatingProfile = false;
let profileCache = null;

export const useEnsureProfile = () => {
  const { user, isSignedIn } = useUser();
  const [profileChecked, setProfileChecked] = useState(false);
  const [publicProfileId, setPublicProfileId] = useState(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const ensureProfile = async () => {
      if (!isSignedIn || !user?.id || hasRun.current || isCreatingProfile) return;
      
      hasRun.current = true;

      // Check cache first
      if (profileCache) {
        setPublicProfileId(profileCache);
        setProfileChecked(true);
        return;
      }

      try {
        // Try to get existing profile
        const response = await axios.get(`${API_URL}/profile/my-profile-id`, {
          withCredentials: true,
        });
        
        const profileId = response.data.data.publicProfileId;
        profileCache = profileId;
        setPublicProfileId(profileId);
        setProfileChecked(true);
      } catch (error) {
        // If profile doesn't exist (404), create it
        if (error.response?.status === 404 && !isCreatingProfile) {
          isCreatingProfile = true;
          try {
            const createResponse = await axios.post(
              `${API_URL}/profile/create`,
              {},
              { withCredentials: true }
            );
            const profileId = createResponse.data.data.publicProfileId;
            profileCache = profileId;
            setPublicProfileId(profileId);
            console.log("✅ Profile created:", profileId);
          } catch (createError) {
            console.error("❌ Error creating profile:", createError);
          } finally {
            isCreatingProfile = false;
          }
        } else {
          console.error("Error checking profile:", error);
        }
        setProfileChecked(true);
      }
    };

    ensureProfile();
  }, [isSignedIn, user]);

  return { profileChecked, publicProfileId };
};
