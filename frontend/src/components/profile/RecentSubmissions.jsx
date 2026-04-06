// /**
//  * RecentSubmissions Component
//  * 
//  * Displays list of recently solved problems.
//  */

// import { Clock } from "lucide-react";

// const RecentSubmissions = ({ activity }) => {
//   if (!activity || activity.length === 0) {
//     return (
//       <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//         <h3 className="text-lg font-semibold text-white mb-4">Recent AC</h3>
//         <p className="text-gray-400 text-sm">No solved problems yet</p>
//       </div>
//     );
//   }

//   const getDifficultyColor = (difficulty) => {
//     switch (difficulty) {
//       case "Easy":
//         return "text-emerald-400";
//       case "Medium":
//         return "text-yellow-400";
//       case "Hard":
//         return "text-red-400";
//       default:
//         return "text-gray-400";
//     }
//   };

//   const formatRelativeTime = (dateStr) => {
//     const now = new Date();
//     const date = new Date(dateStr);
//     const diffMs = now - date;
//     const diffSecs = Math.floor(diffMs / 1000);
//     const diffMins = Math.floor(diffSecs / 60);
//     const diffHours = Math.floor(diffMins / 60);
//     const diffDays = Math.floor(diffHours / 24);

//     if (diffSecs < 60) return "just now";
//     if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
//     if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
//     if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

//     const diffMonths = Math.floor(diffDays / 30);
//     if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;

//     const diffYears = Math.floor(diffMonths / 12);
//     return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
//   };

//   const getLanguageBadge = (language) => {
//     const colors = {
//       javascript: "bg-yellow-500/20 text-yellow-400",
//       python: "bg-blue-500/20 text-blue-400",
//       java: "bg-orange-500/20 text-orange-400",
//     };
//     return colors[language] || "bg-gray-500/20 text-gray-400";
//   };

//   return (
//     <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//       <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
//         <Clock className="w-5 h-5" />
//         Recent AC
//       </h3>

//       <div className="space-y-3">
//         {activity.map((item, index) => (
//           <div
//             key={index}
//             className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
//           >
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mb-1">
//                 <h4 className="text-white font-medium">{item.title}</h4>
//                 <span className={`text-sm font-semibold ${getDifficultyColor(item.difficulty)}`}>
//                   {item.difficulty}
//                 </span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <span className={`text-xs px-2 py-1 rounded ${getLanguageBadge(item.primaryLanguage)}`}>
//                   {item.primaryLanguage}
//                 </span>
//                 {item.languagesSolved && item.languagesSolved.length > 1 && (
//                   <span className="text-xs text-gray-400">
//                     +{item.languagesSolved.length - 1} more
//                   </span>
//                 )}
//               </div>
//             </div>
//             <div className="text-sm text-gray-400">
//               {formatRelativeTime(item.lastSubmissionAt)}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default RecentSubmissions;


/**
 * RecentSubmissions Component
 * 
 * Displays list of recently solved problems.
 */

import { Clock } from "lucide-react";

const RecentSubmissions = ({ activity }) => {
  // Safe array access with fallback
  const safeActivity = activity ?? [];
  
  if (safeActivity.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent AC</h3>
        <p className="text-gray-400 text-sm">No solved problems yet</p>
      </div>
    );
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "text-emerald-400";
      case "Medium":
        return "text-yellow-400";
      case "Hard":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const formatRelativeTime = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  };

  const getLanguageBadge = (language) => {
    const colors = {
      javascript: "bg-yellow-500/20 text-yellow-400",
      python: "bg-blue-500/20 text-blue-400",
      java: "bg-orange-500/20 text-orange-400",
    };
    return colors[language] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Recent AC
      </h3>

      <div className="space-y-3">
        {safeActivity.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-white font-medium">{item?.title || "Problem"}</h4>
                <span className={`text-sm font-semibold ${getDifficultyColor(item?.difficulty)}`}>
                  {item?.difficulty || "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getLanguageBadge(item?.primaryLanguage)}`}>
                  {item?.primaryLanguage || "Unknown"}
                </span>
                {item?.languagesSolved && (item.languagesSolved?.length ?? 0) > 1 && (
                  <span className="text-xs text-gray-400">
                    +{item.languagesSolved.length - 1} more
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-400">
              {formatRelativeTime(item?.lastSubmissionAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentSubmissions;
