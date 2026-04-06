import { Link, useLocation, useNavigate } from "react-router";
import { BookOpenIcon, LayoutDashboardIcon, SparklesIcon, SunIcon, MoonIcon } from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { useTheme } from "../context/ThemeContext";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Cache profile ID to avoid repeated API calls
let cachedProfileId = null;

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { user } = useUser();
  const [publicProfileId, setPublicProfileId] = useState(cachedProfileId);
  const hasFetched = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const hasCheckedAdmin = useRef(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id || hasFetched.current || cachedProfileId) {
        if (cachedProfileId) setPublicProfileId(cachedProfileId);
        return;
      }
      
      hasFetched.current = true;

      try {
        const response = await axios.get(`${API_URL}/profile/my-profile-id`, {
          withCredentials: true,
        });
        const profileId = response.data.data.publicProfileId;
        cachedProfileId = profileId;
        setPublicProfileId(profileId);
      } catch (error) {
        console.error("Error fetching profile ID:", error);
      }
    };

    const primeAdminFromCache = () => {
      if (!user?.id || typeof window === "undefined") return;

      try {
        const cacheKey = `tiq_admin_${user.id}`;
        const cached = window.sessionStorage.getItem(cacheKey);
        if (cached === "true") {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Error reading admin cache:", err);
      }
    };

    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setIsAdminLoading(false);
        return;
      }

      if (hasCheckedAdmin.current) return;

      hasCheckedAdmin.current = true;

      try {
        await axios.get(`${API_URL}/admin/dashboard`, {
          withCredentials: true,
        });
        setIsAdmin(true);
        if (typeof window !== "undefined") {
          try {
            const cacheKey = `tiq_admin_${user.id}`;
            window.sessionStorage.setItem(cacheKey, "true");
          } catch (err) {
            console.error("Error writing admin cache:", err);
          }
        }
      } catch (error) {
        setIsAdmin(false);
        console.error("User is not admin or admin check failed:", error);
        if (typeof window !== "undefined") {
          try {
            const cacheKey = `tiq_admin_${user?.id}`;
            if (user?.id) window.sessionStorage.setItem(cacheKey, "false");
          } catch (err) {
            console.error("Error writing admin cache:", err);
          }
        }
      } finally {
        setIsAdminLoading(false);
      }
    };

    fetchUserProfile();
    primeAdminFromCache();
    checkAdminStatus();
  }, [user]);

  const handleProfileClick = () => {
    if (publicProfileId) {
      navigate(`/profile/${publicProfileId}`);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link
          to="/"
          className="navbar-logo"
        >
          <div className="logo-icon">
            <SparklesIcon className="icon-size" />
          </div>

          <div className="logo-text">
            <span className="logo-title">
              Talent IQ
            </span>
            <span className="logo-subtitle">Code Together</span>
          </div>
        </Link>

        <div className="navbar-menu">
          {/* PROBLEMS PAGE LINK */}
          <Link
            to={"/problems"}
            className={`nav-link ${isActive("/problems") ? "nav-link-active" : ""}`}
          >
            <div className="nav-link-content">
              <BookOpenIcon className="nav-icon" />
              <span className="nav-text">Problems</span>
            </div>
          </Link>

          {/* DASHBOARD PAGE LINK */}
          <Link
            to={"/dashboard"}
            className={`nav-link ${isActive("/dashboard") ? "nav-link-active" : ""}`}
          >
            <div className="nav-link-content">
              <LayoutDashboardIcon className="nav-icon" />
              <span className="nav-text">Dashboard</span>
            </div>
          </Link>

          {/* ADMIN DASHBOARD LINK (visible only for admins) */}
          {(isAdmin || isAdminLoading) && (
            <Link
              to={"/admin/dashboard"}
              className={`nav-link nav-link-admin ${
                isActive("/admin/dashboard") ? "nav-link-admin-active" : ""
              } ${!isAdmin && isAdminLoading ? "nav-link-admin-loading" : ""}`}
            >
              <div className="nav-link-content">
                <LayoutDashboardIcon className="nav-icon" />
                <span className="nav-text">Admin Dashboard</span>
              </div>
            </Link>
          )}

          <div className="navbar-actions">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <SunIcon className="theme-icon" /> : <MoonIcon className="theme-icon" />}
            </button>
            <div 
              onClick={handleProfileClick} 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              title="View Profile"
            >
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
