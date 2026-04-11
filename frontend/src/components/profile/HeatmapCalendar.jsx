// /**
//  * HeatmapCalendar Component (LeetCode-Style)
//  * 
//  * Production-grade contribution heatmap that matches LeetCode behavior exactly.
//  * - Shows ONLY accepted submissions (not all submissions)
//  * - 365-day view with week columns and day rows
//  * - Dynamic color intensity based on submission count
//  * - Month labels, streak stats, year selector
//  * - Optimized rendering with proper memoization
//  */

// import { useState, useMemo, useRef, useEffect } from "react";
// import { generateColorIntensities } from "../../utils/colorUtils";

// const HeatmapCalendar = ({ heatmap, color = "#22c55e", onYearChange, selectedYear }) => {
//   const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
//   const [dropdownOpen, setDropdownOpen] = useState(false);
//   const dropdownRef = useRef(null);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setDropdownOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   if (!heatmap || !heatmap.weeks) return null;

//   const { weeks, months, currentStreak, maxStreak, totalSubmissions, availableYears, activeDays } = heatmap;

//   // Memoize color intensities to avoid recalculation
//   const colorLevels = useMemo(() => generateColorIntensities(color), [color]);

//   /**
//    * Get color for specific intensity level (LeetCode style)
//    * Level 0 = no submissions (dark gray with visible border)
//    * Level 1-4 = increasing intensity of base color
//    */
//   const getColor = (level) => {
//     return colorLevels[level] || colorLevels[0];
//   };

//   const handleMouseEnter = (day, event) => {
//     if (!day.date) return;
//     const rect = event.target.getBoundingClientRect();
//     setTooltip({
//       visible: true,
//       x: rect.left + rect.width / 2,
//       y: rect.top - 8,
//       data: day,
//     });
//   };

//   const handleMouseLeave = () => {
//     setTooltip({ visible: false, x: 0, y: 0, data: null });
//   };

//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     return date.toLocaleDateString("en-US", { 
//       month: "short", 
//       day: "numeric", 
//       year: "numeric" 
//     });
//   };

//   const currentYear = new Date().getFullYear();

//   return (
//     <div className="bg-[#282828] rounded-lg p-5 border border-gray-700/50">
//       {/* Header with stats and year selector */}
//       <div className="flex items-center justify-between mb-4">
//         {/* Left side - submission count with info icon */}
//         <div className="flex items-center gap-2 text-sm text-gray-300">
//           <span className="text-xl font-bold text-white">{totalSubmissions}</span>
//           <span>submissions in the past one year</span>
//           <svg className="w-4 h-4 text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <circle cx="12" cy="12" r="10" strokeWidth="2"/>
//             <path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
//           </svg>
//         </div>
        
//         {/* Right side - stats and dropdown */}
//         <div className="flex items-center gap-6">
//           {/* Stats */}
//           <div className="flex gap-6 text-sm text-gray-400">
//             <span>
//               Total active days: <span className="text-white font-medium">{activeDays || 0}</span>
//             </span>
//             <span>
//               Max streak: <span className="text-white font-medium">{maxStreak || 0}</span>
//             </span>
//           </div>
          
//           {/* Year dropdown (LeetCode style) */}
//           {availableYears && availableYears.length > 0 && (
//             <div className="relative" ref={dropdownRef}>
//               <button
//                 onClick={() => setDropdownOpen(!dropdownOpen)}
//                 className="flex items-center gap-2 bg-[#3a3a3a] hover:bg-[#444] text-white px-4 py-1.5 rounded-md text-sm transition-colors"
//               >
//                 <span>{selectedYear === currentYear ? "Current" : selectedYear}</span>
//                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                 </svg>
//               </button>
              
