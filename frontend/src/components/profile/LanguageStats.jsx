// /**
//  * LanguageStats Component
//  * 
//  * Displays language-wise problem solving statistics.
//  * Shows UNIQUE problems solved per language.
//  */

// import { Code } from "lucide-react";

// const LanguageStats = ({ languages }) => {
//   if (!languages || languages.length === 0) {
//     return (
//       <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//         <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
//         <p className="text-gray-400 text-sm">No problems solved yet</p>
//       </div>
//     );
//   }

//   const languageIcons = {
//     javascript: "🟨",
//     python: "🐍",
//     java: "☕",
//   };

//   return (
//     <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
//       <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
//         <Code className="w-5 h-5" />
//         Languages
//       </h3>

//       <div className="space-y-3">
//         {languages.map((lang) => (
//           <div
//             key={lang.key}
//             className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
//           >
//             <div className="flex items-center gap-3">
//               <span className="text-2xl">{languageIcons[lang.key] || "📝"}</span>
//               <span className="text-white font-medium">{lang.language}</span>
//             </div>
//             <div className="text-right">
//               <div className="text-white font-bold text-lg">{lang.problemsSolved}</div>
//               <div className="text-gray-400 text-xs">problems solved</div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default LanguageStats;

/**
 * LanguageStats Component
 * 
 * Displays language-wise problem solving statistics.
 * Shows UNIQUE problems solved per language.
 */

import { Code } from "lucide-react";

const LanguageStats = ({ languages }) => {
  if (!languages || languages.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Languages</h3>
        <p className="text-gray-400 text-sm">No problems solved yet</p>
      </div>
    );
  }
    const loading = false; // Placeholder for loading state, replace with actual loading logic
    if (loading) {
      return <div className="language-stats-loading">Loading language stats...</div>;
    }

  const languageIcons = {
    javascript: "🟨",
    python: "🐍",
    java: "☕",
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Code className="w-5 h-5" />
        Languages
      </h3>

      <div className="space-y-3">
        {languages.map((lang) => (
          <div
            key={lang.key}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{languageIcons[lang.key] || "📝"}</span>
              <span className="text-white font-medium">{lang.language}</span>
            </div>
            <div className="text-right">
              <div className="text-white font-bold text-lg">{lang.problemsSolved}</div>
              <div className="text-gray-400 text-xs">problems solved</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageStats;
