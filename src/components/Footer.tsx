import React from 'react';
import { Mail } from 'lucide-react';

interface FooterProps {
  onNavigateToContact: () => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigateToContact }) => {
  return (
    <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200/60 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-600">
            <p>&copy; 2024 ResumeAI Pro. Powered by advanced AI technology.</p>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={onNavigateToContact}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span>Contact Us</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;