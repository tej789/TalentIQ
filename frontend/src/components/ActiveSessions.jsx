// import {
//   ArrowRightIcon,
//   Code2Icon,
//   CrownIcon,
//   SparklesIcon,
//   UsersIcon,
//   ZapIcon,
// } from "lucide-react";
// import { Link } from "react-router";

// function ActiveSessions({ sessions, isLoading, isUserInSession }) {
//   return (
//     <div className="dashboard-card-lg">
//       <div className="card-padding">

//         {/* HEADER */}
//         <div className="card-header">
//           <div className="card-title-group">
//             <div className="icon-badge">
//               <ZapIcon className="icon-md" />
//             </div>
//             <h2 className="card-title">
//               Live Sessions
//             </h2>
//           </div>

//           <span className="card-badge">
//             {sessions.length} active
//           </span>
//         </div>

//         {/* CONTENT */}
//         <div className="sessions-list">
//           {isLoading ? (
//             <EmptyState
//               title="Loading sessions"
//               subtitle="Fetching live interview rooms"
//             />
//           ) : sessions.length > 0 ? (
//             sessions.map((session) => {
//               const isFull = session.participant && !isUserInSession(session);

//               return (
//                 <div key={session._id} className="session-card">
//                   <div className="session-card-content">

//                     {/* ICON */}
//                     <div className="session-icon-wrapper">
//                       <Code2Icon className="icon-lg" />
//                       <span className="status-indicator" />
//                     </div>

//                     {/* INFO */}
//                     <div className="session-info">
//                       <h3 className="session-title">
//                         {session.problem}
//                       </h3>

//                       <div className="session-meta">
//                         <span className="meta-item">
//                           <CrownIcon className="icon-xs" />
//                           {session.host?.name}
//                         </span>

//                         <span className="meta-separator">•</span>

//                         <span className="meta-item">
//                           <UsersIcon className="icon-xs" />
//                           {session.participant ? "2/2" : "1/2"}
//                         </span>

//                         <span className="meta-separator">•</span>

//                         <span className="meta-difficulty">
//                           {session.difficulty}
//                         </span>
//                       </div>
//                     </div>

//                     {/* ACTION */}
//                     {isFull ? (
//                       <span className="btn-disabled">
//                         Full
//                       </span>
//                     ) : (
//                       <Link
//                         to={`/session/${session._id}`}
//                         className="btn-join"
//                       >
//                         {isUserInSession(session) ? "Rejoin" : "Join"}
//                         <ArrowRightIcon className="icon-xs" />
//                       </Link>
//                     )}
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <EmptyState
//               title="No active sessions"
//               subtitle="Be the first to create one"
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ---------------- EMPTY STATE ---------------- */

// function EmptyState({ title, subtitle }) {
//   return (
//     <div className="text-center py-20 opacity-70">
//       <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-accent-primary/10 flex items-center justify-center">
//         <SparklesIcon className="size-8 text-accent-primary" />
//       </div>
//       <p className="text-lg font-medium text-text-primary mb-1">
//         {title}
//       </p>
//       <p className="text-sm text-text-secondary">
//         {subtitle}
//       </p>
//     </div>
//   );
// }

// export default ActiveSessions;


