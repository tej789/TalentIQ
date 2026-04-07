import { Code2Icon, PlusIcon, LockIcon, UsersIcon, Loader2Icon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAllProblems } from "../api/problems";
import { LANGUAGE_CONFIG } from "../data/problems";

function CreateSessionModal({
  isOpen,
  onClose,
  roomConfig,
  setRoomConfig,
  onCreateRoom,
  isCreating,
}) {
  // Fetch problems from MongoDB API
  const { data: problemsData, isLoading: loadingProblems } = useQuery({
    queryKey: ["allProblems"],
    queryFn: getAllProblems,
    enabled: isOpen,
  });

  const problems = problemsData?.problems || [];

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* BACKDROP (BEHIND MODAL) */}
      <div
        className="modal-backdrop"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="modal-container" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>

          {/* HEADER */}
          <div className="modal-header">
            <h2 className="modal-title">
              Create Interview Session
            </h2>
            <p className="modal-subtitle">
              Start a collaborative coding interview
            </p>
          </div>

          {/* FORM */}
          <div className="modal-form">
            {/* Problem Selection */}
            <div className="form-group">
              <label className="form-label">
                Select Problem <span className="text-red-400">*</span>
              </label>

              <select
                className="form-select"
                value={roomConfig.problem}
                onChange={(e) => {
                  const selectedProblem = problems.find(
                    (p) => p.title === e.target.value
                  );
                  setRoomConfig((prev) => ({
                    ...prev,
                    difficulty: selectedProblem?.difficulty || "Easy",
                    problem: e.target.value,
                    problemId: selectedProblem?._id || null,
                  }));
                }}
              >
                <option value="" disabled>
                  {loadingProblems ? "Loading problems…" : "Choose a coding problem…"}
                </option>

                {(problems || []).map((problem) => (
                  <option key={problem._id} value={problem.title}>
                    {problem.title} ({problem.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Password (optional) */}
            <div className="form-group">
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <LockIcon className="icon-xs" />
                  Session Password
                  <span className="text-text-muted text-xs font-normal">(optional)</span>
                </span>
              </label>
              <input
                type="password"
                className="form-select"
                placeholder="Leave empty for open session"
                value={roomConfig.password || ""}
                onChange={(e) =>
                  setRoomConfig((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>

            {/* Max Participants */}
            <div className="form-group">
              <label className="form-label">
                <span className="flex items-center gap-1.5">
                  <UsersIcon className="icon-xs" />
                  Max Participants
                </span>
              </label>
              <select
                className="form-select"
                value={roomConfig.maxParticipants || 5}
                onChange={(e) =>
                  setRoomConfig((prev) => ({
                    ...prev,
                    maxParticipants: parseInt(e.target.value),
                  }))
                }
              >
                {[2, 3, 4, 5, 8, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} participants
                  </option>
                ))}
              </select>
            </div>

            {/* SUMMARY */}
            {roomConfig.problem && (
              <div className="session-summary">
                <div className="summary-content">
                  <div className="summary-icon">
                    <Code2Icon className="icon-md" />
                  </div>

                  <div className="summary-details">
                    <p className="summary-title">
                      Session Summary
                    </p>
                    <p className="summary-item">
                      Problem:{" "}
                      <span className="summary-value">
                        {roomConfig.problem}
                      </span>
                    </p>
                    <p className="summary-item">
                      Participants:{" "}
                      <span className="summary-value">
                        Up to {roomConfig.maxParticipants || 5}
                      </span>
                    </p>
                    {roomConfig.password && (
                      <p className="summary-item">
                        <span className="summary-value flex items-center gap-1">
                          <LockIcon className="w-3 h-3" />
                          Password protected
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="modal-actions">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>

            <button
              onClick={onCreateRoom}
              disabled={isCreating || !roomConfig.problem}
              className="btn-primary"
            >
              {isCreating ? (
                <>
                  <span className="spinner" />
                  Creating…
                </>
              ) : (
                <>
                  <PlusIcon className="icon-sm" />
                  Create Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateSessionModal;
