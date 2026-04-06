// /**
//  * ProfilePage Component
//  * 
//  * Main profile page that displays user statistics, heatmap, and activity.
//  * Replicates LeetCode profile behavior.
//  */

// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useUser } from "@clerk/clerk-react";
// import {
//   getProfile,
//   getProfileStats,
//   getHeatmapData,
//   getLanguageStats,
//   getRecentActivity,
// } from "../api/profile";
// import ProfileHeader from "../components/profile/ProfileHeader";
// import StatsRing from "../components/profile/StatsRing";
// import DifficultyBreakdown from "../components/profile/DifficultyBreakdown";
// import HeatmapCalendar from "../components/profile/HeatmapCalendar";
// import LanguageStats from "../components/profile/LanguageStats";
// import RecentSubmissions from "../components/profile/RecentSubmissions";
// import LoadingSpinner from "../components/LoadingSpinner";
// import ThemePreferences from "../components/profile/ThemePreferences";
// import ProfileIdManager from "../components/profile/ProfileIdManager";
// import Navbar from "../components/Navbar";
// import axios from "axios";

// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// const ProfilePage = () => {
//   const { publicProfileId } = useParams();
//   const { user } = useUser();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isOwnProfile, setIsOwnProfile] = useState(false);
  
//   const [profile, setProfile] = useState(null);
//   const [stats, setStats] = useState(null);
//   const [heatmap, setHeatmap] = useState(null);
//   const [languages, setLanguages] = useState([]);
//   const [recentActivity, setRecentActivity] = useState([]);
//   const [heatmapColor, setHeatmapColor] = useState("#a3e635"); // lime-400 default
//   const [selectedYear, setSelectedYear] = useState(null);

//   useEffect(() => {
//     let isMounted = true;
    
//     const fetchProfileData = async () => {
//       try {
//         const startTime = Date.now();
//         setLoading(true);
//         setError(null);

//         // Fetch all profile data in parallel
//         const [profileRes, statsRes, heatmapRes, languagesRes, recentRes] = await Promise.all([
//           getProfile(publicProfileId),
//           getProfileStats(publicProfileId),
//           getHeatmapData(publicProfileId, selectedYear),
//           getLanguageStats(publicProfileId),
//           getRecentActivity(publicProfileId, 10),
//         ]);

//         if (!isMounted) return;

//         setProfile(profileRes.data);
//         setStats(statsRes.data);
//         setHeatmap(heatmapRes.data);
//         setLanguages(languagesRes.data);
//         setRecentActivity(recentRes.data);
        
//         // Check if this is the user's own profile
//         if (user?.id) {
//           try {
//             const myProfileRes = await axios.get(`${API_URL}/profile/my-profile-id`, {
//               withCredentials: true,
//             });
//             if (isMounted) {
//               setIsOwnProfile(myProfileRes.data.data.publicProfileId === publicProfileId);
//             }
//           } catch (err) {
//             console.error("Error checking profile ownership:", err);
//           }
//         }
        
//         // Set heatmap color from preferences
//         if (profileRes.data.preferences?.theme?.heatmapColor) {
//           setHeatmapColor(profileRes.data.preferences.theme.heatmapColor);
//         }
        
//         // Set selected year if not already set
//         if (!selectedYear && heatmapRes.data.selectedYear) {
//           setSelectedYear(heatmapRes.data.selectedYear);
//         }
        
//         // Ensure minimum display time to prevent flashing (300ms minimum)
//         const elapsedTime = Date.now() - startTime;
//         const remainingTime = Math.max(300 - elapsedTime, 0);
        
//         setTimeout(() => {
//           if (isMounted) {
//             setLoading(false);
//           }
//         }, remainingTime);
        
//       } catch (err) {
//         console.error("Error fetching profile:", err);
//         if (isMounted) {
//           setError(err.response?.data?.message || "Failed to load profile");
//           setLoading(false);
//         }
//       }
//     };

//     if (publicProfileId) {
//       fetchProfileData();
//     }
    
//     return () => {
//       isMounted = false;
//     };
//   }, [publicProfileId, selectedYear, user]);

//   if (loading) {
//     return (
//       <>
//         <Navbar />
//         <div className="flex items-center justify-center min-h-screen">
//           <LoadingSpinner size="large" />
//         </div>
//       </>
//     );
//   }

//   if (error) {
//     return (
//       <>
//         <Navbar />
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
//             <p className="text-gray-400">{error}</p>
//           </div>
//         </div>
//       </>
//     );
//   }

//   if (!profile) {
//     return (
//       <>
//         <Navbar />
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
//             <p className="text-gray-400">The profile you're looking for doesn't exist.</p>
//           </div>
//         </div>
//       </>
//     );
//   }

//   return (
//     <>
//       <Navbar />
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         {/* Profile Header */}
//         <ProfileHeader profile={profile.profile} rank={profile.rank} />

//         {/* Profile ID Manager (only for own profile) */}
//         {isOwnProfile && (
//           <div className="mt-6">
//             <ProfileIdManager 
//               currentId={publicProfileId} 
//               onIdChanged={(newId) => setProfile({ ...profile, profile: { ...profile.profile, publicProfileId: newId }})}
//             />
//           </div>
//         )}

//         {/* Main Content Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
//           {/* Left Column - Languages & Community Stats */}
//           <div className="space-y-6">
//             <LanguageStats languages={languages} />
//           </div>

//           {/* Center & Right Columns - Stats, Heatmap, Recent Activity */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Stats Ring and Difficulty Breakdown */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <StatsRing stats={stats} />
//               <DifficultyBreakdown stats={stats} />
//             </div>

//             {/* Heatmap Calendar */}
//             <HeatmapCalendar 
//               heatmap={heatmap} 
//               color={heatmapColor}
//               selectedYear={selectedYear}
//               onYearChange={setSelectedYear}
//             />
            
