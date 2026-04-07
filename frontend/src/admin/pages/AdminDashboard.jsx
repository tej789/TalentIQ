import { useEffect, useState } from "react";
import { getAdminDashboard } from "../../api/admin";
import { Loader, FileCode, CheckCircle } from "lucide-react";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboard();
      setStats(data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="admin-loading">
        <Loader className="animate-spin" size={40} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // ✅ Error UI
  if (error) {
    return (
      <div className="admin-error">
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  // ✅ SAFE destructuring (FIXED)
  const statistics = stats?.statistics || {};
  const problems = stats?.problems || [];

  return (
    <div className="admin-dashboard">
      <h1 className="admin-page-title">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: "#2CBE4E20" }}>
            <FileCode size={24} style={{ color: "#2CBE4E" }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Problems</p>
            <h3 className="stat-value">
              {statistics?.totalProblems || 0}
            </h3>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon" style={{ background: "#3B82F620" }}>
            <CheckCircle size={24} style={{ color: "#3B82F6" }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Submissions</p>
            <h3 className="stat-value">
              {statistics?.totalSubmissions || 0}
            </h3>
          </div>
        </div>

        {/* Difficulty Breakdown */}
        {(statistics?.difficultyBreakdown || []).map((item) => (
          <div key={item._id} className="admin-stat-card">
            <div className="stat-content">
              <p className="stat-label">{item._id} Problems</p>
              <h3 className="stat-value">{item.count}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Problems Table */}
      <div className="admin-table-container">
        <h2 className="admin-section-title">Problems Overview</h2>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Total Submissions</th>
                <th>Accepted</th>
                <th>Acceptance Rate</th>
              </tr>
            </thead>
            <tbody>
              {(problems || []).map((problem)=> {
                const acceptanceRate =
                  problem.totalSubmissions > 0
                    ? (
                        (problem.acceptedSubmissions /
                          problem.totalSubmissions) *
                        100
                      ).toFixed(1)
                    : 0;

                return (
                  <tr key={problem._id}>
                    <td className="problem-title">{problem.title}</td>
                    <td>
                      <span
                        className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}
                      >
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>{problem.totalSubmissions}</td>
                    <td>{problem.acceptedSubmissions}</td>
                    <td>
                      <span className="acceptance-rate">
                        {acceptanceRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;