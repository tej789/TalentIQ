import { Link, Outlet, useLocation } from "react-router";
import { LayoutDashboard, FileCode, Plus, LogOut } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

const AdminLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/admin/problems", icon: FileCode, label: "Manage Problems" },
    { path: "/admin/add-problem", icon: Plus, label: "Add Problem" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Admin Panel</h2>
          <p>TalentIQ</p>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${isActive(item.path) ? "active" : ""}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item">
            <LogOut size={20} />
            <span>Back to App</span>
          </Link>
          <div className="admin-user">
            <UserButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
