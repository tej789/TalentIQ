import { useParams, useNavigate } from "react-router";
import React from "react";
import { useSessionHistory } from "../hooks/useSessions";
import Navbar from "../components/Navbar";
import {
  ArrowLeftIcon,
  ClockIcon,
  CodeIcon,
  UsersIcon,
  CrownIcon,
  EditIcon,
  LogInIcon,
  LogOutIcon,
  ShieldIcon,
  Loader2Icon,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../context/ThemeContext";

function SessionHistoryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { data, isLoading } = useSessionHistory(id);

  const session = data?.session;

  // Build the language code map for display
  // Prefer finalLanguageCode, fall back to languageCode, then single finalCode
  const allLanguageCode = (() => {
    if (!session) return {};
    const map = {};

    // First try finalLanguageCode (snapshot at session end)
    const finalMap = session.finalLanguageCode || {};
    const langMap = session.languageCode || {};

    // Merge both maps (finalLanguageCode takes priority)
    for (const [lang, code] of Object.entries(langMap)) {
      if (code && code.trim()) map[lang] = code;
    }
    for (const [lang, code] of Object.entries(finalMap)) {
      if (code && code.trim()) map[lang] = code;
    }

    // If maps are empty, fall back to single finalCode/currentLanguage
    if (Object.keys(map).length === 0 && (session.finalCode || session.currentCode)) {
      map[session.currentLanguage || "javascript"] = session.finalCode || session.currentCode;
    }

    return map;
  })();

  const languageKeys = Object.keys(allLanguageCode);
  const [activeLanguageTab, setActiveLanguageTab] = React.useState(
    session?.currentLanguage || languageKeys[0] || "javascript"
  );

  // Update active tab when data loads
  React.useEffect(() => {
    if (languageKeys.length > 0 && !allLanguageCode[activeLanguageTab]) {
      setActiveLanguageTab(languageKeys[0]);
    }
  }, [languageKeys.length]);

  if (isLoading) {
    return (
      <div className="h-screen bg-root flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2Icon className="w-10 h-10 animate-spin text-accent-primary" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen bg-root flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-text-primary mb-2">Session not found</p>
            <button onClick={() => navigate("/dashboard")} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getActionIcon = (action) => {
    switch (action) {
      case "join": return <LogInIcon className="w-3.5 h-3.5 text-green-400" />;
      case "leave": return <LogOutIcon className="w-3.5 h-3.5 text-red-400" />;
      case "edit": return <EditIcon className="w-3.5 h-3.5 text-blue-400" />;
      case "permission_grant": return <ShieldIcon className="w-3.5 h-3.5 text-yellow-400" />;
      case "permission_revoke": return <ShieldIcon className="w-3.5 h-3.5 text-orange-400" />;
      default: return <ClockIcon className="w-3.5 h-3.5 text-text-muted" />;
    }
  };

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="h-screen bg-root flex flex-col">
      <Navbar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Back button + Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-bg-hover rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Session Report</h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {session.problem} •{" "}
                <span
                  className={`${
                    session.difficulty === "easy"
                      ? "text-green-400"
                      : session.difficulty === "medium"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {session.difficulty?.charAt(0).toUpperCase() + session.difficulty?.slice(1)}
                </span>
                {" "}• {new Date(session.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left - Code */}
            <div className="lg:col-span-2">
              <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden">
                <div className="p-4 border-b border-border-subtle flex items-center gap-2">
                  <CodeIcon className="w-4 h-4 text-accent-primary" />
                  <h2 className="font-semibold text-text-primary">
                    {languageKeys.length > 1 ? "Code by Language" : "Final Code"}
                  </h2>
                  {/* Language tabs (only show if multiple languages) */}
                  {languageKeys.length > 1 ? (
                    <div className="flex gap-1 ml-auto">
                      {languageKeys.map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setActiveLanguageTab(lang)}
                          className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                            activeLanguageTab === lang
                              ? "bg-accent-primary text-white"
                              : "bg-bg-hover text-text-secondary hover:text-text-primary hover:bg-bg-hover/80"
                          }`}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  ) : (
                    session.currentLanguage && (
                      <span className="text-xs px-2 py-0.5 bg-bg-hover rounded text-text-secondary ml-auto">
                        {session.currentLanguage}
                      </span>
                    )
                  )}
                </div>
                <div style={{ height: "400px" }}>
                  <Editor
                    height="100%"
                    language={activeLanguageTab || session.currentLanguage || "javascript"}
                    value={allLanguageCode[activeLanguageTab] || session.finalCode || "// No code was saved for this session"}
                    theme={isDark ? "vs-dark" : "vs"}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      scrollBeyondLastLine: false,
                      padding: { top: 12, bottom: 12 },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right - Info */}
            <div className="space-y-4">
              {/* Participants */}
              <div className="bg-surface rounded-xl border border-border-subtle p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UsersIcon className="w-4 h-4 text-accent-primary" />
                  <h3 className="font-semibold text-text-primary text-sm">Participants</h3>
                </div>
                <div className="space-y-2">
                  {/* Host */}
                  {session.host && (
                    <div className="flex items-center gap-2.5">
                      {session.host.profileImage ? (
                        <img src={session.host.profileImage} alt="" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-accent-primary/20 flex items-center justify-center text-xs font-bold text-accent-primary">
                          {session.host.name?.[0]}
                        </div>
                      )}
                      <span className="text-sm text-text-primary">{session.host.name}</span>
                      <CrownIcon className="w-3 h-3 text-yellow-400" />
                    </div>
                  )}

                  {/* Participants */}
                  {session.participants?.map((p, i) => {
                    const u = p.user;
                    if (!u) return null;
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        {u.profileImage ? (
                          <img src={u.profileImage} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-bg-hover flex items-center justify-center text-xs font-bold text-text-secondary">
                            {u.name?.[0]}
                          </div>
                        )}
                        <span className="text-sm text-text-primary">{u.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-surface rounded-xl border border-border-subtle p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="w-4 h-4 text-accent-primary" />
                  <h3 className="font-semibold text-text-primary text-sm">Edit Timeline</h3>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {session.editHistory?.length > 0 ? (
                    session.editHistory.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-bg-hover text-xs"
                      >
                        {getActionIcon(entry.action)}
                        <span className="text-text-primary font-medium">
                          {entry.userName || entry.userId?.name || "Unknown"}
                        </span>
                        <span className="text-text-muted">
                          {entry.action === "join"
                            ? "joined"
                            : entry.action === "leave"
                            ? "left"
                            : entry.action === "permission_grant"
                            ? "granted permissions"
                            : entry.action === "permission_revoke"
                            ? "revoked permissions"
                            : "edited code"}
                        </span>
                        <span className="text-text-muted ml-auto">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-text-muted text-center py-4">No activity recorded</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionHistoryPage;
