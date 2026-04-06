import { useAuth } from "@clerk/clerk-react";
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
import { SocketProvider } from "./context/SocketContext";

function App() {
  const { isLoaded, isSignedIn } = useAuth();

  // Single loading gate
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <Routes>
        <Route
          path="/"
          element={!isSignedIn ? <HomePage /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/dashboard"
          element={isSignedIn ? <DashboardPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/problems"
          element={isSignedIn ? <ProblemsPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/problem/:id"
          element={isSignedIn ? <ProblemPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/session/:id"
          element={isSignedIn ? <SessionPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/session/:id/history"
          element={isSignedIn ? <SessionHistoryPage /> : <Navigate to="/" replace />}
        />

        <Route
          path="/sessions/all"
          element={isSignedIn ? <AllSessionsPage /> : <Navigate to="/" replace />}
        />

        {/* Public */}
        <Route path="/profile/:publicProfileId" element={<ProfilePage />} />

        {/* Admin */}
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
      </Routes>

      <Toaster toastOptions={{ duration: 3000 }} />
    </SocketProvider>
  );
}

export default App;