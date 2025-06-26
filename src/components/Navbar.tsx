import React from 'react';
import { Brain } from 'lucide-react';

interface NavbarProps {
  currentPage: 'home' | 'contact' | 'dashboard';
  onNavigate: (page: 'home' | 'contact' | 'dashboard') => void;
  onReset: () => void;
  hasAnalysis: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, onReset, hasAnalysis }) => {
  const navItems = [
    { key: 'home', label: 'Resume Checker' },
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'contact', label: 'Contact' }
  ] as const;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200/60">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ResumeAI Pro
          </h1>
        </div>
        
        <div className="flex items-center space-x-6">
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className={`font-medium transition-colors ${
                currentPage === key 
                  ? 'text-blue-600' 
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {label}
            </button>
          ))}
          
          {hasAnalysis && (
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              New Analysis
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;