//             {/* Theme Preferences (only for own profile) */}
//             {isOwnProfile && (
//               <ThemePreferences 
//                 selectedColor={heatmapColor} 
//                 onColorChange={setHeatmapColor}
//                 publicProfileId={publicProfileId}
//               />
//             )}

//             {/* Recent Submissions */}
//             <RecentSubmissions activity={recentActivity} />
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default ProfilePage;


/**
 * ProfilePage Component
 * 
 * Main profile page that displays user statistics, heatmap, and activity.
 * Replicates LeetCode profile behavior.
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import {
  getProfile,
  getProfileStats,
  getHeatmapData,
  getLanguageStats,
  getRecentActivity,
} from "../api/profile";
import ProfileHeader from "../components/profile/ProfileHeader";
import StatsRing from "../components/profile/StatsRing";
import DifficultyBreakdown from "../components/profile/DifficultyBreakdown";
import HeatmapCalendar from "../components/profile/HeatmapCalendar";
import LanguageStats from "../components/profile/LanguageStats";
import RecentSubmissions from "../components/profile/RecentSubmissions";
import LoadingSpinner from "../components/LoadingSpinner";
import ThemePreferences from "../components/profile/ThemePreferences";
import ProfileIdManager from "../components/profile/ProfileIdManager";
import Navbar from "../components/Navbar";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ProfilePage = () => {
  const { publicProfileId } = useParams();
  const { user } = useUser();
  const { isLoaded: isAuthLoaded } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [heatmapColor, setHeatmapColor] = useState("#a3e635"); // lime-400 default
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfileData = async () => {
      try {
        const startTime = Date.now();
        // Only show loading state if we don't have profile data yet (first load)
        if (!profile) {
          setLoading(true);
        }
        setError(null);

        // Fetch all profile data in parallel
        const [profileRes, statsRes, heatmapRes, languagesRes, recentRes] = await Promise.all([
          getProfile(publicProfileId),
          getProfileStats(publicProfileId),
          getHeatmapData(publicProfileId, selectedYear),
          getLanguageStats(publicProfileId),
          getRecentActivity(publicProfileId, 10),
        ]);

        if (!isMounted) return;

        // Safe data handling with fallback values for new users
        setProfile(profileRes.data || { profile: {}, rank: null });
        setStats(statsRes.data || {
          solved: { total: 0, easy: 0, medium: 0, hard: 0 },
          available: { total: 0, easy: 0, medium: 0, hard: 0 },
          submissions: { total: 0, accepted: 0 },
          streak: { current: 0, max: 0 },
          activeDays: 0
        });
        setHeatmap(heatmapRes.data || { weeks: [], months: [], currentStreak: 0, maxStreak: 0, totalSubmissions: 0, availableYears: [], activeDays: 0 });
        setLanguages(languagesRes.data ?? []);
        setRecentActivity(recentRes.data ?? []);
        
        // Check if this is the user's own profile
        if (user?.id) {
          try {
            const myProfileRes = await axios.get(`${API_URL}/profile/my-profile-id`, {
              withCredentials: true,
            });
            if (isMounted) {
              setIsOwnProfile(myProfileRes.data.data.publicProfileId === publicProfileId);
            }
          } catch (err) {
            console.error("Error checking profile ownership:", err);
          }
        }
        
        // Set heatmap color from preferences (safe access)
        if (profileRes.data?.preferences?.theme?.heatmapColor) {
          setHeatmapColor(profileRes.data.preferences.theme.heatmapColor);
        }
        
        // Set selected year if not already set (safe access)
        if (!selectedYear && heatmapRes.data?.selectedYear) {
          setSelectedYear(heatmapRes.data.selectedYear);
        }
        
        // Ensure minimum display time to prevent flashing (300ms minimum)
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(300 - elapsedTime, 0);
        
        setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, remainingTime);
        
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (isMounted) {
          setError(err.response?.data?.message || "Failed to load profile");
          setLoading(false);
        }
      }
    };

    if (publicProfileId) {
      fetchProfileData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [publicProfileId, selectedYear, user]);

  // Wait for Clerk auth to load OR data to load - App.jsx shows the loader
  if (!isAuthLoaded || loading) {
    return <div className="min-h-screen bg-gray-900" />; // Match App.jsx background to prevent flash
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </>
    );
  }

  if (!profile || !profile.profile) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-gray-400">The profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header - safe access with fallback */}
        <ProfileHeader profile={profile?.profile || {}} rank={profile?.rank} />

        {/* Profile ID Manager (only for own profile) */}
        {isOwnProfile && (
          <div className="mt-6">
            <ProfileIdManager 
              currentId={publicProfileId} 
              onIdChanged={(newId) => setProfile({ ...profile, profile: { ...profile?.profile, publicProfileId: newId }})}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Languages & Community Stats */}
          <div className="space-y-6">
            <LanguageStats languages={languages ?? []} />
          </div>

          {/* Center & Right Columns - Stats, Heatmap, Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Ring and Difficulty Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatsRing stats={stats} />
              <DifficultyBreakdown stats={stats} />
            </div>

            {/* Heatmap Calendar */}
            <HeatmapCalendar 
              heatmap={heatmap} 
              color={heatmapColor}
              selectedYear={selectedYear}
              onYearChange={setSelectedYear}
            />
            
            {/* Theme Preferences (only for own profile) */}
            {isOwnProfile && (
              <ThemePreferences 
                selectedColor={heatmapColor} 
                onColorChange={setHeatmapColor}
                publicProfileId={publicProfileId}
              />
            )}

            {/* Recent Submissions */}
            <RecentSubmissions activity={recentActivity ?? []} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
