import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router";
import { Loader } from "lucide-react";
import axios from "../lib/axios";

const ProtectedAdminRoute = ({ children }) => {
  const { isSignedIn, isLoaded, user } = useUser();
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!isSignedIn || !user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Try to fetch admin dashboard to check if user has admin access
      await axios.get("/admin/dashboard");
      setIsAdmin(true);
    } catch (error) {
      console.error("Not an admin:", {
        status: error.response?.status,
        data: error.response?.data,
      });
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader className="animate-spin" size={40} />
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (isAdmin === false) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have admin privileges</p>
        <a href="/dashboard" style={{ color: '#2CBE4E' }}>Go to Dashboard</a>
      </div>
    );
  }

  return children;
};

export default ProtectedAdminRoute;
