import { Code2, Clock, Users, Trophy, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router";
import { useMyRecentSessions } from "../hooks/useSessions";
import Navbar from "../components/Navbar";

function AllSessionsPage() {
  const { data: recentSessionsData, isLoading } = useMyRecentSessions();
  const sessions = recentSessionsData?.sessions || [];

  return (
    <div className="min-h-screen bg-root">
      <Navbar />
      
      <div className="dashboard-container py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="mb-12">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-surface border border-border-subtle hover:border-accent-primary hover:bg-accent-primary/5 text-text-secondary hover:text-accent-primary transition-all duration-200 mb-8 group font-medium shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </Link>
            
            <div className="flex items-center gap-5">
              <div className="icon-badge bg-accent-primary/10">
                <Clock className="icon-md text-accent-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-text-primary mb-2">All Past Sessions</h1>
                <p className="text-text-secondary text-lg">
                  {isLoading ? (
                    "Loading..."
                  ) : (
                    <>
                      <span className="font-semibold text-accent-primary">{sessions.length}</span>{" "}
                      {sessions.length === 1 ? 'session' : 'sessions'} completed
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="recent-sessions-grid gap-6">
            {isLoading ? (
              <EmptyState
                title="Loading sessions"
                subtitle="Fetching your interview history"
              />
            ) : sessions.length > 0 ? (
              sessions.map((session) => {
                const participantCount = session.participants?.length || 0;

                return (
                  <div key={session._id} className="recent-session-card">
                    <div className="recent-card-content">

                      {/* TOP */}
                      <div className="recent-card-header">
                        <div className="icon-badge-sm">
                          <Code2 className="icon-md" />
                        </div>

                        <div className="recent-card-info">
                          <h3 className="recent-card-title">
                            {session.problem}
                          </h3>
                          <p className="recent-card-time">
                            {formatDistanceToNow(new Date(session.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* META */}
                      <div className="recent-card-meta">
                        <span className="meta-item">
                          <Users className="icon-xs" />
                          {participantCount} participant{participantCount !== 1 ? "s" : ""}
                        </span>

                        <span className="meta-difficulty">
                          {session.difficulty}
                        </span>
                      </div>

                      {/* FOOTER */}
                      <div className="recent-card-footer">
                        <span className="footer-label">
                          Completed
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="footer-date">
                            {new Date(session.updatedAt).toLocaleDateString()}
                          </span>
                          <Link
                            to={`/session/${session._id}/history`}
                            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                            title="View session report"
                          >
                            <ExternalLink className="icon-xs" />
                          </Link>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No sessions yet"
                subtitle="Start your first coding interview"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- EMPTY STATE ---------------- */

function EmptyState({ title, subtitle }) {
  const isLoading = title.toLowerCase().includes("loading");
  
  return (
    <div className="col-span-full text-center py-32">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-accent-primary/10 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-10 h-10 text-accent-primary animate-spin" />
        ) : (
          <Trophy className="w-10 h-10 text-accent-primary" />
        )}
      </div>
      <p className="text-xl font-semibold text-text-primary mb-2">
        {title}
      </p>
      <p className="text-base text-text-secondary">
        {subtitle}
      </p>
    </div>
  );
}

export default AllSessionsPage;