//               {dropdownOpen && (
//                 <div className="absolute right-0 mt-1 bg-[#3a3a3a] rounded-lg shadow-xl border border-gray-600 py-1 z-50 min-w-[120px]">
//                   <button
//                     onClick={() => { onYearChange(currentYear); setDropdownOpen(false); }}
//                     className="w-full flex items-center justify-between px-4 py-2 text-sm text-white hover:bg-[#444] transition-colors"
//                   >
//                     <span>Current</span>
//                     {selectedYear === currentYear && (
//                       <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                       </svg>
//                     )}
//                   </button>
//                   {availableYears.filter(y => y !== currentYear).sort((a, b) => b - a).map((year) => (
//                     <button
//                       key={year}
//                       onClick={() => { onYearChange(year); setDropdownOpen(false); }}
//                       className="w-full flex items-center justify-between px-4 py-2 text-sm text-white hover:bg-[#444] transition-colors"
//                     >
//                       <span>{year}</span>
//                       {selectedYear === year && (
//                         <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                         </svg>
//                       )}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Heatmap Grid Container */}
//       <div className="overflow-x-auto">
//         <div className="inline-block relative">
//           {/* Week columns grid - LeetCode style */}
//           <div className="flex gap-[3px]">
//             {weeks.map((week, weekIdx) => (
//               <div key={weekIdx} className="flex flex-col gap-[3px]">
//                 {week.map((day, dayIdx) => (
//                   <div
//                     key={dayIdx}
//                     className={`w-[10px] h-[10px] rounded-[2px] transition-colors ${
//                       day.date 
//                         ? "cursor-pointer" 
//                         : "invisible"
//                     }`}
//                     style={{ 
//                       backgroundColor: day.date ? getColor(day.level) : "transparent",
//                       outline: day.date && day.level === 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
//                       outlineOffset: "-1px"
//                     }}
//                     onMouseEnter={(e) => handleMouseEnter(day, e)}
//                     onMouseLeave={handleMouseLeave}
//                   />
//                 ))}
//               </div>
//             ))}
//           </div>

//           {/* Month labels positioned at bottom - LeetCode style */}
//           <div className="relative mt-2 h-5">
//             {months
//               .reduce((filtered, month, idx, arr) => {
//                 // Always show first month if it has enough space (3+ weeks)
//                 if (idx === 0) {
//                   if (arr.length > 1 && arr[1].weekIndex - month.weekIndex >= 3) {
//                     filtered.push(month);
//                   }
//                   return filtered;
//                 }
                
//                 // For subsequent months, ensure at least 3 weeks gap from last shown month
//                 const lastShown = filtered[filtered.length - 1];
//                 if (!lastShown || month.weekIndex - lastShown.weekIndex >= 3) {
//                   filtered.push(month);
//                 }
                
//                 return filtered;
//               }, [])
//               .map((month, idx) => {
//                 const leftPosition = month.weekIndex * 13; // 10px width + 3px gap
//                 return (
//                   <div
//                     key={idx}
//                     className="absolute text-xs text-gray-500"
//                     style={{ left: `${leftPosition}px` }}
//                   >
//                     {month.name}
//                   </div>
//                 );
//               })}
//           </div>
//         </div>
//       </div>

//       {/* Tooltip */}
//       {tooltip.visible && tooltip.data && (
//         <div
//           className="fixed z-50 bg-[#3a3a3a] text-white px-3 py-2 rounded-md text-xs border border-gray-600 pointer-events-none shadow-lg"
//           style={{
//             left: tooltip.x,
//             top: tooltip.y,
//             transform: "translate(-50%, -100%)",
//           }}
//         >
//           <span className="font-semibold">{tooltip.data.count} submission{tooltip.data.count !== 1 ? "s" : ""}</span>
//           <span className="text-gray-400 ml-1">on {formatDate(tooltip.data.date)}</span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default HeatmapCalendar;


