// import { useNavigate } from "react-router";
// import { useUser } from "@clerk/clerk-react";
// import { useState } from "react";
// import { useActiveSessions, useCreateSession, useMyRecentSessions } from "../hooks/useSessions";

// import Navbar from "../components/Navbar";
// import WelcomeSection from "../components/WelcomeSection";
// import StatsCards from "../components/StatsCards";
// import ActiveSessions from "../components/ActiveSessions";
// import RecentSessions from "../components/RecentSessions";
// import CreateSessionModal from "../components/CreateSessionModal";

// function DashboardPage() {
//   const navigate = useNavigate();
//   const { user } = useUser();
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: "" });

//   const createSessionMutation = useCreateSession();

//   const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
//   const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();

//   const handleCreateRoom = () => {
//     if (!roomConfig.problem || !roomConfig.difficulty) return;

//     createSessionMutation.mutate(
//       {
//         problem: roomConfig.problem,
//         difficulty: roomConfig.difficulty.toLowerCase(),
//       },
//       {
//         onSuccess: (data) => {
//           setShowCreateModal(false);
//           navigate(`/session/${data.session._id}`);
//         },
//       }
//     );
//   };

//   const activeSessions = activeSessionsData?.sessions || [];
//   const recentSessions = recentSessionsData?.sessions || [];

//   const isUserInSession = (session) => {
//     if (!user.id) return false;

//     return session.host?.clerkId === user.id || session.participant?.clerkId === user.id;
//   };

//   return (
//     <>
//       <div className="dashboard-page">
//         <Navbar />
//         <WelcomeSection onCreateSession={() => setShowCreateModal(true)} />

//         {/* Grid layout */}
//         <div className="dashboard-container">
//           <div className="dashboard-grid">
//             <StatsCards
//               activeSessionsCount={activeSessions.length}
//               recentSessionsCount={recentSessions.length}
//             />
//             <ActiveSessions
//               sessions={activeSessions}
//               isLoading={loadingActiveSessions}
//               isUserInSession={isUserInSession}
//             />
//           </div>

//           <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
//         </div>
//       </div>

//       <CreateSessionModal
//         isOpen={showCreateModal}
//         onClose={() => setShowCreateModal(false)}
//         roomConfig={roomConfig}
//         setRoomConfig={setRoomConfig}
//         onCreateRoom={handleCreateRoom}
//         isCreating={createSessionMutation.isPending}
//       />
//     </>
//   );
// }

// export default DashboardPage;


import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useActiveSessions, useCreateSession, useMyRecentSessions } from "../hooks/useSessions";
import { sessionApi } from "../api/sessions";

import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import CreateSessionModal from "../components/CreateSessionModal";
import AlreadyInSessionModal from "../components/AlreadyInSessionModal";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [alreadyInSessionData, setAlreadyInSessionData] = useState(null);

  const createSessionMutation = useCreateSession();

  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions(searchQuery);
  const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();

  const activeSessions = activeSessionsData?.sessions ?? null;
  const recentSessions = recentSessionsData?.sessions ?? null;

  // Check if the current user is already in ANY active session (host OR participant)
  const userActiveSession = Array.isArray(activeSessions)
    ? activeSessions.find(
        (s) =>
          s.status === "active" &&
          (s.host?.clerkId === user?.id ||
           s.participant?.clerkId === user?.id ||
           s.participants?.some((p) => p.user?.clerkId === user?.id))
      )
    : null;

  const handleCreateRoom = async () => {
    if (!roomConfig.problem || !roomConfig.difficulty) return;

    // Pre-flight check: is user already in an active session?
    try {
      const activeCheck = await sessionApi.checkActiveSession();
      if (activeCheck.inSession) {
        setShowCreateModal(false);
        setAlreadyInSessionData({
          existingSessionId: activeCheck.sessionId,
          role: activeCheck.role,
          sessionProblem: activeCheck.sessionProblem,
          hostName: activeCheck.hostName,
        });
        return;
      }
    } catch (err) {
      console.warn("Active session check failed:", err);
    }

    createSessionMutation.mutate(
      {
        problem: roomConfig.problem,
        difficulty: roomConfig.difficulty.toLowerCase(),
        password: roomConfig.password || undefined,
        maxParticipants: roomConfig.maxParticipants || 5,
        problemId: roomConfig.problemId || undefined,
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          navigate(`/session/${data.session._id}`);
        },
        onError: (error) => {
          const errData = error?.response?.data;
          if (errData?.alreadyInSession) {
            setShowCreateModal(false);
            setAlreadyInSessionData({
              existingSessionId: errData.sessionId,
              role: errData.role,
              sessionProblem: errData.sessionProblem,
              hostName: errData.hostName,
            });
          }
        },
      }
    );
  };

  const isUserInSession = (session) => {
    if (!user.id) return false;

    return (
      session.host?.clerkId === user.id ||
      session.participant?.clerkId === user.id ||
      session.participants?.some((p) => p.user?.clerkId === user.id)
    );
  };

  return (
    <>
      <div className="dashboard-page">
        <Navbar />
        <WelcomeSection onCreateSession={() => setShowCreateModal(true)} />

        {/* Grid layout */}
        <div className="dashboard-container">
          <div className="dashboard-grid">
            <div className="dashboard-main-content">
              <StatsCards
                activeSessionsCount={Array.isArray(activeSessions) ? activeSessions.length : null}
                recentSessionsCount={Array.isArray(recentSessions) ? recentSessions.length : null}
              />
              <ActiveSessions
                sessions={activeSessions}
                isLoading={loadingActiveSessions}
                isUserInSession={isUserInSession}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
          </div>
        </div>
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
      />

      <AlreadyInSessionModal
        isOpen={!!alreadyInSessionData}
        onClose={() => setAlreadyInSessionData(null)}
        existingSessionId={alreadyInSessionData?.existingSessionId}
        hostName={alreadyInSessionData?.hostName}
        sessionProblem={alreadyInSessionData?.sessionProblem}
        role={alreadyInSessionData?.role}
      />
    </>
  );
}

export default DashboardPage;
