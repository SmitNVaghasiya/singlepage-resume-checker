import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Briefcase, Moon, Sun, User } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const Navbar: React.FC = () => {
  const { resetAnalysis, currentAnalysis } = useAppContext();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as 'light' | 'dark') || 'light';
  });
  const location = useLocation();

  useEffect(() => {
    // Apply theme on mount and whenever it changes
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const navItems = [
    { path: '/', label: 'Resume' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/contact', label: 'Contact' },
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
          <span className="navbar-logo-text">
            AI Resume Checker
          </span>
        </Link>

        {/* Navigation Items */}
        <div className="navbar-nav">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`navbar-link ${isActive(path) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
          
          <div className="navbar-actions">
            {/* Profile Icon */}
            <button className="navbar-icon-btn">
              <User />
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="navbar-icon-btn"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon />
              ) : (
                <Sun />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;