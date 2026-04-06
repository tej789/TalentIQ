/**
 * Example React Router Configuration
 * 
 * Add this route to your App.jsx or routes configuration file
 */

// Import the ProfilePage component
import ProfilePage from './pages/ProfilePage';

// In your routes configuration (React Router v6):
const routes = [
  // ... your existing routes
  
  {
    path: '/profile/:publicProfileId',
    element: <ProfilePage />,
  },
  
  // Optional: Redirect /u/:publicProfileId to /profile/:publicProfileId
  {
    path: '/u/:publicProfileId',
    element: <Navigate to="/profile/:publicProfileId" replace />,
  },
];

// OR if using traditional Route components:
<Routes>
  {/* ... your existing routes */}
  
  <Route path="/profile/:publicProfileId" element={<ProfilePage />} />
  <Route path="/u/:publicProfileId" element={<Navigate to="/profile/:publicProfileId" replace />} />
</Routes>

// Example: Link to profile from navbar or user menu
import { Link } from 'react-router-dom';

function UserMenu({ user }) {
  return (
    <div>
      <Link to={`/profile/${user.publicProfileId}`}>
        View Profile
      </Link>
    </div>
  );
}

// Example: Get current user's public profile ID
// You'll need to add this to your user state/context
const currentUser = {
  _id: "...",
  name: "John Doe",
  publicProfileId: "6O0OwlfSD8", // From UserProfile
};
