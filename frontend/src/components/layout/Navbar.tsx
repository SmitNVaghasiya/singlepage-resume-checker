import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
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

const Navbar: React.FC = () => {
  const { resetAnalysis, user, logout } = useAppContext();
  const {
    admin,
    isAuthenticated: isAdminAuthenticated,
    logout: adminLogout,
  } = useAdmin();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const currentTheme = savedTheme || systemTheme;

    setTheme(currentTheme);
    applyTheme(currentTheme);
  }, []);

  const applyTheme = (newTheme: "light" | "dark") => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate("/");
  };

  const handleAdminLogout = async () => {
    adminLogout();
    setShowAdminMenu(false);
    navigate("/");
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".user-menu-container") &&
        !target.closest(".admin-menu-container")
      ) {
        setShowUserMenu(false);
        setShowAdminMenu(false);
      }
    };

    if (showUserMenu || showAdminMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showUserMenu, showAdminMenu]);

  const navItems = [
    { path: "/", label: "Homepage" },
    {
      path: isAdminAuthenticated ? "/admin/dashboard" : "/dashboard",
      label: "Dashboard",
    },
    { path: "/contact", label: "Contact" },
  ] as const;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="max-w-7xl navbar-container">
        {/* Logo and Brand */}
        <Link to="/" onClick={resetAnalysis} className="navbar-logo">
          <div className="navbar-logo-icon">
            <Briefcase />
          </div>
          <span className="navbar-logo-text">AI Resume Checker</span>
        </Link>

        {/* Navigation Items */}
        <div className="navbar-nav">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`navbar-link ${isActive(path) ? "active" : ""}`}
            >
              {label}
            </Link>
          ))}

          <div className="navbar-actions">
            {/* Admin Authentication */}
            {isAdminAuthenticated ? (
              <div className="admin-menu-container">
                <button
                  className="navbar-admin-btn"
                  onClick={() => setShowAdminMenu(!showAdminMenu)}
                >
                  <Shield />
                  <span className="admin-name">{admin?.username}</span>
                  <span className="admin-badge">Admin</span>
                </button>

                {showAdminMenu && (
                  <div className="admin-menu">
                    <div className="admin-menu-header">
                      <p className="admin-email">{admin?.email}</p>
                      <p className="admin-role">Administrator</p>
                    </div>
                    <div className="admin-menu-divider"></div>
                    <Link
                      to="/admin/dashboard"
                      className="admin-menu-item"
                      onClick={() => setShowAdminMenu(false)}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Admin Dashboard
                    </Link>
                    <div className="admin-menu-divider"></div>
                    <button
                      className="admin-menu-item"
                      onClick={handleAdminLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : user ? (
              <div className="user-menu-container">
                <button
                  className="navbar-user-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User />
                  <span className="user-name">{user.username}</span>
                </button>

                {showUserMenu && (
                  <div className="user-menu">
                    <div className="user-menu-header">
                      <p className="user-email">{user.email}</p>
                    </div>
                    <div className="user-menu-divider"></div>
                    <Link
                      to="/profile"
                      className="user-menu-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Profile
                    </Link>
                    <button className="user-menu-item" onClick={handleLogout}>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="navbar-auth-btn login-btn">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link to="/register" className="navbar-auth-btn register-btn">
                  <UserPlus className="w-4 h-4" />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="navbar-icon-btn"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <Moon /> : <Sun />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
