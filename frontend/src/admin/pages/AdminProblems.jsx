import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Edit, Trash2, Loader, Plus } from "lucide-react";
import { getAllProblems, deleteProblem } from "../../api/admin";
import toast from "react-hot-toast";

const AdminProblems = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const data = await getAllProblems();
setProblems(data?.problems || []);    } catch (err) {
      console.error("Error fetching problems:", err);
      setError(err.response?.data?.message || "Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (problemId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteProblem(problemId);
      toast.success("Problem deleted successfully");
      setProblems(problems.filter((p) => p._id !== problemId));
    } catch (error) {
      console.error("Error deleting problem:", error);
      toast.error(error.response?.data?.message || "Failed to delete problem");
    }
  };

  const handleEdit = (problemId) => {
    // Navigate to edit page (you can create EditProblem.jsx similar to AddProblem)
    navigate(`/admin/edit-problem/${problemId}`);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <Loader className="animate-spin" size={40} />
        <p>Loading problems...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <p>{error}</p>
        <button onClick={fetchProblems} className="btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="admin-problems">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Manage Problems</h1>
          <p className="admin-page-subtitle">Total: {problems.length} problems</p>
        </div>
        <button onClick={() => navigate("/admin/add-problem")} className="btn-primary">
          <Plus size={18} /> Add New Problem
        </button>
      </div>

      <div className="admin-table-container">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Category</th>
                <th>Submissions</th>
                <th>Accepted</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(problems?.length || 0) === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                    No problems found. Create your first problem!
                  </td>
                </tr>
              ) : (
                (problems || []).map((problem)=> (
                  <tr key={problem._id}>
                    <td className="problem-title">{problem.title}</td>
                    <td>
                      <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                        {problem.difficulty}
                      </span>
                    </td>
                    <td>{problem.category}</td>
                    <td>{problem.totalSubmissions || 0}</td>
                    <td>{problem.acceptedSubmissions || 0}</td>
                    <td>
                      {problem.createdBy?.name || problem.createdBy?.email || "Unknown"}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          onClick={() => handleEdit(problem._id)}
                          className="btn-icon-small"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(problem._id, problem.title)}
                          className="btn-icon-small btn-danger"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProblems;
