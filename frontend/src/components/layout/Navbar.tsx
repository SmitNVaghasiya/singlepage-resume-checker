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
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContext";

const Navbar: React.FC = () => {
  const { resetAnalysis, user, logout } = useAppContext();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "light" | "dark") || "light";
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Apply theme on mount and whenever it changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate("/");
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showUserMenu]);

  const navItems = [
    { path: "/", label: "Homepage" },
    { path: "/dashboard", label: "Dashboard" },
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
            {/* Authentication */}
            {user ? (
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
