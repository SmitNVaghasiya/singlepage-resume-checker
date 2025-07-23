import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Menu,
  X,
  Moon,
  Sun,
  User,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  Shield,
  BarChart3,
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";
import { useAdmin } from "../../contexts/AdminContext";
import "./mobile-navbar.css";

const MobileNavbar: React.FC = () => {
  const { resetAnalysis, user, logout, isAuthLoading } = useAppContext();
  const {
    admin,
    isAuthenticated: isAdminAuthenticated,
    logout: adminLogout,
  } = useAdmin();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", label: "Homepage" },
    {
      path: isAdminAuthenticated ? "/admin/dashboard" : "/dashboard",
      label: "Dashboard",
    },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setDrawerOpen(false);
    navigate("/");
  };

  const handleAdminLogout = async () => {
    adminLogout();
    setShowAdminMenu(false);
    setDrawerOpen(false);
    navigate("/");
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  return (
    <nav className="mobile-navbar">
      <div className="mobile-navbar-header">
        <button
          className="mobile-navbar-menu-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu />
        </button>
        <Link to="/" onClick={resetAnalysis} className="mobile-navbar-logo">
          <Briefcase />
        </Link>
      </div>
      {drawerOpen && (
        <div
          className="mobile-navbar-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <div className={`mobile-navbar-drawer${drawerOpen ? " open" : ""}`}>
        <div className="mobile-navbar-drawer-header">
          <button
            className="mobile-navbar-close-btn"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>
        <div className="mobile-navbar-links">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`mobile-navbar-link${isActive(path) ? " active" : ""}`}
              onClick={() => setDrawerOpen(false)}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="mobile-navbar-actions">
          {isAuthLoading ? (
            <div className="mobile-navbar-spinner"></div>
          ) : isAdminAuthenticated ? (
            <div className="mobile-admin-menu">
              <button
                className="mobile-navbar-user-btn"
                onClick={() => setShowAdminMenu(!showAdminMenu)}
              >
                <Shield />
                <span>{admin?.username}</span>
                <span className="mobile-admin-badge">Admin</span>
              </button>
              {showAdminMenu && (
                <div className="mobile-user-menu-dropdown">
                  <Link
                    to="/admin/dashboard"
                    className="mobile-user-menu-item"
                    onClick={() => {
                      setShowAdminMenu(false);
                      setDrawerOpen(false);
                    }}
                  >
                    <BarChart3 /> Admin Dashboard
                  </Link>
                  <button
                    className="mobile-user-menu-item"
                    onClick={handleAdminLogout}
                  >
                    <LogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : user ? (
            <div className="mobile-user-menu">
              <button
                className="mobile-navbar-user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <User />
                <span>{user.username}</span>
              </button>
              {showUserMenu && (
                <div className="mobile-user-menu-dropdown">
                  <Link
                    to="/profile"
                    className="mobile-user-menu-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      setDrawerOpen(false);
                    }}
                  >
                    <Settings /> Profile
                  </Link>
                  <button
                    className="mobile-user-menu-item"
                    onClick={handleLogout}
                  >
                    <LogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="mobile-auth-buttons">
              <Link
                to="/login"
                className="mobile-navbar-auth-btn"
                onClick={() => setDrawerOpen(false)}
              >
                <LogIn /> Sign In
              </Link>
              <Link
                to="/register"
                className="mobile-navbar-auth-btn"
                onClick={() => setDrawerOpen(false)}
              >
                <UserPlus /> Sign Up
              </Link>
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="mobile-navbar-theme-btn"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <Moon /> : <Sun />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MobileNavbar;
