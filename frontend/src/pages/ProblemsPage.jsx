import { Link } from "react-router";
import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { getAllProblems } from "../api/problems";
import { ChevronRightIcon, Code2Icon, Loader } from "lucide-react";
import { getDifficultyBadgeClass } from "../lib/utils";

function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const data = await getAllProblems();
      setProblems(data.problems || []);
    } catch (error) {
      console.error("Error fetching problems:", error);
    } finally {
      setLoading(false);
    }
  };

  const easyProblemsCount = problems.filter((p) => p.difficulty === "Easy").length;
  const mediumProblemsCount = problems.filter((p) => p.difficulty === "Medium").length;
  const hardProblemsCount = problems.filter((p) => p.difficulty === "Hard").length;

  // Filter problems based on selected difficulty
  const filteredProblems = selectedDifficulty === "All" 
    ? problems 
    : problems.filter((p) => p.difficulty === selectedDifficulty);

  if (loading) {
    return (
      <div className="min-h-screen bg-root">
        <Navbar />
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 'calc(100vh - 80px)',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <Loader className="animate-spin" size={40} style={{ color: 'var(--accent-primary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-root">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-semibold mb-2 text-text-primary">Practice Problems</h1>
          <p className="text-text-secondary">
            Sharpen your coding skills with these curated problems
          </p>
        </div>

        {/* FILTER SECTION */}
        <div className="mb-8 bg-surface border border-border-subtle rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-accent-primary rounded-full"></div>
              <span className="text-text-primary font-semibold text-lg">Filter by Difficulty</span>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedDifficulty("All")}
                className={`group relative px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  selectedDifficulty === "All"
                    ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/30 scale-105"
                    : "bg-bg-elevated border border-border-subtle text-text-secondary hover:bg-surface hover:border-accent-primary/30 hover:text-accent-primary hover:shadow-md"
                }`}
              >
                <span className="flex items-center gap-2">
                  All
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedDifficulty === "All" 
                      ? "bg-white/20" 
                      : "bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary/20"
                  }`}>
                    {problems.length}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setSelectedDifficulty("Easy")}
                className={`group relative px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  selectedDifficulty === "Easy"
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105"
                    : "bg-bg-elevated border border-border-subtle text-text-secondary hover:bg-green-500/5 hover:border-green-500/30 hover:text-green-400 hover:shadow-md"
                }`}
              >
                <span className="flex items-center gap-2">
                  Easy
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedDifficulty === "Easy" 
                      ? "bg-white/20" 
                      : "bg-green-500/10 text-green-400 group-hover:bg-green-500/20"
                  }`}>
                    {easyProblemsCount}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setSelectedDifficulty("Medium")}
                className={`group relative px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  selectedDifficulty === "Medium"
                    ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30 scale-105"
                    : "bg-bg-elevated border border-border-subtle text-text-secondary hover:bg-yellow-500/5 hover:border-yellow-500/30 hover:text-yellow-400 hover:shadow-md"
                }`}
              >
                <span className="flex items-center gap-2">
                  Medium
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedDifficulty === "Medium" 
                      ? "bg-white/20" 
                      : "bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20"
                  }`}>
                    {mediumProblemsCount}
                  </span>
                </span>
              </button>
              
              <button
                onClick={() => setSelectedDifficulty("Hard")}
                className={`group relative px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                  selectedDifficulty === "Hard"
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                    : "bg-bg-elevated border border-border-subtle text-text-secondary hover:bg-red-500/5 hover:border-red-500/30 hover:text-red-400 hover:shadow-md"
                }`}
              >
                <span className="flex items-center gap-2">
                  Hard
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedDifficulty === "Hard" 
                      ? "bg-white/20" 
                      : "bg-red-500/10 text-red-400 group-hover:bg-red-500/20"
                  }`}>
                    {hardProblemsCount}
                  </span>
                </span>
              </button>
            </div>
          </div>
          
          {/* Active filter indicator */}
          {selectedDifficulty !== "All" && (
            <div className="mt-4 pt-4 border-t border-border-subtle flex items-center gap-2 text-sm">
              <span className="text-text-muted">Showing:</span>
              <span className={`px-3 py-1 rounded-md font-medium ${
                selectedDifficulty === "Easy" ? "bg-green-500/20 text-green-400" :
                selectedDifficulty === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {selectedDifficulty} Problems ({filteredProblems.length})
              </span>
              <button
                onClick={() => setSelectedDifficulty("All")}
                className="ml-auto text-accent-primary hover:text-accent-primary/80 font-medium transition-colors"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>

        {/* PROBLEMS LIST */}
        <div className="space-y-3">
          {filteredProblems.length === 0 ? (
            <div className="bg-surface border border-border-subtle rounded-lg p-12 text-center">
              <Code2Icon className="size-16 text-text-muted mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No problems found</h3>
              <p className="text-text-secondary">
                No {selectedDifficulty.toLowerCase()} problems available at the moment.
              </p>
            </div>
          ) : (
            filteredProblems.map((problem) => (
            <Link
              key={problem._id}
              to={`/problem/${problem.slug || problem._id}`}
              className="group block bg-surface border border-border-subtle rounded-lg p-5 hover:bg-bg-elevated hover:shadow-md transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                {/* LEFT SIDE */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-12 rounded-lg bg-accent-soft flex items-center justify-center">
                      <Code2Icon className="size-6 text-accent-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-text-primary">{problem.title}</h2>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                          problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {problem.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted">{problem.category}</p>
                    </div>
                  </div>
                  <p className="text-text-secondary mb-3">
                    {problem.description?.text || problem.description || "No description available"}
                  </p>
                </div>
                {/* RIGHT SIDE */}

                <div className="flex items-center gap-2 text-text-secondary hover:text-accent-primary transition-colors duration-150">
                  <span className="font-medium">Solve</span>
                  <ChevronRightIcon className="size-5 group-hover:translate-x-1 transition-transform duration-150" />
                </div>
              </div>
            </Link>
          ))
          )}
        </div>

        {/* STATS FOOTER */}
        <div className="mt-12 bg-surface border border-border-subtle rounded-lg p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-text-secondary text-sm">Total Problems</div>
              <div className="text-accent-primary font-semibold text-2xl">{problems.length}</div>
            </div>

            <div className="text-center">
              <div className="text-text-secondary text-sm">Easy</div>
              <div className="text-green-400 font-semibold text-2xl">{easyProblemsCount}</div>
            </div>
            <div className="text-center">
              <div className="text-text-secondary text-sm">Medium</div>
              <div className="text-yellow-400 font-semibold text-2xl">{mediumProblemsCount}</div>
            </div>
            <div className="text-center">
              <div className="text-text-secondary text-sm">Hard</div>
              <div className="text-red-400 font-semibold text-2xl">{hardProblemsCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProblemsPage;
