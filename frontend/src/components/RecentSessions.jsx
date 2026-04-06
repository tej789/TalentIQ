import { Code2, Clock, Users, Trophy, ExternalLink, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router";

function RecentSessions({ sessions, isLoading }) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const displayedSessions = safeSessions.slice(0, 5); // Show only first 5
  const hasMore = safeSessions.length > 5;

  return (
    <div className="dashboard-card">
      <div className="card-padding">

        {/* HEADER */}
        <div className="card-title-group">
          <div className="icon-badge">
            <Clock className="icon-md" />
          </div>
          <h2 className="card-title">
            Past Sessions
          </h2>
        </div>

        {/* CONTENT */}
        <div className="recent-sessions-grid">
          {isLoading ? (
            <EmptyState
              title="Loading sessions"
              subtitle="Fetching your interview history"
            />
          ) : displayedSessions.length > 0 ? (
            displayedSessions.map((session) => {
              const participantCount = session.participants?.length || 0; // host is already in participants array

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

        {/* VIEW ALL BUTTON */}
        {hasMore && !isLoading && (
          <div className="mt-6 text-center">
            <Link
              to="/sessions/all"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              View All Sessions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- EMPTY STATE ---------------- */

function EmptyState({ title, subtitle }) {
  return (
    <div className="col-span-full text-center py-24 opacity-70">
      <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-accent-primary/10 flex items-center justify-center">
        <Trophy className="size-8 text-accent-primary" />
      </div>
      <p className="text-lg font-medium text-text-primary mb-1">
        {title}
      </p>
      <p className="text-sm text-text-secondary">
        {subtitle}
      </p>
    </div>
  );
}

export default RecentSessions;
