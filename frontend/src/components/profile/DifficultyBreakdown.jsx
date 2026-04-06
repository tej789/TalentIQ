// /**
//  * DifficultyBreakdown Component
//  * 
//  * Shows submission stats and streaks.
//  */

// import { Flame, Calendar, CheckCircle } from "lucide-react";

// const DifficultyBreakdown = ({ stats }) => {
//   if (!stats) return null;

//   const { submissions, streak, activeDays } = stats;
//   const acceptanceRate =
//     submissions.total > 0
//       ? ((submissions.accepted / submissions.total) * 100).toFixed(1)
//       : 0;

//   return (
//     <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//       <h3 className="text-lg font-semibold text-white mb-4">Submissions</h3>

//       <div className="space-y-4">
//         {/* Total Submissions */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <CheckCircle className="w-5 h-5 text-emerald-400" />
//             <span className="text-gray-300">Total Submissions</span>
//           </div>
//           <span className="text-white font-semibold">{submissions.total}</span>
//         </div>

//         {/* Accepted */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <CheckCircle className="w-5 h-5 text-green-400" />
//             <span className="text-gray-300">Accepted</span>
//           </div>
//           <span className="text-white font-semibold">{submissions.accepted}</span>
//         </div>

//         {/* Acceptance Rate */}
//         <div className="flex items-center justify-between">
//           <span className="text-gray-300">Acceptance Rate</span>
//           <span className="text-white font-semibold">{acceptanceRate}%</span>
//         </div>

//         <div className="border-t border-gray-700 my-4"></div>

//         {/* Streaks */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Flame className="w-5 h-5 text-orange-400" />
//             <span className="text-gray-300">Current Streak</span>
//           </div>
//           <span className="text-white font-semibold">{streak.current} days</span>
//         </div>

//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Flame className="w-5 h-5 text-red-400" />
//             <span className="text-gray-300">Max Streak</span>
//           </div>
//           <span className="text-white font-semibold">{streak.max} days</span>
//         </div>

//         {/* Active Days */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-2">
//             <Calendar className="w-5 h-5 text-blue-400" />
//             <span className="text-gray-300">Total Active Days</span>
//           </div>
//           <span className="text-white font-semibold">{activeDays}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DifficultyBreakdown;


/**
 * DifficultyBreakdown Component
 * 
 * Shows submission stats and streaks.
 */

import { Flame, Calendar, CheckCircle } from "lucide-react";

const DifficultyBreakdown = ({ stats }) => {
  // Safe destructuring with default values for new users
  const safeStats = stats || {};
  const submissions = safeStats.submissions || { total: 0, accepted: 0 };
  const streak = safeStats.streak || { current: 0, max: 0 };
  const activeDays = safeStats.activeDays ?? 0;
  
  const acceptanceRate =
    submissions.total > 0
      ? ((submissions.accepted / submissions.total) * 100).toFixed(1)
      : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Submissions</h3>

      <div className="space-y-4">
        {/* Total Submissions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-gray-300">Total Submissions</span>
          </div>
          <span className="text-white font-semibold">{submissions.total}</span>
        </div>

        {/* Accepted */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-gray-300">Accepted</span>
          </div>
          <span className="text-white font-semibold">{submissions.accepted}</span>
        </div>

        {/* Acceptance Rate */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Acceptance Rate</span>
          <span className="text-white font-semibold">{acceptanceRate}%</span>
        </div>

        <div className="border-t border-gray-700 my-4"></div>

        {/* Streaks */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-gray-300">Current Streak</span>
          </div>
          <span className="text-white font-semibold">{streak.current} days</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-400" />
            <span className="text-gray-300">Max Streak</span>
          </div>
          <span className="text-white font-semibold">{streak.max} days</span>
        </div>

        {/* Active Days */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-gray-300">Total Active Days</span>
          </div>
          <span className="text-white font-semibold">{activeDays}</span>
        </div>
      </div>
    </div>
  );
};

export default DifficultyBreakdown;
