// /**
//  * StatsRing Component
//  * 
//  * Displays the circular progress ring showing solved problems.
//  * Replicates LeetCode's stats circle.
//  */

// const StatsRing = ({ stats }) => {
//   if (!stats) return null;

//   const { solved, available } = stats;
//   const percentage = available.total > 0 ? (solved.total / available.total) * 100 : 0;

//   // Calculate circle parameters
//   const size = 180;
//   const strokeWidth = 12;
//   const radius = (size - strokeWidth) / 2;
//   const circumference = 2 * Math.PI * radius;
//   const progress = (percentage / 100) * circumference;

//   return (
//     <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//       <div className="flex flex-col items-center">
//         {/* Circular Progress */}
//         <div className="relative" style={{ width: size, height: size }}>
//           <svg width={size} height={size} className="transform -rotate-90">
//             {/* Background circle */}
//             <circle
//               cx={size / 2}
//               cy={size / 2}
//               r={radius}
//               fill="none"
//               stroke="#374151"
//               strokeWidth={strokeWidth}
//             />
//             {/* Progress circle */}
//             <circle
//               cx={size / 2}
//               cy={size / 2}
//               r={radius}
//               fill="none"
//               stroke="url(#gradient)"
//               strokeWidth={strokeWidth}
//               strokeDasharray={circumference}
//               strokeDashoffset={circumference - progress}
//               strokeLinecap="round"
//               className="transition-all duration-1000"
//             />
//             {/* Gradient definition */}
//             <defs>
//               <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
//                 <stop offset="0%" stopColor="#fbbf24" />
//                 <stop offset="50%" stopColor="#10b981" />
//                 <stop offset="100%" stopColor="#ef4444" />
//               </linearGradient>
//             </defs>
//           </svg>

//           {/* Center text */}
//           <div className="absolute inset-0 flex flex-col items-center justify-center">
//             <div className="text-4xl font-bold text-white">
//               {solved.total}
//               <span className="text-2xl text-gray-400">/{available.total}</span>
//             </div>
//             <div className="text-sm text-gray-400 mt-1">Solved</div>
//           </div>
//         </div>

//         {/* Difficulty badges */}
//         <div className="flex gap-4 mt-6 w-full justify-around">
//           <div className="text-center">
//             <div className="text-sm text-emerald-400 mb-1">Easy</div>
//             <div className="text-lg font-semibold text-white">
//               {solved.easy}
//               <span className="text-sm text-gray-400">/{available.easy}</span>
//             </div>
//           </div>
//           <div className="text-center">
//             <div className="text-sm text-yellow-400 mb-1">Med.</div>
//             <div className="text-lg font-semibold text-white">
//               {solved.medium}
//               <span className="text-sm text-gray-400">/{available.medium}</span>
//             </div>
//           </div>
//           <div className="text-center">
//             <div className="text-sm text-red-400 mb-1">Hard</div>
//             <div className="text-lg font-semibold text-white">
//               {solved.hard}
//               <span className="text-sm text-gray-400">/{available.hard}</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StatsRing;


/**
 * StatsRing Component
 * 
 * Displays the circular progress ring showing solved problems.
 * Replicates LeetCode's stats circle.
 */

const StatsRing = ({ stats }) => {
  // Safe destructuring with default values for new users
  const safeStats = stats || {};
  const solved = safeStats.solved || { total: 0, easy: 0, medium: 0, hard: 0 };
  const available = safeStats.available || { total: 0, easy: 0, medium: 0, hard: 0 };
  const percentage = available.total > 0 ? (solved.total / available.total) * 100 : 0;

  // Calculate circle parameters
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (percentage / 100) * circumference;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#374151"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold text-white">
              {solved.total}
              <span className="text-2xl text-gray-400">/{available.total}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">Solved</div>
          </div>
        </div>

        {/* Difficulty badges */}
        <div className="flex gap-4 mt-6 w-full justify-around">
          <div className="text-center">
            <div className="text-sm text-emerald-400 mb-1">Easy</div>
            <div className="text-lg font-semibold text-white">
              {solved.easy}
              <span className="text-sm text-gray-400">/{available.easy}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-yellow-400 mb-1">Med.</div>
            <div className="text-lg font-semibold text-white">
              {solved.medium}
              <span className="text-sm text-gray-400">/{available.medium}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-red-400 mb-1">Hard</div>
            <div className="text-lg font-semibold text-white">
              {solved.hard}
              <span className="text-sm text-gray-400">/{available.hard}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsRing;
