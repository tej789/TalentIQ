/**
 * React Router Configuration (FINAL FIXED)
 */

// ✅ Imports (FIXED)
import { Routes, Route, Link, Navigate, useParams } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";


// ✅ Redirect component (FIXED dynamic redirect)
function RedirectProfile() {
  const { publicProfileId } = useParams();
  return <Navigate to={`/profile/${publicProfileId}`} replace />;
}


// ✅ Routes (USE THIS — main routing)
function AppRoutes() {
  return (
    <Routes>
      {/* ... your existing routes */}

      <Route path="/profile/:publicProfileId" element={<ProfilePage />} />
      <Route path="/u/:publicProfileId" element={<RedirectProfile />} />

    </Routes>
  );
}


// ✅ User Menu (SAFE — no crash)
function UserMenu({ user }) {
  if (!user?.publicProfileId) return null;

  return (
    <div>
      <Link to={`/profile/${user?.publicProfileId}`}>
        View Profile
      </Link>
    </div>
  );
}


// ✅ Example user object (unchanged)
const currentUser = {
  _id: "...",
  name: "John Doe",
  publicProfileId: "6O0OwlfSD8",
};


// ✅ Export if needed
export { AppRoutes, UserMenu };