/**
 * HeatmapCalendar Component (LeetCode-Style)
 * 
 * Production-grade contribution heatmap that matches LeetCode behavior exactly.
 * - Shows ONLY accepted submissions (not all submissions)
 * - 365-day view with week columns and day rows
 * - Dynamic color intensity based on submission count
 * - Month labels, streak stats, year selector
 * - Optimized rendering with proper memoization
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { generateColorIntensities } from "../../utils/colorUtils";

const HeatmapCalendar = ({ heatmap, color = "#22c55e", onYearChange, selectedYear }) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!heatmap || !heatmap.weeks) return null;

  const { weeks, months, currentStreak, maxStreak, totalSubmissions, availableYears, activeDays } = heatmap;

  // Group weeks by month for LeetCode-style rendering
  const monthlyWeeks = useMemo(() => {
    if (!months || !weeks) return [];
    return months.map((month, index) => {
      const nextMonth = months[index + 1];
      const startWeek = month.weekIndex;
      const endWeek = nextMonth ? nextMonth.weekIndex : weeks.length;
      return {
        name: month.name,
        weeks: weeks.slice(startWeek, endWeek),
      };
    });
  }, [months, weeks]);

  // Memoize color intensities to avoid recalculation
  const colorLevels = useMemo(() => generateColorIntensities(color), [color]);

  /**
   * Get color for specific intensity level (LeetCode style)
   * Level 0 = no submissions (dark gray)
   * Level 1-4 = increasing intensity of base color
   */
  const getColor = (level) => {
    return colorLevels[level] || colorLevels[0];
  };

  const handleMouseEnter = (day, event) => {
    if (!day.date) return;
    const rect = event.target.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      data: day,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const currentYear = new Date().getFullYear();

  // Day labels for the left side
  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="bg-[#0d1117] rounded-xl p-6 border border-gray-800/50">
      {/* Header with submission count and controls */}
      <div className="flex items-center justify-between mb-6">
        {/* Left side - submission count */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-white">{totalSubmissions}</span>
          <span className="text-sm text-gray-400">submissions in the past one year</span>
          <svg className="w-4 h-4 text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path strokeLinecap="round" d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        
        {/* Right side - stats and year selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 text-sm">
            <div className="text-gray-400">
              Total active days: <span className="text-white font-semibold">{activeDays || 0}</span>
            </div>
            <div className="text-gray-400">
              Max streak: <span className="text-white font-semibold">{maxStreak || 0}</span>
            </div>
          </div>
          
          {/* Year dropdown */}
          {availableYears && availableYears.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700"
              >
                <span>{selectedYear === currentYear ? "Current" : selectedYear}</span>
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-[#2a2a2a] rounded-lg shadow-2xl border border-gray-700 py-1 z-50 min-w-[140px]">
                  <button
                    onClick={() => { onYearChange(currentYear); setDropdownOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-white hover:bg-[#333] transition-colors"
                  >
                    <span>Current</span>
                    {selectedYear === currentYear && (
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  {availableYears.filter(y => y !== currentYear).sort((a, b) => b - a).map((year) => (
                    <button
                      key={year}
                      onClick={() => { onYearChange(year); setDropdownOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-white hover:bg-[#333] transition-colors"
                    >
                      <span>{year}</span>
                      {selectedYear === year && (
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Grid Container - LeetCode Style */}
      <div className="overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {monthlyWeeks.map((monthData, monthIdx) => (
            <div key={monthIdx} className="flex flex-col">
              {/* Month Label */}
              <div className="text-xs text-gray-400 mb-2 ml-1">
                {monthData.name}
              </div>
              {/* Weeks for the month */}
              <div className="flex gap-1">
                {monthData.weeks.map((week, weekIdx) => (
                  <div key={weekIdx} className="flex flex-col gap-1">
                    {week.map((day, dayIdx) => (
                      <div
                        key={dayIdx}
                        className={`w-[10px] h-[10px] rounded-[2px] transition-all duration-100 ${
                          day.date 
                            ? "cursor-pointer hover:ring-1 hover:ring-white/40 hover:ring-offset-0 hover:scale-110" 
                            : "invisible"
                        }`}
                        style={{ 
                          backgroundColor: day.date ? getColor(day.level) : "transparent",
                          border: day.date && day.level === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                        }}
                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                        onMouseLeave={handleMouseLeave}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="fixed z-50 bg-[#2d2d2d] text-white px-3 py-2 rounded-lg text-xs border border-gray-600 pointer-events-none shadow-2xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-semibold">
            {tooltip.data.count} submission{tooltip.data.count !== 1 ? "s" : ""}
          </div>
          <div className="text-gray-400 mt-0.5">
            {formatDate(tooltip.data.date)}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatmapCalendar;