import {
  ArrowRightIcon,
  Code2Icon,
  CrownIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
  LoaderIcon,
  LockIcon,
  SearchIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { getDifficultyBadgeClass } from "../lib/utils";
import { useState } from "react";
import PasswordModal from "./PasswordModal";
import AlreadyInSessionModal from "./AlreadyInSessionModal";
import { sessionApi } from "../api/sessions";

function ActiveSessions({ sessions, isLoading, isUserInSession, searchQuery, onSearchChange }) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const navigate = useNavigate();
  const [passwordSession, setPasswordSession] = useState(null);
  const [isCheckingActive, setIsCheckingActive] = useState(false);
  const [alreadyInSessionData, setAlreadyInSessionData] = useState(null);

  const handleJoinClick = async (session) => {
    // If user is already in THIS session, navigate directly
    if (isUserInSession(session)) {
      navigate(`/session/${session._id}`);
      return;
    }

    // Check if user is already in a DIFFERENT active session
    setIsCheckingActive(true);
    try {
      const activeCheck = await sessionApi.checkActiveSession();
      if (activeCheck.inSession && activeCheck.sessionId.toString() !== session._id.toString()) {
        // Show friendly blocking modal — don't auto-redirect
        setAlreadyInSessionData({
          existingSessionId: activeCheck.sessionId,
          role: activeCheck.role,
          sessionProblem: activeCheck.sessionProblem,
          hostName: activeCheck.hostName,
        });
        return;
      }
    } catch (err) {
      // If check fails, let the backend joinSession handle it
      console.warn("Active session check failed:", err);
    } finally {
      setIsCheckingActive(false);
    }

    // If session has a password, show password modal
    if (session.hasPassword) {
      setPasswordSession(session);
      return;
    }
    // Otherwise, navigate directly
    navigate(`/session/${session._id}`);
  };

  const handlePasswordSubmit = (password) => {
    if (passwordSession) {
      // Store password in sessionStorage so SessionPage can use it to join
      sessionStorage.setItem(`session_password_${passwordSession._id}`, password);
      navigate(`/session/${passwordSession._id}`);
      setPasswordSession(null);
    }
  };

  const getParticipantCount = (session) => {
    const partsCount = session.participants?.length || 0; // host is already in participants array
    const maxParts = session.maxParticipants || 5;
    return { current: partsCount, max: maxParts };
  };

  const isSessionFull = (session) => {
    const { current, max } = getParticipantCount(session);
    return current >= max && !isUserInSession(session);
  };

  return (
    <div className="lg:col-span-2 card bg-base-100 border-2 border-primary/20 hover:border-primary/30">
      <div className="card-body p-0">
        {/* HEADERS SECTION */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* TITLE AND ICON */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
              <ZapIcon className="size-5" />
            </div>
            <h2 className="text-xl font-bold">Live Sessions</h2>
          </div>

          <div className="flex items-center gap-2 mr-6">
            <div className="size-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm font-medium text-success opacity-80">
              {safeSessions.length} active
            </span>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* SEARCH BAR */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
            <input
              type="text"
              placeholder="Search sessions by host or problem..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="input input-bordered input-sm w-full pl-9"
            />
          </div>

          {/* SESSIONS LIST */}
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoaderIcon className="size-10 animate-spin text-primary" />
              </div>
            ) : safeSessions.length > 0 ? (
              safeSessions.map((session) => {
                const { current, max } = getParticipantCount(session);
                const isFull = isSessionFull(session);

                return (
                  <div
                    key={session._id}
                    className="card bg-base-200 border-2 border-base-300 hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between gap-4 p-4">
                      {/* LEFT SIDE */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative size-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Code2Icon className="size-6 text-white" />
                          <div className="absolute -top-1 -right-1 size-3 bg-success rounded-full border-2 border-base-200" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="font-bold text-md truncate">{session.problem}</h3>
                            <span
                              className={`badge badge-xs ${getDifficultyBadgeClass(
                                session.difficulty
                              )}`}
                            >
                              {session.difficulty.slice(0, 1).toUpperCase() +
                                session.difficulty.slice(1)}
                            </span>
                            {session.hasPassword && (
                              <span className="badge badge-xs badge-warning gap-1">
                                <LockIcon className="size-2.5" />
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs opacity-70">
                            <div className="flex items-center gap-1">
                              <CrownIcon className="size-3.5" />
                              <span className="font-medium">{session.host?.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UsersIcon className="size-3.5" />
                              <span className="text-xs">{current}/{max}</span>
                            </div>
                            {isFull ? (
                              <span className="badge badge-error badge-xs">FULL</span>
                            ) : (
                              <span className="badge badge-success badge-xs">OPEN</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isFull ? (
                        <button className="btn btn-disabled btn-xs">Full</button>
                      ) : (
                        <button
                          onClick={() => handleJoinClick(session)}
                          className="btn btn-primary btn-xs gap-1"
                        >
                          {isUserInSession(session) ? "Rejoin" : "Join"}
                          <ArrowRightIcon className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                  <SparklesIcon className="w-8 h-8 text-primary/50" />
                </div>
                <p className="text-base font-semibold opacity-70 mb-1">
                  {searchQuery ? "No sessions match your search" : "No active sessions"}
                </p>
                <p className="text-sm opacity-50">
                  {searchQuery ? "Try a different search term" : "Be the first to create one!"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <PasswordModal
        isOpen={!!passwordSession}
        onClose={() => setPasswordSession(null)}
        onSubmit={handlePasswordSubmit}
        sessionName={passwordSession?.problem}
      />

      {/* Already-in-session blocking modal */}
      <AlreadyInSessionModal
        isOpen={!!alreadyInSessionData}
        onClose={() => setAlreadyInSessionData(null)}
        existingSessionId={alreadyInSessionData?.existingSessionId}
        hostName={alreadyInSessionData?.hostName}
        sessionProblem={alreadyInSessionData?.sessionProblem}
        role={alreadyInSessionData?.role}
      />
    </div>
  );
}
export default ActiveSessions;
