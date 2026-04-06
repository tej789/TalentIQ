import { TrophyIcon, UsersIcon } from "lucide-react";

function StatsCards({ activeSessionsCount, recentSessionsCount }) {
  return (
    <div className="stats-cards-container">

      {/* ACTIVE SESSIONS */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="icon-badge-lg">
            <UsersIcon className="icon-lg" />
          </div>
          <span className="stat-badge">
            LIVE
          </span>
        </div>

        <div className="stat-value">
          {activeSessionsCount}
        </div>
        <div className="stat-label">
          Active Sessions
        </div>
      </div>

      {/* TOTAL SESSIONS */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="icon-badge-lg">
            <TrophyIcon className="icon-lg" />
          </div>
        </div>

        <div className="stat-value">
          {recentSessionsCount}
        </div>
        <div className="stat-label">
          Total Sessions
        </div>
      </div>

    </div>
  );
}

export default StatsCards;
