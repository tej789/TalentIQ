import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import ProblemsPage from "./pages/ProblemsPage";
import SessionPage from "./pages/SessionPage";
import SessionHistoryPage from "./pages/SessionHistoryPage";
import AllSessionsPage from "./pages/AllSessionsPage";
import ProfilePage from "./pages/ProfilePage";

// Admin imports
import AdminLayout from "./admin/components/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AddProblem from "./admin/pages/AddProblem";
import EditProblem from "./admin/pages/EditProblem";
import AdminProblems from "./admin/pages/AdminProblems";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

import { Toaster } from "react-hot-toast";
import { AuthWrapper } from "./components/AuthWrapper";
import { SocketProvider } from "./context/SocketContext";

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />

        {/* Protected Routes */}
        <Route element={<AuthWrapper />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/problem/:id" element={<ProblemPage />} />
          <Route path="/session/:id" element={<SessionPage />} />
          <Route path="/session/:id/history" element={<SessionHistoryPage />} />
          <Route path="/sessions/all" element={<AllSessionsPage />} />
          <Route path="/profile/:publicProfileId" element={<ProfilePage />} />

          {/* Admin Nested Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="problems" element={<AdminProblems />} />
            <Route path="add-problem" element={<AddProblem />} />
            <Route path="edit-problem/:id" element={<EditProblem />} />
          </Route>
        </Route>
      </Routes>

      <Toaster toastOptions={{ duration: 3000 }} />
    </SocketProvider>
  );
}

export default App;