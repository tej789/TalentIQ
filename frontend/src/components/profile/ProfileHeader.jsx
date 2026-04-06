// /**
//  * ProfileHeader Component
//  * 
//  * Displays user's name, profile ID, rank, and profile image.
//  */

// import { User, MapPin, Link as LinkIcon, Github, Linkedin, Twitter } from "lucide-react";

// const ProfileHeader = ({ profile, rank }) => {
//   const { displayName, profileImage, bio, location, website, socialLinks, publicProfileId } = profile;

//   return (
//     <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//       <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
//         {/* Profile Image */}
//         <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
//           {profileImage ? (
//             <img src={profileImage} alt={displayName} className="w-full h-full object-cover" />
//           ) : (
//             <User className="w-12 h-12" />
//           )}
//         </div>

//         {/* Profile Info */}
//         <div className="flex-1">
//           <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
//             <h1 className="text-3xl font-bold text-white">{displayName}</h1>
//             <span className="text-gray-400 text-sm">{publicProfileId}</span>
//           </div>

//           {rank && (
//             <div className="mb-2">
//               <span className="text-gray-400">Rank </span>
//               <span className="text-white font-semibold">{rank.toLocaleString()}</span>
//             </div>
//           )}

//           {bio && <p className="text-gray-300 mb-3">{bio}</p>}

//           {/* Additional Info */}
//           <div className="flex flex-wrap gap-4 text-sm text-gray-400">
//             {location && (
//               <div className="flex items-center gap-1">
//                 <MapPin className="w-4 h-4" />
//                 <span>{location}</span>
//               </div>
//             )}
//             {website && (
//               <a
//                 href={website}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center gap-1 hover:text-emerald-400 transition"
//               >
//                 <LinkIcon className="w-4 h-4" />
//                 <span>Website</span>
//               </a>
//             )}
//           </div>

//           {/* Social Links */}
//           {socialLinks && (
//             <div className="flex gap-3 mt-3">
//               {socialLinks.github && (
//                 <a
//                   href={`https://github.com/${socialLinks.github}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-gray-400 hover:text-white transition"
//                 >
//                   <Github className="w-5 h-5" />
//                 </a>
//               )}
//               {socialLinks.linkedin && (
//                 <a
//                   href={`https://linkedin.com/in/${socialLinks.linkedin}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-gray-400 hover:text-white transition"
//                 >
//                   <Linkedin className="w-5 h-5" />
//                 </a>
//               )}
//               {socialLinks.twitter && (
//                 <a
//                   href={`https://twitter.com/${socialLinks.twitter}`}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-gray-400 hover:text-white transition"
//                 >
//                   <Twitter className="w-5 h-5" />
//                 </a>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileHeader;

/**
 * ProfileHeader Component
 * 
 * Displays user's name, profile ID, rank, and profile image.
 */

import { User, MapPin, Link as LinkIcon, Github, Linkedin, Twitter } from "lucide-react";

const ProfileHeader = ({ profile, rank }) => {
  // Safe destructuring with fallback values
  const {
    displayName = "User",
    profileImage = null,
    bio = null,
    location = null,
    website = null,
    socialLinks = null,
    publicProfileId = "user"
  } = profile || {};

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Profile Image */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white overflow-hidden">
          {profileImage ? (
            <img src={profileImage} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12" />
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-white">{displayName}</h1>
            <span className="text-gray-400 text-sm">{publicProfileId}</span>
          </div>

          {rank && (
            <div className="mb-2">
              <span className="text-gray-400">Rank </span>
              <span className="text-white font-semibold">{rank.toLocaleString()}</span>
            </div>
          )}

          {bio && <p className="text-gray-300 mb-3">{bio}</p>}

          {/* Additional Info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            )}
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-emerald-400 transition"
              >
                <LinkIcon className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
          </div>

          {/* Social Links */}
          {socialLinks && (
            <div className="flex gap-3 mt-3">
              {socialLinks.github && (
                <a
                  href={`https://github.com/${socialLinks.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition"
                >
                  <Github className="w-5 h-5" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={`https://linkedin.com/in/${socialLinks.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={`https://twitter.com/${socialLinks.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
