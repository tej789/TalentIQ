import { useUser } from "@clerk/clerk-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import toast from "react-hot-toast";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { useCollaboration } from "../hooks/useCollaboration";
import { PROBLEMS } from "../data/problems";
import axiosInstance from "../lib/axios";
import { sessionApi } from "../api/sessions";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  Loader2Icon,
  LogOutIcon,
  PhoneOffIcon,
  UsersIcon,
  MessageSquareIcon,
  MonitorIcon,
} from "lucide-react";
import CollaborativeEditor from "../components/CollaborativeEditor";
import OutputPanel from "../components/OutputPanel";
import VideoStack from "../components/VideoStack";
import ChatDrawer from "../components/ChatDrawer";
import ParticipantPanel from "../components/ParticipantPanel";
import PasswordModal from "../components/PasswordModal";
import AlreadyInSessionModal from "../components/AlreadyInSessionModal";
import {
  broadcastSessionLeave,
  broadcastSessionEnd,
  onSessionBroadcast,
} from "../lib/sessionBroadcast";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantPanelOpen, setIsParticipantPanelOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("editor");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [screenShareExpanded, setScreenShareExpanded] = useState(false);
  // State for the "already in a session" blocking modal
  const [alreadyInSessionData, setAlreadyInSessionData] = useState(null);
  // Flip to true the moment the user starts leaving (own action or cross-tab
  // broadcast). Stops background polling so a last-second refetch can't
  // flip `isParticipant → false` and cause a visible flicker before navigate().
  const [isLeaving, setIsLeaving] = useState(false);

  // Detect mobile viewport
  // dual Y.Doc connections (the root cause of code duplication on sync)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-save state
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimerRef = useRef(null);
  // Tracks whether we've already fired the join mutation for this session
  // mount. Prevents the 5-second refetchInterval from re-triggering the
  // join (and its toast) every time the `session` object reference changes.
  const joinAttemptedRef = useRef(false);
  // Set to true the moment the user starts leaving / the cross-tab broadcast
  // arrives. Prevents the auto-join effect and refetch from causing a flicker
  // during the brief window before navigate() fires.
  const isLeavingRef = useRef(false);

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id, { pauseRefetch: isLeaving });

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();

  const session = sessionData?.session;
  const isHost = session?.host?.clerkId === user?.id;
  const isParticipant =
    session?.participant?.clerkId === user?.id ||
    session?.participants?.some((p) => p.user?.clerkId === user?.id);

  const { call, channel, chatClient, isInitializingCall, streamClient } = useStreamClient(
    session,
    loadingSession,
    isHost,
    isParticipant
  );

  // Get problem data: prefer MongoDB populated data, fallback to local PROBLEMS
  const mongoDbProblem = session?.problemId; // populated Problem document from MongoDB
  const localProblem = session?.problem
    ? Object.values(PROBLEMS).find((p) => p.title === session.problem)
    : null;
  const problemData = mongoDbProblem || localProblem;

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  // Get starter code for current language from problem data
  const getStarterCode = useCallback((lang) => {
    if (!problemData?.starterCode) return "";
    return problemData.starterCode[lang] || "";
  }, [problemData]);

  const [code, setCode] = useState("");

  // Refs to always have the latest language and code inside effects
  const selectedLanguageRef = useRef(selectedLanguage);
  const codeRef = useRef(code);

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Real-time collaboration
  const {
    remoteCode,
    remoteLanguage,
    languageCode,
    remoteSavedCode,
    cursors,
    connectedUsers,
    canEdit,
    permissions,
    screenShareUser,
    isKicked,
    sessionEnded,
    joinRejected,
    isConnected: socketConnected,
    sendCursorUpdate,
    sendLanguageChange,
    setLanguageCode,
    grantEdit,
    revokeEdit,
    kickParticipant,
    grantScreenShare,
    startScreenShare,
    stopScreenShare,
    endSessionSocket,
    leaveSession,
    saveCode,
  } = useCollaboration(
    id,
    user?.id,
    user?.fullName || user?.firstName || "User",
    user?.imageUrl,
    isHost
  );

  // Apply remote code updates from Socket.IO
  useEffect(() => {
    if (typeof remoteCode === "string" && remoteCode !== code) {
      setCode(remoteCode);
    }
  }, [remoteCode, code]);

  // Apply remote language changes and, if available, the corresponding code
  // snapshot provided by the host via savedCode. This runs only when the
  // server tells us the language has changed (initial state or another user),
  // so local manual language switches are not overridden.
  useEffect(() => {
    if (!remoteLanguage) return;

    const currentLang = selectedLanguageRef.current;
    const currentCode = codeRef.current;

    if (remoteLanguage === currentLang) return;

    setLanguageCode((prev) => ({
      ...prev,
      [currentLang]: currentCode,
    }));

    setSelectedLanguage(remoteLanguage);

    if (remoteSavedCode !== null && remoteSavedCode !== undefined) {
      setCode(remoteSavedCode);
    }
  }, [remoteLanguage, remoteSavedCode, setLanguageCode]);

  // Reset trackers whenever we navigate to a different session.
  useEffect(() => {
    joinAttemptedRef.current = false;
    isLeavingRef.current = false;
    setIsLeaving(false);
  }, [id]);

  // Auto-join session
  useEffect(() => {
    // Don't attempt join if session data or user isn't ready yet.
    if (!session || !user || loadingSession) return;
    // Already in this session — nothing to do.
    if (isHost || isParticipant) return;
    // We've already sent a join request this mount — don't resend.
    // This prevents the 5-second `refetchInterval` from firing the mutation
    // (and its "Joined session successfully!" toast) repeatedly.
    if (joinAttemptedRef.current) return;
    // The user is in the process of leaving — don't re-join.
    if (isLeavingRef.current) return;

    joinAttemptedRef.current = true;

    // Check if password was stored from dashboard
    const storedPassword = sessionStorage.getItem(`session_password_${id}`) || "";

    // If session has password and we don't have one stored, show modal
    if (session.hasPassword && !storedPassword) {
      setShowPasswordModal(true);
      return;
    }

    joinSessionMutation.mutate(
      { id, password: storedPassword },
      {
        onSuccess: () => {
          sessionStorage.removeItem(`session_password_${id}`);
          refetch();
        },
        onError: (error) => {
          const errData = error?.response?.data;
          if (errData?.alreadyInSession) {
            // Block and show friendly modal — don't auto-redirect
            setAlreadyInSessionData({
              existingSessionId: errData.sessionId,
              role: errData.role,
              sessionProblem: errData.sessionProblem,
              hostName: errData.hostName,
            });
          } else if (errData?.message?.includes("password")) {
            sessionStorage.removeItem(`session_password_${id}`);
            setShowPasswordModal(true);
          }
        },
      }
    );
  }, [session, user, loadingSession, isHost, isParticipant, id]);

  // Handle password submit from modal
  const handlePasswordSubmit = (password) => {
    joinSessionMutation.mutate(
      { id, password },
      {
        onSuccess: () => {
          setShowPasswordModal(false);
          refetch();
        },
        onError: (error) => {
          const errData = error?.response?.data;
          if (errData?.alreadyInSession) {
            setShowPasswordModal(false);
            setAlreadyInSessionData({
              existingSessionId: errData.sessionId,
              role: errData.role,
              sessionProblem: errData.sessionProblem,
              hostName: errData.hostName,
            });
          }
          // Other errors are shown by the mutation's onError toast
        },
      }
    );
  };

  // ── Cross-tab session sync ─────────────────────────────────────────────
  // If the user leaves or ends the session in another tab, navigate every
  // other tab that has this session open back to the dashboard so they're
  // never stuck in a stale session view.
  useEffect(() => {
    const unsub = onSessionBroadcast((event) => {
      if (!event || event.sessionId !== id) return;
      if (event.type === "SESSION_LEFT" || event.type === "SESSION_ENDED") {
        // Mark leaving immediately so the auto-join effect and any in-flight
        // refetch cannot fire and cause a flicker before navigate() runs.
        isLeavingRef.current = true;
        setIsLeaving(true);
        navigate("/dashboard");
      }
    });
    return unsub;
  }, [id, navigate]);

  // Handle kicked
  useEffect(() => {
    if (isKicked) {
      navigate("/dashboard");
    }
  }, [isKicked, navigate]);

  // Handle socket join rejected (user already in another active session)
  // Show blocking modal instead of silently redirecting.
  useEffect(() => {
    if (joinRejected) {
      setAlreadyInSessionData({
        existingSessionId: joinRejected.existingSessionId || null,
        role: "PARTICIPANT",
        sessionProblem: null,
        hostName: null,
      });
    }
  }, [joinRejected]);

  // Handle session ended by host
  useEffect(() => {
    if (sessionEnded) {
      navigate("/dashboard");
    }
  }, [sessionEnded, navigate]);

  // Redirect when session completed
  useEffect(() => {
    if (!session || loadingSession) return;
    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);

  // Update code when problem loads (only once, before collaboration connects)
  useEffect(() => {
    if (!problemData?.starterCode) return;
    const starter = getStarterCode(selectedLanguage);
    if (starter && !code) {
      setCode(starter);
    }
  }, [problemData]);

  const handleLanguageChange = useCallback(
    (e) => {
      const newLang = e.target.value;
      const oldLang = selectedLanguage;

      const oldCode = code;

      // Save current code under old language locally
      setLanguageCode((prev) => ({
        ...prev,
        [oldLang]: oldCode,
      }));

      setSelectedLanguage(newLang);

      // Determine what code to load for the new language:
      // 1. Saved code from languageCode map (user's previous code in this language)
      // 2. Starter code from problem
      const savedCode = languageCode[newLang];
      const newCode = savedCode || getStarterCode(newLang);

      setCode(newCode);
      setOutput(null);
      sendLanguageChange(newLang, oldLang, oldCode);

      // Show saving status for language switch save
      setIsAutoSaving(true);
      setTimeout(() => {
        setIsAutoSaving(false);
        setLastSaved(new Date());
      }, 600);

    },
    [getStarterCode, sendLanguageChange, selectedLanguage, code, languageCode]
  );

  const handleCodeChange = useCallback(
    (newCode) => {
      setCode(newCode);

      // Debounced auto-save: save after 2s of inactivity
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        setIsAutoSaving(true);
        saveCode();
        // Show "Saving..." briefly, then "Saved"
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSaved(new Date());
        }, 500);
      }, 2000);
    },
    [saveCode]
  );

  const handleCursorUpdate = useCallback(
    (position, selection) => {
      sendCursorUpdate(position, selection);
    },
    [sendCursorUpdate]
  );

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      // Use judge /run endpoint with test cases when we have a problem ID
      const problemId = mongoDbProblem?._id || mongoDbProblem?.slug || localProblem?.id;
      if (problemId) {
        const response = await axiosInstance.post("/judge/run", {
          problemId,
          code,
          language: selectedLanguage,
        });
        const data = response.data;
        if (data.success) {
          // Format judge results into output format
          const lines = data.results.map((r) => {
            const status = r.passed ? "✅ PASSED" : r.error ? "❌ ERROR" : "❌ FAILED";
            let line = `Test ${r.testCase}: ${status}`;
            if (r.input) line += `\n  Input: ${r.input}`;
            if (r.expectedOutput) line += `\n  Expected: ${r.expectedOutput}`;
            if (r.userOutput !== null && r.userOutput !== undefined) line += `\n  Got: ${r.userOutput}`;
            if (r.error) line += `\n  Error: ${r.error}`;
            return line;
          });
          const summary = `\n━━━ ${data.summary.passed}/${data.summary.total} passed ━━━`;
          setOutput({
            success: data.status === "passed",
            output: lines.join("\n\n") + summary,
          });
        } else {
          setOutput({ success: false, error: data.error });
        }
      } else {
        // Fallback: sandbox execute (no test cases)
        const response = await axiosInstance.post("/judge/execute", {
          code,
          language: selectedLanguage,
        });
        setOutput(response.data);
      }
    } catch (error) {
      const msg = error.response?.data?.error || error.message || "Failed to execute code";
      setOutput({ success: false, error: msg });
    }
    setIsRunning(false);
  };

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      // Lock out the auto-join effect and stop background polling immediately
      // so any in-flight refetch can't cause a flicker before navigate() fires.
      isLeavingRef.current = true;
      setIsLeaving(true);
      endSessionSocket();
      saveCode();
      // Clear any pending auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      endSessionMutation.mutate(id, {
        onSuccess: () => {
          // Tell every other tab that has this session open to also leave
          broadcastSessionEnd(id);
          navigate("/dashboard");
        },
      });
    }
  };

  const handleLeaveSession = async () => {
    if (confirm("Are you sure you want to leave this session?")) {
      // Lock out the auto-join effect and stop background polling immediately.
      isLeavingRef.current = true;
      setIsLeaving(true);
      // Clear any pending auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Use HTTP endpoint for reliable leave (socket emit may not arrive
      // before the page navigates away and the socket disconnects).
      try {
        await sessionApi.leaveSession(id);
      } catch (err) {
        console.warn("HTTP leave failed, falling back to socket:", err);
        leaveSession(); // socket emit as fallback
      }

      // Tell every other tab that has this session open to also leave.
      // This handles the case where the user had the session open in
      // multiple tabs — all of them should vacate now.
      broadcastSessionLeave(id);
      navigate("/dashboard");
    }
  };

  // Clean up auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Count participants
  const participantCount = session?.participants?.length || 0; // host is already in participants array
  const maxParts = session?.maxParticipants || 5;

  // ─── RENDER ─────────────────────────────────────────────

  return (
    <div className="h-screen bg-root flex flex-col">
      <Navbar />

      {/* Desktop Layout */}
      <div className="flex-1 hidden md:block">
        <PanelGroup direction="horizontal">
          {/* ════════ LEFT SECTION: Collaboration Area ════════ */}
          <Panel defaultSize={isChatOpen ? 35 : 40} minSize={25}>
            <div className="h-full flex flex-col bg-bg-elevated">
              {/* Top Bar */}
              <div className="session-top-bar">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <h1 className="text-lg font-semibold text-text-primary truncate">
                    {session?.problem || "Loading..."}
                  </h1>
                  {session?.difficulty && (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                        session.difficulty === "easy"
                          ? "bg-green-500/20 text-green-400"
                          : session.difficulty === "medium"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Socket connection indicator */}
                  <div
                    className={`w-2 h-2 rounded-full ${socketConnected ? "bg-green-500" : "bg-red-500"}`}
                    title={socketConnected ? "Connected" : "Disconnected"}
                  />

                  {/* Chat toggle */}
                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`p-1.5 rounded-md text-sm transition-colors ${
                      isChatOpen
                        ? "bg-accent-primary text-white"
                        : "hover:bg-bg-hover text-text-secondary hover:text-text-primary"
                    }`}
                    title="Toggle chat"
                  >
                    <MessageSquareIcon className="w-4 h-4" />
                  </button>

                  {/* Participants */}
                  <button
                    onClick={() => setIsParticipantPanelOpen(true)}
                    className="p-1.5 rounded-md hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1"
                    title="See participants"
                  >
                    <UsersIcon className="w-4 h-4" />
                    <span className="text-xs">{participantCount}/{maxParts}</span>
                  </button>

                  {/* End Session (Host) / Leave Session (Participant) */}
                  {isHost && session?.status === "active" && (
                    <button
                      onClick={handleEndSession}
                      disabled={endSessionMutation.isPending}
                      className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white rounded-md text-xs font-medium gap-1.5 inline-flex items-center disabled:opacity-50"
                    >
                      {endSessionMutation.isPending ? (
                        <Loader2Icon className="w-3 h-3 animate-spin" />
                      ) : (
                        <LogOutIcon className="w-3 h-3" />
                      )}
                      End
                    </button>
                  )}
                  {!isHost && isParticipant && session?.status === "active" && (
                    <button
                      onClick={handleLeaveSession}
                      className="px-2.5 py-1 bg-red-500/80 hover:bg-red-500 text-white rounded-md text-xs font-medium gap-1.5 inline-flex items-center transition-colors"
                    >
                      <LogOutIcon className="w-3 h-3" />
                      Leave
                    </button>
                  )}
                </div>
                
              </div>

              {/* Description (60%) + Video (40%) split */}
              <div className="flex-1 flex flex-col overflow-hidden relative">

                {/* Description Panel (60% of left section) — hidden when screen share is expanded */}
                {!screenShareExpanded && (
                <div className="flex-[6] overflow-y-auto min-h-0">
                  <div className="p-4 space-y-4">
                    {problemData?.description && (
                      <div className="bg-surface rounded-lg p-4 border border-border-subtle">
                        <h2 className="text-base font-semibold mb-3 text-text-primary">Description</h2>
                        <div className="space-y-2 text-sm leading-relaxed">
                          <p className="text-text-secondary">
                            {typeof problemData.description === "string"
                              ? problemData.description
                              : problemData.description.text}
                          </p>
                          {problemData.description?.notes?.map((note, idx) => (
                            <p key={idx} className="text-text-secondary">{note}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {problemData?.examples?.length > 0 && (
                      <div className="bg-surface rounded-lg p-4 border border-border-subtle">
                        <h2 className="text-base font-semibold mb-3 text-text-primary">Examples</h2>
                        <div className="space-y-3">
                          {problemData.examples.map((example, idx) => (
                            <div key={idx}>
                              <p className="text-xs font-medium text-text-primary mb-1.5">
                                Example {idx + 1}
                              </p>
                              <div className="bg-bg-elevated rounded p-3 font-mono text-xs space-y-1">
                                <div className="flex gap-2">
                                  <span className="text-accent-primary font-semibold min-w-[55px]">Input:</span>
                                  <span className="text-text-primary">{example.input}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-accent-primary font-semibold min-w-[55px]">Output:</span>
                                  <span className="text-text-primary">{example.output}</span>
                                </div>
                                {example.explanation && (
                                  <div className="pt-1.5 border-t border-border-subtle mt-1.5">
                                    <span className="text-text-muted text-[11px]">
                                      <span className="font-semibold">Explanation:</span> {example.explanation}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {problemData?.constraints?.length > 0 && (
                      <div className="bg-surface rounded-lg p-4 border border-border-subtle">
                        <h2 className="text-base font-semibold mb-3 text-text-primary">Constraints</h2>
                        <ul className="space-y-1.5 text-text-secondary text-sm">
                          {problemData.constraints.map((c, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-accent-primary">•</span>
                              <code className="text-xs text-text-primary">{c}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* Resize handle */}
                {!screenShareExpanded && (
                <div className="h-1 bg-border-default hover:bg-accent-primary transition-colors cursor-row-resize flex-shrink-0" />
                )}

                {/* Video Section — SINGLE stable rendering */}
                <div className={screenShareExpanded ? "flex-1 min-h-0 overflow-hidden" : "flex-[4] min-h-0 overflow-hidden"}>
                  {isInitializingCall ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2Icon className="w-8 h-8 mx-auto animate-spin text-accent-primary mb-3" />
                        <p className="text-sm text-text-secondary">Connecting to video...</p>
                      </div>
                    </div>
                  ) : !streamClient || !call ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center p-4">
                        <PhoneOffIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-sm text-text-primary">Connection Failed</p>
                        <p className="text-xs text-text-secondary">Unable to connect to video</p>
                      </div>
                    </div>
                  ) : (
                    <StreamVideo client={streamClient}>
                      <StreamCall call={call}>
                        <VideoStack
                          isHost={isHost}
                          screenShareExpanded={screenShareExpanded}
                          onToggleScreenShareExpand={() => setScreenShareExpanded(prev => !prev)}
                        />
                      </StreamCall>
                    </StreamVideo>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {/* Chat Drawer (between left and right) */}
          {isChatOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-border-default hover:bg-accent-primary transition-colors cursor-col-resize" />
              <Panel defaultSize={20} minSize={15} maxSize={30}>
                <ChatDrawer
                  isOpen={isChatOpen}
                  onClose={() => setIsChatOpen(false)}
                  chatClient={chatClient}
                  channel={channel}
                />
              </Panel>
            </>
          )}

          <PanelResizeHandle className="w-1.5 bg-border-default hover:bg-accent-primary transition-colors cursor-col-resize" />

          {/* ════════ RIGHT SECTION: Coding Area ════════ */}
          <Panel defaultSize={isChatOpen ? 45 : 60} minSize={30}>
            <PanelGroup direction="vertical">
              {/* Code Editor (top) */}
              <Panel defaultSize={65} minSize={30}>
                <CollaborativeEditor
                  selectedLanguage={selectedLanguage}
                  isRunning={isRunning}
                  isAutoSaving={isAutoSaving}
                  lastSaved={lastSaved}
                  onLanguageChange={handleLanguageChange}
                  onRunCode={handleRunCode}
                  canEdit={canEdit}
                  cursors={cursors}
                  onCursorUpdate={handleCursorUpdate}
                  isHost={isHost}
                  connectedUsers={connectedUsers}
                  sessionId={!isMobile ? id : null}
                />
              </Panel>

              <PanelResizeHandle className="h-1.5 bg-border-default hover:bg-accent-primary transition-colors cursor-row-resize" />

              {/* Output (bottom) */}
              <Panel defaultSize={35} minSize={15}>
                <OutputPanel output={output} />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* ════════ MOBILE LAYOUT ════════ */}
      <div className="flex-1 md:hidden flex flex-col">
        {/* Mobile Top Bar */}
        <div className="session-top-bar">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-text-primary truncate">
              {session?.problem || "Loading..."}
            </h1>
            {session?.difficulty && (
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  session.difficulty === "easy"
                    ? "bg-green-500/20 text-green-400"
                    : session.difficulty === "medium"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {session.difficulty.charAt(0).toUpperCase() + session.difficulty.slice(1)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsParticipantPanelOpen(true)}
              className="p-1 rounded hover:bg-bg-hover text-text-secondary"
            >
              <UsersIcon className="w-4 h-4" />
            </button>
            {isHost && session?.status === "active" && (
              <button
                onClick={handleEndSession}
                className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] font-medium"
              >
                End
              </button>
            )}
            {!isHost && isParticipant && session?.status === "active" && (
              <button
                onClick={handleLeaveSession}
                className="px-2 py-0.5 bg-red-500/80 hover:bg-red-500 text-white rounded text-[10px] font-medium transition-colors"
              >
                Leave
              </button>
            )}
          </div>
        </div>

        {/* Mobile Content — use CSS hiding instead of conditional rendering to prevent mount/unmount */}
        <div className="flex-1 overflow-hidden relative">
          <div className={`h-full overflow-y-auto p-4 space-y-4 ${mobileTab !== "description" ? "hidden" : ""}`}>
            {problemData?.description && (
              <div className="bg-surface rounded-lg p-4 border border-border-subtle">
                <h2 className="text-base font-semibold mb-3 text-text-primary">Description</h2>
                <p className="text-sm text-text-secondary">
                  {typeof problemData.description === "string"
                    ? problemData.description
                    : problemData.description?.text}
                </p>
              </div>
            )}
            {problemData?.examples?.map((ex, idx) => (
              <div key={idx} className="bg-surface rounded-lg p-3 border border-border-subtle">
                <p className="text-xs font-medium mb-1">Example {idx + 1}</p>
                <div className="bg-bg-elevated rounded p-2 font-mono text-xs space-y-1">
                  <div>Input: {ex.input}</div>
                  <div>Output: {ex.output}</div>
                </div>
              </div>
            ))}

            {/* Video indicator on mobile (no duplicate Stream tree — desktop one handles it) */}
            <div className="bg-surface rounded-lg border border-border-subtle overflow-hidden p-6 text-center">
              {streamClient && call ? (
                <div>
                  <UsersIcon className="w-8 h-8 mx-auto mb-2 text-accent-primary" />
                  <p className="text-sm text-text-primary font-medium">Video call active</p>
                  <p className="text-xs text-text-muted mt-1">Video is displayed in the desktop view</p>
                </div>
              ) : isInitializingCall ? (
                <div>
                  <Loader2Icon className="w-6 h-6 animate-spin text-accent-primary mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Connecting to video...</p>
                </div>
              ) : (
                <div>
                  <PhoneOffIcon className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <p className="text-xs text-text-muted">Video unavailable</p>
                </div>
              )}
            </div>
          </div>

          <div className={`h-full ${mobileTab !== "editor" ? "hidden" : ""}`}>
            <CollaborativeEditor
              selectedLanguage={selectedLanguage}
              isRunning={isRunning}
              isAutoSaving={isAutoSaving}
              lastSaved={lastSaved}
              onLanguageChange={handleLanguageChange}
              onRunCode={handleRunCode}
              canEdit={canEdit}
              cursors={cursors}
              onCursorUpdate={handleCursorUpdate}
              isHost={isHost}
              connectedUsers={connectedUsers}
              sessionId={isMobile ? id : null}
            />
          </div>

          <div className={`h-full ${mobileTab !== "chat" ? "hidden" : ""}`}>
            {chatClient && channel ? (
              <ChatDrawer isOpen={true} onClose={() => setMobileTab("editor")} chatClient={chatClient} channel={channel} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-text-muted">Chat not available</p>
              </div>
            )}
          </div>

          <div className={`h-full ${mobileTab !== "output" ? "hidden" : ""}`}>
            <OutputPanel output={output} />
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="mobile-tab-bar">
          {["description", "editor", "chat", "output"].map((tab) => (
            <button
              key={tab}
              onClick={() => setMobileTab(tab)}
              className={`mobile-tab ${mobileTab === tab ? "mobile-tab-active" : ""}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Participant Panel (shared across mobile/desktop) */}
      <ParticipantPanel
        isOpen={isParticipantPanelOpen}
        onClose={() => setIsParticipantPanelOpen(false)}
        session={session}
        connectedUsers={connectedUsers}
        permissions={permissions}
        isHost={isHost}
        onGrantEdit={grantEdit}
        onRevokeEdit={revokeEdit}
        onGrantScreenShare={grantScreenShare}
        onKick={kickParticipant}
        currentUserId={user?.id}
      />

      {/* Password Modal for joining protected sessions */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          navigate("/dashboard");
        }}
        onSubmit={handlePasswordSubmit}
        sessionName={session?.problem}
      />

      {/* Already-in-session blocking modal */}
      <AlreadyInSessionModal
        isOpen={!!alreadyInSessionData}
        onClose={() => {
          setAlreadyInSessionData(null);
          navigate("/dashboard");
        }}
        existingSessionId={alreadyInSessionData?.existingSessionId}
        hostName={alreadyInSessionData?.hostName}
        sessionProblem={alreadyInSessionData?.sessionProblem}
        role={alreadyInSessionData?.role}
      />
    </div>
  );
}

export default SessionPage;
